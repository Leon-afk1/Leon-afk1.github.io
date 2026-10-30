"""Backend tests with fake Gemini and Neo4j clients (no network).
    cd backend && pip install -r requirements-dev.txt && pytest
"""
import os
import sys
import time
from pathlib import Path

import pytest

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))
os.environ.update(GEMINI_API_KEY="test", NEO4J_PASSWORD="test", NEO4J_URI="neo4j://127.0.0.1:1",
                  CHAT_RATE_LIMIT="3/minute", ALLOWED_ORIGINS="https://leon-afk1.github.io")

import main  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402


class FakeResponse:
    def __init__(self, text):
        self.text = text


class FakeModels:
    def __init__(self, failures=None):
        self.failures = failures or {}  # model name -> exception
        self.calls = []

    def generate_content(self, model, contents):
        self.calls.append(model)
        if model in self.failures:
            raise self.failures[model]
        if "Classify into" in contents:
            return FakeResponse("RELEVANT: YES\nMOTIVATION: NO\nCOMPANY_FIELD: none\nTECH_DEFINITION: NO\nTECHNOLOGY: none")
        if "Cypher query expert" in contents:
            return FakeResponse('MATCH (p:Person {name: "Léon Morales"})-[:WORKED_ON]->(x:Project) RETURN x.name')
        return FakeResponse(f"answer from {model}")


class FakeClient:
    def __init__(self, failures=None):
        self.models = FakeModels(failures)


class FakeNeo4j:
    def __init__(self):
        self.queries = []

    def run_query(self, query, parameters=None):
        self.queries.append(query)
        return [{"x.name": "Graph RAG assistant"}]

    def close(self):
        pass


NAMES = main.ModelManager(FakeClient()).model_names


# ---------- Model rotation

def test_rotation_skips_quota_and_unknown_models():
    client = FakeClient({NAMES[0]: Exception("404 NOT_FOUND"), NAMES[1]: Exception("429 RESOURCE_EXHAUSTED")})
    mm = main.ModelManager(client)
    assert mm.generate_content("hi").text == f"answer from {NAMES[2]}"
    assert mm.generate_content("hi").text == f"answer from {NAMES[2]}"
    # The failing models are not retried while set aside
    assert client.models.calls == [NAMES[0], NAMES[1], NAMES[2], NAMES[2]]


def test_quota_exhausted_model_comes_back_after_delay(monkeypatch):
    client = FakeClient({NAMES[0]: Exception("429 quota")})
    mm = main.ModelManager(client)
    mm.generate_content("hi")
    client.models.failures.clear()          # quota reset on Google's side
    assert mm.generate_content("hi").text == f"answer from {NAMES[1]}"   # still set aside
    now = time.time()
    monkeypatch.setattr(main.time, "time", lambda: now + main.QUOTA_RETRY_SECONDS + 1)
    assert mm.generate_content("hi").text == f"answer from {NAMES[0]}"   # preferred model is back


def test_all_models_exhausted():
    mm = main.ModelManager(FakeClient({n: Exception("429") for n in NAMES}))
    with pytest.raises(main.AllModelsExhaustedException):
        mm.generate_content("hi")


def test_other_errors_are_raised():
    mm = main.ModelManager(FakeClient({NAMES[0]: ValueError("boom")}))
    with pytest.raises(ValueError):
        mm.generate_content("hi")


# ---------- Conversation memory

def test_session_store_is_bounded_and_keeps_last_turns():
    store = main.SessionStore(max_sessions=3, ttl=3600, max_turns=2)
    for i in range(5):
        store.append(f"s{i}", "q", "a")
    assert len(store) == 3
    assert store.get("s0") == [] and store.get("s4") != []
    for i in range(4):
        store.append("s4", f"q{i}", f"a{i}")
    assert [t["user"] for t in store.get("s4")] == ["q2", "q3"]


def test_session_store_expires_sessions(monkeypatch):
    store = main.SessionStore(max_sessions=10, ttl=60, max_turns=5)
    store.append("old", "q", "a")
    now = time.time()
    monkeypatch.setattr(main.time, "time", lambda: now + 61)
    assert store.get("old") == []
    assert len(store) == 0


# ---------- API

@pytest.fixture
def client():
    with TestClient(main.app) as c:
        main.model_manager = main.ModelManager(FakeClient())
        main.neo4j_conn = FakeNeo4j()
        main.sessions = main.SessionStore()
        main.limiter.reset()
        yield c


def test_health(client):
    assert client.get("/health").status_code == 200


def test_cors_allows_site_and_localhost_only(client):
    def preflight(origin):
        return client.options("/chat", headers={"Origin": origin, "Access-Control-Request-Method": "POST",
                                                "Access-Control-Request-Headers": "content-type"})
    assert preflight("https://leon-afk1.github.io").headers.get("access-control-allow-origin") == "https://leon-afk1.github.io"
    assert preflight("http://localhost:3000").headers.get("access-control-allow-origin") == "http://localhost:3000"
    assert "access-control-allow-origin" not in preflight("https://evil.example").headers


def test_input_validation(client):
    assert client.post("/chat", json={"query": ""}).status_code == 422
    assert client.post("/chat", json={"query": "x" * 1001}).status_code == 422


def test_chat_runs_the_rag_flow_and_remembers_the_turn(client):
    r = client.post("/chat", json={"query": "What did Léon build?", "session_id": "s1", "language": "en"})
    assert r.status_code == 200
    assert r.json()["response"].startswith("answer from")
    assert main.neo4j_conn.queries and "WORKED_ON" in main.neo4j_conn.queries[0]
    assert [t["user"] for t in main.sessions.get("s1")] == ["What did Léon build?"]


def test_rate_limit_per_ip(client):
    codes = [client.post("/chat", json={"query": "hello"}, headers={"X-Forwarded-For": "203.0.113.7"}).status_code
             for _ in range(4)]
    assert codes[:3] == [200, 200, 200] and codes[3] == 429

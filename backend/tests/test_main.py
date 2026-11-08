"""Backend tests with fake Gemini and Neo4j clients (no network).
    cd backend && pip install -r requirements-dev.txt && pytest
"""
import datetime
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
        return [{"x.name": "Graph RAG assistant", "x.startDate": datetime.date(2024, 9, 1)}]

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


def test_slow_model_is_set_aside_then_retried(monkeypatch):
    client = FakeClient({NAMES[0]: TimeoutError("read timed out")})
    mm = main.ModelManager(client)
    assert mm.generate_content("hi").text == f"answer from {NAMES[1]}"
    # The API giving up (504) counts as slow too
    client.models.failures = {NAMES[1]: Exception("504 DEADLINE_EXCEEDED")}
    assert mm.generate_content("hi").text == f"answer from {NAMES[2]}"
    client.models.failures.clear()
    now = time.time()
    monkeypatch.setattr(main.time, "time", lambda: now + main.SLOW_RETRY_SECONDS + 1)
    assert mm.generate_content("hi").text == f"answer from {NAMES[0]}"


def test_request_gives_up_after_two_timeouts():
    client = FakeClient({n: TimeoutError("read timed out") for n in NAMES})
    mm = main.ModelManager(client)
    with pytest.raises(main.AllModelsExhaustedException):
        mm.generate_content("hi")
    assert len(client.models.calls) == main.MAX_TIMEOUTS_PER_CALL


def test_overloaded_model_is_skipped():
    client = FakeClient({NAMES[0]: Exception("503 UNAVAILABLE: This model is currently experiencing high demand")})
    assert main.ModelManager(client).generate_content("hi").text == f"answer from {NAMES[1]}"


def test_query_results_with_dates_are_serialized(client):
    context, ok, error = main.execute_cypher_query("MATCH (x) RETURN x")
    assert ok and not error and "2024-09-01" in context


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


INTENT_MOTIVATION = "RELEVANT: YES\nMOTIVATION: YES\nCOMPANY_FIELD: Google\nTECH_DEFINITION: NO\nTECHNOLOGY: none"


def script_gemini(monkeypatch, answer=None, intent=None, cypher=None):
    """Fake Gemini that records the prompts: returns the list they are appended to."""
    prompts = []

    def generate(prompt):
        prompts.append(prompt)
        if "Classify into" in prompt:
            return FakeResponse(intent or "RELEVANT: YES\nMOTIVATION: NO\nCOMPANY_FIELD: none\nTECH_DEFINITION: NO\nTECHNOLOGY: none")
        if "Cypher query expert" in prompt:
            return FakeResponse(cypher or 'MATCH (p:Person) RETURN p')
        return FakeResponse(answer or "a reply about Léon")

    monkeypatch.setattr(main.model_manager, "generate_content", generate)
    return prompts


class EmptyThenFound(FakeNeo4j):
    """No rows for the first `empty` queries, then a result."""

    def __init__(self, empty):
        super().__init__()
        self.empty = empty
        self.parameters = []

    def run_query(self, query, parameters=None):
        self.queries.append(query)
        self.parameters.append(parameters)
        return [] if len(self.queries) <= self.empty else [{"name": "Hackathon Conformit x UQAC"}]


def test_motivation_refers_to_an_interview_and_is_remembered(client, monkeypatch):
    prompts = script_gemini(monkeypatch, answer="Léon cherche un poste en IA ; parlons-en en entretien.", intent=INTENT_MOTIVATION)
    r = client.post("/chat", json={"query": "Pourquoi veux-tu rejoindre Google ?", "session_id": "m1"})
    assert "entretien" in r.json()["response"]
    assert any("SEEKS" in q for q in main.neo4j_conn.queries)
    final = prompts[-1]
    assert "interview" in final and main.CONTACT_EMAIL in final and "you\", \"your\"" in final
    assert [t["user"] for t in main.sessions.get("m1")] == ["Pourquoi veux-tu rejoindre Google ?"]


def test_classifier_prompt_keeps_the_job_search_out_of_motivation(client, monkeypatch):
    prompts = script_gemini(monkeypatch)
    main.analyze_question_intent("Quel poste recherches-tu ?")
    assert "NO, these are facts" in prompts[0] and "Quel poste recherches-tu" in prompts[0]


def test_job_search_question_goes_through_the_rag_flow(client, monkeypatch):
    prompts = script_gemini(monkeypatch, cypher="MATCH (:Person)-[:SEEKS]->(s) RETURN s")
    r = client.post("/chat", json={"query": "Quel poste recherches-tu ?", "session_id": "j1"})
    assert r.json()["response"] == "a reply about Léon"
    assert "SEEKS" in main.neo4j_conn.queries[0]
    assert "Database Results" in prompts[-1]


@pytest.mark.parametrize("text", [
    "As an AI, I don't have personal motivations.",
    "My capabilities as a large language model are limited.",
    "I am a large language model trained by Google.",
    "En tant qu'IA, je ne peux pas répondre.",
    "Je n'ai pas de motivations personnelles.",
])
def test_self_references_are_replaced(text):
    assert main.without_self_reference(text, "Quel poste recherches-tu ?") == main.interview_message("Quel poste recherches-tu ?")


@pytest.mark.parametrize("text", [
    "As an AI engineer, he built a Graph RAG platform.",
    "He evaluated several large language models at Astek.",
    "He used Gemini as a language model for text-to-SQL.",
    "En tant qu'ingénieur IA, il a conçu un pipeline RAG.",
    "I am an AI assistant answering from Léon's knowledge graph.",
])
def test_talking_about_his_work_on_llms_is_kept(text):
    assert main.without_self_reference(text, "What did he do?") == text


def test_self_reference_is_replaced_in_the_api_answer(client, monkeypatch):
    script_gemini(monkeypatch, answer="As an AI, I don't have personal motivations.")
    r = client.post("/chat", json={"query": "What position are you looking for?"})
    assert main.CONTACT_EMAIL in r.json()["response"] and "As an AI" not in r.json()["response"]


def test_empty_result_is_retried_with_a_hint(client, monkeypatch):
    prompts = script_gemini(monkeypatch)
    main.neo4j_conn = EmptyThenFound(empty=1)
    client.post("/chat", json={"query": "Quelle a été ta contribution au hackathon de l'UQAC ?"})
    assert len(main.neo4j_conn.queries) == 2
    assert any("PREVIOUS FAILED ATTEMPT" in p and "PARTICIPATED_IN" in p.split("PREVIOUS FAILED ATTEMPT")[1] for p in prompts)
    assert "Hackathon Conformit" in prompts[-1]


def test_keyword_search_is_the_last_resort(client, monkeypatch):
    prompts = script_gemini(monkeypatch)
    main.neo4j_conn = EmptyThenFound(empty=2)
    client.post("/chat", json={"query": "Quelle a été ta contribution au hackathon de l'UQAC ?"})
    assert main.neo4j_conn.queries[2] == main.KEYWORD_SEARCH_CYPHER
    keywords = main.neo4j_conn.parameters[2]["keywords"]
    assert "hackathon" in keywords and "uqac" in keywords and "ton" not in keywords
    assert "Hackathon Conformit" in prompts[-1]


def test_cypher_prompt_asks_for_inline_values():
    assert "with $name" not in main.DATABASE_SCHEMA
    assert "never use query parameters" in main.DATABASE_SCHEMA


def test_is_french_matches_whole_words():
    assert main.is_french("Quel poste recherches-tu ?")
    assert not main.is_french("What is the best question about testing?")


def test_rate_limit_per_ip(client):
    codes = [client.post("/chat", json={"query": "hello"}, headers={"X-Forwarded-For": "203.0.113.7"}).status_code
             for _ in range(4)]
    assert codes[:3] == [200, 200, 200] and codes[3] == 429

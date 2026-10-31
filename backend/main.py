# main.py - Backend API for Portfolio Chatbot with Graph RAG
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv
from google import genai
from google.genai import types as genai_types
from neo4j import GraphDatabase
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from typing import List, Dict, Optional
import json
import threading
import time
import traceback
from collections import OrderedDict
from concurrent.futures import ThreadPoolExecutor

# Load environment variables
load_dotenv()
NEO4J_URI = os.getenv("NEO4J_URI", "neo4j://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
# Comma-separated list of origins allowed to call the API (localhost is always allowed)
ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "https://leon-afk1.github.io").split(",") if o.strip()]
# Per-IP limit on /chat, each request costs several Gemini calls
CHAT_RATE_LIMIT = os.getenv("CHAT_RATE_LIMIT", "10/minute;100/day")
# A model that hit its quota is retried after this delay; an unknown model name after a day
QUOTA_RETRY_SECONDS = 3600
UNAVAILABLE_RETRY_SECONDS = 86400
# Gemini latency has spikes: a call taking longer than this is abandoned and the next model is tried,
# so a request stays well under the 60 s Cloud Run timeout. A slow model is set aside for SLOW_RETRY_SECONDS.
GEMINI_TIMEOUT_SECONDS = float(os.getenv("GEMINI_TIMEOUT_SECONDS", "12"))
SLOW_RETRY_SECONDS = 120
# At most this many timeouts in one call, then the request gives up instead of trying every model
MAX_TIMEOUTS_PER_CALL = 2

# Custom Exception for all models exhausted
class AllModelsExhaustedException(Exception):
    """Raised when all Gemini models have reached their quota limit"""
    pass

# Model Manager for automatic rotation
class ModelManager:
    def __init__(self, client: genai.Client):
        self.client = client
        self.model_names = [
            'gemini-3.1-flash-lite',
            'gemini-3.5-flash-lite',
            'gemini-3.6-flash',
            'gemini-3.8-flash',
            'gemini-3-flash-preview',
            'gemini-2.5-flash-lite',
            'gemini-2.5-flash',
        ]
        self.current_index = 0
        # model name -> time (epoch seconds) until which it is skipped
        self.unavailable_until: Dict[str, float] = {}

    def _is_quota_error(self, error: Exception) -> bool:
        """Check if the error is related to quota/rate limiting"""
        error_str = str(error).lower()
        quota_keywords = [
            'quota', 'rate limit', 'resource exhausted', 
            '429', 'too many requests', 'limit exceeded',
            'resource_exhausted'
        ]
        return any(keyword in error_str for keyword in quota_keywords)

    def _is_timeout_error(self, error: Exception) -> bool:
        """Client-side timeout, or the API giving up (504 DEADLINE_EXCEEDED)"""
        if isinstance(error, TimeoutError):
            return True
        error_str = f"{type(error).__name__} {error}".lower()
        return any(keyword in error_str for keyword in ['timeout', 'timed out', 'deadline', '504'])

    def _is_overloaded_error(self, error: Exception) -> bool:
        """503: the model is temporarily overloaded (\"high demand\")"""
        error_str = str(error).lower()
        return any(keyword in error_str for keyword in ['503', 'unavailable', 'overloaded', 'high demand'])

    def _is_unavailable_error(self, error: Exception) -> bool:
        """Check if the model name does not exist or is not served for this key"""
        error_str = str(error).lower()
        return any(keyword in error_str for keyword in ['404', 'not_found', 'not found', 'not supported'])

    def generate_content(self, prompt: str):
        """Generate content with the first model of the list that is not set aside.
        A model hitting its quota is skipped for QUOTA_RETRY_SECONDS, a slow or overloaded one for SLOW_RETRY_SECONDS,
        an unknown one for UNAVAILABLE_RETRY_SECONDS,
        so the preferred model comes back once its quota resets. Models are tried lazily (no test call at startup)."""
        timeouts = 0
        for index, model_name in enumerate(self.model_names):
            if self.unavailable_until.get(model_name, 0) > time.time():
                continue
            try:
                response = self.client.models.generate_content(model=model_name, contents=prompt)
                self.current_index = index
                return response
            except Exception as e:
                if self._is_quota_error(e):
                    self.unavailable_until[model_name] = time.time() + QUOTA_RETRY_SECONDS
                elif self._is_timeout_error(e):
                    self.unavailable_until[model_name] = time.time() + SLOW_RETRY_SECONDS
                    timeouts += 1
                    if timeouts >= MAX_TIMEOUTS_PER_CALL:
                        raise AllModelsExhaustedException("Gemini is too slow right now")
                elif self._is_overloaded_error(e):
                    self.unavailable_until[model_name] = time.time() + SLOW_RETRY_SECONDS
                elif self._is_unavailable_error(e):
                    self.unavailable_until[model_name] = time.time() + UNAVAILABLE_RETRY_SECONDS
                else:
                    print(f"Error with model {model_name}: {e}")
                    raise
                print(f"Model {model_name} unavailable, switching to next model: {e}")

        raise AllModelsExhaustedException("All available models have reached their quota limit")
    
    def get_current_model_name(self) -> str:
        """Get the name of the currently active model"""
        if 0 <= self.current_index < len(self.model_names):
            return self.model_names[self.current_index]
        return "Unknown"

# Neo4j Connection
class Neo4jConnection:
    def __init__(self, uri, user, password):
        self._driver = GraphDatabase.driver(uri, auth=(user, password))

    def close(self):
        if self._driver:
            self._driver.close()

    def run_query(self, query, parameters=None):
        # Read-only transaction: queries are generated by the LLM from user input
        with self._driver.session() as session:
            return session.execute_read(
                lambda tx: [record.data() for record in tx.run(query, parameters)]
            )

# Global variables
neo4j_conn = None
model_manager = None

# Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global neo4j_conn, model_manager
    print("===== Application Startup =====")
    
    # Configure Gemini with ModelManager
    model_manager = ModelManager(genai.Client(
        api_key=GEMINI_API_KEY,
        http_options=genai_types.HttpOptions(timeout=int(GEMINI_TIMEOUT_SECONDS * 1000)),  # milliseconds
    ))
    print(f"✓ Gemini configured, first model: {model_manager.get_current_model_name()}")
    
    # Initialize Neo4j
    try:
        neo4j_conn = Neo4jConnection(NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD)
        print("✓ Connected to Neo4j successfully")
    except Exception as e:
        print(f"✗ Failed to connect to Neo4j: {e}")
        neo4j_conn = None
    
    yield
    
    # Shutdown
    print("===== Application Shutdown =====")
    if neo4j_conn:
        neo4j_conn.close()
        print("✓ Neo4j connection closed")

# Initialize FastAPI app with lifespan
app = FastAPI(
    title="Léon's Portfolio Chatbot API",
    lifespan=lifespan
)

# Rate limiting (per client IP, in memory per instance)
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

# Models
class ChatQuery(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000)
    session_id: Optional[str] = Field("default", max_length=100)

class ChatResponse(BaseModel):
    response: str
    session_id: str

class SessionStore:
    """Last turns of each conversation. Bounded so that many session ids cannot exhaust the instance memory:
    least recently used sessions are evicted beyond max_sessions, and sessions expire after ttl seconds."""

    def __init__(self, max_sessions: int = 500, ttl: float = 3600, max_turns: int = 10):
        self.max_sessions, self.ttl, self.max_turns = max_sessions, ttl, max_turns
        self._data: "OrderedDict[str, tuple]" = OrderedDict()  # session_id -> (last_seen, turns)
        self._lock = threading.Lock()  # the endpoint runs in a thread pool

    def _evict(self, now: float):
        while self._data:
            last_seen = next(iter(self._data.values()))[0]
            if len(self._data) > self.max_sessions or now - last_seen > self.ttl:
                self._data.popitem(last=False)
            else:
                break

    def get(self, session_id: str) -> List[Dict[str, str]]:
        with self._lock:
            self._evict(time.time())
            entry = self._data.get(session_id)
            return list(entry[1]) if entry else []

    def append(self, session_id: str, user: str, assistant: str):
        with self._lock:
            now = time.time()
            turns = self._data.pop(session_id, (now, []))[1]
            turns.append({"user": user, "assistant": assistant})
            self._data[session_id] = (now, turns[-self.max_turns:])
            self._evict(now)

    def __len__(self):
        return len(self._data)


sessions = SessionStore()
# Intent analysis and Cypher generation are independent Gemini calls: run them in parallel
executor = ThreadPoolExecutor(max_workers=8)

# --- Simplified RAG Functions ---

DATABASE_SCHEMA = """
Neo4j Database Schema for Léon Morales Portfolio:

## Node Labels and Properties

### Core Entities
- **Person**: name, title, age, status, homeBase, currentLocation, summary
- **Institution**: name, type, location, url, industry

### Experience Types (all share base Experience label)
- **Experience**: identifier, startDate, endDate, description
- **Education** (additional): degree, field, type
- **Internship** (additional): role, report_en, report_fr
- **Leadership** (additional): role, achievements (array)
- **Job** (additional): role
- **Event** (additional): name, date, duration_hours, team_size, result

### Skills & Competencies
- **Skill**: name, category, level, description
- **Quality**: name, description
- **AreaOfDevelopment**: name, description
- **Certification**: name, url

### Projects & Activities
- **Project**: name, type, source, status, startDate, endDate, description, difficulty, url, reportUrl_en, reportUrl_fr, skills (array), experienceId
- **Interest**: name, details

### Methodologies & Values
- **Methodology**: name, description
- **Goal**: name, description
- **Value**: name, description

### Location & Life Path
- **City**: name, department, country
- **LifePath**: name
- **LifeEvent**: type, description

### Communication & Preferences
- **Language**: name
- **ContactInfo**: type, value
- **InternshipPreferences**: identifier, availability_start_possible, availability_start_ideal, availability_start_latest, duration_min_weeks, contract_type, mobility, remote_preference, preferred_sectors, company_size_preference, role_preference, canada_work_status, salary_expectation
- **Anecdote**: name, story

---

## Relationship Types

### Person → Core Relationships
- **(Person)-[:HAS_EXPERIENCE]->(Experience)**
- **(Person)-[:PARTICIPATED_IN]->(Experience:Event)**
- **(Person)-[:HAS_SKILL {level}]->(Skill)**
- **(Person)-[:APPLIED_IN_PERSONAL_PROJECTS]->(Skill)**
- **(Person)-[:HAS_QUALITY]->(Quality)**
- **(Person)-[:WORKS_ON_IMPROVING]->(AreaOfDevelopment)**
- **(Person)-[:WORKED_ON]->(Project)**
- **(Person)-[:EARNED]->(Certification)**
- **(Person)-[:SPEAKS {level}]->(Language)**
- **(Person)-[:INTERESTED_IN]->(Interest)**
- **(Person)-[:USES_METHODOLOGY]->(Methodology)**
- **(Person)-[:HAS_GOAL]->(Goal)**
- **(Person)-[:VALUES]->(Value)**
- **(Person)-[:HAS_CONTACT]->(ContactInfo)**
- **(Person)-[:SEEKS]->(InternshipPreferences)**
- **(Person)-[:HAS_ANECDOTE]->(Anecdote)**
- **(Person)-[:BORN_IN {year}]->(City)**
- **(Person)-[:HAS_LIFE_PATH]->(LifePath)**

### Experience → Relationships
- **(Experience)-[:AT_INSTITUTION]->(Institution)**
- **(Experience)-[:INCLUDED_PROJECT]->(Project)**
- **(Experience)-[:INVOLVED_SKILL]->(Skill)**
- **(Experience)-[:FOCUSED_ON_SKILL]->(Skill)** _(used for academic focus)_
- **(Experience)-[:DEVELOPED_QUALITY]->(Quality)**
- **(Experience)-[:LOCATED_IN]->(City)**
- **(Experience)-[:LANGUAGE_USED]->(Language)**
- **(Experience:Event)-[:HOSTED_BY]->(Institution)**

### Project → Relationships
- **(Project)-[:UTILIZED_SKILL]->(Skill)**
- **(Project)-[:UTILIZED_QUALITY]->(Quality)**

### Skill → Relationships
- **(Skill)-[:APPLIED_IN_PROJECT]->(Project)**

### Certification → Relationships
- **(Certification)-[:ISSUED_BY]->(Institution)**
- **(Certification)-[:VALIDATES]->(Skill)**

### Interest → Relationships
- **(Interest)-[:DEVELOPS_QUALITY]->(Quality)**

### Location → Relationships
- **(LifePath)-[:INCLUDED_LOCATION {period}]->(City)**

### Anecdote → Relationships
- **(Anecdote)-[:CONTEXT_FOR]->(Experience)**
- **(Anecdote)-[:CONTEXT_FOR]->(Project)**
- **(Anecdote)-[:DEMONSTRATES]->(Quality)**
- **(Anecdote)-[:ILLUSTRATES]->(Methodology)**
- **(Anecdote)-[:LINKS_TO]->(Value)**

### Preferences → Relationships
- **(InternshipPreferences)-[:MOTIVATED_BY]->(Value)**

### Life Events → Relationships
- **(LifeEvent)-[:DEVELOPED_QUALITY]->(Quality)**

---

## Notes
- Multiple labels can be applied to nodes (e.g., Experience:Education, Experience:Internship)
- Array properties: achievements, skills
- Relationship properties: level (for HAS_SKILL, SPEAKS), year (for BORN_IN), period (for INCLUDED_LOCATION)
- The main person is named "Léon Morales"
- Always use MATCH (p:Person {name: "Léon Morales"}) to start queries about Léon
- Use parameterized queries with $name variable
- Project.startDate / Project.endDate and Experience.startDate / Experience.endDate are dates: to answer "first", "latest", "before" or "since", ORDER BY or compare them
- Projects done during an internship or a degree: (Experience)-[:INCLUDED_PROJECT]->(Project); find the experience through its institution, e.g. (e:Experience)-[:AT_INSTITUTION]->(i:Institution) WHERE toLower(i.name) CONTAINS "ksilink"
- Return the useful properties (name, description, dates, skills), not only names

## Examples
Question: What was Léon's first project at Ksilink?
MATCH (p:Person {name: "Léon Morales"})-[:HAS_EXPERIENCE]->(e:Experience)-[:AT_INSTITUTION]->(i:Institution)
WHERE toLower(i.name) CONTAINS "ksilink"
MATCH (e)-[:INCLUDED_PROJECT]->(pr:Project)
RETURN pr.name, pr.description, pr.startDate ORDER BY pr.startDate ASC LIMIT 1

Question: Which projects use Neo4j?
MATCH (p:Person {name: "Léon Morales"})-[:WORKED_ON]->(pr:Project)-[:UTILIZED_SKILL]->(s:Skill)
WHERE toLower(s.name) CONTAINS "neo4j"
RETURN pr.name, pr.description, pr.startDate ORDER BY pr.startDate DESC
"""

def generate_cypher_query_with_gemini(user_query: str, conversation_context: str = "", previous_attempt: str = "", error_message: str = "") -> str:
    """Generate Cypher query. Always instructed to use English for the DB interaction."""
    
    retry_context = ""
    if previous_attempt and error_message:
        retry_context = f"PREVIOUS FAILED ATTEMPT:\nQuery: {previous_attempt}\nError: {error_message}\nFix it."
    
    # We keep the prompt in English and instruct to handle the user query (whatever the language)
    prompt = f"""You are a Neo4j Cypher query expert. Generate a Cypher query to answer the user's question about Léon Morales.

IMPORTANT: Generate the Cypher query in ENGLISH ONLY, regardless of the user's language.
Use "Léon Morales" as the person name. Match strings using toLower() and CONTAINS.

{DATABASE_SCHEMA}

CONVERSATION CONTEXT:
{conversation_context}

{retry_context}

USER QUESTION:
{user_query}

Generate ONLY the Cypher query. No markdown, no explanations."""

    try:
        response = model_manager.generate_content(prompt)
        cypher_query = response.text.replace('```cypher', '').replace('```', '').strip()
        return cypher_query
    except AllModelsExhaustedException:
        raise  # Propagate this exception to be handled at the endpoint level
    except Exception as e:
        print(f"Error generating Cypher: {e}")
        return 'MATCH (p:Person {name: "Léon Morales"}) RETURN p'

def execute_cypher_query(cypher_query: str, parameters: Optional[dict] = None) -> tuple[str, bool, str]:
    if not neo4j_conn:
        return "Neo4j connection not available.", False, "No connection"
    try:
        results = neo4j_conn.run_query(cypher_query, parameters)
        if not results:
            return "No information found in the database.", True, ""
        # default=str: Neo4j dates are not JSON serializable
        return json.dumps(results, indent=2, ensure_ascii=False, default=str), True, ""
    except Exception as e:
        return "", False, str(e)

def analyze_question_intent(user_query: str) -> dict:
    """Analyze intent. Gemini handles the language understanding naturally."""
    
    # Check if specifically about Léon (simple heuristic to save tokens, optional)
    user_lower = user_query.lower()
    is_about_leon = any(x in user_lower for x in ['leon', 'léon'])
    
    prompt = f"""Analyze this user question about Léon Morales's portfolio.

USER QUESTION: "{user_query}"

Classify into:
1. RELEVANT: Is it about Léon, his skills, projects, or professional life? (YES/NO)
2. MOTIVATION: Is it asking why he wants to join a specific company? (YES/NO)
   - IF YES: Extract company name/field.
3. TECH_DEFINITION: Is it asking to explain a tech concept WITHOUT mentioning Léon? (YES/NO)
   - IF YES: Extract the tech name.

Answer format:
RELEVANT: YES/NO
MOTIVATION: YES/NO
COMPANY_FIELD: [value or none]
TECH_DEFINITION: YES/NO
TECHNOLOGY: [value or none]
"""
    
    try:
        response = model_manager.generate_content(prompt)
        answer = response.text.strip()
        
        result = {
            'is_relevant': "RELEVANT: YES" in answer,
            'is_motivation': "MOTIVATION: YES" in answer,
            'company_field': 'none',
            'is_tech_definition': "TECH_DEFINITION: YES" in answer and not is_about_leon,
            'technology': 'none'
        }
        
        # Simple parsing
        for line in answer.split('\n'):
            if 'COMPANY_FIELD:' in line: result['company_field'] = line.split(':')[1].strip()
            if 'TECHNOLOGY:' in line: result['technology'] = line.split(':')[1].strip()
            
        return result
    except AllModelsExhaustedException:
        raise  # Propagate this exception to be handled at the endpoint level
    except Exception:
        return {'is_relevant': True, 'is_motivation': False, 'company_field': 'none', 'is_tech_definition': False, 'technology': 'none'}

def generate_response_with_gemini(user_query: str, context: str, conversation_history: List[Dict[str, str]]) -> str:
    """Generate response. The prompt instructs Gemini to mirror the user's language."""
    
    history_text = "\n".join([f"User: {msg['user']}\nAssistant: {msg['assistant']}" for msg in conversation_history[-5:]])
    
    prompt = f"""You are an AI assistant representing Léon Morales.
    
**CRITICAL INSTRUCTION ON LANGUAGE:**
- **Reply in the SAME language as the USER'S CURRENT QUESTION.**
- If the user writes in French, answer in French.
- If the user writes in English, answer in English.
- If ambiguous, look at the conversation history. Default to English only if completely unsure.

**CONTEXT:**
Database Results: {context}
Conversation History: {history_text}

**USER QUESTION:**
{user_query}

**GUIDELINES:**
1. Speak in THIRD PERSON about Léon ("he", "his" / "il", "son").
2. Be professional, concise, and friendly.
3. Base your answer strictly on the Database Results. If the info isn't there, say you don't know (in the user's language).
4. Do not translate technical terms (Python, Machine Learning, etc.).

Response:"""

    try:
        response = model_manager.generate_content(prompt)
        return response.text or "I cannot generate a response right now."
    except AllModelsExhaustedException:
        raise  # Propagate this exception to be handled at the endpoint level
    except Exception as e:
        print(f"Error generating response: {e}")
        return "Error generating response."

# --- Main Endpoint ---

# Sync endpoint: FastAPI runs it in a thread pool, so blocking Gemini/Neo4j calls don't stall other requests
@app.post("/chat", response_model=ChatResponse)
@limiter.limit(CHAT_RATE_LIMIT)
def handle_chat(request: Request, chat_query: ChatQuery):
    user_query = chat_query.query
    session_id = chat_query.session_id
    
    print(f"Query: {user_query}")
    
    history = sessions.get(session_id)
    convo_context = "\n".join([f"Q: {m['user']}\nA: {m['assistant']}" for m in history[-3:]])

    try:
        # 1. Analyze intent, and generate the Cypher query at the same time (discarded if off-topic)
        intent_future = executor.submit(analyze_question_intent, user_query)
        cypher_future = executor.submit(generate_cypher_query_with_gemini, user_query, convo_context)
        intent = intent_future.result()
        
        # 2. Handle Non-Relevant / Off-topic
        if not intent['is_relevant']:
            # We ask Gemini to generate the polite refusal in the correct language
            refusal_prompt = f"The user asked: '{user_query}'. Politely refuse to answer because it's off-topic. Say you only answer about Léon Morales. Reply in the same language as the user."
            resp = model_manager.generate_content(refusal_prompt)
            return ChatResponse(response=resp.text, session_id=session_id)

        # 3. Handle Motivation Questions
        if intent['is_motivation']:
            field = intent['company_field']
            motiv_prompt = f"The user represents a company in '{field}' and asked: '{user_query}'. Reply in the user's language that Léon cannot speak to specific personal motivations as an AI, but would love to discuss it in an interview."
            resp = model_manager.generate_content(motiv_prompt)
            return ChatResponse(response=resp.text, session_id=session_id)

        # 4. Handle Tech Definitions (General Knowledge fallback)
        if intent['is_tech_definition'] and intent['technology'] != "none":
            # Simplified logic: just ask Gemini to define it briefly AND mention if Léon knows it based on DB check
            tech = intent['technology']
            # Quick check if Léon has the skill
            check_cypher = 'MATCH (p:Person {name: "Léon Morales"})-[:HAS_SKILL]->(s:Skill) WHERE toLower(s.name) CONTAINS toLower($tech) RETURN s'
            db_res, _, _ = execute_cypher_query(check_cypher, {"tech": tech})
            has_skill = "No information" not in db_res
            
            skill_status = "confirm Léon has this skill" if has_skill else "state you don't have details on Léon's use of this"
            def_prompt = f"""User asked about tech '{tech}': '{user_query}'. 
            1. Define it briefly (2 sentences).
            2. Then, {skill_status} based on the portfolio.
            Reply in the user's language."""
            
            resp = model_manager.generate_content(def_prompt)
            return ChatResponse(response=resp.text, session_id=session_id)

        # 5. Standard RAG Flow: execute the Cypher generated in parallel with the intent
        cypher = cypher_future.result()
        context, success, error_msg = execute_cypher_query(cypher)
        
        if not success and error_msg:
            cypher_retry = generate_cypher_query_with_gemini(user_query, convo_context, previous_attempt=cypher, error_message=error_msg)
            context, success, error_msg = execute_cypher_query(cypher_retry)
        
        # Generate Answer
        response_text = generate_response_with_gemini(user_query, context, history)
        
        sessions.append(session_id, user_query, response_text)
            
        return ChatResponse(response=response_text, session_id=session_id)

    except AllModelsExhaustedException as e:
        print(f"ALL MODELS EXHAUSTED: {e}")
        # Detect user's language from query
        user_lower = user_query.lower()
        french_words = ['qui', 'que', 'quoi', 'comment', 'pourquoi', 'où', 'quand', 'quel', 'quelle', 'est', 'sont', 'avez', 'fait', 'peut', 'peux']
        is_french = any(word in user_lower for word in french_words)
        
        if is_french:
            error_message = (
                "L'assistant est momentanément indisponible : le service Gemini est surchargé ou a atteint son quota. "
                "Réessayez dans quelques minutes, ou écrivez directement à Léon : leon.morales@outlook.fr"
            )
        else:
            error_message = (
                "The assistant is temporarily unavailable: the Gemini service is overloaded or has reached its quota. "
                "Try again in a few minutes, or write to Léon directly: leon.morales@outlook.fr"
            )

        return ChatResponse(response=error_message, session_id=session_id)
    
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")
        traceback.print_exc()
        # Generic fallback
        return ChatResponse(response="An error occurred. Please try again.", session_id=session_id)

@app.get("/")
async def root():
    return {
        "message": "Léon's Portfolio Chatbot API",
        "status": "running",
        "neo4j_connected": neo4j_conn is not None
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "neo4j_connected": neo4j_conn is not None
    }
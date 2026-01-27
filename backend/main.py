# main.py - Backend API for Portfolio Chatbot with Graph RAG
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv
import google.generativeai as genai
from neo4j import GraphDatabase
from typing import List, Dict, Optional
import json
from collections import defaultdict
import traceback

# Load environment variables
load_dotenv()
NEO4J_URI = os.getenv("NEO4J_URI", "neo4j://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Neo4j Connection
class Neo4jConnection:
    def __init__(self, uri, user, password):
        self._driver = GraphDatabase.driver(uri, auth=(user, password))

    def close(self):
        if self._driver:
            self._driver.close()

    def run_query(self, query, parameters=None):
        with self._driver.session() as session:
            result = session.run(query, parameters)
            return [record.data() for record in result]

# Global variables
neo4j_conn = None
model = None

# Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global neo4j_conn, model
    print("===== Application Startup =====")
    
    # Configure Gemini and try models in order
    genai.configure(api_key=GEMINI_API_KEY)
    
    model_names = [
        'gemini-2.5-flash',
        'gemini-2.5-flash-lite',
        'gemini-3-flash',
    ]
    
    model = None
    for model_name in model_names:
        try:
            print(f"Trying model: {model_name}")
            test_model = genai.GenerativeModel(model_name)
            # Test with a simple query
            test_response = test_model.generate_content("Say 'OK'")
            if test_response.text:
                model = test_model
                print(f"✓ Gemini configured successfully with model: {model_name}")
                break
        except Exception as e:
            print(f"✗ Model {model_name} failed: {e}")
            continue
    
    if model is None:
        print("✗ WARNING: All models failed, using fallback model")
        model = genai.GenerativeModel('gemini-1.5-flash')
    
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

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class ChatQuery(BaseModel):
    query: str
    session_id: Optional[str] = "default"

class ChatResponse(BaseModel):
    response: str
    session_id: str

conversation_history: Dict[str, List[Dict[str, str]]] = defaultdict(list)

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
"""

# Note: Assurez-vous d'inclure la variable DATABASE_SCHEMA complète ici comme dans votre fichier original

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
        response = model.generate_content(prompt)
        cypher_query = response.text.replace('```cypher', '').replace('```', '').strip()
        return cypher_query
    except Exception as e:
        print(f"Error generating Cypher: {e}")
        return 'MATCH (p:Person {name: "Léon Morales"}) RETURN p'

def execute_cypher_query(cypher_query: str) -> tuple[str, bool, str]:
    if not neo4j_conn:
        return "Neo4j connection not available.", False, "No connection"
    try:
        results = neo4j_conn.run_query(cypher_query)
        if not results:
            return "No information found in the database.", True, ""
        return json.dumps(results, indent=2, ensure_ascii=False), True, ""
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
        response = model.generate_content(prompt)
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
        response = model.generate_content(prompt)
        return response.text if response.parts else "I cannot generate a response right now."
    except Exception as e:
        print(f"Error generating response: {e}")
        return "Error generating response."

# --- Main Endpoint ---

@app.post("/chat", response_model=ChatResponse)
async def handle_chat(chat_query: ChatQuery):
    user_query = chat_query.query
    session_id = chat_query.session_id
    
    print(f"🤖 Query: {user_query}")
    
    try:
        # 1. Analyze Intent
        intent = analyze_question_intent(user_query)
        
        # 2. Handle Non-Relevant / Off-topic
        if not intent['is_relevant']:
            # We ask Gemini to generate the polite refusal in the correct language
            refusal_prompt = f"The user asked: '{user_query}'. Politely refuse to answer because it's off-topic. Say you only answer about Léon Morales. Reply in the same language as the user."
            resp = model.generate_content(refusal_prompt)
            return ChatResponse(response=resp.text, session_id=session_id)

        # 3. Handle Motivation Questions
        if intent['is_motivation']:
            field = intent['company_field']
            motiv_prompt = f"The user represents a company in '{field}' and asked: '{user_query}'. Reply in the user's language that Léon cannot speak to specific personal motivations as an AI, but would love to discuss it in an interview."
            resp = model.generate_content(motiv_prompt)
            return ChatResponse(response=resp.text, session_id=session_id)

        # 4. Handle Tech Definitions (General Knowledge fallback)
        if intent['is_tech_definition'] and intent['technology'] != "none":
            # Simplified logic: just ask Gemini to define it briefly AND mention if Léon knows it based on DB check
            tech = intent['technology']
            # Quick check if Léon has the skill
            check_cypher = f'MATCH (p:Person {{name: "Léon Morales"}})-[:HAS_SKILL]->(s:Skill) WHERE toLower(s.name) CONTAINS toLower("{tech}") RETURN s'
            db_res, _, _ = execute_cypher_query(check_cypher)
            has_skill = "No information" not in db_res
            
            skill_status = "confirm Léon has this skill" if has_skill else "state you don't have details on Léon's use of this"
            def_prompt = f"""User asked about tech '{tech}': '{user_query}'. 
            1. Define it briefly (2 sentences).
            2. Then, {skill_status} based on the portfolio.
            Reply in the user's language."""
            
            resp = model.generate_content(def_prompt)
            return ChatResponse(response=resp.text, session_id=session_id)

        # 5. Standard RAG Flow
        history = conversation_history[session_id]
        convo_context = "\n".join([f"Q: {m['user']}\nA: {m['assistant']}" for m in history[-3:]])
        
        # Generate & Execute Cypher
        cypher = generate_cypher_query_with_gemini(user_query, convo_context)
        context, success, _ = execute_cypher_query(cypher)
        
        # Generate Answer
        response_text = generate_response_with_gemini(user_query, context, history)
        
        # Update History
        conversation_history[session_id].append({"user": user_query, "assistant": response_text})
        if len(conversation_history[session_id]) > 10:
            conversation_history[session_id].pop(0)
            
        return ChatResponse(response=response_text, session_id=session_id)

    except Exception as e:
        print(f"CRITICAL ERROR: {e}")
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
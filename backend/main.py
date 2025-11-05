# main.py - Backend API for Portfolio Chatbot with Graph RAG
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
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

# Validate environment variables
if not all([NEO4J_PASSWORD, GEMINI_API_KEY]):
    print("WARNING: Missing environment variables (Neo4j/Gemini credentials).")

# Initialize FastAPI app
app = FastAPI(title="Léon's Portfolio Chatbot API")

# Add CORS middleware to allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.5-flash')

print("=" * 60)
print("Initializing Portfolio Chatbot API")
print("=" * 60)

# Neo4j Connection Class
class Neo4jConnection:
    def __init__(self, uri, user, password):
        self._driver = GraphDatabase.driver(uri, auth=(user, password))

    def close(self):
        if self._driver:
            self._driver.close()

    def run_query(self, query, parameters=None):
        """Execute a Cypher query and return results."""
        with self._driver.session() as session:
            result = session.run(query, parameters)
            return [record.data() for record in result]

# Initialize Neo4j connection
try:
    neo4j_conn = Neo4jConnection(NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD)
    print("✓ Connected to Neo4j successfully")
except Exception as e:
    print(f"✗ Failed to connect to Neo4j: {e}")
    neo4j_conn = None

# Request/Response Models
class ChatQuery(BaseModel):
    query: str
    session_id: Optional[str] = "default"
    language: Optional[str] = "en"  # 'en' or 'fr'

class ChatResponse(BaseModel):
    response: str
    session_id: str

# Conversation memory storage (in production, use Redis or database)
conversation_history: Dict[str, List[Dict[str, str]]] = defaultdict(list)

# Graph RAG Functions

def detect_language(text: str) -> str:
    """
    Detect if the text is in French or English.
    Returns 'fr' for French, 'en' for English.
    Uses a simple keyword-based approach for fast detection.
    """
    text_lower = text.lower()
    
    # French-specific words and patterns
    french_indicators = [
        'quoi', 'quel', 'quelle', 'quels', 'quelles',
        'qui', 'où', 'comment', 'pourquoi', 'combien',
        'parle', 'parlez', 'parler', 'dis', 'dites',
        'peux', 'peut', 'pouvez', 'pouvons',
        'sais', 'sait', 'savez', 'savoir',
        'connais', 'connaît', 'connaissez', 'connaître',
        'a-t-il', 'a-t-elle', 'est-ce', 'qu\'est-ce',
        'ses compétences', 'son expérience', 'son parcours',
        'de léon', 'de leon', 'sur léon', 'sur leon',
        'vécu', 'habite', 'travaillé', 'étudié',
        'dans', 'avec', 'pour', 'sans',
        'une', 'des', 'les', 'aux',
        'sont', 'était', 'avez', 'avoir'
    ]
    
    # English-specific words and patterns
    english_indicators = [
        'what', 'which', 'who', 'where', 'when', 'why', 'how',
        'tell me', 'can you', 'could you', 'would you',
        'do you', 'does he', 'did he', 'has he',
        'his skills', 'his experience', 'his background',
        'about léon', 'about leon',
        'lived', 'works', 'worked', 'studied',
        'with', 'from', 'about', 'through',
        'the', 'are', 'was', 'were', 'have', 'has'
    ]
    
    # Count indicators
    french_count = sum(1 for indicator in french_indicators if indicator in text_lower)
    english_count = sum(1 for indicator in english_indicators if indicator in text_lower)
    
    # Additional check: French-specific characters
    if any(char in text for char in ['é', 'è', 'ê', 'à', 'ù', 'ô', 'â', 'î', 'ç', 'û']):
        french_count += 2
    
    # Decide based on counts
    if french_count > english_count:
        return 'fr'
    elif english_count > french_count:
        return 'en'
    else:
        # Default to English if unclear
        return 'en'

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

def generate_cypher_query_with_gemini(user_query: str, conversation_context: str = "", previous_attempt: str = "", error_message: str = "") -> str:
    """
    Use Gemini to generate a Cypher query based on the user's question.
    If previous_attempt and error_message are provided, ask Gemini to fix the query.
    Note: Cypher queries are ALWAYS generated in English regardless of user's question language.
    """
    
    retry_context = ""
    if previous_attempt and error_message:
        retry_context = f"""
PREVIOUS FAILED ATTEMPT:
Query: {previous_attempt}
Error: {error_message}

Please fix the query above to avoid this error.
"""
    
    prompt = f"""You are a Neo4j Cypher query expert. Generate a Cypher query to answer the user's question about Léon Morales.

IMPORTANT: Generate the Cypher query in ENGLISH ONLY, regardless of the language of the user's question.

CRITICAL: Keep the query as SIMPLE and EFFICIENT as possible!
- Use ONLY the necessary MATCH/OPTIONAL MATCH clauses
- Avoid excessive WHERE conditions (max 2-3 conditions per clause)
- Return ONLY the properties needed to answer the question
- DO NOT try to fetch everything - be selective and focused
- Prefer simple queries over complex ones - simplicity is key!

{DATABASE_SCHEMA}

CONVERSATION CONTEXT:
{conversation_context}

{retry_context}

USER QUESTION (may be in French or English):
{user_query}

INSTRUCTIONS:
1. Generate ONLY the Cypher query in ENGLISH, nothing else
2. Use "Léon Morales" as the person name
3. Return ONLY relevant properties based on the question - don't fetch everything!
4. Keep the query SIMPLE - use minimal MATCH/OPTIONAL MATCH clauses
5. Limit WHERE conditions to 2-3 per clause maximum
6. Limit results to 10 if listing multiple items
7. Do not include markdown formatting or explanations
8. The query must be valid Cypher syntax
9. Make sure property names match the schema exactly
10. ALWAYS use toLower() for case-insensitive string comparisons
11. ALWAYS use CONTAINS for partial string matching instead of exact matches
12. For text searches, convert both the property and search term to lowercase

STRING MATCHING RULES:
- Use: WHERE toLower(s.name) CONTAINS toLower("python")
- Use: WHERE toLower(proj.name) CONTAINS toLower("chatbot")
- Use: WHERE toLower(e.role) CONTAINS toLower("engineer")
- DO NOT use exact matches like: WHERE s.name = "Python"
- DO NOT use case-sensitive CONTAINS: WHERE s.name CONTAINS "Python"
- LIMIT WHERE conditions: max 2-3 conditions per clause

SIMPLICITY EXAMPLES:

Question: "What are Léon's skills?" OR "Quelles sont les compétences de Léon ?"
GOOD (Simple): MATCH (p:Person {{name: "Léon Morales"}})-[r:HAS_SKILL]->(s:Skill) RETURN s.name AS skill, r.level AS level, s.category AS category ORDER BY r.level DESC LIMIT 10
BAD (Too complex): Fetching skills + projects + experience + certifications all at once

Question: "Tell me about Léon's Python skills" OR "Parle-moi des compétences Python de Léon"
GOOD (Simple): MATCH (p:Person {{name: "Léon Morales"}})-[r:HAS_SKILL]->(s:Skill) WHERE toLower(s.name) CONTAINS toLower("python") RETURN s.name AS skill, r.level AS level, s.description AS description
BAD (Too complex): Multiple OPTIONAL MATCH with many WHERE conditions

Question: "Why should I hire him as a software engineer at Google?" OR "Pourquoi devrais-je l'embaucher?"
GOOD (Simple): MATCH (p:Person {{name: "Léon Morales"}}) OPTIONAL MATCH (p)-[r:HAS_SKILL]->(s:Skill) WHERE toLower(s.category) CONTAINS toLower("programming") OPTIONAL MATCH (p)-[:HAS_EXPERIENCE]->(e:Experience) RETURN p.summary AS summary, collect(DISTINCT s.name)[..5] AS top_skills, collect(DISTINCT e.role)[..3] AS experiences LIMIT 1
BAD (Too complex): 10+ OPTIONAL MATCH clauses with dozens of WHERE conditions

Question: "Tell me about Léon's projects" OR "Parle-moi des projets de Léon"
GOOD (Simple): MATCH (p:Person {{name: "Léon Morales"}})-[:WORKED_ON]->(proj:Project) RETURN proj.name AS project, proj.description AS description, proj.skills AS technologies LIMIT 10
BAD (Too complex): Fetching projects + skills + qualities + certifications + experience

Question: "What is Léon's education?" OR "Quelle est la formation de Léon?"
GOOD (Simple): MATCH (p:Person {{name: "Léon Morales"}})-[:HAS_EXPERIENCE]->(e:Education) OPTIONAL MATCH (e)-[:AT_INSTITUTION]->(i:Institution) RETURN e.degree AS degree, e.field AS field, i.name AS institution, e.startDate AS start, e.endDate AS end
BAD (Too complex): Fetching education + internships + jobs + certifications + skills

REMEMBER: SIMPLE queries are BETTER than complex ones! Answer the question directly with minimal data fetching.

Now generate the Cypher query for the user's question:"""

    try:
        response = model.generate_content(prompt)
        cypher_query = response.text.strip()
        
        # Clean up the response (remove markdown formatting if any)
        cypher_query = cypher_query.replace('```cypher', '').replace('```', '').strip()
        
        print(f"🔍 Generated Cypher: {cypher_query}")
        return cypher_query
    
    except Exception as e:
        print(f"Error generating Cypher query: {e}")
        # Fallback query
        return 'MATCH (p:Person {name: "Léon Morales"}) RETURN p.bio AS bio, p.interests AS interests'

def execute_cypher_query(cypher_query: str) -> tuple[str, bool, str]:
    """
    Execute the Cypher query and format results as context.
    Returns: (formatted_results, success, error_message)
    """
    if not neo4j_conn:
        return "Neo4j connection not available.", False, "No Neo4j connection"
    
    try:
        results = neo4j_conn.run_query(cypher_query)
        
        if not results:
            return "No information found in the database.", True, ""
        
        # Format results as JSON string for context
        formatted_results = json.dumps(results, indent=2, ensure_ascii=False)
        print(f"Query returned {len(results)} results")
        
        return formatted_results, True, ""
    
    except Exception as e:
        error_msg = str(e)
        print(f"Error executing Cypher query: {error_msg}")
        return "", False, error_msg

def analyze_question_intent(user_query: str, language: str = "en") -> dict:
    """
    Unified function to analyze question intent in ONE Gemini call.
    Returns a dictionary with all analysis results:
    {
        'is_relevant': bool,
        'is_motivation': bool,
        'company_field': str,
        'is_tech_definition': bool,
        'technology': str
    }
    """
    
    # Quick check: if asking about "Léon" or "Leon" the person, it's not a tech definition
    user_lower = user_query.lower()
    is_about_leon = any(phrase in user_lower for phrase in [
        'about léon', 'about leon', 'de léon', 'de leon', 'sur léon', 'sur leon',
        'tell me about léon', 'parle-moi de léon', 'qui est léon', 'who is léon',
        'parle moi de léon', 'parlez moi de léon', 'leon', 'léon'
    ])
    
    prompt = f"""Analyze this user question about Léon Morales's portfolio and provide a comprehensive classification.

USER QUESTION: "{user_query}"
LANGUAGE: {language}

Analyze the question for these aspects:

1. RELEVANCE: Is this question about Léon Morales or his professional life?
   - Answer YES for ANY question about Léon (his life, location, background, skills, projects, etc.)
   - Answer YES for questions in any language (English, French, etc.) that mention "Léon" or "Leon"
   - Answer NO ONLY for questions completely unrelated to Léon (e.g., "What is the capital of France?", "Calculate 2+2")
   
   Examples of RELEVANT questions:
   - "Where did Léon live?" / "Où a vécu Léon?" -> YES (about Léon's life)
   - "What are his skills?" / "Quelles sont ses compétences?" -> YES (about Léon)
   - "Tell me about Leon" / "Parle-moi de Leon" -> YES (about Léon)
   - "Where was he born?" / "Où est-il né?" -> YES (about Léon)
   - "His experience in Python?" / "Son expérience en Python?" -> YES (about Léon)
   
   Examples of NOT RELEVANT:
   - "What is the capital of France?" -> NO (general knowledge)
   - "How does Python work?" -> NO (general tech question, not about Léon)

2. MOTIVATION: Is this asking why Léon wants to join a specific company ("Why us?", "Why our company?")?
   - If YES, guess the company field/domain if mentioned

3. TECH_DEFINITION: Is this asking for a definition/explanation of a TECHNOLOGY (not about Léon)?
   - Answer NO if asking about Léon's experience with something
   - Answer YES only if asking "What is X?" or "Explain X" for a technical concept WITHOUT mentioning Léon
   - If the question is about Léon himself, answer NO

Answer in this EXACT format (no other text):
RELEVANT: YES or NO
MOTIVATION: YES or NO
COMPANY_FIELD: [field name or "none"]
TECH_DEFINITION: YES or NO
TECHNOLOGY: [technology name or "none"]

Examples:
Question: "What are Léon's skills?" / "Quelles sont les compétences de Léon?"
RELEVANT: YES
MOTIVATION: NO
COMPANY_FIELD: none
TECH_DEFINITION: NO
TECHNOLOGY: none

Question: "Where did Leon live?" / "Où a vécu Leon?"
RELEVANT: YES
MOTIVATION: NO
COMPANY_FIELD: none
TECH_DEFINITION: NO
TECHNOLOGY: none

Question: "Why do you want to join Google?"
RELEVANT: YES
MOTIVATION: YES
COMPANY_FIELD: tech/search
TECH_DEFINITION: NO
TECHNOLOGY: none

Question: "What is Docker?" (not mentioning Léon)
RELEVANT: NO
MOTIVATION: NO
COMPANY_FIELD: none
TECH_DEFINITION: YES
TECHNOLOGY: Docker

Question: "What is the capital of France?"
RELEVANT: NO
MOTIVATION: NO
COMPANY_FIELD: none
TECH_DEFINITION: NO
TECHNOLOGY: none

Now analyze:"""
    
    try:
        response = model.generate_content(prompt)
        answer = response.text.strip()
        
        # Parse the response
        result = {
            'is_relevant': "RELEVANT: YES" in answer,
            'is_motivation': "MOTIVATION: YES" in answer,
            'company_field': 'none',
            'is_tech_definition': "TECH_DEFINITION: YES" in answer and not is_about_leon,
            'technology': 'none'
        }
        
        # Extract company field
        if "COMPANY_FIELD:" in answer:
            for line in answer.split('\n'):
                if 'COMPANY_FIELD:' in line:
                    result['company_field'] = line.split('COMPANY_FIELD:')[1].strip()
                    break
        
        # Extract technology
        if "TECHNOLOGY:" in answer:
            for line in answer.split('\n'):
                if 'TECHNOLOGY:' in line:
                    result['technology'] = line.split('TECHNOLOGY:')[1].strip()
                    break
        
        # Override tech definition if it's about Léon
        if is_about_leon:
            result['is_tech_definition'] = False
            result['technology'] = 'none'
        
        print(f"🎯 Question analysis: relevant={result['is_relevant']}, motivation={result['is_motivation']}, tech_def={result['is_tech_definition']}, tech={result['technology']}")
        return result
    
    except Exception as e:
        print(f"⚠️  Error analyzing question intent: {e}")
        # Safe defaults
        return {
            'is_relevant': True,
            'is_motivation': False,
            'company_field': 'none',
            'is_tech_definition': False,
            'technology': 'none'
        }

def is_relevant_question(user_query: str, language: str = "en") -> bool:
    """
    Check if the question is relevant to Léon Morales portfolio.
    Returns True if relevant, False if off-topic.
    """
    
    scope_description = {
        "en": """The chatbot should ONLY answer questions about:
- Léon's professional background, skills, experience
- His projects, education, certifications
- His career goals, interests, qualities
- Contact information
- Technical skills and expertise
- Work history and achievements

The chatbot should REJECT questions about:
- General knowledge (e.g., "What is Python?", "How does AI work?")
- Other people or topics unrelated to Léon
- Current events, news, politics
- Mathematics, science problems unrelated to Léon's work
- Jokes, games, or casual conversation not about Léon
- Requests to perform tasks (calculations, translations, etc.)""",
        
        "fr": """Le chatbot doit UNIQUEMENT répondre aux questions sur:
- Le parcours professionnel, les compétences et l'expérience de Léon
- Ses projets, formation, certifications
- Ses objectifs de carrière, intérêts, qualités
- Informations de contact
- Compétences techniques et expertise
- Historique professionnel et réalisations

Le chatbot doit REJETER les questions sur:
- Connaissances générales (ex: "Qu'est-ce que Python?", "Comment fonctionne l'IA?")
- D'autres personnes ou sujets sans rapport avec Léon
- Actualités, politique
- Problèmes de mathématiques ou sciences sans rapport avec le travail de Léon
- Blagues, jeux ou conversations informelles ne concernant pas Léon
- Demandes d'effectuer des tâches (calculs, traductions, etc.)"""
    }
    
    prompt = f"""You are a question relevance classifier for a portfolio chatbot about Léon Morales.

{scope_description.get(language, scope_description['en'])}

USER QUESTION: "{user_query}"

Is this question relevant to Léon Morales's portfolio? Answer with ONLY "YES" or "NO".
"""
    
    try:
        response = model.generate_content(prompt)
        answer = response.text.strip().upper()
        
        print(f"Question relevance: {answer}")
        return "YES" in answer
    
    except Exception as e:
        print(f"Error checking relevance: {e}")
        # If we can't determine, assume it's relevant to avoid false positives
        return True

def is_company_motivation_question(user_query: str, language: str = "en") -> tuple[bool, str]:
    """
    Detect if the question is about why Léon wants to join the recruiter's company.
    Returns (is_motivation_question, company_field_guess)
    """
    
    prompt = f"""Analyze if this question is asking about why Léon wants to join a specific company or "Why us?".

USER QUESTION: "{user_query}"

Answer in this exact format:
IS_MOTIVATION: YES or NO
COMPANY_FIELD: [guess the company's field/domain if mentioned, or "general" if not clear]

Examples:
- "Why do you want to join us?" -> IS_MOTIVATION: YES, COMPANY_FIELD: general
- "Why Google?" -> IS_MOTIVATION: YES, COMPANY_FIELD: tech/search
- "What are your skills?" -> IS_MOTIVATION: NO, COMPANY_FIELD: none
"""
    
    try:
        response = model.generate_content(prompt)
        answer = response.text.strip()
        
        is_motivation = "IS_MOTIVATION: YES" in answer
        
        # Extract company field
        company_field = "general"
        if "COMPANY_FIELD:" in answer:
            field_line = [line for line in answer.split('\n') if 'COMPANY_FIELD:' in line][0]
            company_field = field_line.split('COMPANY_FIELD:')[1].strip()
        
        print(f"🏢 Company motivation question: {is_motivation}, Field: {company_field}")
        return is_motivation, company_field
    
    except Exception as e:
        print(f"Error detecting motivation question: {e}")
        return False, "general"

def is_technology_definition_question(user_query: str) -> tuple[bool, str]:
    """
    Detect if the question is asking for a definition/explanation of a technology.
    Returns (is_definition, technology_name)
    """
    
    # Quick check: if asking about "Léon" or "Leon" the person, it's not a tech definition
    user_lower = user_query.lower()
    if any(phrase in user_lower for phrase in ['about léon', 'about leon', 'de léon', 'de leon', 'sur léon', 'sur leon', 'tell me about léon', 'parle-moi de léon', 'qui est léon', 'who is léon']):
        return False, "none"
    
    prompt = f"""Analyze if this question is asking for a definition or explanation of a TECHNOLOGY/TECHNICAL CONCEPT (not about a person named Léon).

USER QUESTION: "{user_query}"

IMPORTANT: If the question is about Léon Morales (the person), answer NO.

Answer in this exact format:
IS_DEFINITION: YES or NO
TECHNOLOGY: [the technology/concept name, or "none"]

Examples:
- "What is Contrastive Learning?" -> IS_DEFINITION: YES, TECHNOLOGY: Contrastive Learning
- "Can you explain Docker?" -> IS_DEFINITION: YES, TECHNOLOGY: Docker
- "What are Léon's skills?" -> IS_DEFINITION: NO, TECHNOLOGY: none
- "Tell me about Léon" -> IS_DEFINITION: NO, TECHNOLOGY: none
- "Who is Léon?" -> IS_DEFINITION: NO, TECHNOLOGY: none
- "Tell me about his Python experience" -> IS_DEFINITION: NO, TECHNOLOGY: none
"""
    
    try:
        response = model.generate_content(prompt)
        answer = response.text.strip()
        
        is_definition = "IS_DEFINITION: YES" in answer
        
        # Extract technology name
        technology = "none"
        if "TECHNOLOGY:" in answer:
            tech_line = [line for line in answer.split('\n') if 'TECHNOLOGY:' in line][0]
            technology = tech_line.split('TECHNOLOGY:')[1].strip()
        
        print(f"📚 Technology definition question: {is_definition}, Technology: {technology}")
        return is_definition, technology
    
    except Exception as e:
        print(f"Error detecting definition question: {e}")
        return False, "none"

def generate_response_with_gemini(user_query: str, context: str, conversation_history: List[Dict[str, str]], language: str = "en") -> str:
    """Generate a response using Gemini with the retrieved context and conversation history.
    Detects the language of the user's question and responds in the same language."""
    
    # Format conversation history
    history_text = ""
    if conversation_history:
        history_text = "\n".join([
            f"User: {msg['user']}\nAssistant: {msg['assistant']}"
            for msg in conversation_history[-5:]  # Last 5 exchanges
        ])
    
    prompt = f"""You are an AI assistant representing Léon Morales, a professional in the field. You're helping recruiters and visitors learn about Léon's background, skills, experience, and projects.

IMPORTANT LANGUAGE INSTRUCTION:
- DETECT the language of the user's question (English or French)
- RESPOND in the SAME language as the question
- If the question is in French, respond in French
- If the question is in English, respond in English
- Speak in THIRD PERSON about Léon (use "he", "his" in English or "il", "son" in French)
- Act as a professional assistant highlighting Léon's strengths and achievements
- Be conversational, friendly, and professional
- Your goal is to showcase Léon's expertise and qualifications to potential recruiters

CONVERSATION HISTORY:
{history_text}

DATABASE QUERY RESULTS (in English - keep technical terms in English):
{context}

CURRENT USER QUESTION (may be in French or English):
{user_query}

INSTRUCTIONS:
1. Answer based on the database results provided above
2. Maintain context from previous messages in the conversation
3. If the database results are empty or don't answer the question, politely say that information is not available
4. Highlight key achievements, skills, and experiences naturally
5. Keep responses concise but informative (3-5 sentences for most questions)
6. Format lists with bullet points when appropriate
7. If asked about contact information, encourage the user to reach out
8. Keep technical terms in English (e.g., Python, Machine Learning, etc.)
9. RESPOND IN THE SAME LANGUAGE AS THE QUESTION
10. ALWAYS use third person (he/his/il/son) when referring to Léon
11. Present Léon's qualifications in a positive, professional manner that appeals to recruiters

FORMATTING INSTRUCTIONS (use Markdown):
- Use **bold** for important words, key skills, technologies, and achievements
- Use bullet points (•) for lists of items
- Use numbered lists (1., 2., 3.) for sequential steps or rankings
- Create tables using Markdown syntax when presenting structured data (e.g., skills with levels, projects with technologies)
- Use line breaks to separate different topics
- Example table format:
  | Skill | Level | Category |
  |-------|-------|----------|
  | Python | Expert | Programming |
  | React | Advanced | Frontend |

FORMATTING EXAMPLES:
Good: "Léon has **5 years of experience** in **Machine Learning** and **Data Science**."
Good: "His main skills include:\n• **Python** (Expert level)\n• **TensorFlow** (Advanced)\n• **Docker** (Intermediate)"
Good for multiple projects: Use a table with columns: Project | Technologies | Description

TONE EXAMPLES:
Good (Third person, professional): "Léon has extensive experience in Machine Learning, with a particular focus on deep learning and computer vision."
Good (French, third person): "Léon possède une solide expérience en Machine Learning, avec une spécialisation en deep learning."
Bad (First person): "I have experience in Machine Learning and computer vision."
Bad (First person French): "J'ai de l'expérience en Machine Learning."

IMPORTANT:
- Don't make up information not in the database results
- Reference previous conversation topics when relevant
- Detect and match the language of the user's question
- Use Markdown formatting to make responses visually appealing and easy to read
- Always speak in third person about Léon to maintain professional distance

RESPONSE:"""

    try:
        response = model.generate_content(prompt)
        
        if response.parts:
            return response.text
        else:
            print(f"⚠️  Response blocked by safety filters")
            print(f"Prompt feedback: {response.prompt_feedback}")
            # Detect if question is in French to provide appropriate fallback
            french_keywords = ['quoi', 'quel', 'qui', 'comment', 'pourquoi', 'où', 'parle', 'peux', 'sais', 'connais']
            is_french = any(keyword in user_query.lower() for keyword in french_keywords)
            
            if is_french:
                return "Je m'excuse, mais je n'ai pas pu générer de réponse. Veuillez reformuler votre question."
            else:
                return "I apologize, but I couldn't generate a response. Please try rephrasing your question."
    
    except Exception as e:
        print(f"❌ ERROR in generate_response_with_gemini: {e}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        print(f"Full traceback:\n{traceback.format_exc()}")
        
        # Detect if question is in French to provide appropriate error message
        french_keywords = ['quoi', 'quel', 'qui', 'comment', 'pourquoi', 'où', 'parle', 'peux', 'sais', 'connais']
        is_french = any(keyword in user_query.lower() for keyword in french_keywords)
        
        if is_french:
            return "J'ai des difficultés à traiter votre demande actuellement. Veuillez réessayer."
        else:
            return "I'm having trouble processing your request right now. Please try again."

# API Endpoints
@app.get("/", summary="Root endpoint for health check")
async def read_root():
    # Try to get the actual host from environment or request
    space_host = os.getenv("SPACE_HOST", "unknown")
    port = os.getenv("PORT", "8080")
    
    return {
        "message": "Léon's Portfolio Chatbot API is running!",
        "version": "1.0.0",
        "neo4j_connected": neo4j_conn is not None,
        "space_host": space_host,
        "port": port,
        "hint": "Use POST /chat with {query: 'your question'}"
    }

@app.post("/chat", response_model=ChatResponse, summary="Process a user query")
async def handle_chat(chat_query: ChatQuery):
    """
    Main chatbot endpoint with conversation memory:
    1. Detect language automatically from the question
    2. Check if question is relevant to Léon's portfolio
    3. Generate Cypher query using Gemini (with retry logic)
    4. Execute query on Neo4j
    5. Generate response with context and conversation history
    """
    user_query = chat_query.query
    session_id = chat_query.session_id
    
    # AUTO-DETECT LANGUAGE from the user's question
    detected_language = detect_language(user_query)
    # Override with provided language if explicitly set and not default
    language = chat_query.language if chat_query.language and chat_query.language != "en" else detected_language
    
    print("\n" + "="*80)
    print(f"🤖 NEW QUERY | Session: {session_id} | Language: {language} (detected: {detected_language})")
    print(f"📝 User Query: {user_query}")
    print("="*80)
    
    try:
        # Step 0: UNIFIED ANALYSIS - Analyze question intent in ONE Gemini call
        intent = analyze_question_intent(user_query, language)
        
        # Check if question is relevant
        if not intent['is_relevant']:
            off_topic_messages = {
                "en": """I apologize, but I'm here specifically to answer questions about Léon Morales and his professional background.

I can tell you about:
- His technical skills and expertise
- Professional experience
- Projects and achievements
- Education and certifications
- Career goals

Feel free to ask me anything about these topics! """,
                
                "fr": """Je suis désolé, mais je suis ici uniquement pour répondre à vos questions concernant Léon Morales et son parcours professionnel.

Je peux vous parler de :
- Ses compétences et expertise technique
- Son expérience professionnelle
- Ses projets et réalisations
- Sa formation et certifications
- Ses objectifs de carrière

N'hésitez pas à me poser une question sur l'un de ces sujets ! """
            }
            
            print("❌ Off-topic question detected")
            return ChatResponse(
                response=off_topic_messages.get(language, off_topic_messages['en']), 
                session_id=session_id
            )
        
        # Check if it's a company motivation question
        if intent['is_motivation']:
            company_field = intent['company_field']
            motivation_responses = {
                "en": f"""As Léon's assistant, I cannot speak on his behalf regarding specific motivations for joining your company. However, Léon would be delighted to discuss this in detail during an interview, as he is very interested in {company_field if company_field != "general" and company_field != "none" else "opportunities that align with his expertise"}.

I can tell you about his **skills**, **experience**, and **projects** that make him a strong candidate. What would you like to know?""",
                
                "fr": f"""En tant qu'assistant de Léon, je ne peux pas parler en son nom concernant ses motivations spécifiques pour rejoindre votre entreprise. Cependant, Léon serait ravi d'en discuter en détail lors d'un entretien, car il est très intéressé par {company_field if company_field != "general" and company_field != "none" else "les opportunités qui correspondent à son expertise"}.

Je peux vous parler de ses **compétences**, **expérience** et **projets** qui font de lui un candidat solide. Que souhaitez-vous savoir ?"""
            }
            
            print(f"🏢 Company motivation question detected")
            return ChatResponse(
                response=motivation_responses.get(language, motivation_responses['en']),
                session_id=session_id
            )
        
        # Check if it's a technology definition question
        if intent['is_tech_definition'] and intent['technology'] != "none":
            print(f"📚 Technology definition question detected: {technology}")
            
            # Generate brief explanation
            explanation_prompt = f"""Provide a VERY brief (2-3 sentences max) explanation of {technology} in {"French" if language == "fr" else "English"}. Be concise and clear."""
            
            try:
                explanation_response = model.generate_content(explanation_prompt)
                brief_explanation = explanation_response.text.strip()
                
                # Now check if Léon has this skill in the database
                skill_query = f'MATCH (p:Person {{name: "Léon Morales"}})-[:HAS_SKILL]->(s:Skill) WHERE toLower(s.name) CONTAINS toLower("{technology}") RETURN s.name AS skill, s.level AS level'
                skill_context, success, _ = execute_cypher_query(skill_query)
                
                if success and skill_context != "No information found in the database.":
                    # Parse the skill info
                    skill_data = json.loads(skill_context)
                    if skill_data:
                        skill_info = skill_data[0]
                        skill_name = skill_info.get('skill', technology)
                        skill_level = skill_info.get('level', 'expérimenté' if language == "fr" else 'experienced')
                        
                        if language == "fr":
                            response_text = f"""{brief_explanation}

Le graphe indique que Léon a un niveau **{skill_level}** en **{skill_name}**. Il pourra vous l'expliquer en détail lors d'un entretien et partager son expérience pratique."""
                        else:
                            response_text = f"""{brief_explanation}

The knowledge graph indicates that Léon has **{skill_level}** level proficiency in **{skill_name}**. He can explain it in detail during an interview and share his practical experience."""
                    else:
                        # No specific info found
                        if language == "fr":
                            response_text = f"""{brief_explanation}

Je n'ai pas d'information spécifique sur l'expérience de Léon avec {technology} dans la base de données. N'hésitez pas à lui poser la question directement lors d'un entretien !"""
                        else:
                            response_text = f"""{brief_explanation}

I don't have specific information about Léon's experience with {technology} in the database. Feel free to ask him directly during an interview!"""
                else:
                    # No info in database
                    if language == "fr":
                        response_text = f"""{brief_explanation}

Je n'ai pas d'information sur l'utilisation de {technology} par Léon dans la base de données actuelle. Vous pouvez lui poser la question lors d'un entretien !"""
                    else:
                        response_text = f"""{brief_explanation}

I don't have information about Léon's use of {technology} in the current database. You can ask him about it during an interview!"""
                
                print(f"✅ Technology definition response generated")
                conversation_history[session_id].append({
                    "user": user_query,
                    "assistant": response_text
                })
                
                return ChatResponse(response=response_text, session_id=session_id)
                
            except Exception as e:
                print(f"❌ Error generating technology explanation: {e}")
                print(f"Full error: {traceback.format_exc()}")
                # Fall through to normal processing
        
        # Get conversation history for this session
        history = conversation_history[session_id]
        
        # Format conversation context for Cypher generation
        conversation_context = ""
        if history:
            recent_msgs = history[-3:]  # Last 3 exchanges
            conversation_context = "\n".join([
                f"Previous Q: {msg['user']}\nPrevious A: {msg['assistant']}"
                for msg in recent_msgs
            ])
        
        # Step 1: Generate and execute Cypher query with retry logic
        max_retries = 5
        cypher_query = ""
        context = ""
        error_msg = ""
        
        for attempt in range(max_retries):
            print(f"Attempt {attempt + 1}/{max_retries}")
            
            # Generate Cypher query (with error context if retrying)
            cypher_query = generate_cypher_query_with_gemini(
                user_query, 
                conversation_context,
                previous_attempt=cypher_query if attempt > 0 else "",
                error_message=error_msg if attempt > 0 else ""
            )
            
            # Execute the query
            context, success, error_msg = execute_cypher_query(cypher_query)
            
            if success:
                print(f"✅ Query executed successfully on attempt {attempt + 1}")
                print(f"📊 Retrieved data length: {len(context)} characters")
                print(f"📄 Data preview: {context[:200]}..." if len(context) > 200 else f"📄 Data: {context}")
                break
            else:
                print(f"❌ Query failed on attempt {attempt + 1}: {error_msg}")
                if attempt == max_retries - 1:
                    print("⚠️  Max retries reached, using fallback")
                    context = "No valid data could be retrieved from the database."

        print(f"Context length: {len(context)} characters")

        # Step 2: Generate response with Gemini
        print("🤔 Generating response with Gemini...")
        response_text = generate_response_with_gemini(user_query, context, history, language)
        print(f"✅ Response generated ({len(response_text)} characters)")
        print(f"💬 Response preview: {response_text[:150]}..." if len(response_text) > 150 else f"💬 Response: {response_text}")
        print("="*80 + "\n")
        
        # Step 3: Update conversation history
        conversation_history[session_id].append({
            "user": user_query,
            "assistant": response_text
        })
        
        # Keep only last 10 exchanges per session
        if len(conversation_history[session_id]) > 10:
            conversation_history[session_id] = conversation_history[session_id][-10:]
        
        return ChatResponse(response=response_text, session_id=session_id)
    
    except Exception as e:
        print(f"❌ CRITICAL ERROR in handle_chat: {e}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        print(f"Full traceback:\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error processing your request: {str(e)}")

# Cleanup on shutdown
@app.on_event("shutdown")
def shutdown_event():
    if neo4j_conn:
        neo4j_conn.close()
        print("Neo4j connection closed")

# Clear conversation history endpoint
@app.delete("/chat/history/{session_id}")
async def clear_history(session_id: str):
    """Clear conversation history for a specific session."""
    if session_id in conversation_history:
        del conversation_history[session_id]
        return {"message": f"History cleared for session {session_id}"}
    return {"message": "No history found for this session"}

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "neo4j": neo4j_conn is not None,
        "gemini": GEMINI_API_KEY is not None
    }

# Run with: uvicorn main:app --reload --host 0.0.0.0 --port 8080

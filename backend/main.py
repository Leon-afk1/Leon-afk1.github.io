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
model = genai.GenerativeModel('gemini-2.0-flash')

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
DATABASE_SCHEMA = """
Neo4j Database Schema for Léon Morales Portfolio:

Node Labels and Properties:
- Person: name, bio, interests
- Skill: name, level, category
- Experience: company, role, period, start_date, description, achievements
- Project: name, description, technologies, link, importance
- Education: institution, degree, field, period, end_date
- Certification: name, issuer, date, link
- Institution: name
- Internship: (properties to be defined)
- Language: name
- Interest: name
- Quality: name
- Methodology: name
- Goal: name
- Value: name
- Leadership: name
- ContactInfo: (properties to be defined)

Relationship Types:
- (Person)-[:HAS_SKILL]->(Skill)
- (Person)-[:HAS_EXPERIENCE]->(Experience)
- (Person)-[:WORKED_ON]->(Project)
- (Person)-[:STUDIED_AT]->(Education)
- (Person)-[:HAS_CERTIFICATION]->(Certification)
- (Person)-[:SPEAKS]->(Language)
- (Person)-[:INTERESTED_IN]->(Interest)
- (Person)-[:HAS_QUALITY]->(Quality)
- (Person)-[:USES_METHODOLOGY]->(Methodology)
- (Person)-[:HAS_GOAL]->(Goal)
- (Person)-[:VALUES]->(Value)
- (Person)-[:DEMONSTRATES]->(Leadership)
- (Person)-[:HAS_CONTACT]->(ContactInfo)

Important Notes:
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

{DATABASE_SCHEMA}

CONVERSATION CONTEXT:
{conversation_context}

{retry_context}

USER QUESTION (may be in French or English):
{user_query}

INSTRUCTIONS:
1. Generate ONLY the Cypher query in ENGLISH, nothing else
2. Use "Léon Morales" as the person name
3. Return relevant properties based on the question
4. Use MATCH, OPTIONAL MATCH, WHERE, RETURN appropriately
5. Limit results to 10 if listing multiple items
6. Do not include markdown formatting or explanations
7. The query must be valid Cypher syntax
8. If the question is general, return information about Person, Skills, Projects, and Experience
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

EXAMPLES:
Question: "What are Léon's skills?" OR "Quelles sont les compétences de Léon ?"
Query: MATCH (p:Person {{name: "Léon Morales"}})-[:HAS_SKILL]->(s:Skill) RETURN s.name AS skill, s.level AS level, s.category AS category ORDER BY s.level DESC

Question: "Tell me about Léon's Python skills" OR "Parle-moi des compétences Python de Léon"
Query: MATCH (p:Person {{name: "Léon Morales"}})-[:HAS_SKILL]->(s:Skill) WHERE toLower(s.name) CONTAINS toLower("python") RETURN s.name AS skill, s.level AS level, s.category AS category

Question: "Tell me about Léon's projects" OR "Parle-moi des projets de Léon"
Query: MATCH (p:Person {{name: "Léon Morales"}})-[:WORKED_ON]->(proj:Project) RETURN proj.name AS project, proj.description AS description, proj.technologies AS technologies LIMIT 10

Question: "What projects involve machine learning?" OR "Quels projets utilisent le machine learning ?"
Query: MATCH (p:Person {{name: "Léon Morales"}})-[:WORKED_ON]->(proj:Project) WHERE toLower(proj.description) CONTAINS toLower("machine learning") OR toLower(proj.technologies) CONTAINS toLower("machine learning") RETURN proj.name AS project, proj.description AS description, proj.technologies AS technologies LIMIT 10

Question: "What is Léon's background?" OR "Quel est le parcours de Léon ?"
Query: MATCH (p:Person {{name: "Léon Morales"}}) OPTIONAL MATCH (p)-[:HAS_EXPERIENCE]->(e:Experience) OPTIONAL MATCH (p)-[:STUDIED_AT]->(edu:Education) RETURN p.bio AS bio, collect(DISTINCT e.role) AS roles, collect(DISTINCT edu.degree) AS degrees

Question: "What engineering experience does he have?" OR "Quelle expérience en ingénierie a-t-il ?"
Query: MATCH (p:Person {{name: "Léon Morales"}})-[:HAS_EXPERIENCE]->(e:Experience) WHERE toLower(e.role) CONTAINS toLower("engineer") RETURN e.role AS role, e.company AS company, e.duration AS duration, e.description AS description

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
            print(f"Response blocked: {response.prompt_feedback}")
            # Detect if question is in French to provide appropriate fallback
            french_keywords = ['quoi', 'quel', 'qui', 'comment', 'pourquoi', 'où', 'parle', 'peux', 'sais', 'connais']
            is_french = any(keyword in user_query.lower() for keyword in french_keywords)
            
            if is_french:
                return "Je m'excuse, mais je n'ai pas pu générer de réponse. Veuillez reformuler votre question."
            else:
                return "I apologize, but I couldn't generate a response. Please try rephrasing your question."
    
    except Exception as e:
        print(f"Error generating response with Gemini: {e}")
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
    1. Check if question is relevant to Léon's portfolio
    2. Generate Cypher query using Gemini (with retry logic)
    3. Execute query on Neo4j
    4. Generate response with context and conversation history
    """
    user_query = chat_query.query
    session_id = chat_query.session_id
    language = chat_query.language or "en"
    
    print("\n" + "="*80)
    print(f"🤖 NEW QUERY | Session: {session_id} | Language: {language}")
    print(f"📝 User Query: {user_query}")
    print("="*80)
    
    try:
        # Step 0: Check if question is relevant
        if not is_relevant_question(user_query, language):
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
            
            print("Off-topic question detected")
            return ChatResponse(
                response=off_topic_messages.get(language, off_topic_messages['en']), 
                session_id=session_id
            )
        
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
        print(f"Error in handle_chat: {e}")
        raise HTTPException(status_code=500, detail="Error processing your request")

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

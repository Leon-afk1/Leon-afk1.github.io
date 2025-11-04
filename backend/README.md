# Portfolio Chatbot Backend

Backend API pour le chatbot du portfolio de Léon utilisant Graph RAG (Retrieval-Augmented Generation) avec Neo4j et Google Gemini.

## 🚀 Fonctionnalités

- **Graph RAG**: Récupération intelligente d'informations depuis une base de données Neo4j
- **LLM Integration**: Génération de réponses contextualisées avec Google Gemini
- **Intent Detection**: Détection automatique de l'intention de l'utilisateur
- **Query Optimization**: Construction dynamique de requêtes Cypher basées sur l'intention
- **FastAPI**: API REST rapide et moderne avec documentation automatique

## 📋 Prérequis

- Python 3.10+
- Neo4j Database (local ou cloud)
- Google Gemini API Key

## ⚙️ Installation

1. **Installer les dépendances:**
```bash
pip install -r requirements.txt
```

2. **Configuration des variables d'environnement:**

Copier `.env.example` vers `.env` et remplir les valeurs:

```bash
cp .env.example .env
```

Éditer `.env` avec vos credentials:
```env
NEO4J_URI=neo4j://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password
GEMINI_API_KEY=your_api_key
```

## 🗄️ Configuration Neo4j

Votre base de données Neo4j doit contenir les nœuds et relations suivants:

### Structure du Graphe

```cypher
// Person node
(:Person {name: "Léon Morales", bio: "...", interests: "..."})

// Skills
(:Skill {name: "Python", level: "Advanced", category: "Programming"})
(:Person)-[:HAS_SKILL]->(:Skill)

// Experience
(:Experience {company: "Ksilink", role: "AI Engineer Intern", period: "...", 
              description: "...", achievements: "..."})
(:Person)-[:HAS_EXPERIENCE]->(:Experience)

// Projects
(:Project {name: "RAG Chatbot", description: "...", 
           technologies: "...", link: "..."})
(:Person)-[:WORKED_ON]->(:Project)

// Education
(:Education {institution: "UQAC", degree: "Master", 
             field: "AI", period: "..."})
(:Person)-[:STUDIED_AT]->(:Education)

// Certifications
(:Certification {name: "Neo4j Certified", issuer: "Neo4j", 
                 date: "2024", link: "..."})
(:Person)-[:HAS_CERTIFICATION]->(:Certification)
```

## 🏃 Lancer l'application

### Mode développement (avec hot reload):
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8080
```

### Mode production:
```bash
uvicorn main:app --host 0.0.0.0 --port 8080
```

## 🐳 Docker

### Build l'image:
```bash
docker build -t portfolio-chatbot-backend .
```

### Run le container:
```bash
docker run -p 8080:8080 \
  -e NEO4J_URI=your_uri \
  -e NEO4J_USER=your_user \
  -e NEO4J_PASSWORD=your_password \
  -e GEMINI_API_KEY=your_key \
  portfolio-chatbot-backend
```

## 📚 Documentation API

Une fois l'application lancée, accéder à:
- Swagger UI: http://localhost:8080/docs
- ReDoc: http://localhost:8080/redoc

## 🔍 Endpoints

### `POST /chat`
Envoyer une question au chatbot

**Request:**
```json
{
  "query": "What are your main skills?"
}
```

**Response:**
```json
{
  "response": "Léon has strong skills in AI/ML, including..."
}
```

### `GET /health`
Vérifier l'état de santé du serveur

### `GET /`
Endpoint racine avec informations de base

## 🧠 Comment fonctionne le Graph RAG

1. **Intent Detection**: Analyse la question pour détecter l'intention (skills, experience, projects, etc.)
2. **Query Building**: Construit dynamiquement des requêtes Cypher appropriées
3. **Context Retrieval**: Exécute les requêtes sur Neo4j et récupère le contexte pertinent
4. **Response Generation**: Utilise Gemini pour générer une réponse naturelle basée sur le contexte

## 🎯 Exemple d'utilisation

```python
import requests

response = requests.post(
    "http://localhost:8080/chat",
    json={"query": "Tell me about your experience at Ksilink"}
)

print(response.json()["response"])
```

## 🔧 Personnalisation

Pour adapter le chatbot à vos besoins:

1. **Modifier les intents**: Éditer `detect_query_intent()` dans `main.py`
2. **Ajouter des requêtes**: Modifier `build_cypher_query()` 
3. **Changer le formatage**: Adapter `format_results_by_type()`
4. **Ajuster le prompt**: Modifier `generate_response_with_gemini()`

## 📝 Notes

- En production, remplacer `allow_origins=["*"]` par votre domaine dans CORS
- Utiliser des variables d'environnement sécurisées (secrets) en production
- Considérer l'ajout d'un cache pour optimiser les performances
- Implémenter rate limiting pour éviter les abus

## 🐛 Dépannage

**Erreur de connexion Neo4j:**
- Vérifier que Neo4j est démarré
- Vérifier les credentials dans `.env`
- Vérifier l'URI (bolt:// vs neo4j://)

**Erreur Gemini:**
- Vérifier que l'API key est valide
- Vérifier les quotas de l'API
- Vérifier la connexion internet

## 📄 Licence

MIT License

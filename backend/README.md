# Portfolio Chatbot Backend

Backend API pour le chatbot du portfolio de Léon utilisant Graph RAG (Retrieval-Augmented Generation) avec Neo4j et Google Gemini.

## 🚀 Fonctionnalités

- **Graph RAG**: Récupération intelligente d'informations depuis une base de données Neo4j
- **LLM Integration**: Génération de réponses contextualisées avec Google Gemini
- **Intent Detection**: Détection automatique de l'intention de l'utilisateur
- **Query Optimization**: Construction dynamique de requêtes Cypher basées sur l'intention
- **FastAPI**: API REST rapide et moderne avec documentation automatique

## 📋 Prérequis

- Python 3.12+
- Neo4j Database (local ou cloud)
- Google Gemini API Key

## ⚙️ Installation

1. **Installer les dépendances:**
```bash
pip install -r requirements.txt
```

2. **Configuration des variables d'environnement:**

Créer un fichier `.env` (non versionné) avec vos credentials:
```env
NEO4J_URI=neo4j://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password
GEMINI_API_KEY=your_api_key

# Optionnel
ALLOWED_ORIGINS=https://leon-afk1.github.io   # origines CORS, séparées par des virgules (localhost toujours autorisé)
CHAT_RATE_LIMIT=10/minute;100/day             # limite par IP sur /chat
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
docker run -p 8080:8080 --env-file .env portfolio-chatbot-backend
```

Le conteneur écoute sur `$PORT` (8080 par défaut), comme sur Cloud Run.

## ☁️ Déploiement

En production, l'API tourne sur Cloud Run : https://portfolio-chatbot-ls5myalnna-ew.a.run.app

Chaque push sur `main` qui modifie `backend/` déclenche `.github/workflows/deploy-backend.yml`
(build, push vers Artifact Registry, nouvelle révision Cloud Run, test `/health`).
Les secrets viennent de Secret Manager. L'infrastructure est décrite dans `../infra/` (voir `../infra/README.md`).

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

1. **Modifier les intents**: Éditer `analyze_question_intent()` dans `main.py`
2. **Adapter le schéma du graphe**: Modifier `DATABASE_SCHEMA`, utilisé par `generate_cypher_query_with_gemini()`
3. **Ajuster le prompt de réponse**: Modifier `generate_response_with_gemini()`
4. **Changer les modèles**: Modifier la liste `ModelManager.model_names`

## 📝 Notes

- CORS limité à `ALLOWED_ORIGINS` et à localhost
- Limite de requêtes par IP sur `/chat` (`CHAT_RATE_LIMIT`, en mémoire par instance)
- Les requêtes Cypher générées par le LLM s'exécutent dans une transaction en lecture seule
- Les modèles Gemini sont essayés à la demande, dans l'ordre de `ModelManager.model_names` ; un modèle épuisé (429) ou inexistant (404) est sauté
- Considérer l'ajout d'un cache pour optimiser les performances

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

import google.generativeai as genai
import os
from dotenv import load_dotenv 
from neo4j import GraphDatabase
import os

# load_dotenv()
# API_KEY = os.getenv("GEMINI_API_KEY")

# if not API_KEY:
#     raise ValueError("Clé API Gemini non trouvée. Définis GEMINI_API_KEY dans ton fichier .env")

# genai.configure(api_key=API_KEY)

# # --- Lister les modèles disponibles (pour débogage) ---
# print("Modèles disponibles supportant 'generateContent':")
# for m in genai.list_models():
#   if 'generateContent' in m.supported_generation_methods:
#     print(m.name)
# # --- Fin de la liste ---

# # --- Choisis un modèle différent ---
# # Essaye 'gemini-pro' ou 'gemini-1.5-flash-latest'
# # Si la liste ci-dessus montre d'autres options, tu peux les essayer aussi.
# try:
#     # model = genai.GenerativeModel('gemini-1.0-pro') # Ancien nom
#     model = genai.GenerativeModel('gemini-2.5-flash') # Essaye celui-ci
#     # ou model = genai.GenerativeModel('gemini-pro')

# except Exception as e:
#     print(f"Erreur lors de la création du modèle: {e}")
#     exit() # Arrête si le modèle ne peut pas être créé

# def generate_response(prompt):
#     """Fonction simple pour envoyer un prompt et obtenir une réponse."""
#     try:
#         # Configuration de génération (optionnel, pour ajuster la sortie)
#         generation_config = genai.types.GenerationConfig(
#             # temperature=0.7, # Contrôle la créativité (0=déterministe, 1=très créatif)
#             # max_output_tokens=2048 # Limite la longueur de la réponse
#         )
#         response = model.generate_content(prompt, generation_config=generation_config)
#         # Vérifie si la réponse contient du texte
#         if response.parts:
#              return response.text
#         else:
#              # Gère le cas où la réponse est bloquée (sécurité, etc.)
#              print("Réponse bloquée ou vide. Raison:", response.prompt_feedback.block_reason)
#              return "Désolé, je n'ai pas pu générer de réponse en raison des filtres de sécurité."

#     except Exception as e:
#         print(f"Erreur lors de l'appel à l'API Gemini: {e}")
#         # Affiche plus de détails si disponibles dans l'erreur
#         if hasattr(e, 'response') and hasattr(e.response, 'text'):
#             print("Détails de l'erreur API:", e.response.text)
#         return "Désolé, une erreur s'est produite lors de la génération de la réponse."


# # --- Exemple d'utilisation ---
# if __name__ == "__main__":
#     question = "Explique brièvement ce qu'est le contrastive learning."
#     contexte_neo4j = "Contrastive Learning: AI/ML technique, Proficient level, Used in Ksilink internship project 'Multimodal Contrastive Learning'."

#     mon_prompt = f"""
#     Rôle: Tu es un assistant IA pour Léon Morales.
#     Contexte sur Léon: {contexte_neo4j}
#     Question: {question}
#     Instructions: Réponds à la question en te basant UNIQUEMENT sur le contexte fourni sur Léon. Sois concis.

#     Réponse:
#     """

#     reponse = generate_response(mon_prompt)
#     print("\n--- Réponse du Modèle ---")
#     print(reponse)


# Charge les variables d'environnement
load_dotenv()
NEO4J_URI = os.getenv("NEO4J_URI", "neo4j://localhost:7687") # Prend la valeur du .env ou utilise le défaut
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")

if not NEO4J_PASSWORD:
    raise ValueError("Mot de passe Neo4j non trouvé. Définis NEO4J_PASSWORD dans ton fichier .env")

# Classe pour gérer la connexion (bonne pratique)
class Neo4jConnection:
    def __init__(self, uri, user, password):
        # Initialise le driver une seule fois
        self._driver = GraphDatabase.driver(uri, auth=(user, password))

    def close(self):
        # Ferme le driver quand tu as fini
        if self._driver:
            self._driver.close()

    def run_query(self, query, parameters=None):
        """Exécute une requête et retourne les résultats."""
        # Utilise une session pour chaque interaction (ou groupe d'interactions)
        with self._driver.session() as session:
            result = session.run(query, parameters)
            # Convertit les enregistrements en dictionnaires pour une manipulation facile
            return [record.data() for record in result]

# --- Exemple d'utilisation ---
if __name__ == "__main__":
    # Crée une instance de connexion
    conn = Neo4jConnection(NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD)

    try:
        # Exemple 1: Compter tous les nœuds
        count_query = "MATCH (n) RETURN count(n) AS node_count"
        count_result = conn.run_query(count_query)
        print("Résultat du comptage:", count_result) # Devrait afficher [{'node_count': X}]

        # Exemple 2: Récupérer les compétences de Léon
        skills_query = """
        MATCH (p:Person {name: $name})-[:HAS_SKILL]->(s:Skill)
        RETURN s.name AS skill, s.level AS level, s.category AS category
        ORDER BY category, level DESC
        """
        skills_result = conn.run_query(skills_query, parameters={"name": "Léon Morales"})
        print("\nCompétences de Léon:")
        for record in skills_result:
            print(f"- {record['skill']} ({record['level']}, {record['category']})")

    except Exception as e:
        print(f"Erreur lors de l'interaction avec Neo4j: {e}")
    finally:
        # Ferme la connexion proprement
        conn.close()
        print("\nConnexion Neo4j fermée.")
import os
from neo4j import GraphDatabase

# Récupération des variables d'environnement (définies dans GitHub Secrets)
uri = os.environ.get("NEO4J_URI")
user = os.environ.get("NEO4J_USER")
password = os.environ.get("NEO4J_PASSWORD")

if not all([uri, user, password]):
    print("Erreur : Les identifiants Neo4j (URI, USER, PASSWORD) sont manquants.")
    exit(1)

try:
    # Connexion au driver
    driver = GraphDatabase.driver(uri, auth=(user, password))
    
    # Ouverture d'une session pour exécuter une requête triviale
    with driver.session() as session:
        result = session.run("RETURN 'Neo4j is alive!' AS message")
        msg = result.single()["message"]
        print(f"Succès : {msg}")

    driver.close()

except Exception as e:
    print(f"Erreur lors du ping Neo4j : {e}")
    exit(1)

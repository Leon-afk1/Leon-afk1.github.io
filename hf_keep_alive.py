import os
import requests

# URL de l'API Hugging Face Space
# Utilise la variable d'environnement si définie, sinon utilise l'URL par défaut
HF_SPACE_URL = os.environ.get("HF_SPACE_URL") or "https://leon-mls-chatbot-portfolio.hf.space"

# Nettoyer l'URL (enlever les espaces et slashs en fin)
HF_SPACE_URL = HF_SPACE_URL.strip().rstrip('/')

def ping_huggingface():
    """Ping le serveur Hugging Face pour le maintenir actif."""
    try:
        # Ping du endpoint health
        health_url = f"{HF_SPACE_URL}/health"
        response = requests.get(health_url, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Succès : Hugging Face Space est actif!")
            print(f"   Status: {data.get('status', 'unknown')}")
            print(f"   Neo4j: {data.get('neo4j', 'unknown')}")
            print(f"   Gemini: {data.get('gemini', 'unknown')}")
            return True
        else:
            print(f"⚠️ Réponse inattendue : Status {response.status_code}")
            return False
            
    except requests.exceptions.Timeout:
        print("⏳ Le serveur met du temps à répondre (peut-être en train de démarrer)...")
        # Réessayer avec le endpoint racine
        try:
            root_url = f"{HF_SPACE_URL}/"
            response = requests.get(root_url, timeout=60)
            if response.status_code == 200:
                print("✅ Succès : Le serveur a démarré!")
                return True
        except Exception as e:
            print(f"❌ Échec du retry : {e}")
        return False
        
    except Exception as e:
        print(f"❌ Erreur lors du ping Hugging Face : {e}")
        return False

def send_test_query():
    """Envoie une requête de test au chatbot pour s'assurer qu'il fonctionne."""
    try:
        chat_url = f"{HF_SPACE_URL}/chat"
        payload = {
            "query": "Hello",
            "session_id": "keepalive_test",
            "language": "en"
        }
        
        response = requests.post(chat_url, json=payload, timeout=60)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Test chatbot réussi!")
            print(f"   Réponse: {data.get('response', '')[:100]}...")
            return True
        else:
            print(f"⚠️ Réponse chatbot inattendue : Status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Erreur lors du test chatbot : {e}")
        return False

if __name__ == "__main__":
    print("=" * 50)
    print("🤖 Ping Hugging Face Space - Keep Alive")
    print("=" * 50)
    print(f"URL: {HF_SPACE_URL}")
    print()
    
    # Étape 1: Ping health endpoint
    print("📡 Étape 1: Ping du endpoint /health...")
    health_ok = ping_huggingface()
    print()
    
    # Étape 2: Test du chatbot (optionnel mais recommandé)
    if health_ok:
        print("💬 Étape 2: Test du chatbot...")
        chat_ok = send_test_query()
        print()
    
    print("=" * 50)
    if health_ok:
        print("✅ Keep-alive terminé avec succès!")
    else:
        print("❌ Keep-alive a rencontré des problèmes")
        exit(1)

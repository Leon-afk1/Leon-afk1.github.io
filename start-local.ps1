# Script de lancement local pour le portfolio avec chatbot
# Run: .\start-local.ps1

Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 58) -ForegroundColor Cyan
Write-Host "🚀 Lancement du Portfolio avec Chatbot en local" -ForegroundColor Green
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 58) -ForegroundColor Cyan

# Vérifier si Python est installé
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python détecté: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python n'est pas installé!" -ForegroundColor Red
    Write-Host "   Téléchargez-le depuis: https://www.python.org/downloads/" -ForegroundColor Yellow
    exit 1
}

# Vérifier le fichier .env dans backend
if (-Not (Test-Path "backend\.env")) {
    Write-Host "⚠️  Fichier backend\.env non trouvé!" -ForegroundColor Yellow
    Write-Host "   Création d'un fichier .env à partir de .env.example..." -ForegroundColor Yellow
    
    if (Test-Path "backend\.env.example") {
        Copy-Item "backend\.env.example" "backend\.env"
        Write-Host "📝 Fichier .env créé! N'oubliez pas de le configurer avec vos identifiants." -ForegroundColor Cyan
    }
}

# Fonction pour démarrer le backend
function Start-Backend {
    Write-Host "`n📡 Démarrage du backend..." -ForegroundColor Cyan
    
    # Aller dans le dossier backend
    Push-Location backend
    
    # Installer les dépendances si nécessaire
    if (-Not (Test-Path "venv")) {
        Write-Host "📦 Installation des dépendances..." -ForegroundColor Yellow
        pip install -r requirements.txt
    }
    
    # Démarrer uvicorn
    Write-Host "✅ Backend démarré sur http://localhost:8080" -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "uvicorn main:app --reload --host 0.0.0.0 --port 8080"
    
    Pop-Location
    Start-Sleep -Seconds 3
}

# Fonction pour démarrer le frontend
function Start-Frontend {
    Write-Host "`n🌐 Démarrage du serveur frontend..." -ForegroundColor Cyan
    
    Write-Host "✅ Frontend démarré sur http://localhost:3000" -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "python serve.py"
    
    Start-Sleep -Seconds 2
}

# Menu principal
Write-Host "`nQue voulez-vous lancer?" -ForegroundColor Yellow
Write-Host "1. Backend seulement (API sur port 8080)" -ForegroundColor White
Write-Host "2. Frontend seulement (Site sur port 3000)" -ForegroundColor White
Write-Host "3. Les deux (Backend + Frontend)" -ForegroundColor White
Write-Host "4. Quitter" -ForegroundColor White

$choice = Read-Host "`nVotre choix (1-4)"

switch ($choice) {
    "1" {
        Start-Backend
        Write-Host "`n✅ Backend lancé!" -ForegroundColor Green
        Write-Host "📚 Documentation API: http://localhost:8080/docs" -ForegroundColor Cyan
    }
    "2" {
        Start-Frontend
        Write-Host "`n✅ Frontend lancé!" -ForegroundColor Green
        Write-Host "🌐 Ouvrez: http://localhost:3000" -ForegroundColor Cyan
    }
    "3" {
        Start-Backend
        Start-Frontend
        Write-Host "`n✅ Backend et Frontend lancés!" -ForegroundColor Green
        Write-Host "🌐 Site: http://localhost:3000" -ForegroundColor Cyan
        Write-Host "📚 API: http://localhost:8080/docs" -ForegroundColor Cyan
    }
    "4" {
        Write-Host "`nAu revoir! 👋" -ForegroundColor Yellow
        exit 0
    }
    default {
        Write-Host "`n❌ Choix invalide!" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n" -NoNewline
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 58) -ForegroundColor Cyan
Write-Host "💡 Appuyez sur CTRL+C dans chaque fenêtre pour arrêter" -ForegroundColor Yellow
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 58) -ForegroundColor Cyan

Read-Host "`nAppuyez sur Entrée pour fermer cette fenêtre"

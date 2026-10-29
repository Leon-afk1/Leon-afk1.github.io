# Infrastructure — backend du chatbot sur Cloud Run

Terraform gère : APIs, Artifact Registry, Secret Manager (conteneurs uniquement), comptes de service,
Workload Identity Federation (GitHub → GCP sans clé), le service Cloud Run, le budget et les alertes.

Les deux workflows :
- `.github/workflows/terraform.yml` : `plan` sur PR et sur `main`, `apply` sur `main` après validation (environnement `production`).
- `.github/workflows/deploy-backend.yml` : build de l'image, push, `gcloud run services update --image`, test `/health`.

## Mise en route (une seule fois)

Le plus simple est de tout faire dans **Cloud Shell** (gcloud et Terraform y sont déjà installés).
En local, il faut installer gcloud + Terraform ≥ 1.9, puis `gcloud auth application-default login`.

```bash
PROJECT_ID=<id-du-projet>            # 6-30 caractères : minuscules, chiffres, tirets ; globalement unique
BILLING=<XXXXXX-XXXXXX-XXXXXX>       # gcloud billing accounts list
REGION=europe-west1
BUCKET=$PROJECT_ID-tfstate

# 1. Projet + facturation
gcloud projects create "$PROJECT_ID"
gcloud billing projects link "$PROJECT_ID" --billing-account="$BILLING"
gcloud config set project "$PROJECT_ID"
gcloud auth application-default set-quota-project "$PROJECT_ID"
gcloud services enable cloudresourcemanager.googleapis.com serviceusage.googleapis.com billingbudgets.googleapis.com

# 2. Bucket de l'état Terraform (privé, versionné)
gcloud storage buckets create "gs://$BUCKET" --location="$REGION" \
  --uniform-bucket-level-access --public-access-prevention
gcloud storage buckets update "gs://$BUCKET" --versioning

# 3. Variables et init
cd infra
cp terraform.tfvars.example terraform.tfvars   # puis remplir (non versionné)
terraform init -backend-config="bucket=$BUCKET"

# 4. Créer d'abord les secrets, puis y mettre les valeurs (jamais dans l'état Terraform)
terraform apply -target=google_secret_manager_secret.app
for name in GEMINI_API_KEY NEO4J_URI NEO4J_USER NEO4J_PASSWORD; do
  read -rsp "$name: " value; echo
  printf '%s' "$value" | gcloud secrets versions add "$name" --data-file=-
done

# 5. Tout le reste (Cloud Run démarre avec une image "hello" en attendant le premier déploiement)
terraform apply

# 6. Droits que le compte Terraform de la CI ne peut pas se donner lui-même
TF_SA=$(terraform output -raw terraform_service_account)
gcloud storage buckets add-iam-policy-binding "gs://$BUCKET" \
  --member="serviceAccount:$TF_SA" --role=roles/storage.admin
gcloud billing accounts add-iam-policy-binding "$BILLING" \
  --member="serviceAccount:$TF_SA" --role=roles/billing.costsManager
```

## Configuration GitHub

Avec `gh` (ou Settings → Secrets and variables → Actions) :

```bash
REPO=Leon-afk1/Leon-afk1.github.io
gh variable set GCP_PROJECT_ID  -R $REPO -b "$PROJECT_ID"
gh variable set GCP_REGION      -R $REPO -b "$REGION"
gh variable set TF_STATE_BUCKET -R $REPO -b "$BUCKET"
gh variable set WIF_PROVIDER    -R $REPO -b "$(terraform output -raw wif_provider)"
gh variable set DEPLOYER_SA     -R $REPO -b "$(terraform output -raw deployer_service_account)"
gh variable set TERRAFORM_SA    -R $REPO -b "$(terraform output -raw terraform_service_account)"

# Secrets : les logs Actions d'un dépôt public sont publics
gh secret set GCP_BILLING_ACCOUNT_ID -R $REPO -b "$BILLING"
gh secret set ALERT_EMAIL            -R $REPO -b "<votre e-mail>"
```

Puis créer l'environnement **`production`** (Settings → Environments) avec vous comme *Required reviewer*,
et lancer **Deploy backend** à la main (Actions → Run workflow) pour le premier déploiement.

## Coûts : alertes et limites

| Mécanisme | Bloque ? | Où |
|---|---|---|
| Budget mensuel (5 € par défaut), alertes à 50 / 90 / 100 % + prévision 100 % | Non, e-mail uniquement | `monitoring.tf` |
| Alertes 5xx (> 5 / 5 min) et trafic anormal (> 500 req / h) | Non, e-mail | `monitoring.tf` |
| `max_instances = 2`, `min_instances = 0` | Oui | `cloudrun.tf` |
| Limite par IP sur `/chat` (`10/minute;100/day`) | Oui | `backend/main.py`, variable `chat_rate_limit` |
| Quotas de l'API Gemini | Oui | Console Google Cloud / AI Studio du projet de la clé |

À vérifier pour Gemini : si le projet de la clé API a la facturation activée, l'usage au-delà du niveau gratuit est
facturé. Réglez des quotas par minute et par jour (IAM & Admin → Quotas, API *Generative Language*).

La devise du budget (`budget_currency`) doit être celle du compte de facturation.

## Opérations courantes

- Changer la limite de requêtes, les origines CORS, le budget : modifier `variables.tf` / `terraform.tfvars`, ouvrir une PR.
- Changer une valeur secrète : `gcloud secrets versions add <NOM> --data-file=-`, puis redéployer (Actions → Deploy backend).
- Logs : `gcloud run services logs read portfolio-chatbot --region europe-west1`.

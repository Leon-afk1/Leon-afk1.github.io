# Identity of the Cloud Run service at runtime
resource "google_service_account" "runtime" {
  account_id   = "portfolio-chatbot-run"
  display_name = "Portfolio chatbot (Cloud Run runtime)"
}

# Used by .github/workflows/deploy-backend.yml: push images and roll out new revisions only
resource "google_service_account" "deployer" {
  account_id   = "github-deployer"
  display_name = "GitHub Actions - backend deploy"
}

resource "google_artifact_registry_repository_iam_member" "deployer_writer" {
  location   = google_artifact_registry_repository.portfolio.location
  repository = google_artifact_registry_repository.portfolio.name
  role       = "roles/artifactregistry.writer"
  member     = google_service_account.deployer.member
}

resource "google_cloud_run_v2_service_iam_member" "deployer_developer" {
  name     = google_cloud_run_v2_service.chatbot.name
  location = google_cloud_run_v2_service.chatbot.location
  role     = "roles/run.developer"
  member   = google_service_account.deployer.member
}

resource "google_service_account_iam_member" "deployer_act_as_runtime" {
  service_account_id = google_service_account.runtime.name
  role               = "roles/iam.serviceAccountUser"
  member             = google_service_account.deployer.member
}

# Used by .github/workflows/terraform.yml to plan and apply this configuration
resource "google_service_account" "terraform" {
  account_id   = "github-terraform"
  display_name = "GitHub Actions - Terraform"
}

locals {
  terraform_roles = [
    "roles/artifactregistry.admin",
    "roles/iam.serviceAccountAdmin",
    "roles/iam.serviceAccountUser",
    "roles/iam.workloadIdentityPoolAdmin",
    "roles/monitoring.editor",
    "roles/resourcemanager.projectIamAdmin",
    "roles/run.admin",
    "roles/secretmanager.admin",
    "roles/serviceusage.serviceUsageAdmin",
  ]
}

resource "google_project_iam_member" "terraform" {
  for_each = toset(local.terraform_roles)

  project = var.project_id
  role    = each.value
  member  = google_service_account.terraform.member
}

# Access to the state bucket (storage.admin) and to budgets on the billing account (billing.costsManager)
# is granted once with gcloud (see infra/README.md): this account could not read those IAM policies itself.

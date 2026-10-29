# Only the secret containers are managed here. Values are added out of band so they never land in the state:
#   printf '%s' "<value>" | gcloud secrets versions add <NAME> --data-file=-
locals {
  secret_names = ["GEMINI_API_KEY", "NEO4J_URI", "NEO4J_USER", "NEO4J_PASSWORD"]
}

resource "google_secret_manager_secret" "app" {
  for_each = toset(local.secret_names)

  secret_id = each.value
  replication {
    auto {}
  }

  depends_on = [google_project_service.this]
}

resource "google_secret_manager_secret_iam_member" "runtime" {
  for_each = google_secret_manager_secret.app

  secret_id = each.value.id
  role      = "roles/secretmanager.secretAccessor"
  member    = google_service_account.runtime.member
}

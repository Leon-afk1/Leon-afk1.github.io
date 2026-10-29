resource "google_artifact_registry_repository" "portfolio" {
  location      = var.region
  repository_id = "portfolio"
  format        = "DOCKER"
  description   = "Portfolio chatbot images"

  # Stay within the free storage tier: keep the 5 latest images, delete the rest after 7 days
  cleanup_policy_dry_run = false

  cleanup_policies {
    id     = "keep-latest"
    action = "KEEP"
    most_recent_versions {
      keep_count = 5
    }
  }

  cleanup_policies {
    id     = "delete-old"
    action = "DELETE"
    condition {
      older_than = "604800s"
    }
  }

  depends_on = [google_project_service.this]
}

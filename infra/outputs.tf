output "service_url" {
  description = "Backend URL, to put in chatbot-config.js"
  value       = google_cloud_run_v2_service.chatbot.uri
}

output "image_repository" {
  value = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.portfolio.repository_id}"
}

output "wif_provider" {
  description = "GitHub variable WIF_PROVIDER"
  value       = google_iam_workload_identity_pool_provider.github.name
}

output "deployer_service_account" {
  description = "GitHub variable DEPLOYER_SA"
  value       = google_service_account.deployer.email
}

output "terraform_service_account" {
  description = "GitHub variable TERRAFORM_SA"
  value       = google_service_account.terraform.email
}

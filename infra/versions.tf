terraform {
  required_version = ">= 1.9"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 8.9"
    }
  }

  # Bucket passed at init: terraform init -backend-config="bucket=<state bucket>"
  backend "gcs" {
    prefix = "portfolio"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region

  # Required by the Billing Budgets API when authenticating with user or service account credentials
  user_project_override = true
  billing_project       = var.project_id
}

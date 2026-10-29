variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "Region for Cloud Run and Artifact Registry"
  type        = string
  default     = "europe-west1"
}

variable "github_repository" {
  description = "GitHub repository allowed to authenticate through Workload Identity Federation (owner/name)"
  type        = string
  default     = "Leon-afk1/Leon-afk1.github.io"
}

variable "billing_account_id" {
  description = "Billing account ID linked to the project (XXXXXX-XXXXXX-XXXXXX)"
  type        = string
  sensitive   = true
}

variable "alert_email" {
  description = "Email address receiving budget and monitoring alerts"
  type        = string
  sensitive   = true
}

variable "budget_amount" {
  description = "Monthly budget, in budget_currency units"
  type        = number
  default     = 5
}

variable "budget_currency" {
  description = "Must match the billing account currency"
  type        = string
  default     = "EUR"
}

variable "allowed_origins" {
  description = "Origins allowed by the backend CORS policy"
  type        = list(string)
  default     = ["https://leon-afk1.github.io"]
}

variable "max_instances" {
  description = "Hard cap on Cloud Run instances (cost limit)"
  type        = number
  default     = 2
}

variable "chat_rate_limit" {
  description = "Per-IP rate limit on /chat (slowapi syntax)"
  type        = string
  default     = "10/minute;100/day"
}

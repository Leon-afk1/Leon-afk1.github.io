data "google_project" "this" {}

resource "google_monitoring_notification_channel" "email" {
  display_name = "Portfolio alerts"
  type         = "email"
  labels = {
    email_address = var.alert_email
  }

  depends_on = [google_project_service.this]
}

# Budget alerts only notify, they never stop spending. Hard limits are max_instances,
# the per-IP rate limit in the backend and the Gemini API quotas.
resource "google_billing_budget" "monthly" {
  billing_account = var.billing_account_id
  display_name    = "portfolio-monthly"

  budget_filter {
    projects = ["projects/${data.google_project.this.number}"]
  }

  amount {
    specified_amount {
      currency_code = var.budget_currency
      units         = tostring(var.budget_amount)
    }
  }

  threshold_rules {
    threshold_percent = 0.5
  }
  threshold_rules {
    threshold_percent = 0.9
  }
  threshold_rules {
    threshold_percent = 1.0
  }
  threshold_rules {
    threshold_percent = 1.0
    spend_basis       = "FORECASTED_SPEND"
  }

  all_updates_rule {
    monitoring_notification_channels = [google_monitoring_notification_channel.email.id]
  }

  depends_on = [google_project_service.this]
}

locals {
  run_requests_filter = "resource.type = \"cloud_run_revision\" AND resource.labels.service_name = \"${google_cloud_run_v2_service.chatbot.name}\" AND metric.type = \"run.googleapis.com/request_count\""
}

resource "google_monitoring_alert_policy" "server_errors" {
  display_name = "portfolio-chatbot: 5xx errors"
  combiner     = "OR"

  conditions {
    display_name = "More than 5 server errors in 5 minutes"
    condition_threshold {
      filter          = "${local.run_requests_filter} AND metric.labels.response_code_class = \"5xx\""
      comparison      = "COMPARISON_GT"
      threshold_value = 5
      duration        = "0s"
      aggregations {
        alignment_period     = "300s"
        per_series_aligner   = "ALIGN_SUM"
        cross_series_reducer = "REDUCE_SUM"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.email.id]
}

resource "google_monitoring_alert_policy" "traffic_spike" {
  display_name = "portfolio-chatbot: abnormal traffic"
  combiner     = "OR"

  conditions {
    display_name = "More than 500 requests in 1 hour"
    condition_threshold {
      filter          = local.run_requests_filter
      comparison      = "COMPARISON_GT"
      threshold_value = 500
      duration        = "0s"
      aggregations {
        alignment_period     = "3600s"
        per_series_aligner   = "ALIGN_SUM"
        cross_series_reducer = "REDUCE_SUM"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.email.id]
}

# provider "pagerduty" {
#   token = var.pagerduty_api_token
# }

# resource "pagerduty_service" "alerts" {
#   name               = "CloudResumeAlerts"
#   description        = "PagerDuty service for Cloud Resume alarms"
#   escalation_policy  = var.pagerduty_escalation_policy_id
# }

# resource "pagerduty_service_integration" "alerts_integration" {
#   service = pagerduty_service.alerts.id
#   name    = "AWS CloudWatch Integration"
#   type    = "events_api_v2"
# }

# output "pagerduty_integration_key" {
#   value = pagerduty_service_integration.alerts_integration.integration_key
# }

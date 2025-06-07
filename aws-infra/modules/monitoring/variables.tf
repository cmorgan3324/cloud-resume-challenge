variable "slack_team_id" {
  description = "slack team id for aws chatbot"
  type        = string
}

variable "slack_channel_id" {
  description = "slack channel id to receive alerts"
  type        = string
}

# variable "pagerduty_api_token" {
#   description = "pagerduty api token (w/ write access), stored as a secret"
#   type        = string
#   default     = ""
# }

# variable "pagerduty_escalation_policy_id" {
#   description = "pagerduty escalation policy id to attach new incidents"
#   type        = string
#   default     = ""
# }

variable "budget_limit" {
  description = "monthly cost budget threshold in $usd"
  type        = number
  default     = 10.0
}

variable "budget_threshold_percentage" {
  description = "percentage of budget at which to alarm (e.g., 80 for 80%)"
  type        = number
  default     = 80
}

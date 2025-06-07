variable "slack_team_id" {
  description = "slack team id for aws chatbot"
  type        = string
}

variable "slack_channel_id" {
  description = "slack channel id to receive alerts"
  type        = string
}

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

variable "lambda_function_name" {
  description = "lambda function name"
  type        = string
}
variable "domain_name" {
  description = "custom domain for resume site"
  type        = string
}

variable "public_bucket_name" {
  description = "name for S3 bucket to host site"
  type        = string
}

variable "zone_name" {
  description = "route53 hosted zone name"
  type        = string
}

variable "lambda_source_dir" {
  description = "local path to the folder containing Lambda code"
  type        = string
}

variable "lambda_function_name" {
  description = "lambda function name"
  type        = string
}

variable "dynamodb_table_name" {
  description = "dynamoDB table name for visitor counts"
  type        = string
}

variable "api_name" {
  description = "http api gateway name"
  type        = string
}

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
  default     = 5.0
}

variable "budget_threshold_percentage" {
  description = "percentage of budget at which to alarm (e.g., 80 for 80%)"
  type        = number
  default     = 80
}

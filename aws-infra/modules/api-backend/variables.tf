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

variable "environment" {
  description = "environment label (e.g. dev, prod)"
  type        = string
  default     = "dev"
}
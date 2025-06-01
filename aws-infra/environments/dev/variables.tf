variable "domain_name" {
  description = "custom domain for resume site"
  type = string
}

variable "public_bucket_name" {
  description = "name for S3 bucket to host site"
  type = string
}

variable "zone_name" {
  description = "route53 hosted zone name (vibebycory.dev)"
  type = string
}

# variable "lambda_source_dir" {
#   description = "local path to the folder containing Lambda code"
#   type        = string
# }

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
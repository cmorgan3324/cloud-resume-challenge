provider "aws" {
  region = "us-east-1"
}

terraform {
  backend "s3" {
    bucket = "vibebycory-terraform-state-bucket"
    key    = "portfolio-site-serverless/terraform.tfstate"
    region = "us-east-1"
    encrypt = true
  }
}

# Use updated static site module
module "static_site" {
  source             = "./modules/static-site"
  domain_name        = var.domain_name
  public_bucket_name = var.public_bucket_name
  zone_name          = var.zone_name
}

module "api_backend" {
  source               = "./modules/api-backend"
  lambda_function_name = "portfolio-api-function"
  dynamodb_table_name  = "portfolio-visitor-counter"
  api_name             = "portfolio-api"
  environment          = "prod"
  domain_name          = var.domain_name
}

# Variables
variable "domain_name" {
  description = "Domain name for the site"
  type        = string
  default     = "vibebycory.dev"
}

variable "public_bucket_name" {
  description = "Name of the S3 bucket"
  type        = string
  default     = "vibebycory-portfolio-content"
}

variable "zone_name" {
  description = "Route 53 zone name"
  type        = string
  default     = "vibebycory.dev"
}

# Outputs
output "website_url" {
  description = "Website URL"
  value       = module.static_site.website_url
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = module.static_site.cloudfront_distribution_id
}

output "s3_bucket_name" {
  description = "S3 bucket name"
  value       = module.static_site.bucket_name
}

output "api_gateway_url" {
  description = "API Gateway URL"
  value       = module.api_backend.api_gateway_url
}
provider "aws" {
  region = "us-east-1"
}

terraform {
  backend "s3" {
    bucket = "vibebycory-terraform-state-bucket"
    key    = "serverless-web-resume/dev/terraform.tfstate"
    region = "us-east-1"
    # dynamodb_table = "vibebycory-terraform-locks"
    encrypt = true
  }
}

module "static_site" {
  source             = "../../modules/static-site"
  domain_name        = var.domain_name
  public_bucket_name = var.public_bucket_name
  zone_name          = var.zone_name
}

module "api_backend" {
  source               = "../../modules/api-backend"
  lambda_source_dir    = "${path.cwd}/lambda"
  lambda_function_name = "resume-counter-function"
  dynamodb_table_name  = "resume-visitor-counter"
  api_name             = "resume-visitor-api"
  environment          = "dev"
}

module "monitoring" {
  source           = "../../modules/monitoring"
  slack_team_id    = var.slack_team_id
  slack_channel_id = var.slack_channel_id
  budget_limit                = var.budget_limit
  budget_threshold_percentage = var.budget_threshold_percentage
  lambda_function_name        = module.api_backend.lambda_function_name

}
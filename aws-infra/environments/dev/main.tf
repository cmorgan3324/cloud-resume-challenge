provider "aws" {
  region = "us-east-1"
  profile = "terraform-dev"
}

module "static_site" {
  source = "../../modules/static-site"
  domain_name = var.domain_name
  public_bucket_name = var.public_bucket_name
  zone_name = var.zone_name
}

# # have terraform create a hosted zone, if DNS is available

# # look up existing public hosted zone
# data "aws_route53_zone" "primary" {
#   name         = var.zone_name
#   private_zone = false
# }

# create an alias A record pointing to domain at cloudfront
# resource "aws_route53_record" "site_alias" {
#   zone_id = data.aws_route53_zone.primary.zone_id
#   name    = var.domain_name
#   type    = "A"

#   alias {
#     name                   = module.static_site.cloudfront_domain_name
#     zone_id                = module.static_site.cloudfront_zone_id
#     evaluate_target_health = false
#   }
# }

module "api_backend" {
  source               = "../../modules/api-backend"
  lambda_source_dir    = "${path.cwd}/lambda"
  lambda_function_name = "resume-counter-function"
  dynamodb_table_name  = "resume-visitor-counter"
  api_name             = "resume-visitor-api"
  environment          = "dev"
}


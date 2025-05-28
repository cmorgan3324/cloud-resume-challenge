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


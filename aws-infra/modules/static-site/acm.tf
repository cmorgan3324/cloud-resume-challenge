# # request & DNS-validate acm certificate for custom domain (DNS validation)
# data "aws_route53_zone" "primary" {
#   # capture the hosted zone matching the root domain of var.domain_name
#   name         = var.zone_name
#   private_zone = false
# }

# create (or manage) a public Route 53 hosted zone for var.zone_name
resource "aws_route53_zone" "primary" {
  name = var.zone_name

  tags = {
    Environment = "static-site"
    ManagedBy   = "Terraform"
  }
}

# Use the existing certificate that CloudFront is already using
# This prevents certificate deletion conflicts since CloudFront holds a reference
# The certificate was created outside of this Terraform configuration
data "aws_acm_certificate" "site_cert" {
  domain   = var.domain_name
  statuses = ["ISSUED"]
  most_recent = true
}

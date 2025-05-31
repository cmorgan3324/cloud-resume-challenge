# request & DNS-validate acm certificate for custom domain (DNS validation)
data "aws_route53_zone" "primary" {
  # capture the hosted zone matching the root domain of var.domain_name
  name         = var.zone_name
  private_zone = false
}

resource "aws_acm_certificate" "site_cert" {
  domain_name       = var.domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "TLS cert for ${var.domain_name}"
  }
}

resource "aws_route53_record" "cert_validation" {
  zone_id = data.aws_route53_zone.primary.zone_id
  name    = tolist(aws_acm_certificate.site_cert.domain_validation_options)[0].resource_record_name
  type    = tolist(aws_acm_certificate.site_cert.domain_validation_options)[0].resource_record_type
  ttl     = 300
  records = [tolist(aws_acm_certificate.site_cert.domain_validation_options)[0].resource_record_value]
}

# validate the certificate once DNS is ready
resource "aws_acm_certificate_validation" "site_cert_validation" {
  certificate_arn         = aws_acm_certificate.site_cert.arn
  validation_record_fqdns = [aws_route53_record.cert_validation.fqdn]
}

output "bucket_name" {
  value = aws_s3_bucket.site.id
}

output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.site_cdn.domain_name
}

output "acm_certificate_arn" {
  description = "The ARN of the ACM certificate"
  value = aws_acm_certificate.site_cert.arn
}

output "cloudfront_zone_id" {
  description = "cloudfront distribution hosted zone ID"
  value       = aws_cloudfront_distribution.site_cdn.hosted_zone_id
}
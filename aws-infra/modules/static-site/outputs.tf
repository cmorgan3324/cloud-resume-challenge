output "bucket_name" {
  description = "name of s3 bucket"
  value = aws_s3_bucket.site.id
}

output "cloudfront_domain_name" {
  description = "domain name of cloudfront site cdn"
  value = aws_cloudfront_distribution.site_cdn.domain_name
}

output "acm_certificate_arn" {
  description = "arn of the acm certificate"
  value = data.aws_acm_certificate.site_cert.arn
}

output "cloudfront_zone_id" {
  description = "cloudfront distribution hosted zone id"
  value       = aws_cloudfront_distribution.site_cdn.hosted_zone_id
}

output "cloudfront_distribution_id" {
  description = "id of the cloudFront distribution"
  value       = aws_cloudfront_distribution.site_cdn.id
}
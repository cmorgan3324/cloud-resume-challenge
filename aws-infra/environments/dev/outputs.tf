output "site_bucket" {
  value = module.static_site.bucket_name
}

output "site_cdn" {
  value = module.static_site.cloudfront_domain_name
}

output "cloudfront_distribution_id" {
  value = module.static_site.cloudfront_distribution_id
}
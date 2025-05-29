output "site_bucket" {
  value = module.static_site.bucket_name
}

output "site_cdn" {
  value = module.static_site.cloudfront_domain_name
}
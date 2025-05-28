variable "domain_name" {
  description = "custom domain for resume site"
  type        = string
}

variable "public_bucket_name" {
  description = "name for S3 bucket to host site"
  type        = string
}

variable "zone_name" {
  description = "route53 hosted zone name (e.g. example.com)"
  type        = string
}

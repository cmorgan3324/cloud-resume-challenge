variable "domain_name" {
  description = "The domain name for the website"
  type        = string
}

variable "public_bucket_name" {
  description = "The name of the S3 bucket for static content"
  type        = string
}

variable "zone_name" {
  description = "The Route 53 zone name"
  type        = string
}
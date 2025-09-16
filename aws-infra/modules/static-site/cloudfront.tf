# cloudfront distribution to serve the static site over HTTPS using the ACM certificate

# creates an origin access identity so only cloudfront can fetch objects
resource "aws_cloudfront_origin_access_identity" "oai" {
  comment = "OAI for ${var.public_bucket_name}"
}

# define cloudfront distribution (point to bucket endpoint + enforce https via acm cert)
resource "aws_cloudfront_distribution" "site_cdn" {
  origin {
    domain_name = aws_s3_bucket.site.bucket_regional_domain_name
    origin_id   = "s3-${var.public_bucket_name}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.oai.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  aliases = [var.domain_name]

  default_cache_behavior {
    target_origin_id       = "s3-${var.public_bucket_name}"
    viewer_protocol_policy = "redirect-to-https"

    allowed_methods = ["GET", "HEAD"]
    cached_methods  = ["GET", "HEAD"]

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  viewer_certificate {
    acm_certificate_arn            = data.aws_acm_certificate.site_cert.arn
    ssl_support_method             = "sni-only"
    minimum_protocol_version       = "TLSv1.2_2021"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  tags = {
    Name        = "CloudFront for ${var.domain_name}"
    Environment = "dev"
  }
}

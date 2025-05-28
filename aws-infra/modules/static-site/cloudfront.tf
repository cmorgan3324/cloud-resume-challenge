# cloudfront distribution to serve the static site over HTTPS using the ACM certificate

# creates an origin access identity so only cloudfront can fetch objects
resource "aws_cloudfront_origin_access_identity" "oai" {
  comment = "OAI for ${var.public_bucket_name}"
}

resource "aws_iam_policy" "s3_read_policy" {
  name        = "${var.public_bucket_name}-cloudfront-s3-read"
  description = "policy allowing cloudfront to read from S3 bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:GetObject"]
        Resource = ["${aws_s3_bucket.site.arn}/*"]
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.oai.iam_arn
        }
      }
    ]
  })
}

# set up an aim role + policy granting cloudfront read access to your bucket
resource "aws_iam_role_policy_attachment" "attach_s3_read" {
  role       = aws_iam_role.cloudfront_role.name
  policy_arn = aws_iam_policy.s3_read_policy.arn
}

resource "aws_iam_role" "cloudfront_role" {
  name = "${var.public_bucket_name}-cf-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

# define cloudfront distribution (point to bucket endpoint + enforce https via acm cert)
resource "aws_cloudfront_distribution" "site_cdn" {
  origin {
    domain_name = aws_s3_bucket_website_configuration.site.website_endpoint
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
    # acm_certificate_arn            = aws_acm_certificate_validation.site_cert_validation.certificate_arn
    cloudfront_default_certificate = true # change once domain name is registered for DNS validation
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

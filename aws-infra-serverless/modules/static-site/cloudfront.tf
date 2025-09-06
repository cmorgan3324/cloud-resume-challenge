# cloudfront distribution to serve the static site over HTTPS using the ACM certificate

# creates an origin access identity so only cloudfront can fetch objects
resource "aws_cloudfront_origin_access_identity" "oai" {
  comment = "OAI for ${var.public_bucket_name}"
}

# CloudFront function to handle directory index rewriting
resource "aws_cloudfront_function" "index_rewrite" {
  name    = "index-rewrite-${var.public_bucket_name}"
  runtime = "cloudfront-js-1.0"
  comment = "Rewrite directory paths to index.html"
  publish = true
  code    = <<-EOT
function handler(event) {
    var request = event.request;
    var uri = request.uri;
    
    // If the URI ends with /resume/, rewrite to /resume/index.html
    if (uri === '/resume/') {
        request.uri = '/resume/index.html';
    }
    
    // If the URI ends with /faq-search-demo/, rewrite to /faq-search-demo/index.html
    if (uri === '/faq-search-demo/') {
        request.uri = '/faq-search-demo/index.html';
    }
    
    return request;
}
EOT
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

  # Default behavior for portfolio (root)
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

    min_ttl     = 0
    default_ttl = 86400
    max_ttl     = 31536000
  }

  # Behavior for resume path - exact match for directory
  ordered_cache_behavior {
    path_pattern           = "/resume/"
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

    min_ttl     = 0
    default_ttl = 86400
    max_ttl     = 31536000

    # Add function to handle directory index
    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.index_rewrite.arn
    }
  }

  # Behavior for resume files
  ordered_cache_behavior {
    path_pattern           = "/resume/*"
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

    min_ttl     = 0
    default_ttl = 86400
    max_ttl     = 31536000
  }

  # Behavior for FAQ demo path - exact match for directory
  ordered_cache_behavior {
    path_pattern           = "/faq-search-demo/"
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

    min_ttl     = 0
    default_ttl = 86400
    max_ttl     = 31536000

    # Add function to handle directory index
    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.index_rewrite.arn
    }
  }

  # Behavior for FAQ demo files
  ordered_cache_behavior {
    path_pattern           = "/faq-search-demo/*"
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

    min_ttl     = 0
    default_ttl = 86400
    max_ttl     = 31536000
  }

  # Custom error pages for SPA-like behavior (only for root, not resume)
  custom_error_response {
    error_code         = 404
    response_code      = 404
    response_page_path = "/error.html"
  }

  custom_error_response {
    error_code         = 403
    response_code      = 403
    response_page_path = "/error.html"
  }

  viewer_certificate {
    acm_certificate_arn            = aws_acm_certificate_validation.site_cert_validation.certificate_arn
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
    Environment = "prod"
  }
}
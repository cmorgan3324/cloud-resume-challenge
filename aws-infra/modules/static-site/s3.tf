# s3 bucket definition
resource "aws_s3_bucket" "site" {
  bucket = var.public_bucket_name

  tags = {
    Name        = "Static resume site"
    Environment = "dev"
  }
}

# ownership controls
resource "aws_s3_bucket_ownership_controls" "site" {
  bucket = aws_s3_bucket.site.id

  rule {
    object_ownership = "ObjectWriter"
  }
}

# public access block config (allow public reads)
resource "aws_s3_bucket_public_access_block" "site" {
  bucket = aws_s3_bucket.site.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# set acl to public-read after controls are in place
resource "aws_s3_bucket_acl" "site_acl" {
  depends_on = [
    aws_s3_bucket_ownership_controls.site,
    aws_s3_bucket_public_access_block.site,
  ]

  bucket = aws_s3_bucket.site.id
  acl    = "public-read"
}

# static website hosting config
resource "aws_s3_bucket_website_configuration" "site" {
  bucket = aws_s3_bucket.site.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "error.html"
  }
}

# public read policy for all objects
resource "aws_s3_bucket_policy" "site_policy" {
  bucket = aws_s3_bucket.site.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.site.arn}/*"
      },
    ]
  })
}

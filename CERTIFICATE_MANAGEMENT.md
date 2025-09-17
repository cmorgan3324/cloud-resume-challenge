# ACM Certificate Management Strategy

## Overview
This infrastructure uses an existing ACM certificate rather than managing it through Terraform to prevent deletion conflicts with CloudFront.

## Current Setup

### Certificate Details
- **Domain**: `vibebycory.dev`
- **Certificate ARN**: `arn:aws:acm:us-east-1:864899872694:certificate/e90af866-c5f1-41f8-bb5a-fb02bd0d530b`
- **Status**: ISSUED
- **Validation Method**: DNS

### Architecture Decision
We use a **data source approach** instead of managing the certificate as a Terraform resource:

```hcl
# Reference existing certificate (recommended)
data "aws_acm_certificate" "site_cert" {
  domain   = var.domain_name
  statuses = ["ISSUED"]
  most_recent = true
}
```

Instead of:
```hcl
# Managed certificate (causes deletion conflicts)
resource "aws_acm_certificate" "site_cert" {
  domain_name       = var.domain_name
  validation_method = "DNS"
  # ...
}
```

## Why This Approach?

### Problem with Managed Certificates
When Terraform manages the ACM certificate as a resource:
1. CloudFront holds a reference to the certificate
2. If Terraform tries to delete/recreate the certificate, it fails with:
   ```
   ResourceInUseException: Certificate is in use
   ```
3. This breaks CI/CD deployments and infrastructure updates

### Benefits of Data Source Approach
1. ✅ **No deletion conflicts** - Terraform only references, doesn't manage
2. ✅ **CloudFront stability** - No disruption to live traffic
3. ✅ **CI/CD reliability** - Deployments work consistently
4. ✅ **Certificate reuse** - Leverages existing, validated certificate

## Certificate Lifecycle

### Current Certificate
- Created outside of Terraform
- DNS validated through Route53
- Used by CloudFront distribution `E2NQC052S8UMMX`
- Automatically renewed by AWS

### If Certificate Needs Renewal
AWS automatically handles certificate renewal for DNS-validated certificates. No manual intervention required.

### If New Certificate Needed
1. Create new certificate manually or through separate Terraform config
2. Update CloudFront to use new certificate
3. Update data source to reference new certificate
4. Remove old certificate after CloudFront migration

## Troubleshooting

### Certificate Not Found
If the data source fails to find the certificate:
```bash
# List available certificates
aws acm list-certificates --region us-east-1

# Check specific certificate
aws acm describe-certificate --certificate-arn <arn>
```

### CloudFront Certificate Mismatch
If CloudFront uses a different certificate than expected:
```bash
# Check CloudFront distribution
aws cloudfront get-distribution --id E2NQC052S8UMMX \
  --query "Distribution.DistributionConfig.ViewerCertificate"
```

## State Management

### Clean State Commands
If you need to clean up certificate resources from Terraform state:
```bash
# Remove managed certificate from state (if exists)
terraform state rm module.static_site.aws_acm_certificate.site_cert

# Remove validation resources (if exists)
terraform state rm module.static_site.aws_route53_record.cert_validation
terraform state rm module.static_site.aws_acm_certificate_validation.site_cert_validation
```

### Verify Clean State
```bash
# Should only show data source, not managed resources
terraform state list | grep -E "(acm|cert)"
# Expected output: module.static_site.data.aws_acm_certificate.site_cert
```

## Best Practices

1. **Always use data sources** for certificates used by CloudFront
2. **Test infrastructure changes** in dev environment first
3. **Monitor certificate expiration** (though AWS auto-renews)
4. **Document certificate dependencies** in infrastructure code
5. **Keep certificate ARNs** in documentation for reference

## Related Resources
- CloudFront Distribution: `E2NQC052S8UMMX`
- Route53 Hosted Zone: `Z0012470S0SFXF2W5GBB`
- S3 Bucket: `vibebycory-resume-content`
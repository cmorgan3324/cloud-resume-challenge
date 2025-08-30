#!/bin/bash

# Variables
BUCKET_NAME="vibebycory-portfolio-content"
AWS_REGION="us-east-1"

echo "🚀 Starting serverless deployment..."

# Deploy infrastructure first
echo "🏗️  Deploying AWS infrastructure..."
cd aws-infra-serverless
terraform init
terraform plan
read -p "Apply infrastructure changes? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    terraform apply -auto-approve
    
    # Get API Gateway URL from terraform output
    API_URL=$(terraform output -raw api_gateway_url)
    echo "📡 API Gateway URL: $API_URL"
    
    # Update resume HTML with actual API URL
    cd ..
    sed -i.bak "s|https://YOUR_API_GATEWAY_URL|$API_URL|g" resume/public/index.html
    echo "✅ Updated resume with API Gateway URL"
    
else
    echo "❌ Infrastructure deployment cancelled"
    exit 1
fi

# Upload static files to S3
echo "📦 Uploading static files to S3..."

# Upload portfolio files (root level)
aws s3 cp index.html s3://$BUCKET_NAME/ --region $AWS_REGION
aws s3 cp styles.css s3://$BUCKET_NAME/ --region $AWS_REGION
aws s3 cp script.js s3://$BUCKET_NAME/ --region $AWS_REGION
aws s3 cp Cory_Morgan_SA_Resume.pdf s3://$BUCKET_NAME/ --region $AWS_REGION

# Upload resume files to /resume/ prefix
aws s3 cp resume/public/ s3://$BUCKET_NAME/resume/ --recursive --region $AWS_REGION

# Set proper content types
echo "🏷️  Setting content types..."
aws s3 cp s3://$BUCKET_NAME/index.html s3://$BUCKET_NAME/index.html --metadata-directive REPLACE --content-type "text/html" --region $AWS_REGION
aws s3 cp s3://$BUCKET_NAME/styles.css s3://$BUCKET_NAME/styles.css --metadata-directive REPLACE --content-type "text/css" --region $AWS_REGION
aws s3 cp s3://$BUCKET_NAME/script.js s3://$BUCKET_NAME/script.js --metadata-directive REPLACE --content-type "application/javascript" --region $AWS_REGION

# Set content types for resume files
aws s3 cp s3://$BUCKET_NAME/resume/ s3://$BUCKET_NAME/resume/ --recursive --metadata-directive REPLACE --content-type "text/html" --exclude "*" --include "*.html" --region $AWS_REGION
aws s3 cp s3://$BUCKET_NAME/resume/ s3://$BUCKET_NAME/resume/ --recursive --metadata-directive REPLACE --content-type "text/css" --exclude "*" --include "*.css" --region $AWS_REGION

# Invalidate CloudFront cache
echo "🔄 Invalidating CloudFront cache..."
DISTRIBUTION_ID=$(cd aws-infra-serverless && terraform output -raw cloudfront_distribution_id)
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*" --region $AWS_REGION

echo "✅ Deployment complete!"
echo "🌐 Your site should be available at: https://vibebycory.dev"
echo "📄 Resume available at: https://vibebycory.dev/resume/"
echo "📡 API Gateway: $API_URL"
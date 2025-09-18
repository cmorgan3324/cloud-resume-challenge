# A.R.C - AI Resume Companion

A floating AI chatbot widget powered by Amazon Bedrock that appears on all pages of the portfolio site. The chatbot provides recruiter-friendly information about Cory's experience, projects, and skills with persistent state across page loads and browser tabs.

## Features

- **Floating Chat Widget**: Unobtrusive circular button that expands to a chat panel
- **Persistent State**: Maintains conversation history across page loads and browser tabs
- **AI-Powered Responses**: Uses Amazon Bedrock with RAG over personal knowledge base
- **Professional Personality**: JARVIS-like assistant optimized for recruiter interactions
- **Error Handling**: Automatic retries with exponential backoff and user-friendly error messages
- **Mobile Responsive**: Optimized for all device sizes

## Architecture

### Backend (AWS)

- **Amazon Bedrock Knowledge Base**: S3-backed vector storage with OpenSearch Serverless
- **AWS Lambda**: Node.js 20 handler for chat API
- **API Gateway HTTP API**: RESTful endpoint with CORS configuration
- **S3**: Knowledge base content storage under `kb/` prefix
- **IAM**: Least-privilege roles and policies

### Frontend

- **Vanilla JavaScript**: No framework dependencies for fast loading
- **LocalStorage**: Persistent chat state across sessions
- **BroadcastChannel**: Real-time sync between browser tabs
- **CSS**: Modern styling with gradient themes and animations

### Infrastructure as Code

- **Terraform**: Complete infrastructure provisioning
- **GitHub Actions**: Automated CI/CD pipeline
- **CloudFront**: CDN integration with cache invalidation

## Quick Start

### Prerequisites

- AWS CLI configured with appropriate permissions
- Terraform >= 1.0
- Node.js >= 20
- Access to Amazon Bedrock models in us-east-1

### 1. Deploy Infrastructure

```bash
# Install dependencies
make install

# Deploy Terraform infrastructure
make deploy-infra

# Get outputs for next steps
cd infra/chatbot/terraform
terraform output
```

### 2. Sync Knowledge Base

```bash
# Set environment variables from Terraform outputs
export KB_ID="your-knowledge-base-id"
export DATA_SOURCE_ID="your-data-source-id"

# Sync knowledge base content
make sync-kb
```

### 3. Deploy Frontend

```bash
# Set API URL from Terraform outputs
export CHAT_API_URL="your-api-gateway-url"
export S3_BUCKET_NAME="vibebycory-resume-content"

# Deploy frontend with chatbot integration
make deploy-frontend
```

## Knowledge Base Management

### Adding Content

1. Add files to the `kb/` directory:

   - `kb/cory_profile.json` - Personal profile and skills
   - `kb/projects/` - Individual project descriptions
   - `kb/resume/` - Resume content (PDF/Markdown)

2. Supported formats: `.md`, `.txt`, `.json`, `.pdf`

3. Sync to knowledge base:

```bash
node scripts/publish-kb.mjs
```

### Content Structure

```
kb/
├── cory_profile.json          # Core profile information
├── projects/
│   ├── aws_cloud_resume.md    # Project descriptions
│   ├── ai_faq_search.md
│   └── ...
├── resume/
│   ├── resume.pdf
│   └── resume.md
└── site/
    └── exported_content.md    # Site content export
```

## Configuration

### Environment Variables

```bash
# Required
AWS_REGION=us-east-1
KB_ID=your-knowledge-base-id
DATA_SOURCE_ID=your-data-source-id
S3_BUCKET_NAME=vibebycory-resume-content
CHAT_API_URL=your-api-gateway-url

# Optional (defaults provided)
GEN_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0
KB_EMBED_MODEL_ID=amazon.titan-embed-text-v1
CLOUDFRONT_DIST_ID=your-distribution-id
```

### Terraform Variables

```hcl
# infra/chatbot/terraform/terraform.tfvars
aws_region = "us-east-1"
project_name = "vibebycory-chatbot"
s3_bucket_name = "vibebycory-resume-content"
kb_embed_model_id = "amazon.titan-embed-text-v1"
gen_model_id = "anthropic.claude-3-haiku-20240307-v1:0"
```

## API Reference

### POST /chat

Request:

```json
{
  "sessionId": "optional-uuid",
  "messages": [
    { "role": "user", "content": "Tell me about Cory's AWS experience" }
  ],
  "metadata": {}
}
```

Response:

```json
{
  "sessionId": "uuid",
  "message": {
    "role": "assistant",
    "content": "Based on Cory's experience..."
  },
  "citations": [],
  "stream": false,
  "metadata": {
    "latency": 1500,
    "retryCount": 0,
    "timestamp": "2025-01-16T..."
  }
}
```

## Customization

### Personality Prompt

Edit the system prompt in `infra/chatbot/lambda/index.mjs`:

```javascript
const SYSTEM_PROMPT = `You are "VIBE Recruiter Assistant," a concise, recruiter-friendly guide...`;
```

### Styling

Modify the CSS in `public/chatbot.js` or create a separate stylesheet:

```css
.vibe-chat-toggle {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  /* Your custom styles */
}
```

### Widget Behavior

Configure in `public/chatbot.js`:

```javascript
const MAX_HISTORY_LENGTH = 20;
const MAX_RETRIES = 2;
const BASE_DELAY = 1000;
```

## Monitoring

### CloudWatch Logs

- Lambda function logs: `/aws/lambda/vibebycory-chatbot-handler`
- API Gateway logs: `/aws/apigateway/vibebycory-chatbot-api`

### Metrics to Monitor

- Lambda invocation count and duration
- API Gateway request count and latency
- Bedrock token usage and costs
- Error rates and retry patterns

### Cost Optimization

- Use on-demand Bedrock pricing
- Implement request size limits
- Set Lambda timeout to 30 seconds
- Monitor token usage patterns

## Troubleshooting

### Common Issues

**Chatbot not appearing:**

- Check if `chatbot.js` is loaded in HTML
- Verify API URL configuration
- Check browser console for errors

**API errors:**

- Verify IAM permissions for Lambda
- Check Bedrock model availability in region
- Confirm Knowledge Base ingestion status

**Knowledge Base not updating:**

- Check S3 sync permissions
- Verify ingestion job completion
- Review supported file formats

**CORS errors:**

- Confirm API Gateway CORS configuration
- Check allowed origins match your domain
- Verify preflight OPTIONS handling

### Debug Commands

```bash
# Check Terraform outputs
cd infra/chatbot/terraform && terraform output

# Test API endpoint
curl -X POST "$CHAT_API_URL/chat" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'

# Check Knowledge Base status
aws bedrock-agent list-knowledge-bases --region us-east-1

# View Lambda logs
aws logs tail /aws/lambda/vibebycory-chatbot-handler --follow
```

## Security

### Best Practices Implemented

- CORS restricted to production domain
- IAM roles with least privilege
- Input validation and sanitization
- Rate limiting (basic in-memory)
- No sensitive data in logs
- Secure API endpoints

### Security Considerations

- Monitor for abuse patterns
- Implement advanced rate limiting if needed
- Regular security updates for dependencies
- Review IAM permissions periodically

## Contributing

### Development Workflow

1. Create feature branch from `main`
2. Make changes to relevant components
3. Test locally with `make` commands
4. Submit PR with description of changes
5. CI/CD will deploy on merge to `main`

### Testing

```bash
# Test knowledge base sync
KB_ID=test-kb node scripts/publish-kb.mjs

# Test HTML injection
CHAT_API_URL=test-url node scripts/inject-chat-script.mjs

# Test Lambda function locally (requires SAM CLI)
sam local start-api
```

## License

This project is licensed under the ISC License - see the main project LICENSE file for details.

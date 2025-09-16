# Local Testing Guide - VIBE Chatbot

This guide walks you through testing the chatbot system locally before AWS deployment.

## Prerequisites

### Required Tools
- Node.js >= 20
- AWS CLI configured with appropriate permissions
- Terraform >= 1.0
- A local web server (Python's http.server, Live Server, etc.)

### AWS Permissions Needed
Your AWS credentials need access to:
- Bedrock (InvokeModel, RetrieveAndGenerate)
- S3 (GetObject, PutObject, ListBucket)
- Lambda (CreateFunction, InvokeFunction)
- API Gateway (CreateApi, CreateRoute)
- OpenSearch Serverless (CreateCollection)
- IAM (CreateRole, AttachRolePolicy)

### Check Bedrock Model Access
```bash
# Verify you have access to required models in us-east-1
aws bedrock list-foundation-models --region us-east-1 --query 'modelSummaries[?contains(modelId, `claude-3-haiku`) || contains(modelId, `titan-embed`)].modelId'
```

## Phase 1: Infrastructure Testing

### 1.1 Install Dependencies
```bash
cd portfolio-site

# Install Lambda dependencies
cd infra/chatbot/lambda
npm install
cd ../../..

# Install script dependencies
cd scripts
npm install
cd ..
```

### 1.2 Validate Terraform Configuration
```bash
cd infra/chatbot/terraform

# Initialize Terraform
terraform init

# Validate configuration
terraform validate

# Plan deployment (don't apply yet)
terraform plan
```

### 1.3 Test Lambda Function Locally
```bash
cd infra/chatbot/lambda

# Create a test event
cat > test-event.json << 'EOF'
{
  "body": "{\"messages\":[{\"role\":\"user\",\"content\":\"Hello, tell me about Cory\"}]}",
  "headers": {
    "Content-Type": "application/json"
  },
  "httpMethod": "POST",
  "path": "/chat"
}
EOF

# Test the handler (this will fail without AWS resources, but validates syntax)
node -e "
import('./index.mjs').then(module => {
  console.log('✅ Lambda function syntax is valid');
  console.log('Handler exported:', typeof module.handler === 'function');
}).catch(err => {
  console.error('❌ Lambda function has syntax errors:', err.message);
});
"
```

## Phase 2: Frontend Testing

### 2.1 Test Chatbot Widget Locally
```bash
# Create a simple test HTML file
cat > test-chatbot.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Chatbot Test</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
    <h1>Chatbot Widget Test</h1>
    <p>The chatbot should appear as a floating button in the bottom-right corner.</p>
    
    <!-- Mock config for testing -->
    <script>
        // Create mock config
        window.fetch = window.fetch || function(url) {
            if (url.includes('chatbot.config.json')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        apiUrl: 'http://localhost:3000/mock-api',
                        version: '1.0.0'
                    })
                });
            }
            return Promise.reject(new Error('Mock fetch'));
        };
    </script>
    <script src="public/chatbot.js"></script>
</body>
</html>
EOF

# Start a local server
python3 -m http.server 8080 &
SERVER_PID=$!

echo "🌐 Test server started at http://localhost:8080"
echo "📱 Open http://localhost:8080/test-chatbot.html to test the widget"
echo "🛑 Press Ctrl+C to stop the server"

# Wait for user input
read -p "Press Enter after testing the widget UI..."

# Stop the server
kill $SERVER_PID 2>/dev/null
rm test-chatbot.html
```

### 2.2 Test Script Utilities
```bash
# Test HTML injection script
echo "🔧 Testing HTML injection script..."
node scripts/inject-chat-script.mjs "https://mock-api-url.com"

# Check if script was injected
if grep -q "chatbot.js" index.html; then
    echo "✅ HTML injection successful"
else
    echo "❌ HTML injection failed"
fi

# Test knowledge base sync script (dry run)
echo "🔧 Testing knowledge base sync script..."
KB_ID="test-kb" S3_BUCKET_NAME="test-bucket" node -e "
import('./scripts/publish-kb.mjs').then(() => {
    console.log('✅ Knowledge base script syntax is valid');
}).catch(err => {
    console.error('❌ Knowledge base script has errors:', err.message);
});
"
```

## Phase 3: Mock API Testing

### 3.1 Create Mock API Server
```bash
# Create a simple mock API for testing
cat > mock-api-server.js << 'EOF'
const http = require('http');
const url = require('url');

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    if (req.method === 'POST' && req.url === '/chat') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                console.log('📨 Received chat request:', data);
                
                // Mock response
                const response = {
                    sessionId: data.sessionId || 'mock-session-123',
                    message: {
                        role: 'assistant',
                        content: `Mock response to: "${data.messages[data.messages.length - 1].content}". This is a test response from the mock API server.`
                    },
                    citations: [],
                    stream: false,
                    metadata: {
                        latency: 500,
                        retryCount: 0,
                        timestamp: new Date().toISOString()
                    }
                };
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(response));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

server.listen(3000, () => {
    console.log('🚀 Mock API server running on http://localhost:3000');
    console.log('📡 Endpoint: POST http://localhost:3000/chat');
});
EOF

# Start mock API server
node mock-api-server.js &
MOCK_API_PID=$!

echo "🚀 Mock API server started"
echo "🧪 You can now test the chatbot with a mock backend"
```

### 3.2 Test Full Integration
```bash
# Update chatbot config to use mock API
mkdir -p public
cat > public/chatbot.config.json << 'EOF'
{
  "apiUrl": "http://localhost:3000",
  "version": "1.0.0",
  "lastUpdated": "2025-01-16T00:00:00.000Z"
}
EOF

# Start web server for full integration test
python3 -m http.server 8080 &
WEB_SERVER_PID=$!

echo "🌐 Full integration test ready!"
echo "📱 Open http://localhost:8080 to test the complete chatbot"
echo "💬 Try sending messages to see mock responses"
echo ""
echo "🛑 Press Enter when done testing..."
read

# Cleanup
kill $MOCK_API_PID 2>/dev/null
kill $WEB_SERVER_PID 2>/dev/null
rm mock-api-server.js
rm public/chatbot.config.json 2>/dev/null
```

## Phase 4: AWS Integration Testing

### 4.1 Deploy Minimal Infrastructure
```bash
# Deploy only the infrastructure (no frontend yet)
cd infra/chatbot/terraform

# Create Lambda deployment package
cd ../lambda
npm ci --only=production
zip -r ../terraform/chatbot-handler.zip . -x "*.git*" "*.DS_Store*"
cd ../terraform

# Deploy infrastructure
terraform apply -auto-approve

# Get outputs
CHAT_API_URL=$(terraform output -raw chat_api_url)
KB_ID=$(terraform output -raw kb_id)

echo "✅ Infrastructure deployed!"
echo "🔗 API URL: $CHAT_API_URL"
echo "🧠 Knowledge Base ID: $KB_ID"

# Export for next steps
export CHAT_API_URL KB_ID
```

### 4.2 Test API Endpoint
```bash
# Test the deployed API
cd ../../../scripts
node test-chatbot.mjs "$CHAT_API_URL"
```

### 4.3 Sync Knowledge Base
```bash
# Sync knowledge base content
KB_ID="$KB_ID" S3_BUCKET_NAME="vibebycory-resume-content" node publish-kb.mjs

echo "⏳ Knowledge base ingestion started. This may take 2-5 minutes..."
echo "🔄 You can check status in AWS Console > Bedrock > Knowledge bases"
```

### 4.4 Test Full System
```bash
# Update frontend to use real API
cd ..
node scripts/inject-chat-script.mjs "$CHAT_API_URL"

# Test the complete system
echo "🎯 Testing complete system..."
node scripts/test-chatbot.mjs "$CHAT_API_URL"

echo "✅ Local testing completed!"
echo "🚀 Ready for full deployment"
```

## Troubleshooting

### Common Issues

**Bedrock Access Denied:**
```bash
# Check if models are enabled in your region
aws bedrock list-foundation-models --region us-east-1
```

**CORS Errors:**
- Ensure API Gateway CORS is configured correctly
- Check that your domain is in the allowed origins

**Knowledge Base Empty:**
- Verify S3 sync completed successfully
- Check ingestion job status in AWS Console

**Lambda Timeout:**
- Check CloudWatch logs for detailed error messages
- Increase timeout if needed

### Debug Commands
```bash
# Check Lambda logs
aws logs tail /aws/lambda/vibebycory-chatbot-chatbot-handler --follow

# Check API Gateway logs
aws logs tail /aws/apigateway/vibebycory-chatbot-chatbot-api --follow

# Test S3 access
aws s3 ls s3://vibebycory-resume-content/kb/

# Check Knowledge Base status
aws bedrock-agent get-knowledge-base --knowledge-base-id "$KB_ID"
```

## Next Steps

After successful local testing:
1. Commit your changes
2. Push to main branch for automated deployment
3. Monitor CloudWatch logs during deployment
4. Test the live site at https://vibebycory.dev

## Cleanup (Optional)

To remove test infrastructure:
```bash
cd infra/chatbot/terraform
terraform destroy -auto-approve
```
EOF
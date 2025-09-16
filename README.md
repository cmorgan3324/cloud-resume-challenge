# AI/Cloud Portfolio Website – AWS Cloud Resume Challenge

A clean, mobile-friendly portfolio website showcasing AI and Cloud projects, built as part of the AWS Cloud Resume Challenge.

Visit the live site for a deep dive into my process of developing this VIBE on my blog at [VIBEbyCory.dev](https://VIBEbyCory.dev/).

---

## Architecture Diagram

![Architecture Diagram Placeholder](./cloud-architecture-diagram.png)

---

## Features

- **Responsive Design**: Optimized for all devices (mobile, tablet, desktop)  
- **Modern UI**: Professional design with smooth animations  
- **Project Showcase**: Section highlighting 6 AI/Cloud projects  
- **Resume Download**: Direct PDF download option  
- **Contact Integration**: Easy access to contact details and social links  
- **Performance Optimized**: Fast loading with minimal dependencies  
- **Visitor Counter**: Integrated with AWS API Gateway, Lambda, and DynamoDB  
- **AI Chatbot**: VIBE Recruiter Assistant powered by Amazon Bedrock with RAG  

---

## Recent Updates

- **AI Chatbot (VIBE Recruiter Assistant)**  
  - Added floating chat widget powered by Amazon Bedrock  
  - RAG-enabled responses using personal knowledge base  
  - Persistent state across page loads and browser tabs  
  - Professional, recruiter-friendly personality (JARVIS-inspired)  

- **Visitor Counter**  
  - Added real integration with AWS backend (API Gateway + Lambda + DynamoDB)  
  - Simplified logic to rely only on the server-side counter  

---

## AWS Cloud Resume Challenge Architecture

This project demonstrates a fully serverless AWS implementation.

### Frontend
- Static Site Hosting: S3 + CloudFront + Route 53 + ACM  
- Custom Domain: VIBEbyCory.dev with HTTPS  

### Backend
- Visitor Counter API: DynamoDB + Python Lambda + HTTP API Gateway  
- AI Chatbot API: Amazon Bedrock + Knowledge Base + Node.js Lambda  
- Infrastructure as Code: Terraform modules and workspaces  
- Unit Testing: Pytest + moto for Lambda testing  

### CI/CD
- GitHub Actions: Automated deployments  
- Monitoring: CloudWatch alarms + SNS notifications  

---

## Project Structure
```
portfolio-site/
├── index.html                    # Main portfolio page
├── styles.css                    # CSS styles
├── script.js                     # JavaScript with AWS API integration
├── public/
│   └── chatbot.js                # AI chatbot widget
├── infra/
│   └── chatbot/                  # Chatbot infrastructure
│       ├── terraform/            # Terraform IaC
│       └── lambda/               # Lambda function code
├── kb/                           # Knowledge base content
│   ├── cory_profile.json         # Personal profile
│   └── projects/                 # Project descriptions
├── scripts/                      # Deployment and management scripts
├── aws-infra-serverless/         # Original infrastructure code
├── resume/                       # Resume page and assets
└── deploy-serverless.sh          # Deployment script
```
---

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript, Font Awesome, Google Fonts  
- **Backend**: AWS Lambda (Python/Node.js), DynamoDB, API Gateway, Amazon Bedrock  
- **AI/ML**: Bedrock Knowledge Base, OpenSearch Serverless, RAG  
- **Infrastructure**: Terraform, AWS S3, CloudFront, Route 53, ACM  
- **CI/CD**: GitHub Actions  
- **Testing**: Pytest, moto  

---

## VIBE Recruiter Assistant (AI Chatbot)

The portfolio site features an AI-powered chatbot that helps recruiters and visitors learn about Cory's experience, projects, and skills. Built with Amazon Bedrock and a custom knowledge base.

### Key Features
- **Floating Widget**: Unobtrusive chat button that expands to full conversation panel
- **Persistent State**: Maintains conversation history across page loads and browser tabs
- **RAG-Powered**: Uses Retrieval-Augmented Generation with personal knowledge base
- **Professional Tone**: JARVIS-inspired personality optimized for recruiter interactions
- **Error Handling**: Automatic retries and user-friendly error messages
- **Mobile Responsive**: Optimized for all device sizes

### Architecture
- **Amazon Bedrock**: Knowledge Base with S3 vector storage
- **AWS Lambda**: Node.js 20 handler for chat API
- **API Gateway**: HTTP API with CORS configuration
- **OpenSearch Serverless**: Vector storage for embeddings
- **Terraform**: Infrastructure as Code

### Quick Start
```bash
# Deploy infrastructure
make deploy-infra

# Sync knowledge base
make sync-kb

# Deploy frontend
make deploy-frontend
```

For detailed setup instructions, see [CHATBOT_README.md](./CHATBOT_README.md).

---

## License

This project is licensed under the ISC License.
# AWS Cloud Resume Challenge

**Project Type:** Cloud Architecture & Infrastructure  
**Status:** Completed and Live  
**Live Site:** https://vibebycory.dev  
**GitHub:** https://github.com/cmorgan3324/cloud-resume-challenge

## Overview
Migrated a local Node.js/SQLite resume application to a fully serverless AWS architecture using Infrastructure as Code (Terraform). This project demonstrates end-to-end cloud engineering skills from frontend hosting to backend APIs and CI/CD automation.

## Architecture
- **Frontend:** Static site hosted on S3 with CloudFront CDN
- **Domain:** Custom domain (vibebycory.dev) via Route 53 with ACM SSL certificate
- **Backend:** Serverless visitor counter using Lambda (Python) and DynamoDB
- **API:** HTTP API Gateway for RESTful endpoints
- **Infrastructure:** Fully managed via Terraform with modular design
- **CI/CD:** GitHub Actions for automated deployments

## Technical Implementation

### Frontend Hosting
- Private S3 bucket with CloudFront Origin Access Identity (OAI)
- CloudFront distribution with custom domain and SSL
- Route 53 DNS management with A/AAAA records
- Automated cache invalidation on deployments

### Serverless Backend
- Python Lambda function for visitor counting logic
- DynamoDB table with on-demand billing for cost efficiency
- API Gateway HTTP API with CORS configuration
- CloudWatch logging and monitoring

### Infrastructure as Code
- Terraform modules for reusable components
- Separate workspaces for development and production
- State management with S3 backend and DynamoDB locking
- IAM roles and policies following least privilege principle

### CI/CD Pipeline
- GitHub Actions workflows for frontend and infrastructure
- Automated testing with pytest and moto for Lambda functions
- CloudWatch alarms with SNS notifications for monitoring
- Automated deployments on code changes

## Key Challenges Solved
1. **DNS Configuration:** Properly configured Route 53 with CloudFront aliases
2. **CORS Issues:** Resolved cross-origin requests between frontend and API
3. **IAM Permissions:** Implemented secure, minimal permissions for all services
4. **Cost Optimization:** Used on-demand billing and efficient resource sizing
5. **Monitoring:** Set up comprehensive logging and alerting

## Technologies Used
- **AWS Services:** S3, CloudFront, Route 53, ACM, Lambda, DynamoDB, API Gateway, CloudWatch, IAM
- **Infrastructure:** Terraform, AWS CLI
- **Backend:** Python, boto3, pytest, moto
- **Frontend:** HTML5, CSS3, JavaScript
- **CI/CD:** GitHub Actions
- **Monitoring:** CloudWatch, SNS

## Results
- **Performance:** Sub-second page load times globally via CloudFront
- **Reliability:** 99.9%+ uptime with serverless architecture
- **Cost:** Under $5/month for full production environment
- **Security:** SSL encryption, secure API endpoints, proper IAM roles
- **Scalability:** Auto-scaling Lambda and DynamoDB for traffic spikes

## Skills Demonstrated
- Cloud architecture design and implementation
- Infrastructure as Code best practices
- Serverless application development
- CI/CD pipeline automation
- Cost optimization strategies
- Security implementation (SSL, IAM, CORS)
- Performance optimization
- Monitoring and alerting setup

This project showcases the ability to design, implement, and maintain production-ready cloud infrastructure while following AWS Well-Architected Framework principles.
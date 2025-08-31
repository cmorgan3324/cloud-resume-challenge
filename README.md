# AI/Cloud Portfolio Website – AWS Cloud Resume Challenge

A clean, mobile-friendly portfolio website showcasing AI and Cloud projects, built as part of the AWS Cloud Resume Challenge.

Visit the live site at: <https://VIBEbyCory.dev>

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

---

## Recent Updates

- **Visitor Counter**  
  - Added real integration with AWS backend (API Gateway + Lambda + DynamoDB)  
  - Simplified logic to rely only on the server-side counter  

---

## AWS Cloud Resume Challenge Architecture

This project demonstrates a fully serverless AWS implementation.

### Frontend
- Static Site Hosting: S3 + CloudFront + Route 53 + ACM  
- Custom Domain: vibebycory.dev with HTTPS  

### Backend
- Visitor Counter API: DynamoDB + Python Lambda + HTTP API Gateway  
- Infrastructure as Code: Terraform modules and workspaces  
- Unit Testing: Pytest + moto for Lambda testing  

### CI/CD
- GitHub Actions: Automated deployments  
- Monitoring: CloudWatch alarms + SNS notifications  

---
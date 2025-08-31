# AI/Cloud Portfolio Website – AWS Cloud Resume Challenge

A clean, mobile-friendly portfolio website showcasing AI and Cloud projects, built as part of the AWS Cloud Resume Challenge.

Visit the live site to read more about the build process and lessons learned on my blog: [VIBEbyCory.dev/](https://VIBEbyCory.dev/)

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
- Custom Domain: VIBEbyCory.dev with HTTPS  

### Backend
- Visitor Counter API: DynamoDB + Python Lambda + HTTP API Gateway  
- Infrastructure as Code: Terraform modules and workspaces  
- Unit Testing: Pytest + moto for Lambda testing  

### CI/CD
- GitHub Actions: Automated deployments  
- Monitoring: CloudWatch alarms + SNS notifications  

---

## Project Structure
```
portfolio-site/
├── index.html # Main portfolio page
├── styles.css # CSS styles
├── script.js # JavaScript with AWS API integration
├── aws-infra-serverless/ # Terraform infrastructure code
├── resume/ # Resume page and assets
└── deploy-serverless.sh # Deployment script
```
---

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript, Font Awesome, Google Fonts  
- **Backend**: AWS Lambda (Python), DynamoDB, API Gateway  
- **Infrastructure**: Terraform, AWS S3, CloudFront, Route 53, ACM  
- **CI/CD**: GitHub Actions  
- **Testing**: Pytest, moto  

---

## License

This project is licensed under the ISC License.
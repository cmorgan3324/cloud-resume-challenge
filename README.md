# AI/Cloud Portfolio Website - AWS Cloud Resume Challenge

A clean, mobile-friendly portfolio website showcasing AI and Cloud projects, built as part of the AWS Cloud Resume Challenge.

Visit the live site at: <https://VIBEbyCory.dev>

## Features

- **Responsive Design**: Optimized for all devices (mobile, tablet, desktop)
- **Modern UI**: Clean, professional design with smooth animations
- **Project Showcase**: Dedicated section for 6 AI/Cloud projects
- **Resume Download**: Direct PDF download functionality
- **Contact Integration**: Easy-to-find contact information and social links
- **Performance Optimized**: Fast loading with minimal dependencies
- **Real Visitor Counter**: AWS API Gateway + Lambda + DynamoDB integration

## Recent Updates

### ✅ Visitor Counter Fixed!

- **Removed localStorage simulation** - The JavaScript was generating fake visitor counts (1000+ random numbers)
- **Added real API integration** - Now calls the actual AWS API Gateway endpoint
- **Simplified logic** - Removed localStorage and sessionStorage, now relies on the server-side counter

## AWS Cloud Resume Challenge Architecture

This project demonstrates a fully serverless AWS implementation:

### Frontend

- **Static Site Hosting**: S3 + CloudFront + Route 53 + ACM certificate
- **Custom Domain**: vibebycory.dev with HTTPS

### Backend

- **Visitor Counter API**: DynamoDB + Python Lambda + HTTP API Gateway
- **Infrastructure as Code**: Terraform modules and workspaces
- **Unit Testing**: Pytest + moto for Lambda testing

### CI/CD

- **GitHub Actions**: Automated deployments
- **Monitoring**: CloudWatch alarms + SNS notifications

## Project Structure

```
portfolio-site/
├── index.html              # Main portfolio page
├── styles.css              # All CSS styles
├── script.js               # JavaScript with real API integration
├── aws-infra-serverless/   # Terraform infrastructure code
├── resume/                 # Resume page and assets
└── deploy-serverless.sh    # Deployment script
```

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript, Font Awesome, Google Fonts
- **Backend**: AWS Lambda (Python), DynamoDB, API Gateway
- **Infrastructure**: Terraform, AWS S3, CloudFront, Route 53, ACM
- **CI/CD**: GitHub Actions
- **Testing**: Pytest, moto

## Future Improvements

- Add Terraform staging and production workspaces
- Integrate CloudWatch monitoring with Slack notifications
- Add blog functionality
- Enhance resume page styling

## License

This project is licensed under the ISC License.

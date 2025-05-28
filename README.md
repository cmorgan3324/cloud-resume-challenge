# My AWS Cloud Resume Challenge

A serverless web application that hosts my resume, built using AWS services and modern DevOps practices. This project demonstrates how to migrate a legacy application via lift-and-shift and deploy on AWS using AWS RDS, AWS Lambda, AWS API Gateway, AWS Route 53, Terraform, GitHub Actions, and JavaScript.

## Overview

This application leverages the following key technologies:

- **AWS DynamoDB:** A managed NoSQL database service used to store your resume data.
- **AWS Lambda:** Serverless functions that execute your code in response to API calls.
- **AWS API Gateway:** Provides RESTful API endpoints that trigger your Lambda functions.
- **AWS Route 53:** DNS service that routes your custom domain to your API endpoints.
- **Terraform:** Infrastructure-as-Code (IaC) tool to provision and manage AWS resources.
- **GitHub Actions:** Automates the CI/CD process for testing and deploying your infrastructure.
- **JavaScript:** Used both in the Lambda function (Node.js) and the frontend for rendering your resume.

## Getting Started

### Prerequisites

Before getting started, ensure you have the following installed on your machine:
- [Homebrew](https://brew.sh/) (for package management)
- [Git](https://git-scm.com/)
- [Terraform](https://www.terraform.io/downloads)
- [AWS CLI](https://aws.amazon.com/cli/)
- [Node.js and npm](https://nodejs.org/)

### Installation

1. **Clone the Repository:**

   Open your Terminal and run:

   ```bash
   git clone https://github.com/your-username/serverless-web-resume.git
   cd serverless-web-resume
   ```

2. **Project Structure:**

   The repository is organized into key directories:

   ```
   serverless-web-resume/
   ├── .github
   │   └── workflows         # GitHub Actions workflow files
   ├── lambda                # AWS Lambda function code
   ├── terraform             # Terraform configuration files
   ├── web                   # Frontend HTML, CSS, and JavaScript files
   └── README.md             # This file
   ```

3. **Configure AWS CLI:**

   Run the following command to configure your AWS credentials:

   ```bash
   aws configure
   ```

   Enter your AWS Access Key ID, Secret Access Key, default region, and output format when prompted.

## Deployment

### Provisioning Infrastructure with Terraform

Terraform automates the creation of AWS resources like DynamoDB, Lambda, API Gateway, and Route 53.

1. **Navigate to the Terraform Directory:**

   ```bash
   cd terraform
   ```

2. **Initialize Terraform:**

   ```bash
   terraform init
   ```

3. **Review the Terraform Plan:**

   ```bash
   terraform plan
   ```

4. **Apply the Terraform Plan:**

   ```bash
   terraform apply -auto-approve
   ```

   This command will create and configure all necessary AWS resources for your application.

### Continuous Deployment with GitHub Actions

A GitHub Actions workflow located in `.github/workflows/deploy.yml` automates Terraform deployments when you push changes to the `main` branch.

- **Setup GitHub Secrets:**  
  Add your AWS credentials to your repository’s secrets:
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`

Whenever you push code, GitHub Actions will automatically deploy your infrastructure updates.

## Frontend

The frontend code is located in the `web` directory. It contains a simple HTML file and JavaScript that fetches your resume data from the API Gateway endpoint.

### Running the Frontend Locally

1. Open the `index.html` file in your preferred web browser.
2. Ensure that the API endpoint in your JavaScript code is updated to match your deployed API Gateway endpoint.

## Lambda Function

The AWS Lambda function is stored in the `lambda` directory. This function retrieves your resume data from DynamoDB and returns it in JSON format via API Gateway.

### Packaging Your Lambda Function

Before deploying, package your Lambda function code into a ZIP file. For example:

```bash
cd lambda
zip -r resume-handler.zip index.js node_modules
```

Make sure that the generated ZIP file is referenced correctly in your Terraform configuration.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request if you have any suggestions, bug fixes, or improvements.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
```

---

Simply copy and paste the above content into your `README.md` file. Feel free to adjust any sections to better suit your project details.

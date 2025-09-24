terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket         = "vibebycory-terraform-state-bucket"
    key            = "chatbot/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-lock"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# S3 bucket for knowledge base (using existing bucket)
data "aws_s3_bucket" "resume_content" {
  bucket = var.s3_bucket_name
}

# IAM role for Bedrock Knowledge Base
resource "aws_iam_role" "bedrock_kb_role" {
  name = "${var.project_name}-bedrock-kb-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "bedrock.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_policy" "bedrock_kb_policy" {
  name = "${var.project_name}-bedrock-kb-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          data.aws_s3_bucket.resume_content.arn,
          "${data.aws_s3_bucket.resume_content.arn}/kb/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel"
        ]
        Resource = "arn:aws:bedrock:${data.aws_region.current.name}::foundation-model/${var.kb_embed_model_id}"
      },
      {
        Effect = "Allow"
        Action = [
          "aoss:APIAccessAll"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "bedrock_kb_policy_attachment" {
  role       = aws_iam_role.bedrock_kb_role.name
  policy_arn = aws_iam_policy.bedrock_kb_policy.arn
}

# Bedrock Knowledge Base - temporarily disabled
# resource "aws_bedrockagent_knowledge_base" "chatbot_kb" {
#   name     = "${var.project_name}-knowledge-base"
#   role_arn = aws_iam_role.bedrock_kb_role.arn
# }

# OpenSearch Serverless collection - temporarily disabled
# resource "aws_opensearchserverless_collection" "kb_collection" {
#   name = "vbc-kb-collection"
#   type = "VECTORSEARCH"
# }

# OpenSearch Serverless resources - temporarily disabled
# resource "aws_opensearchserverless_security_policy" "kb_encryption_policy" {
#   name = "vbc-kb-encryption-policy"
#   type = "encryption"
# }
# 
# resource "aws_opensearchserverless_security_policy" "kb_network_policy" {
#   name = "vbc-kb-network-policy"
#   type = "network"
# }
# 
# resource "aws_opensearchserverless_access_policy" "kb_data_policy" {
#   name = "vbc-kb-data-policy"
#   type = "data"
# }

# Bedrock Knowledge Base Data Source - temporarily disabled
# resource "aws_bedrockagent_data_source" "kb_data_source" {
#   knowledge_base_id = aws_bedrockagent_knowledge_base.chatbot_kb.id
#   name              = "${var.project_name}-s3-data-source"
# }

# IAM role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_policy" "lambda_policy" {
  name = "${var.project_name}-lambda-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream"
        ]
        Resource = "arn:aws:bedrock:${data.aws_region.current.name}::foundation-model/${var.gen_model_id}"
      },

    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_policy_attachment" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

# Lambda function
resource "aws_lambda_function" "chatbot_handler" {
  filename         = "chatbot-handler.zip"
  function_name    = "${var.project_name}-chatbot-handler"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  runtime         = "nodejs20.x"
  timeout         = 30

  environment {
    variables = {
      BEDROCK_REGION = var.aws_region
      GEN_MODEL_ID  = var.gen_model_id
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_policy_attachment,
    aws_cloudwatch_log_group.lambda_logs,
  ]
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${var.project_name}-chatbot-handler"
  retention_in_days = 14
}

# API Gateway HTTP API
resource "aws_apigatewayv2_api" "chatbot_api" {
  name          = "${var.project_name}-chatbot-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_credentials = false
    allow_headers     = ["content-type", "x-amz-date", "authorization", "x-api-key"]
    allow_methods     = ["POST", "OPTIONS"]
    allow_origins     = ["https://vibebycory.dev", "https://www.vibebycory.dev"]
    max_age          = 86400
  }
}

resource "aws_apigatewayv2_stage" "chatbot_api_stage" {
  api_id      = aws_apigatewayv2_api.chatbot_api.id
  name        = "prod"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gw_logs.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip            = "$context.identity.sourceIp"
      requestTime   = "$context.requestTime"
      httpMethod    = "$context.httpMethod"
      routeKey      = "$context.routeKey"
      status        = "$context.status"
      protocol      = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }
}

resource "aws_cloudwatch_log_group" "api_gw_logs" {
  name              = "/aws/apigateway/${var.project_name}-chatbot-api"
  retention_in_days = 14
}

resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id             = aws_apigatewayv2_api.chatbot_api.id
  integration_type   = "AWS_PROXY"
  integration_method = "POST"
  integration_uri    = aws_lambda_function.chatbot_handler.invoke_arn
}

resource "aws_apigatewayv2_route" "chat_route" {
  api_id    = aws_apigatewayv2_api.chatbot_api.id
  route_key = "POST /chat"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_apigatewayv2_route" "chat_options_route" {
  api_id    = aws_apigatewayv2_api.chatbot_api.id
  route_key = "OPTIONS /chat"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_lambda_permission" "api_gw_lambda" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.chatbot_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.chatbot_api.execution_arn}/*/*"
}
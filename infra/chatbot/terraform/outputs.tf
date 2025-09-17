output "chat_api_url" {
  description = "Chat API Gateway URL"
  value       = aws_apigatewayv2_api.chatbot_api.api_endpoint
}

# output "kb_id" {
#   description = "Bedrock Knowledge Base ID"
#   value       = aws_bedrockagent_knowledge_base.chatbot_kb.id
# }

output "lambda_function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.chatbot_handler.function_name
}

output "s3_kb_prefix" {
  description = "S3 prefix for knowledge base content"
  value       = "s3://${var.s3_bucket_name}/kb/"
}
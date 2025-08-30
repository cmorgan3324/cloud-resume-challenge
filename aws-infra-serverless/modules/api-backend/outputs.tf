output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.counter.function_name
}

output "api_gateway_url" {
  description = "API Gateway URL"
  value       = aws_apigatewayv2_api.http_api.api_endpoint
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  value       = aws_dynamodb_table.counter_table.name
}
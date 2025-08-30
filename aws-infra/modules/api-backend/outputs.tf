output "dynamodb_table" {
  description = "DynamoDB table name"
  value       = aws_dynamodb_table.counter_table.name
}

output "lambda_function_name" {
  description = "deployed lambda function name"
  value       = aws_lambda_function.counter.function_name
}

output "api_endpoint" {
  description = "invoke url for the http api"
  value       = aws_apigatewayv2_api.http_api.api_endpoint
}
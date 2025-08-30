resource "archive_file" "pd_zip" {
  type        = "zip"
  source_dir  = "${path.module}/pd_forwarder"
  output_path = "${path.module}/pd_forwarder/lambda.zip"
}

resource "aws_iam_role" "pd_forwarder_role" {
  name = "pd-forwarder-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "pd_logs" {
  role       = aws_iam_role.pd_forwarder_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "pd_forwarder" {
  function_name = "pagerduty-forwarder"
  runtime       = "python3.9"
  handler       = "lambda_function.lambda_handler"
  role          = aws_iam_role.pd_forwarder_role.arn
  filename      = archive_file.pd_zip.output_path

# ensure the sns topic and pagerduty integration exit first
  depends_on = [
    aws_sns_topic.alarms,
    pagerduty_service_integration.alerts_integration
  ]

  environment {
    variables = {
      PAGERDUTY_INTEGRATION_KEY = pagerduty_service_integration.alerts_integration.integration_key
    }
  }
}

resource "aws_sns_topic_subscription" "to_pd_lambda" {
  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.pd_forwarder.arn

  depends_on = [
    aws_sns_topic.alarms,
    pagerduty_service_integration.alerts_integration,
    aws_lambda_function.pd_forwarder
  ]
}

resource "aws_lambda_permission" "allow_sns_pd" {
  statement_id  = "AllowSNSToInvokePDForwarder"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.pd_forwarder.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.alarms.arn
}

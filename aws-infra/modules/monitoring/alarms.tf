resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "LambdaVisitorCounterErrors"
  alarm_description   = "Triggers on any error in the visitor-count Lambda"
  namespace           = "AWS/Lambda"
  metric_name         = "Errors"
  dimensions = {
    FunctionName = module.api_backend.lambda_function_name
  }
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 1
  threshold           = 1      # alarm if ≥1 error
  comparison_operator = "GreaterThanOrEqualToThreshold"
  alarm_actions       = [ aws_sns_topic.alarms.arn ]

  depends_on = [ module.api_backend ] 
}

resource "aws_cloudwatch_metric_alarm" "lambda_throttles" {
  alarm_name          = "LambdaThrottles"
  namespace           = "AWS/Lambda"
  metric_name         = "Throttles"
  dimensions = {
    FunctionName = module.api_backend.lambda_function_name
  }
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 1
  threshold           = 1
  comparison_operator = "GreaterThanOrEqualToThreshold"
  alarm_description   = "Triggered when Lambda is throttled"
  alarm_actions       = [ aws_sns_topic.alarm.arn ]
}
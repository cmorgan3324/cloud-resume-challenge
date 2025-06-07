resource "aws_sns_topic" "alarms" {
  name = "cloud-resume-alarms"
  tags = {
    Environment = "dev"
  }

}

resource "aws_sns_topic_policy" "alarms_policy" {
  arn    = aws_sns_topic.alarms.arn
  policy = jsonencode({
    Version = "2012-10-17"
    # allow both cloudwatch and aws budgets to publish to this topic
    Statement = [
      {
        Sid       = "AllowCloudWatchPublish"
        Effect    = "Allow"
        Principal = { Service = "cloudwatch.amazonaws.com" }
        Action    = "SNS:Publish"
        Resource  = aws_sns_topic.alarms.arn
      },
      {
        Sid       = "AllowBudgetsPublish"
        Effect    = "Allow"
        Principal = { Service = "budgets.amazonaws.com" }
        Action    = "SNS:Publish"
        Resource  = aws_sns_topic.alarms.arn
      }
    ]
  })
}

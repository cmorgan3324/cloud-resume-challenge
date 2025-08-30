# create an IAM role that AWS Chatbot will assume
resource "aws_iam_role" "chatbot_role" {
  name = "SlackChatbotRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "chatbot.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

# grant SNS read permissions to that role
resource "aws_iam_role_policy" "chatbot_sns_read" {
  name   = "chatbot-sns-read"
  role   = aws_iam_role.chatbot_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = [
        "sns:ListSubscriptionsByTopic",
        "sns:GetTopicAttributes",
        "sns:Subscribe"
      ]
      Resource = aws_sns_topic.alarms.arn
    }]
  })
}

# resource "aws_iam_role_policy_attachment" "chatbot_service" {
#   role       = aws_iam_role.chatbot_role.name
#   policy_arn = "arn:aws:iam::aws:policy/service-role/AWSChatbotServiceRolePolicy"
# }


# configure the slack channel in AWS Chatbot
resource "aws_chatbot_slack_channel_configuration" "alerts" {
  configuration_name = "cloud-resume-alerts"
  slack_team_id = var.slack_team_id
  slack_channel_id   = var.slack_channel_id
  iam_role_arn       = aws_iam_role.chatbot_role.arn
  sns_topic_arns     = [ aws_sns_topic.alarms.arn ]
  logging_level = "ERROR"
}

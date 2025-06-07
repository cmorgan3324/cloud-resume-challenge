resource "aws_budgets_budget" "monthly_cost" {
  name = "MonthlyCostBudget"

  budget_type = "COST"
  limit_amount = var.budget_limit
  limit_unit   = "USD"

  time_unit = "MONTHLY"
  time_period_start = formatdate("YYYY-MM-DD", timestamp())  # today’s date

  cost_types {
    include_tax              = true
    include_subscription     = true
    include_support          = true
    include_other_subscription = true
    include_upfront          = true
    use_amortized            = false
  }

  notification {
    comparison_operator = "GREATER_THAN"
    threshold           = var.budget_threshold_percentage 
    threshold_type      = "PERCENTAGE"
    notification_type   = "ACTUAL"
    subscriber_sns_topic_arns = aws_sns_topic.alarms.arn

    # subscriber {
    #   subscription_type = "SNS"
    #   address           = aws_sns_topic.alarms.arn
    # }
  }
}

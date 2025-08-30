# import os
# import json
# import urllib3

# INTEGRATION_KEY = os.environ["PAGERDUTY_INTEGRATION_KEY"]
# PD_URL = "https://events.pagerduty.com/v2/enqueue"
# http = urllib3.PoolManager()

# def lambda_handler(event, context):
#     # SNS delivers alarms as JSON in event['Records'][0]['Sns']['Message']
#     sns_message = json.loads(event["Records"][0]["Sns"]["Message"])
#     alarm_name  = sns_message.get("AlarmName", "UnknownAlarm")
#     state       = sns_message.get("NewStateValue", "UNKNOWN")
#     reason      = sns_message.get("NewStateReason", "")
#     payload = {
#         "routing_key": INTEGRATION_KEY,
#         "event_action": "trigger",
#         "payload": {
#             "summary": f"{alarm_name}: {state}",
#             "source": "aws_cloudwatch",
#             "severity": "error" if state == "ALARM" else "info",
#             "custom_details": sns_message
#         }
#     }
#     encoded = json.dumps(payload).encode("utf-8")
#     resp = http.request(
#         "POST",
#         PD_URL,
#         body=encoded,
#         headers={"Content-Type": "application/json"}
#     )
#     return {
#         "statusCode": resp.status,
#         "body": resp.data.decode("utf-8")
#     }

import json
import os
import boto3
from boto3.dynamodb.conditions import Key

TABLE = os.environ["TABLE_NAME"]
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE)

def lambda_handler(event, context):
    # extract single counter item (id="counter")
    resp = table.get_item(Key={"id": "counter"})
    count = int(resp.get("Item", {}).get("count", 0))

    # increment
    count += 1
    table.put_item(Item={"id": "counter", "count": count})

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({"count": count})
    }
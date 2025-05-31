import os
import sys
import json
import boto3
import pytest
import importlib

TABLE_NAME = "resume-visitor-counter"
os.environ["TABLE_NAME"] = TABLE_NAME

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'lambda')))

from moto import mock_aws

@pytest.fixture(scope="function")
def lambda_module_and_table(monkeypatch):
    """
    1. Set up the Moto DynamoDB mock.
    2. Create a fake DynamoDB table with the same name as TABLE_NAME.
    3. After creating the table, import or reload lambda_function so that
       its module‐level `table = dynamodb.Table(TABLE_NAME)` is bound to
       this mocked table rather than the real AWS one.
    4. Yield the imported module and the moto‐backed table object.
    """
    # ensure TABLE_NAME is in the environment
    monkeypatch.setenv("TABLE_NAME", TABLE_NAME)

    with mock_aws():
        # create the mocked table in the moto context
        dynamodb = boto3.resource("dynamodb", region_name="us-east-1")
        table = dynamodb.create_table(
            TableName=TABLE_NAME,
            KeySchema=[{"AttributeName": "id", "KeyType": "HASH"}],
            AttributeDefinitions=[{"AttributeName": "id", "AttributeType": "S"}],
            BillingMode="PAY_PER_REQUEST"
        )
        table.wait_until_exists()

        # import (or reload) the lambda_function module so that its top-level `dynamodb.Table(TABLE_NAME)` refers to this mock.
        if "lambda_function" in sys.modules:
            importlib.reload(sys.modules["lambda_function"])
        else:
            import lambda_function

        yield sys.modules["lambda_function"], table
        # after the yield, exiting the with-block tears down the mocked table


def test_initial_counter_creates_item(lambda_module_and_table):
    """
    If no item exists yet (id="counter"), lambda_handler should create it with count=1.
    """
    lambda_module, table = lambda_module_and_table

    # the table starts empty
    items = table.scan().get("Items", [])
    assert items == []

    # call the handler (no special event needed)
    response = lambda_module.lambda_handler({}, {})
    assert response["statusCode"] == 200

    body = json.loads(response["body"])
    # first invocation should set counter = 1
    assert body["count"] == 1

    # verify the item was written in the mock DynamoDB
    result = table.get_item(Key={"id": "counter"})
    assert "Item" in result
    assert result["Item"]["count"] == 1


def test_increment_existing_counter(lambda_module_and_table):
    """
    If an item with id="counter" already exists with count=5,
    calling lambda_handler should increment to 6.
    """
    lambda_module, table = lambda_module_and_table

    # preload the mocked table with count=5
    table.put_item(Item={"id": "counter", "count": 5})

    # invoke the handler
    response = lambda_module.lambda_handler({}, {})
    assert response["statusCode"] == 200

    body = json.loads(response["body"])
    # expect count to go from 5 → 6
    assert body["count"] == 6

    # confirm the mock DynamoDB has been updated
    result = table.get_item(Key={"id": "counter"})
    assert result["Item"]["count"] == 6


def test_missing_table_env_var(monkeypatch):
    """
    If TABLE_NAME is missing entirely, importing lambda_function or calling
    lambda_handler should raise a KeyError.
    """
    # remove TABLE_NAME from the environment
    monkeypatch.delenv("TABLE_NAME", raising=False)

    # if the module was already imported, remove it so that import will re‐execute
    if "lambda_function" in sys.modules:
        del sys.modules["lambda_function"]

    # now importing should trigger KeyError at the top level (TABLE = os.environ["TABLE_NAME"])
    with pytest.raises(KeyError):
        import lambda_function

    # in case import succeeded (unlikely), also check calling the handler fails
    if "lambda_function" in sys.modules:
        with pytest.raises(KeyError):
            sys.modules["lambda_function"].lambda_handler({}, {})
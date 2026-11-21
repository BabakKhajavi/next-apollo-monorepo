# Table/GSI shape mirrors apps/api/scripts/create-tables.mjs (DynamoDB
# Local, dev only) exactly, so application code behaves identically
# against either.

resource "aws_dynamodb_table" "workflows" {
  name         = "${var.project_name}-workflows"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }
}

resource "aws_dynamodb_table" "executions" {
  name         = "${var.project_name}-executions"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "workflowId"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }

  attribute {
    name = "activityType"
    type = "S"
  }

  global_secondary_index {
    name            = "byWorkflowId"
    hash_key        = "workflowId"
    range_key       = "createdAt"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "byStatus"
    hash_key        = "status"
    range_key       = "createdAt"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "byRecent"
    hash_key        = "activityType"
    range_key       = "createdAt"
    projection_type = "ALL"
  }
}

# One role per Lambda, least-privilege: each gets only the DynamoDB table(s)
# and SQS queue(s) it actually touches. AppSync Events publish uses the
# HTTP API + API key (see appsync-events.tf), not IAM, so no permission is
# needed for that here.

data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

# --- api ---------------------------------------------------------------

resource "aws_iam_role" "api_lambda" {
  name               = "${var.project_name}-api-lambda"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_role_policy_attachment" "api_lambda_logs" {
  role       = aws_iam_role.api_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "api_lambda_inline" {
  statement {
    sid = "DynamoDbReadWrite"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:Query",
      "dynamodb:Scan",
    ]
    resources = [
      aws_dynamodb_table.workflows.arn,
      aws_dynamodb_table.executions.arn,
      "${aws_dynamodb_table.executions.arn}/index/*",
    ]
  }

  statement {
    sid       = "EnqueueWorkerRequests"
    actions   = ["sqs:SendMessage"]
    resources = [aws_sqs_queue.workflow_generation.arn, aws_sqs_queue.workflow_execution.arn]
  }
}

resource "aws_iam_role_policy" "api_lambda_inline" {
  name   = "${var.project_name}-api-lambda"
  role   = aws_iam_role.api_lambda.id
  policy = data.aws_iam_policy_document.api_lambda_inline.json
}

# --- ai-worker -----------------------------------------------------------

resource "aws_iam_role" "ai_worker_lambda" {
  name               = "${var.project_name}-ai-worker-lambda"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_role_policy_attachment" "ai_worker_lambda_logs" {
  role       = aws_iam_role.ai_worker_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "ai_worker_lambda_inline" {
  statement {
    sid       = "UpdateWorkflowResult"
    actions   = ["dynamodb:UpdateItem"]
    resources = [aws_dynamodb_table.workflows.arn]
  }

  statement {
    sid = "ConsumeWorkflowGenerationQueue"
    actions = [
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:GetQueueAttributes",
    ]
    resources = [aws_sqs_queue.workflow_generation.arn]
  }
}

resource "aws_iam_role_policy" "ai_worker_lambda_inline" {
  name   = "${var.project_name}-ai-worker-lambda"
  role   = aws_iam_role.ai_worker_lambda.id
  policy = data.aws_iam_policy_document.ai_worker_lambda_inline.json
}

# --- execution-worker ----------------------------------------------------

resource "aws_iam_role" "execution_worker_lambda" {
  name               = "${var.project_name}-execution-worker-lambda"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_role_policy_attachment" "execution_worker_lambda_logs" {
  role       = aws_iam_role.execution_worker_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "execution_worker_lambda_inline" {
  statement {
    sid       = "UpdateExecutionStatus"
    actions   = ["dynamodb:UpdateItem"]
    resources = [aws_dynamodb_table.executions.arn]
  }

  statement {
    sid = "ConsumeWorkflowExecutionQueue"
    actions = [
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:GetQueueAttributes",
    ]
    resources = [aws_sqs_queue.workflow_execution.arn]
  }
}

resource "aws_iam_role_policy" "execution_worker_lambda_inline" {
  name   = "${var.project_name}-execution-worker-lambda"
  role   = aws_iam_role.execution_worker_lambda.id
  policy = data.aws_iam_policy_document.execution_worker_lambda_inline.json
}

# ai-worker/execution-worker are single esbuild-bundled files (no NestJS,
# no implicit decorator-based DI, so esbuild's lack of design:paramtypes
# emission doesn't matter for them). api can't use esbuild: NestJS's
# GraphQL schema builder and constructor DI both rely on
# emitDecoratorMetadata's design:paramtypes, which esbuild never emits
# (confirmed empirically — tsc/`nest build` emits it correctly, esbuild
# doesn't, for the exact same decorated class). So api is packaged via
# `nest build` (real tsc output) + `pnpm deploy --prod` (real, non-
# symlinked node_modules, workspace packages injected) instead, zipped as
# a directory. Run `pnpm nx run-many -t bundle -p api ai-worker
# execution-worker` before `terraform apply`.

data "archive_file" "api" {
  type        = "zip"
  source_dir  = "${path.module}/../../apps/api/dist-lambda-pkg"
  output_path = "${path.module}/.terraform-build/api.zip"
}

data "archive_file" "ai_worker" {
  type        = "zip"
  source_file = "${path.module}/../../apps/ai-worker/dist-lambda/handler.js"
  output_path = "${path.module}/.terraform-build/ai-worker.zip"
}

data "archive_file" "execution_worker" {
  type        = "zip"
  source_file = "${path.module}/../../apps/execution-worker/dist-lambda/handler.js"
  output_path = "${path.module}/.terraform-build/execution-worker.zip"
}

# --- api: GraphQL, fronted by API Gateway (apigateway.tf) ----------------

resource "aws_lambda_function" "api" {
  function_name    = "${var.project_name}-api"
  filename         = data.archive_file.api.output_path
  source_code_hash = data.archive_file.api.output_base64sha256
  handler          = "dist/handler.handler"
  runtime          = "nodejs22.x"
  role             = aws_iam_role.api_lambda.arn
  timeout          = 29 # API Gateway's own HTTP API integration timeout caps at 30s
  memory_size      = 512

  environment {
    variables = {
      WORKFLOWS_TABLE_NAME        = aws_dynamodb_table.workflows.name
      EXECUTIONS_TABLE_NAME       = aws_dynamodb_table.executions.name
      WORKFLOW_GENERATION_QUEUE_URL = aws_sqs_queue.workflow_generation.url
      WORKFLOW_EXECUTION_QUEUE_URL   = aws_sqs_queue.workflow_execution.url
    }
  }

  # Code is deployed by deploy-api.yml (aws lambda update-function-code),
  # not by `terraform apply` — Terraform only owns the function's shape
  # (IAM, env vars, timeout/memory), not its deployed code, so the two
  # pipelines don't fight over source_code_hash.
  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }
}

resource "aws_cloudwatch_log_group" "api" {
  name              = "/aws/lambda/${aws_lambda_function.api.function_name}"
  retention_in_days = 14
}

# --- ai-worker: SQS-triggered, no local runner (see COMMANDS.md Phase 3) -

resource "aws_lambda_function" "ai_worker" {
  function_name    = "${var.project_name}-ai-worker"
  filename         = data.archive_file.ai_worker.output_path
  source_code_hash = data.archive_file.ai_worker.output_base64sha256
  handler          = "handler.handler"
  runtime          = "nodejs22.x"
  role             = aws_iam_role.ai_worker_lambda.arn
  timeout          = 50 # must stay under the queue's 60s visibility timeout
  memory_size      = 512

  environment {
    variables = {
      WORKFLOWS_TABLE_NAME                 = aws_dynamodb_table.workflows.name
      OPENAI_API_KEY                       = var.openai_api_key
      APPSYNC_EVENTS_HTTP_ENDPOINT          = "https://${aws_appsync_api.workflow_events.dns["HTTP"]}"
      APPSYNC_EVENTS_API_KEY               = aws_appsync_api_key.workflow_events_key.key
      WORKFLOW_UPDATES_CHANNEL_NAMESPACE   = aws_appsync_channel_namespace.workflow_updates.name
    }
  }

  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }
}

resource "aws_cloudwatch_log_group" "ai_worker" {
  name              = "/aws/lambda/${aws_lambda_function.ai_worker.function_name}"
  retention_in_days = 14
}

resource "aws_lambda_event_source_mapping" "ai_worker" {
  event_source_arn = aws_sqs_queue.workflow_generation.arn
  function_name    = aws_lambda_function.ai_worker.arn
  batch_size       = 1
}

# --- execution-worker: SQS-triggered, same shape as ai-worker ------------

resource "aws_lambda_function" "execution_worker" {
  function_name    = "${var.project_name}-execution-worker"
  filename         = data.archive_file.execution_worker.output_path
  source_code_hash = data.archive_file.execution_worker.output_base64sha256
  handler          = "handler.handler"
  runtime          = "nodejs22.x"
  role             = aws_iam_role.execution_worker_lambda.arn
  timeout          = 50 # must stay under the queue's 60s visibility timeout
  memory_size      = 256

  environment {
    variables = {
      EXECUTIONS_TABLE_NAME                = aws_dynamodb_table.executions.name
      APPSYNC_EVENTS_HTTP_ENDPOINT          = "https://${aws_appsync_api.workflow_events.dns["HTTP"]}"
      APPSYNC_EVENTS_API_KEY               = aws_appsync_api_key.workflow_events_key.key
      EXECUTION_UPDATES_CHANNEL_NAMESPACE  = aws_appsync_channel_namespace.execution_updates.name
    }
  }

  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }
}

resource "aws_cloudwatch_log_group" "execution_worker" {
  name              = "/aws/lambda/${aws_lambda_function.execution_worker.function_name}"
  retention_in_days = 14
}

resource "aws_lambda_event_source_mapping" "execution_worker" {
  event_source_arn = aws_sqs_queue.workflow_execution.arn
  function_name    = aws_lambda_function.execution_worker.arn
  batch_size       = 1
}

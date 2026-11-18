# Workflow-generation requests land here from the generateWorkflow mutation
# and are picked up by apps/ai-worker (deploy-and-test Lambda, no local
# runner — see COMMANDS.md Phase 3).

resource "aws_sqs_queue" "workflow_generation_dlq" {
  name = "${var.project_name}-workflow-generation-dlq"
}

resource "aws_sqs_queue" "workflow_generation" {
  name                       = "${var.project_name}-workflow-generation"
  visibility_timeout_seconds = 60 # must exceed the AI worker's expected processing time

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.workflow_generation_dlq.arn
    maxReceiveCount     = 3
  })
}

# Execution requests land here from the executeWorkflow mutation and are
# picked up by apps/execution-worker.

resource "aws_sqs_queue" "workflow_execution_dlq" {
  name = "${var.project_name}-workflow-execution-dlq"
}

resource "aws_sqs_queue" "workflow_execution" {
  name                       = "${var.project_name}-workflow-execution"
  visibility_timeout_seconds = 60 # must exceed the execution worker's expected processing time

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.workflow_execution_dlq.arn
    maxReceiveCount     = 3
  })
}

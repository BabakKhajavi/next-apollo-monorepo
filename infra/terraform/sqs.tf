# Workflow-generation requests land here from the generateWorkflow mutation
# and are picked up by the AI worker (Lambda in prod, a polling Node
# process locally — see apps/ai-worker).

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

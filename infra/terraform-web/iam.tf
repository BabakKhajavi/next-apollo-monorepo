data "aws_iam_policy_document" "ecs_task_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

# Execution role: pulls the image from ECR, ships logs to CloudWatch.
resource "aws_iam_role" "web_task_execution" {
  name               = "${var.project_name}-web-task-execution"
  assume_role_policy = data.aws_iam_policy_document.ecs_task_assume_role.json
}

resource "aws_iam_role_policy_attachment" "web_task_execution" {
  role       = aws_iam_role.web_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Task role: what the running Next.js server itself can call. It only
# talks to the public GraphQL API/AppSync endpoints over HTTPS, not any
# AWS API directly — no permissions needed beyond the default (empty).
resource "aws_iam_role" "web_task" {
  name               = "${var.project_name}-web-task"
  assume_role_policy = data.aws_iam_policy_document.ecs_task_assume_role.json
}

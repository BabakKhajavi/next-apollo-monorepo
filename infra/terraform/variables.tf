variable "aws_region" {
  description = "AWS region for Phase 3 resources."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Prefix applied to resource names."
  type        = string
  default     = "ai-workflow-automation"
}

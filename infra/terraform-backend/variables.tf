variable "aws_region" {
  description = "AWS region for all resources."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Prefix applied to every resource name, so they're identifiable at a glance in the AWS console/billing."
  type        = string
  default     = "nam"
}

variable "openai_api_key" {
  description = "Passed to ai-worker as OPENAI_API_KEY. Set via TF_VAR_openai_api_key or a *.auto.tfvars file (gitignored) — never commit it."
  type        = string
  sensitive   = true
}

variable "web_origin" {
  description = "CloudFront domain the web app is served from (infra/terraform-web's output) — allowed as a CORS origin on the API Gateway HTTP API. Separate Terraform root/state, so this can't be read directly; pass it via TF_VAR_web_origin."
  type        = string
}

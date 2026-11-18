variable "aws_region" {
  description = "AWS region for all resources."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Prefix applied to every resource name."
  type        = string
  default     = "nam"
}

variable "container_port" {
  description = "Port the Next.js standalone server listens on inside the container."
  type        = number
  default     = 3000
}

variable "task_cpu" {
  description = "Fargate task vCPU units (256 = 0.25 vCPU)."
  type        = number
  default     = 512
}

variable "task_memory" {
  description = "Fargate task memory, MB."
  type        = number
  default     = 1024
}

variable "min_capacity" {
  description = "Minimum running ECS tasks — kept >=1 so there's always a warm server (no scale-out cold start)."
  type        = number
  default     = 1
}

variable "max_capacity" {
  description = "Maximum running ECS tasks under CPU-based autoscaling."
  type        = number
  default     = 3
}

variable "image_tag" {
  description = "Docker image tag to deploy. Set via -var on terraform apply from CI, defaults to a placeholder so `terraform plan` works before the first image is pushed."
  type        = string
  default     = "placeholder"
}

# Runtime (server-only, not NEXT_PUBLIC_*) env vars for the container —
# values come from the same repo vars deploy-web.yml already reads.
variable "graphql_uri" {
  description = "Server-side GraphQL endpoint, read at request time by RSC."
  type        = string
}

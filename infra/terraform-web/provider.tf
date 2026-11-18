# Separate root module/state from infra/terraform (backend) — the web
# app's hosting infra (ECS/ALB/CloudFront/S3) changes independently of
# Lambda/DynamoDB/SQS/AppSync, so it gets its own state file in the same
# state bucket rather than sharing one root module across two apps.

terraform {
  required_version = ">= 1.7"

  backend "s3" {
    bucket       = "nam-terraform-state-314146325814"
    key          = "web/terraform.tfstate"
    region       = "us-east-1"
    encrypt      = true
    use_lockfile = true
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

data "aws_caller_identity" "current" {}

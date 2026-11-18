terraform {
  required_version = ">= 1.7"

  backend "s3" {
    bucket       = "nam-terraform-state-314146325814"
    key          = "api/terraform.tfstate"
    region       = "us-east-1"
    encrypt      = true
    use_lockfile = true # native S3 locking (Terraform 1.10+) — no DynamoDB lock table needed
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0" # aws_appsync_api / aws_appsync_channel_namespace (AppSync Events) need v6+
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

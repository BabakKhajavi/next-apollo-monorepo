# GitHub Actions OIDC — no static AWS keys in CI. One IAM OIDC provider
# per AWS account already exists (reused across repos); this just adds
# roles scoped to this repo.
#
# Two roles, not one: a PR's `plan` runs with read-only access (a PR from
# a fork could otherwise get write credentials just by opening a PR); only
# a push to `main` can assume the role with real write permissions.

data "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"
}

locals {
  # GitHub's OIDC `sub` claim embeds stable numeric owner/repo IDs, not just
  # names (repo:OWNER@OWNER_ID/REPO@REPO_ID:...) — confirmed by printing the
  # actual token claims in a debug step; the name-only format never matches.
  github_repo = "BabakKhajavi@67204317/next-apollo-monorepo@1449882754"
}

# --- terraform plan (any PR against this repo) ---------------------------

data "aws_iam_policy_document" "github_plan_assume_role" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [data.aws_iam_openid_connect_provider.github.arn]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${local.github_repo}:pull_request"]
    }
  }
}

resource "aws_iam_role" "github_terraform_plan" {
  name               = "github-terraform-plan"
  assume_role_policy = data.aws_iam_policy_document.github_plan_assume_role.json
}

resource "aws_iam_role_policy_attachment" "github_terraform_plan_readonly" {
  role       = aws_iam_role.github_terraform_plan.name
  policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
}

# --- terraform apply (push to main only) ----------------------------------

data "aws_iam_policy_document" "github_apply_assume_role" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [data.aws_iam_openid_connect_provider.github.arn]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${local.github_repo}:ref:refs/heads/main"]
    }
  }
}

resource "aws_iam_role" "github_terraform_apply" {
  name               = "github-terraform-apply"
  assume_role_policy = data.aws_iam_policy_document.github_apply_assume_role.json
}

# Mirrors exactly what's attached to zaplite-main-developer today — this
# role needs to create/update the same resource types a human applying
# from the terminal does.
resource "aws_iam_role_policy_attachment" "github_terraform_apply_iam" {
  role       = aws_iam_role.github_terraform_apply.name
  policy_arn = "arn:aws:iam::aws:policy/IAMFullAccess"
}

resource "aws_iam_role_policy_attachment" "github_terraform_apply_apigateway" {
  role       = aws_iam_role.github_terraform_apply.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonAPIGatewayAdministrator"
}

resource "aws_iam_role_policy_attachment" "github_terraform_apply_appsync" {
  role       = aws_iam_role.github_terraform_apply.name
  policy_arn = "arn:aws:iam::aws:policy/AWSAppSyncAdministrator"
}

resource "aws_iam_role_policy_attachment" "github_terraform_apply_logs" {
  role       = aws_iam_role.github_terraform_apply.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess"
}

resource "aws_iam_role_policy_attachment" "github_terraform_apply_lambda" {
  role       = aws_iam_role.github_terraform_apply.name
  policy_arn = "arn:aws:iam::aws:policy/AWSLambda_FullAccess"
}

resource "aws_iam_role_policy_attachment" "github_terraform_apply_dynamodb" {
  role       = aws_iam_role.github_terraform_apply.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
}

resource "aws_iam_role_policy_attachment" "github_terraform_apply_sqs" {
  role       = aws_iam_role.github_terraform_apply.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSQSFullAccess"
}

# State bucket read/write — not covered by the service policies above.
data "aws_iam_policy_document" "github_terraform_apply_state" {
  statement {
    actions = ["s3:GetObject", "s3:PutObject", "s3:ListBucket"]
    resources = [
      aws_s3_bucket.terraform_state.arn,
      "${aws_s3_bucket.terraform_state.arn}/*",
    ]
  }
}

resource "aws_iam_role_policy" "github_terraform_apply_state" {
  name   = "terraform-state-access"
  role   = aws_iam_role.github_terraform_apply.id
  policy = data.aws_iam_policy_document.github_terraform_apply_state.json
}

output "github_terraform_plan_role_arn" {
  value = aws_iam_role.github_terraform_plan.arn
}

output "github_terraform_apply_role_arn" {
  value = aws_iam_role.github_terraform_apply.arn
}

# --- lambda code deploy (push to main OR staging — deploy-backend.yml
# runs from both) — narrower than the infra apply role: only touches the 3
# Lambda functions' code, nothing else.

data "aws_iam_policy_document" "github_lambda_deploy_assume_role" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [data.aws_iam_openid_connect_provider.github.arn]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values = [
        "repo:${local.github_repo}:ref:refs/heads/main",
        "repo:${local.github_repo}:ref:refs/heads/staging",
      ]
    }
  }
}

resource "aws_iam_role" "github_lambda_deploy" {
  name               = "github-lambda-deploy"
  assume_role_policy = data.aws_iam_policy_document.github_lambda_deploy_assume_role.json
}

data "aws_iam_policy_document" "github_lambda_deploy" {
  statement {
    actions = ["lambda:UpdateFunctionCode", "lambda:GetFunction"]
    resources = [
      "arn:aws:lambda:us-east-1:${var.account_id}:function:nam-api",
      "arn:aws:lambda:us-east-1:${var.account_id}:function:nam-ai-worker",
      "arn:aws:lambda:us-east-1:${var.account_id}:function:nam-execution-worker",
    ]
  }

  # api only: publish a numbered version after each code update, then
  # repoint the `live` alias (Provisioned Concurrency sits on that alias,
  # not on $LATEST — see infra/terraform-backend/lambda.tf).
  statement {
    actions = ["lambda:PublishVersion", "lambda:UpdateAlias", "lambda:GetAlias"]
    resources = [
      "arn:aws:lambda:us-east-1:${var.account_id}:function:nam-api",
      "arn:aws:lambda:us-east-1:${var.account_id}:function:nam-api:*",
    ]
  }
}

resource "aws_iam_role_policy" "github_lambda_deploy" {
  name   = "lambda-update-code"
  role   = aws_iam_role.github_lambda_deploy.id
  policy = data.aws_iam_policy_document.github_lambda_deploy.json
}

output "github_lambda_deploy_role_arn" {
  value = aws_iam_role.github_lambda_deploy.arn
}

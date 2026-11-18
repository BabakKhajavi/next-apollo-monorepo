# Web app's infra (ECS/ALB/CloudFront/S3, infra/terraform-web/) gets its
# own roles, mirroring oidc-backend.tf's shape — separate state, separate
# folder, separate roles, so a change to one app's deploy permissions
# never touches the other's.

# --- terraform plan (any PR against infra/terraform-web/) ----------------

resource "aws_iam_role" "github_terraform_web_plan" {
  name               = "github-terraform-web-plan"
  assume_role_policy = data.aws_iam_policy_document.github_plan_assume_role.json
}

resource "aws_iam_role_policy_attachment" "github_terraform_web_plan_readonly" {
  role       = aws_iam_role.github_terraform_web_plan.name
  policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
}

# --- terraform apply (push to main only) ----------------------------------

resource "aws_iam_role" "github_terraform_web_apply" {
  name               = "github-terraform-web-apply"
  assume_role_policy = data.aws_iam_policy_document.github_apply_assume_role.json
}

resource "aws_iam_role_policy_attachment" "github_terraform_web_apply_iam" {
  role       = aws_iam_role.github_terraform_web_apply.name
  policy_arn = "arn:aws:iam::aws:policy/IAMFullAccess"
}

resource "aws_iam_role_policy_attachment" "github_terraform_web_apply_vpc" {
  role       = aws_iam_role.github_terraform_web_apply.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonVPCFullAccess"
}

resource "aws_iam_role_policy_attachment" "github_terraform_web_apply_elb" {
  role       = aws_iam_role.github_terraform_web_apply.name
  policy_arn = "arn:aws:iam::aws:policy/ElasticLoadBalancingFullAccess"
}

resource "aws_iam_role_policy_attachment" "github_terraform_web_apply_ecs" {
  role       = aws_iam_role.github_terraform_web_apply.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonECS_FullAccess"
}

resource "aws_iam_role_policy_attachment" "github_terraform_web_apply_ecr" {
  role       = aws_iam_role.github_terraform_web_apply.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryFullAccess"
}

resource "aws_iam_role_policy_attachment" "github_terraform_web_apply_cloudfront" {
  role       = aws_iam_role.github_terraform_web_apply.name
  policy_arn = "arn:aws:iam::aws:policy/CloudFrontFullAccess"
}

resource "aws_iam_role_policy_attachment" "github_terraform_web_apply_s3" {
  role       = aws_iam_role.github_terraform_web_apply.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
}

resource "aws_iam_role_policy_attachment" "github_terraform_web_apply_logs" {
  role       = aws_iam_role.github_terraform_web_apply.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess"
}

# vpc.tf reads the CloudFront managed prefix list (to scope the ALB
# security group to CloudFront's IP ranges) — AmazonVPCFullAccess doesn't
# cover prefix-list actions, so this is granted separately, same gap hit
# locally by zaplite-main-developer.
data "aws_iam_policy_document" "github_terraform_web_apply_prefix_list" {
  statement {
    actions   = ["ec2:DescribeManagedPrefixLists", "ec2:GetManagedPrefixListEntries"]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "github_terraform_web_apply_prefix_list" {
  name   = "read-cloudfront-prefix-list"
  role   = aws_iam_role.github_terraform_web_apply.id
  policy = data.aws_iam_policy_document.github_terraform_web_apply_prefix_list.json
}

# ecs.tf's aws_appautoscaling_target/policy — none of the managed policies
# above cover the Application Auto Scaling service at all (ECS itself
# doesn't need it), same gap hit locally by zaplite-main-developer.
data "aws_iam_policy_document" "github_terraform_web_apply_autoscaling" {
  statement {
    actions   = ["application-autoscaling:*"]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "github_terraform_web_apply_autoscaling" {
  name   = "ecs-autoscaling"
  role   = aws_iam_role.github_terraform_web_apply.id
  policy = data.aws_iam_policy_document.github_terraform_web_apply_autoscaling.json
}

# State bucket read/write for the web/terraform.tfstate key — not covered
# by the service policies above.
data "aws_iam_policy_document" "github_terraform_web_apply_state" {
  statement {
    actions = ["s3:GetObject", "s3:PutObject", "s3:ListBucket"]
    resources = [
      aws_s3_bucket.terraform_state.arn,
      "${aws_s3_bucket.terraform_state.arn}/*",
    ]
  }
}

resource "aws_iam_role_policy" "github_terraform_web_apply_state" {
  name   = "terraform-state-access"
  role   = aws_iam_role.github_terraform_web_apply.id
  policy = data.aws_iam_policy_document.github_terraform_web_apply_state.json
}

output "github_terraform_web_plan_role_arn" {
  value = aws_iam_role.github_terraform_web_plan.arn
}

output "github_terraform_web_apply_role_arn" {
  value = aws_iam_role.github_terraform_web_apply.arn
}

# --- web app code deploy (push to main OR staging — deploy-web.yml runs
# from both) — narrower than the infra-apply role above: only pushes a
# container image, updates the one ECS service, and syncs static assets.

data "aws_iam_policy_document" "github_web_deploy_assume_role" {
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

resource "aws_iam_role" "github_web_deploy" {
  name               = "github-web-deploy"
  assume_role_policy = data.aws_iam_policy_document.github_web_deploy_assume_role.json
}

data "aws_iam_policy_document" "github_web_deploy" {
  statement {
    sid       = "EcrAuth"
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"] # this action doesn't support resource-level scoping
  }

  statement {
    sid = "EcrPush"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:BatchGetImage", # buildx HEADs the manifest to check if that digest already exists before pushing
      "ecr:GetDownloadUrlForLayer",
      "ecr:InitiateLayerUpload",
      "ecr:UploadLayerPart",
      "ecr:CompleteLayerUpload",
      "ecr:PutImage",
    ]
    resources = ["arn:aws:ecr:us-east-1:${var.account_id}:repository/nam-web"]
  }

  statement {
    sid = "EcsDeploy"
    actions = [
      "ecs:RegisterTaskDefinition",
      "ecs:DescribeTaskDefinition",
      "ecs:UpdateService",
      "ecs:DescribeServices",
    ]
    resources = ["*"] # RegisterTaskDefinition requires "*"; the rest are scoped by the cluster/service names in deploy-web.yml
  }

  statement {
    sid     = "PassTaskRoles"
    actions = ["iam:PassRole"]
    resources = [
      "arn:aws:iam::${var.account_id}:role/nam-web-task-execution",
      "arn:aws:iam::${var.account_id}:role/nam-web-task",
    ]
  }

  statement {
    sid     = "StaticAssetSync"
    actions = ["s3:PutObject", "s3:DeleteObject", "s3:ListBucket"]
    resources = [
      "arn:aws:s3:::nam-web-static-${var.account_id}",
      "arn:aws:s3:::nam-web-static-${var.account_id}/*",
    ]
  }

  statement {
    sid       = "CloudFrontInvalidate"
    actions   = ["cloudfront:CreateInvalidation"]
    resources = ["*"] # distribution ID isn't known until first apply; narrow once it's stable
  }
}

resource "aws_iam_role_policy" "github_web_deploy" {
  name   = "web-deploy"
  role   = aws_iam_role.github_web_deploy.id
  policy = data.aws_iam_policy_document.github_web_deploy.json
}

output "github_web_deploy_role_arn" {
  value = aws_iam_role.github_web_deploy.arn
}

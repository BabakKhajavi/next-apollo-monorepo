resource "aws_s3_bucket" "web_static" {
  bucket = "${var.project_name}-web-static-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_public_access_block" "web_static" {
  bucket                  = aws_s3_bucket.web_static.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudFront reaches this bucket via Origin Access Control (not legacy
# OAI) — see cloudfront.tf for the distribution + OAC resource.
data "aws_iam_policy_document" "web_static" {
  statement {
    sid       = "AllowCloudFrontOAC"
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.web_static.arn}/*"]
    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.web.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "web_static" {
  bucket = aws_s3_bucket.web_static.id
  policy = data.aws_iam_policy_document.web_static.json
}

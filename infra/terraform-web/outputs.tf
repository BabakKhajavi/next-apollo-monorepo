output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.web.domain_name
}

output "ecr_repository_url" {
  value = aws_ecr_repository.web.repository_url
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.web.name
}

output "ecs_service_name" {
  value = aws_ecs_service.web.name
}

output "web_static_bucket_name" {
  value = aws_s3_bucket.web_static.bucket
}

output "workflow_generation_queue_url" {
  value = aws_sqs_queue.workflow_generation.url
}

output "workflow_generation_queue_arn" {
  value = aws_sqs_queue.workflow_generation.arn
}

output "appsync_events_http_endpoint" {
  value = "https://${aws_appsync_api.workflow_events.dns["HTTP"]}"
}

output "appsync_events_realtime_endpoint" {
  value = "wss://${aws_appsync_api.workflow_events.dns["REALTIME"]}"
}

output "appsync_events_api_key" {
  value     = aws_appsync_api_key.workflow_events_key.key
  sensitive = true
}

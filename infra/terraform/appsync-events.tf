# Real-time push of workflow-generation results to subscribed clients.
# API_KEY auth keeps this simple for the demo; swap for IAM/Cognito for
# production multi-tenant auth.

resource "aws_appsync_api" "workflow_events" {
  name = "${var.project_name}-workflow-events"

  event_config {
    auth_providers {
      auth_type = "API_KEY"
    }

    connection_auth_modes {
      auth_type = "API_KEY"
    }

    default_publish_auth_modes {
      auth_type = "API_KEY"
    }

    default_subscribe_auth_modes {
      auth_type = "API_KEY"
    }
  }
}

resource "aws_appsync_channel_namespace" "workflow_updates" {
  api_id = aws_appsync_api.workflow_events.api_id
  name   = "workflow-updates"
}

resource "aws_appsync_api_key" "workflow_events_key" {
  api_id  = aws_appsync_api.workflow_events.api_id
  expires = timeadd(timestamp(), "8760h") # 1 year; rotate before production use
}

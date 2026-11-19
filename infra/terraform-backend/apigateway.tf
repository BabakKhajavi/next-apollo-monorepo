# HTTP API (v2) — apps/api/src/handler.ts is built against
# APIGatewayProxyEventV2 (@as-integrations/aws-lambda's v2 request
# handler), so this must be an HTTP API, not a REST API (v1).

resource "aws_apigatewayv2_api" "api" {
  name          = "${var.project_name}-api"
  protocol_type = "HTTP"

  # Client-side mutations (e.g. GenerateWorkflowForm) call this origin
  # directly from the browser — server-side RSC queries don't need this
  # (same-process, no browser involved) but client components do.
  cors_configuration {
    allow_origins = ["https://${var.web_origin}"]
    allow_methods = ["GET", "POST", "OPTIONS"]
    allow_headers = ["content-type", "authorization"]
    max_age       = 300
  }
}

# Points at the `live` alias (Provisioned Concurrency, see lambda.tf), not
# the bare function — traffic must hit the warmed alias, not $LATEST.
resource "aws_apigatewayv2_integration" "api" {
  api_id                 = aws_apigatewayv2_api.api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_alias.api_live.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "api" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.api.id}"
}

resource "aws_apigatewayv2_stage" "api" {
  api_id      = aws_apigatewayv2_api.api.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_lambda_permission" "api_gateway_invoke" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  qualifier     = aws_lambda_alias.api_live.name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api.execution_arn}/*/*"
}

resource "aws_lb" "web" {
  name               = "${var.project_name}-web"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id
}

resource "aws_lb_target_group" "web" {
  name        = "${var.project_name}-web"
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = aws_vpc.web.id
  target_type = "ip"

  health_check {
    path                = "/"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 30
    timeout             = 5
  }
}

# HTTP only — CloudFront terminates TLS at the edge and talks to the ALB
# over the AWS backbone, not the public internet. Accepted simplification
# until a custom domain + ACM cert exist for end-to-end HTTPS.
resource "aws_lb_listener" "web" {
  load_balancer_arn = aws_lb.web.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web.arn
  }
}

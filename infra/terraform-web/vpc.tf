# Minimal VPC for the web app's ALB + Fargate task — public subnets only,
# no NAT Gateway. Fargate gets assign_public_ip = true and reaches
# ECR/CloudWatch over the public internet directly; a single low-traffic
# service doesn't justify ~$32/mo for a NAT Gateway.

data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_vpc" "web" {
  cidr_block           = "10.42.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = { Name = "${var.project_name}-web" }
}

resource "aws_internet_gateway" "web" {
  vpc_id = aws_vpc.web.id

  tags = { Name = "${var.project_name}-web" }
}

resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.web.id
  cidr_block              = "10.42.${count.index}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = { Name = "${var.project_name}-web-public-${count.index}" }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.web.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.web.id
  }

  tags = { Name = "${var.project_name}-web-public" }
}

resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# ALB only reachable through CloudFront, not directly from the internet.
data "aws_ec2_managed_prefix_list" "cloudfront" {
  name = "com.amazonaws.global.cloudfront.origin-facing"
}

resource "aws_security_group" "alb" {
  name        = "${var.project_name}-web-alb"
  description = "Allow HTTP from CloudFront only"
  vpc_id      = aws_vpc.web.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    prefix_list_ids = [data.aws_ec2_managed_prefix_list.cloudfront.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-web-alb" }
}

resource "aws_security_group" "task" {
  name        = "${var.project_name}-web-task"
  description = "Allow container port from the ALB only"
  vpc_id      = aws_vpc.web.id

  ingress {
    from_port       = var.container_port
    to_port         = var.container_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-web-task" }
}

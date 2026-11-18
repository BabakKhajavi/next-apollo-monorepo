# Two origins: S3 for static Next.js assets (long-cached), ALB for
# everything else (SSR/RSC — dynamic, never cached).

resource "aws_cloudfront_origin_access_control" "web_static" {
  name                              = "${var.project_name}-web-static"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "web" {
  enabled = true

  origin {
    origin_id                = "s3-static"
    domain_name              = aws_s3_bucket.web_static.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.web_static.id
  }

  origin {
    origin_id   = "alb"
    domain_name = aws_lb.web.dns_name

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only" # ALB has no cert yet — see alb.tf
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    target_origin_id       = "alb"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods         = ["GET", "HEAD"]

    # SSR/RSC responses are dynamic — don't cache, but do forward what
    # Next needs to vary on (query strings incl. the RSC `_rsc` param,
    # cookies, and the headers Next's App Router router uses).
    forwarded_values {
      query_string = true
      cookies {
        forward = "all"
      }
      headers = ["RSC", "Next-Router-State-Tree", "Next-Router-Prefetch", "Next-Url"]
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  ordered_cache_behavior {
    path_pattern           = "/_next/static/*"
    target_origin_id       = "s3-static"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 31536000 # 1 year — filenames are content-hashed, safe to cache hard
    max_ttl     = 31536000
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

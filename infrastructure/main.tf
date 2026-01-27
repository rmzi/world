terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region  = "us-east-1"
  profile = "personal"
}

locals {
  domain_name = "rmzi.world"
  bucket_name = "rmzi.world"
}

# ============================================================================
# S3 Bucket for Static Website
# ============================================================================

resource "aws_s3_bucket" "website" {
  bucket = local.bucket_name
}

resource "aws_s3_bucket_public_access_block" "website" {
  bucket = aws_s3_bucket.website.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "website" {
  bucket = aws_s3_bucket.website.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowCloudFrontServicePrincipal"
        Effect    = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.website.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.website.arn
          }
        }
      }
    ]
  })
}

# ============================================================================
# ACM Certificate (must be in us-east-1 for CloudFront)
# ============================================================================

resource "aws_acm_certificate" "website" {
  domain_name               = local.domain_name
  subject_alternative_names = ["www.${local.domain_name}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

# ============================================================================
# Route53 - Get existing hosted zone
# ============================================================================

data "aws_route53_zone" "main" {
  name         = local.domain_name
  private_zone = false
}

# DNS validation records for ACM certificate
resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.website.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.main.zone_id
}

resource "aws_acm_certificate_validation" "website" {
  certificate_arn         = aws_acm_certificate.website.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

# ============================================================================
# CloudFront Distribution
# ============================================================================

resource "aws_cloudfront_origin_access_control" "website" {
  name                              = "${local.domain_name}-oac"
  description                       = "OAC for ${local.domain_name}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "website" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  aliases             = [local.domain_name, "www.${local.domain_name}"]
  price_class         = "PriceClass_100"

  origin {
    domain_name              = aws_s3_bucket.website.bucket_regional_domain_name
    origin_id                = "S3-${local.bucket_name}"
    origin_access_control_id = aws_cloudfront_origin_access_control.website.id
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${local.bucket_name}"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  # Handle SPA routing - serve index.html for 404s
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.website.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  depends_on = [aws_acm_certificate_validation.website]
}

# ============================================================================
# Route53 DNS Records pointing to CloudFront
# ============================================================================

resource "aws_route53_record" "apex" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = local.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.website.domain_name
    zone_id                = aws_cloudfront_distribution.website.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "www" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "www.${local.domain_name}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.website.domain_name
    zone_id                = aws_cloudfront_distribution.website.hosted_zone_id
    evaluate_target_health = false
  }
}

# ============================================================================
# SES Email Forwarding (hello@rmzi.world -> Gmail)
# ============================================================================

variable "forward_to_email" {
  description = "Gmail address to forward emails to"
  type        = string
  default     = "ramzi.abdoch@gmail.com"
}

# Verify domain with SES
resource "aws_ses_domain_identity" "main" {
  domain = local.domain_name
}

resource "aws_ses_domain_dkim" "main" {
  domain = aws_ses_domain_identity.main.domain
}

# Route53 records for SES
resource "aws_route53_record" "ses_verification" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "_amazonses.${local.domain_name}"
  type    = "TXT"
  ttl     = 600
  records = [aws_ses_domain_identity.main.verification_token]
}

resource "aws_route53_record" "ses_dkim" {
  count   = 3
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "${aws_ses_domain_dkim.main.dkim_tokens[count.index]}._domainkey.${local.domain_name}"
  type    = "CNAME"
  ttl     = 600
  records = ["${aws_ses_domain_dkim.main.dkim_tokens[count.index]}.dkim.amazonses.com"]
}

# MX record for receiving email
resource "aws_route53_record" "mx" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = local.domain_name
  type    = "MX"
  ttl     = 600
  records = ["10 inbound-smtp.us-east-1.amazonaws.com"]
}

# S3 bucket for storing incoming emails
resource "aws_s3_bucket" "ses_emails" {
  bucket = "${local.domain_name}-emails"
}

resource "aws_s3_bucket_policy" "ses_emails" {
  bucket = aws_s3_bucket.ses_emails.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowSESPuts"
        Effect    = "Allow"
        Principal = { Service = "ses.amazonaws.com" }
        Action    = "s3:PutObject"
        Resource  = "${aws_s3_bucket.ses_emails.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}

data "aws_caller_identity" "current" {}

# Lambda function for email forwarding
resource "aws_iam_role" "email_forwarder" {
  name = "ses-email-forwarder"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "email_forwarder" {
  name = "ses-email-forwarder-policy"
  role = aws_iam_role.email_forwarder.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect   = "Allow"
        Action   = ["s3:GetObject"]
        Resource = "${aws_s3_bucket.ses_emails.arn}/*"
      },
      {
        Effect   = "Allow"
        Action   = ["ses:SendRawEmail"]
        Resource = "*"
      }
    ]
  })
}

data "archive_file" "email_forwarder" {
  type        = "zip"
  output_path = "${path.module}/email_forwarder.zip"
  source {
    content  = <<-EOF
import boto3
import email
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication

def handler(event, context):
    s3 = boto3.client('s3')
    ses = boto3.client('ses', region_name='us-east-1')
    
    record = event['Records'][0]
    bucket = record['s3']['bucket']['name']
    key = record['s3']['object']['key']
    
    response = s3.get_object(Bucket=bucket, Key=key)
    raw_email = response['Body'].read()
    msg = email.message_from_bytes(raw_email)
    
    forward_to = os.environ['FORWARD_TO']
    from_addr = 'hello@${local.domain_name}'
    
    # Create forwarded message
    new_msg = MIMEMultipart()
    new_msg['Subject'] = f"[Fwd] {msg['Subject']}"
    new_msg['From'] = from_addr
    new_msg['To'] = forward_to
    new_msg['Reply-To'] = msg['From']
    
    body = f"--- Forwarded from {msg['From']} ---\n\n"
    
    if msg.is_multipart():
        for part in msg.walk():
            if part.get_content_type() == 'text/plain':
                body += part.get_payload(decode=True).decode('utf-8', errors='ignore')
    else:
        body += msg.get_payload(decode=True).decode('utf-8', errors='ignore')
    
    new_msg.attach(MIMEText(body, 'plain'))
    
    ses.send_raw_email(
        Source=from_addr,
        Destinations=[forward_to],
        RawMessage={'Data': new_msg.as_string()}
    )
    
    return {'statusCode': 200}
    EOF
    filename = "index.py"
  }
}

resource "aws_lambda_function" "email_forwarder" {
  filename         = data.archive_file.email_forwarder.output_path
  function_name    = "ses-email-forwarder"
  role             = aws_iam_role.email_forwarder.arn
  handler          = "index.handler"
  runtime          = "python3.11"
  timeout          = 30
  source_code_hash = data.archive_file.email_forwarder.output_base64sha256

  environment {
    variables = {
      FORWARD_TO = var.forward_to_email
    }
  }
}

resource "aws_lambda_permission" "allow_s3" {
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.email_forwarder.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.ses_emails.arn
}

resource "aws_s3_bucket_notification" "email_notification" {
  bucket = aws_s3_bucket.ses_emails.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.email_forwarder.arn
    events              = ["s3:ObjectCreated:*"]
  }

  depends_on = [aws_lambda_permission.allow_s3]
}

# SES Receipt Rule Set
resource "aws_ses_receipt_rule_set" "main" {
  rule_set_name = "rmzi-world-rules"
}

resource "aws_ses_active_receipt_rule_set" "main" {
  rule_set_name = aws_ses_receipt_rule_set.main.rule_set_name
}

resource "aws_ses_receipt_rule" "store" {
  name          = "store-and-forward"
  rule_set_name = aws_ses_receipt_rule_set.main.rule_set_name
  recipients    = ["hello@${local.domain_name}"]
  enabled       = true
  scan_enabled  = true

  s3_action {
    bucket_name = aws_s3_bucket.ses_emails.id
    position    = 1
  }
}

# ============================================================================
# Outputs
# ============================================================================

output "website_url" {
  value = "https://${local.domain_name}"
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.website.id
}

output "s3_bucket_name" {
  value = aws_s3_bucket.website.id
}

output "email_address" {
  value = "hello@${local.domain_name}"
}


variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name prefix for resources"
  type        = string
  default     = "vibebycory-chatbot"
}

variable "s3_bucket_name" {
  description = "S3 bucket name for knowledge base content"
  type        = string
  default     = "vibebycory-resume-content"
}

variable "kb_embed_model_id" {
  description = "Bedrock embedding model ID for knowledge base"
  type        = string
  default     = "amazon.titan-embed-text-v1"
}

variable "gen_model_id" {
  description = "Bedrock generation model ID for chat responses"
  type        = string
  default     = "anthropic.claude-3-haiku-20240307-v1:0"
}
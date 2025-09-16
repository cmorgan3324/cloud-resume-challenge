# VIBE Chatbot Makefile
.PHONY: help install deploy-infra sync-kb deploy-frontend clean

# Default target
help:
	@echo "VIBE Chatbot Management"
	@echo "======================"
	@echo ""
	@echo "Available commands:"
	@echo "  install        - Install all dependencies"
	@echo "  deploy-infra   - Deploy Terraform infrastructure"
	@echo "  sync-kb        - Sync knowledge base content to S3 and trigger ingestion"
	@echo "  deploy-frontend- Deploy frontend with chatbot integration"
	@echo "  clean          - Clean up temporary files"
	@echo ""
	@echo "Environment variables needed:"
	@echo "  AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY"
	@echo "  KB_ID, DATA_SOURCE_ID (after infrastructure deployment)"

# Install dependencies
install:
	@echo "Installing Lambda dependencies..."
	cd infra/chatbot/lambda && npm install
	@echo "Installing script dependencies..."
	cd scripts && npm install
	@echo "✅ Dependencies installed"

# Deploy infrastructure
deploy-infra:
	@echo "Deploying chatbot infrastructure..."
	cd infra/chatbot/lambda && npm ci --only=production
	cd infra/chatbot/lambda && zip -r ../terraform/chatbot-handler.zip . -x "*.git*" "*.DS_Store*"
	cd infra/chatbot/terraform && terraform init
	cd infra/chatbot/terraform && terraform plan -out=tfplan
	cd infra/chatbot/terraform && terraform apply -auto-approve tfplan
	@echo "✅ Infrastructure deployed"

# Sync knowledge base
sync-kb:
	@echo "Syncing knowledge base..."
	@if [ -z "$(KB_ID)" ]; then \
		echo "❌ KB_ID environment variable is required"; \
		exit 1; \
	fi
	cd scripts && node publish-kb.mjs
	@echo "✅ Knowledge base synced"

# Deploy frontend
deploy-frontend:
	@echo "Deploying frontend with chatbot..."
	@if [ -z "$(CHAT_API_URL)" ]; then \
		echo "❌ CHAT_API_URL environment variable is required"; \
		exit 1; \
	fi
	node scripts/inject-chat-script.mjs "$(CHAT_API_URL)"
	aws s3 sync . s3://$(S3_BUCKET_NAME) \
		--delete \
		--cache-control "no-cache" \
		--exclude ".git/*" \
		--exclude ".github/*" \
		--exclude ".gitignore" \
		--exclude "README*" \
		--exclude "infra/*" \
		--exclude "scripts/*" \
		--exclude "kb/*" \
		--exclude "node_modules/*" \
		--exclude "*.zip" \
		--exclude "*.log" \
		--exclude ".terraform*" \
		--exclude "terraform.*" \
		--exclude "Makefile"
	@if [ -n "$(CLOUDFRONT_DIST_ID)" ]; then \
		aws cloudfront create-invalidation --distribution-id $(CLOUDFRONT_DIST_ID) --paths "/*"; \
	fi
	@echo "✅ Frontend deployed"

# Clean up
clean:
	@echo "Cleaning up temporary files..."
	find . -name "*.zip" -delete
	find . -name "*.log" -delete
	find . -name ".terraform*" -delete
	find . -name "terraform.tfstate*" -delete
	find . -name "tfplan" -delete
	@echo "✅ Cleanup completed"

# Full deployment (for CI/CD)
deploy-all: install deploy-infra sync-kb deploy-frontend
	@echo "🎉 Full deployment completed!"
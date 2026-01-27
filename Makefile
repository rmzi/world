.PHONY: install dev build deploy clean

# ============================================================================
# Development
# ============================================================================

install:
	cd client && npm install

dev:
	cd client && npm run dev -- --port 5173

# ============================================================================
# Production Build & Deploy
# ============================================================================

build:
	cd client && npm run build

# Deploy: build → sync to S3 → invalidate CloudFront
deploy: build
	@echo "📦 Uploading to S3..."
	aws s3 sync client/dist s3://rmzi.world --delete --profile personal
	@echo "🔄 Invalidating CloudFront cache..."
	aws cloudfront create-invalidation \
		--distribution-id E32QE60PG3ZUYP \
		--paths "/*" \
		--profile personal \
		--output json | jq -r '"Invalidation: " + .Invalidation.Id'
	@echo "✅ Deployed to https://rmzi.world"

# Quick deploy (skip build if already built)
push:
	@echo "📦 Uploading to S3..."
	aws s3 sync client/dist s3://rmzi.world --delete --profile personal
	@echo "🔄 Invalidating CloudFront cache..."
	aws cloudfront create-invalidation \
		--distribution-id E32QE60PG3ZUYP \
		--paths "/*" \
		--profile personal \
		--output json | jq -r '"Invalidation: " + .Invalidation.Id'
	@echo "✅ Deployed to https://rmzi.world"

# ============================================================================
# Infrastructure
# ============================================================================

infra-plan:
	cd infrastructure && terraform plan

infra-apply:
	cd infrastructure && terraform apply

infra-output:
	cd infrastructure && terraform output

# ============================================================================
# Testing
# ============================================================================

test:
	cd client && npm run test:run

test-watch:
	cd client && npm run test

# ============================================================================
# Utilities
# ============================================================================

clean:
	rm -rf client/dist client/node_modules
	@echo "Cleaned build artifacts"

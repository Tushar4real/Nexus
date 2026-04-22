#!/bin/bash

# NEXUS Deployment Script
# This script verifies the frontend build before deploying to Render

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"

echo "🚀 Starting NEXUS deployment check..."

# Check if root .env exists
if [ ! -f "$ROOT_DIR/.env" ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create .env in the repo root with Supabase credentials"
    exit 1
fi

# Install dependencies if needed
cd "$FRONTEND_DIR"

if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --legacy-peer-deps
fi

# Build the project
echo "🔨 Building project..."
npm run build

echo "✅ Build successful!"
echo "📦 Docker config: $ROOT_DIR/deployment/Dockerfile"
echo "🛰️ Render blueprint: $ROOT_DIR/render.yaml"
echo "🎉 Project is ready to deploy on Render."

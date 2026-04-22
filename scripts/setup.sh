#!/bin/bash

# NEXUS Setup Script
# This script helps set up the frontend workspace for the first time

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"

echo "🎯 NEXUS Project Setup"
echo "======================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js 16+ from https://nodejs.org"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed!"
    exit 1
fi

echo "✅ npm version: $(npm -v)"
echo ""

# Install dependencies
echo "📦 Installing frontend dependencies..."
cd "$FRONTEND_DIR"
npm install --legacy-peer-deps

echo "✅ Dependencies installed!"
echo ""

# Check for root .env file
cd "$ROOT_DIR"
if [ ! -f ".env" ]; then
    echo "⚠️  Root .env file not found"
    echo "📝 Creating .env from frontend template..."
    
    if [ -f "frontend/.env.example" ]; then
        cp frontend/.env.example .env
        echo "✅ .env file created!"
        echo ""
        echo "⚠️  IMPORTANT: Edit .env file with your Supabase credentials"
        echo "   Get credentials from: https://supabase.com/dashboard"
    else
        echo "❌ frontend/.env.example not found!"
    fi
else
    echo "✅ Root .env file exists"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env in the repo root with your Supabase credentials"
echo "2. Run 'cd frontend && npm run dev' to start development server"
echo "3. Check docs/START_HERE.md for detailed instructions"
echo ""

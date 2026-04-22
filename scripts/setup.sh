#!/bin/bash

# NEXUS Setup Script
# This script helps set up the project for the first time

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
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies!"
    exit 1
fi

echo "✅ Dependencies installed!"
echo ""

# Check for .env file
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found"
    echo "📝 Creating .env from template..."
    
    if [ -f "config/.env.example" ]; then
        cp config/.env.example .env
        echo "✅ .env file created!"
        echo ""
        echo "⚠️  IMPORTANT: Edit .env file with your Firebase credentials"
        echo "   Get credentials from: https://console.firebase.google.com"
    else
        echo "❌ .env.example not found!"
    fi
else
    echo "✅ .env file exists"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your Firebase credentials"
echo "2. Run 'npm run dev' to start development server"
echo "3. Check docs/START_HERE.md for detailed instructions"
echo ""

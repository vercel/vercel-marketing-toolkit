#!/bin/bash
# Quick Start Script for Vercel Marketing Toolkit
# This script helps you get the app running locally

set -e  # Exit on error

echo "================================================"
echo "  Vercel Marketing Toolkit - Quick Start"
echo "================================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo ""
    echo "Please install Node.js first:"
    echo "  - macOS: brew install node"
    echo "  - Or download from: https://nodejs.org/"
    echo ""
    exit 1
fi

echo "✅ Node.js $(node --version) detected"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed!"
    exit 1
fi

echo "✅ npm $(npm --version) detected"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
echo "(This may take a few minutes on first run)"
echo ""
npm install

echo ""
echo "✅ Dependencies installed successfully!"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  .env.local not found!"
    echo ""
    echo "A template has been created for you at:"
    echo "  .env.local"
    echo ""
    echo "IMPORTANT: Please edit this file and add your API keys:"
    echo "  - OPENAI_API_KEY (required for AI features)"
    echo "  - TRAY_WEBHOOK_URL (required for List Import)"
    echo "  - SCORING_AGENT_URL (required for Agent Scoring)"
    echo ""
    echo "See LIST_IMPORT_ENV_VARS.md for detailed documentation."
    echo ""
else
    echo "✅ .env.local file exists"
    echo ""
fi

# Build the application (optional - checks for errors)
echo "🔨 Building the application..."
echo "(This will check for any TypeScript or build errors)"
echo ""
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "================================================"
    echo "  ✅ Build successful! Ready to start."
    echo "================================================"
    echo ""
    echo "To start the development server, run:"
    echo "  npm run dev"
    echo ""
    echo "Then open your browser to:"
    echo "  http://localhost:3000"
    echo ""
    echo "You should see the Marketing Toolkit homepage with:"
    echo "  - List Import Agent tile (indigo color)"
    echo "  - List Import link in the navigation"
    echo ""
    echo "See TESTING_GUIDE.md for a complete testing checklist."
    echo "================================================"
else
    echo ""
    echo "❌ Build failed! Please check the error messages above."
    echo ""
    echo "Common issues:"
    echo "  - Missing .env.local file (see LIST_IMPORT_ENV_VARS.md)"
    echo "  - TypeScript errors in the code"
    echo "  - Missing dependencies (try: rm -rf node_modules && npm install)"
    echo ""
    exit 1
fi

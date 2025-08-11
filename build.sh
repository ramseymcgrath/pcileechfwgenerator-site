#!/bin/bash
# This script builds the MkDocs site using npm commands

set -e

echo "🚀 Building PCILeech Firmware Generator Documentation"
echo "=================================================="

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is required but not installed"
    exit 1
fi

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed"
    exit 1
fi

# Install Python dependencies if needed
echo "📦 Installing Python dependencies..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -q -r requirements.txt

# Navigate to worker directory and install dependencies
echo "📦 Installing npm dependencies..."
cd worker
npm install

# Build the documentation site
echo "🏗️  Building MkDocs site..."
npm run build:docs

echo "✅ Build completed successfully!"
echo "📁 Site built to: site/"

# Output some useful information
echo ""
echo "🌐 To serve locally:"
echo "   npm run dev"
echo ""
echo "🚀 To deploy:"
echo "   npm run deploy"

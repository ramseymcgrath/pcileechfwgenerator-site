#!/bin/bash

# Build script for Cloudflare Worker deployment
# This script builds the MkDocs site

set -e

echo "🚀 Building PCILeech Firmware Generator Documentation"
echo "=================================================="

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed"
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -q -r requirements.txt

# Build the site
echo "🏗️  Building MkDocs site..."
mkdocs build --clean --strict

echo "✅ Build completed successfully!"
echo "📁 Site built to: site/"

# Output some useful information
echo ""
echo "🌐 To serve locally:"
echo "   mkdocs serve"
echo ""
echo "🚀 To deploy:"
echo "   The 'site/' directory contains the built documentation"
echo "   ready for deployment to Cloudflare Pages"

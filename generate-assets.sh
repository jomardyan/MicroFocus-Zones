#!/bin/bash

# MicroFocus Zones - Asset Generation Script (macOS/Linux)
# This script installs dependencies and generates all assets + ZIP file

echo ""
echo "========================================================="
echo "    MicroFocus Zones - Asset Generator"
echo "========================================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org/"
    echo ""
    exit 1
fi

echo "[1/3] Checking Node.js version..."
node --version
echo ""

echo "[2/3] Installing dependencies..."
echo "Please wait, this may take a few minutes on first run..."
echo ""

npm install

if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: Failed to install dependencies"
    echo "Try running: npm install --no-optional"
    echo ""
    exit 1
fi

echo ""
echo "[3/3] Generating assets and packaging extension..."
echo ""

node generate-assets.js

if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: Asset generation failed"
    echo ""
    exit 1
fi

echo ""
echo "========================================================="
echo "    SUCCESS! Your extension is ready."
echo "========================================================="
echo ""
echo "Next steps:"
echo "1. Check the 'assets' folder for generated images"
echo "2. Upload 'microfocus-zones.zip' to Chrome Web Store"
echo "3. Or load as unpacked extension in chrome://extensions"
echo ""

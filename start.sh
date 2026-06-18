#!/bin/bash
# Bin Al-Zain Shop — startup script
# Run this to install all dependencies and start both services

set -e

echo "📦 Installing dependencies..."
npm install

echo ""
echo "🚀 Starting Bin Al-Zain Shop..."
echo "   → API Server:  http://localhost:4000"
echo "   → Frontend:    http://localhost:3000"
echo ""

npm run dev

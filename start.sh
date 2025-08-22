#!/bin/bash

# Showcase Furniture CMS Startup Script

echo "🚀 Starting Showcase Furniture CMS..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Please create one from .env.example"
    echo "📝 Copy .env.example to .env and configure your Supabase credentials"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Create uploads directory if it doesn't exist
mkdir -p uploads/temp uploads/products uploads/sliders uploads/banners

echo "✅ Dependencies installed"
echo "✅ Upload directories created"
echo "🌐 Starting server..."

# Start the application
npm start
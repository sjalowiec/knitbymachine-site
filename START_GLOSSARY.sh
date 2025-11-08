#!/bin/bash
# Simple script to run your Astro glossary on Replit

echo "🚀 Starting Knit by Machine Glossary..."
echo ""

# Go to astro-site folder
cd astro-site || exit 1

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Start Astro on port 5000 for public access
echo "✅ Starting Astro dev server on port 5000..."
echo "📍 Your glossary will be available at: https://sjalowiec.replit.dev/glossary"
echo ""

npm run dev -- --host 0.0.0.0 --port 5000

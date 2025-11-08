#!/bin/bash
cd astro-site

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
  echo "Installing Astro dependencies..."
  npm install
fi

# Run Astro dev server on port 5000 for Replit
echo "Starting Astro dev server on port 5000..."
npm run dev -- --host 0.0.0.0 --port 5000

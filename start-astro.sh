#!/bin/bash
cd astro-site

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
  echo "Installing Astro dependencies..."
  npm install
fi

# Run Astro dev server
echo "Starting Astro dev server..."
npm run dev

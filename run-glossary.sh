#!/bin/bash
# Force-run Astro glossary on port 5000 by clearing all conflicts

echo "🧹 Clearing port 5000..."
killall -9 node tsx 2>/dev/null
sleep 3

echo "🚀 Starting Astro glossary..."
cd astro-site
npm run dev -- --host 0.0.0.0 --port 5000

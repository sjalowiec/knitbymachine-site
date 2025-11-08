# How to Run Your Astro Glossary on Replit

Your glossary site isn't showing publicly because the configuration is pointing to the old Express app instead of Astro.

## Quick Fix (Choose ONE option):

### **Option 1: Edit package.json (Easiest)**

1. Open `package.json` in the root folder
2. Find line 7 that says: `"dev": "NODE_ENV=development tsx server/index.ts",`
3. Change it to: `"dev": "cd astro-site && npm install && npm run dev -- --host 0.0.0.0 --port 5000",`
4. Save the file (Ctrl+S)
5. Click the **"Run Project"** button (green play button at top)
6. Wait 20 seconds
7. Open: `https://sjalowiec.replit.dev/glossary`

### **Option 2: Run in Shell**

1. Go to your **Shell** tab
2. Type: `cd astro-site`
3. Type: `npm install`
4. Type: `npm run dev -- --host 0.0.0.0 --port 5000`
5. Wait 20 seconds
6. Open: `https://sjalowiec.replit.dev/glossary`

---

## What's Happening?

- Your Astro files are in the `astro-site/` folder
- They need to run on port 5000 to be publicly accessible
- The current setup tries to run the old Express admin app instead
- Once you make this change, your glossary will be live!

## After It's Working

You can test your glossary at: **https://sjalowiec.replit.dev/glossary**

(The Netlify deployment at knitbymachine.com is separate and still works as before)

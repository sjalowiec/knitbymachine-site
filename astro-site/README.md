## Knit by Machine (Astro)

Netlify-hosted Astro site for Knit by Machine. Builds from `main` on GitHub (`sjalowiec/knitbymachine-site`) and publishes the `dist` folder.

### Prerequisites
- Node 20 (Netlify uses Node 20 via `netlify.toml`)
- npm (use the included `package-lock.json`)

### Local Development
1) Install: `npm install`
2) Start dev server: `npm run dev` (default at http://localhost:4321)
3) Build locally: `npm run build`
4) Preview production build: `npm run preview`

### Deployment (auto via Netlify)
Netlify is connected to GitHub. Pushing to `main` triggers:
- Build command: `npm run build`
- Publish directory: `dist`

Typical publish flow:
```
git add .
git commit -m "Describe your change"
git push origin main
```

### Useful Commands
- `npm run dev` – Start local dev server
- `npm run build` – Production build
- `npm run preview` – Preview the built site
- `npm run prebuild` – Clear Astro/Vite caches and Netlify build artifacts

### Key Files
- `netlify.toml` – Build/publish config and headers
- `astro.config.mjs` – Astro setup
- `src/pages` – Static and dynamic pages (Astro)
- `public/` – Static assets (served as-is)
- `public/scripts/wizards/` – Wizard embeds and supporting JS

### Troubleshooting
- Build or preview issues? Run `npm run prebuild` then `npm install` and retry.
- Node version errors? Use Node 20 (match Netlify).
- Wizard not loading? Confirm the script in `public/scripts/wizards/` exists and paths match the page embed.

// @ts-check
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: netlify(),
  server: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT) || 5000
  },
  vite: {
    server: {
      allowedHosts: [
        'localhost',
        '0.0.0.0',
        '.repl.co',
        '.replit.dev',
        '.worf.repl.co',
        '.worf.replit.dev'
      ]
    }
  }
});

export const prerender = false;

import type { APIRoute } from 'astro';

const GITHUB_TOKEN = import.meta.env.GITHUB_TOKEN || process.env.GITHUB_TOKEN;
const REPO_OWNER = 'sjalowiec';
const REPO_NAME = 'knitbymachine-site';
const CONTENT_PATH = 'astro-site/src/content/glossary';

export const GET: APIRoute = async () => {
  try {
    // Fetch directory listing from GitHub
    const listResponse = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${CONTENT_PATH}`,
      {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'knitbymachine-astro'
        }
      }
    );

    if (!listResponse.ok) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    const files = await listResponse.json();
    const jsonFiles = files.filter((file: any) => file.name.endsWith('.json'));

    // Fetch each glossary entry
    const entries = [];
    for (const file of jsonFiles) {
      try {
        const fileResponse = await fetch(file.download_url);
        if (fileResponse.ok) {
          const entry = await fileResponse.json();
          // Only include active, non-draft entries
          if (entry.active && !entry.isDraft) {
            entries.push({
              slug: entry.slug,
              term: entry.term,
              tooltip: entry.tooltip,
              description: entry.description
            });
          }
        }
      } catch (error) {
        console.error(`Error fetching ${file.name}:`, error);
      }
    }

    return new Response(JSON.stringify(entries), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
      }
    });
  } catch (error) {
    console.error('Error fetching glossary entries:', error);
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

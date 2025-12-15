import fs from 'node:fs';
import path from 'node:path';

const WORKSHOPS_DIR = path.join(process.cwd(), 'src/content/workshops');

export interface WorkshopDay {
  day: number;
  title: string;
  goal: string;
  released: boolean;
}

export interface Workshop {
  version: number;
  slug: string;
  client: {
    firstName: string;
  };
  workshop: {
    title: string;
    subtitle: string;
    startDay: number;
    status: string;
  };
  outline: {
    id: string;
    days: WorkshopDay[];
  };
  hub: {
    welcomeTitle: string;
    welcomeBody: string;
    todayLabel: string;
    showVideoReplyPlaceholder: boolean;
  };
  hyvor: {
    enabled: boolean;
    websiteId: string;
    pageId: string;
  };
}

export function getWorkshopSlugs(): string[] {
  try {
    const files = fs.readdirSync(WORKSHOPS_DIR);
    return files
      .filter(file => file.endsWith('.json') && !file.startsWith('_'))
      .filter(file => {
        // Check if the file has the new workshop instance structure
        try {
          const filePath = path.join(WORKSHOPS_DIR, file);
          const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          return content.hub && content.outline && content.client;
        } catch {
          return false;
        }
      })
      .map(file => file.replace('.json', ''));
  } catch {
    return [];
  }
}

export function getWorkshopBySlug(slug: string): Workshop | null {
  try {
    const filePath = path.join(WORKSHOPS_DIR, `${slug}.json`);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    const workshop = JSON.parse(content) as Workshop;
    
    // Validate it's the new structure
    if (!workshop.hub || !workshop.outline || !workshop.client) {
      return null;
    }
    
    return workshop;
  } catch {
    return null;
  }
}

export function getAllWorkshops(): Workshop[] {
  const slugs = getWorkshopSlugs();
  return slugs
    .map(slug => getWorkshopBySlug(slug))
    .filter((w): w is Workshop => w !== null);
}

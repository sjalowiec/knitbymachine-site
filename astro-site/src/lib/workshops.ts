import fs from 'node:fs';
import path from 'node:path';

const WORKSHOPS_DIR = path.join(process.cwd(), 'src/content/workshops');

export interface WorkshopDay {
  day: number;
  title: string;
  goal: string;
  released: boolean;
}

// Curriculum block types
export interface RichTextBlock {
  type: 'richText';
  content: string;
}

export interface ImageBlock {
  type: 'image';
  src: string;
  alt: string;
  caption?: string;
}

export interface VideoBlock {
  type: 'video';
  provider: 'youtube' | 'vimeo' | 'loom' | 'direct';
  url: string;
  caption?: string;
}

export interface DownloadBlock {
  type: 'download';
  label: string;
  url: string;
}

export interface ChecklistItem {
  text: string;
  isOptional?: boolean;
}

export interface ChecklistBlock {
  type: 'checklist';
  title?: string;
  items: ChecklistItem[];
}

export interface CalloutBlock {
  type: 'callout';
  style: 'note' | 'tip' | 'important';
  title?: string;
  content: string;
}

export type CurriculumBlock = RichTextBlock | ImageBlock | VideoBlock | DownloadBlock | ChecklistBlock | CalloutBlock;

export interface CurriculumDay {
  day: number;
  title: string;
  shortDescription: string;
  estimatedTime?: string;
  release: {
    mode: 'relative' | 'absolute';
    dayOffset?: number;
    date?: string;
  };
  blocks: CurriculumBlock[];
}

export interface Curriculum {
  version: number;
  days: CurriculumDay[];
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
  curriculum?: Curriculum;
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

import { db } from "../server/db";
import { contentPages, categories } from "../shared/schema";
import * as fs from "fs";
import * as path from "path";

const WIZARDS_DIR = "./astro-site/src/content/wizards";

interface WizardJson {
  title: string;
  slug: string;
  hero?: string;
  description?: string;
  excerpt?: string;
  whyUseThisTool?: string;
  category?: string;
  tags?: string[];
  keywords?: string[];
  aliases?: string[];
  videoUrl?: string;
  accessLevel?: string;
  price?: string;
  relatedAnas?: string[];
  relatedWorkshops?: string[];
  imageUrl?: string;
  imageAlt?: string;
  iconUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  schemaMarkup?: any;
  isDraft?: boolean;
  publishedDate?: string;
  pendingPublish?: boolean;
}

function mapCategoryToContentType(category: string | undefined): string {
  if (!category) return "tool";
  const cat = category.toLowerCase();
  if (cat === "tool") return "tool";
  if (cat === "pattern" || cat === "pattern wizard") return "pattern";
  if (cat === "practice project" || cat === "practice-project") return "pattern";
  if (cat === "project wizard" || cat === "project-wizard") return "project-wizard";
  return "tool";
}

function getVariant(category: string | undefined): string | null {
  if (!category) return null;
  const cat = category.toLowerCase();
  if (cat === "practice project" || cat === "practice-project") return "practice-project";
  return null;
}

async function importWizards() {
  console.log("Starting wizard import...");
  
  const files = fs.readdirSync(WIZARDS_DIR).filter(f => f.endsWith(".json"));
  console.log(`Found ${files.length} wizard JSON files`);
  
  let imported = 0;
  let skipped = 0;
  
  for (const file of files) {
    const filePath = path.join(WIZARDS_DIR, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const wizard: WizardJson = JSON.parse(content);
    
    console.log(`Processing: ${wizard.title} (${wizard.slug})`);
    
    const contentType = mapCategoryToContentType(wizard.category);
    const variant = getVariant(wizard.category);
    
    const pageData = {
      title: wizard.title,
      slug: wizard.slug,
      contentType,
      variant,
      summary: wizard.hero || wizard.excerpt || "",
      body: wizard.description || null,
      accessLevel: wizard.accessLevel || "free",
      priceLabel: wizard.price || null,
      featuredImage: wizard.imageUrl ? { url: wizard.imageUrl, alt: wizard.imageAlt || "" } : null,
      videoUrl: wizard.videoUrl || null,
      iconKey: wizard.iconUrl || null,
      tags: wizard.tags || [],
      keywords: wizard.keywords || [],
      aliases: wizard.aliases || [],
      metaTitle: wizard.metaTitle || null,
      metaDescription: wizard.metaDescription || null,
      status: wizard.isDraft ? "draft" : "published",
      publishedAt: wizard.publishedDate ? new Date(wizard.publishedDate) : null,
      wizardFlowIds: [],
      related: [],
    };
    
    try {
      await db.insert(contentPages).values(pageData).onConflictDoNothing();
      imported++;
      console.log(`  ✓ Imported: ${wizard.title}`);
    } catch (error: any) {
      console.log(`  ✗ Error: ${error.message}`);
      skipped++;
    }
  }
  
  console.log(`\nImport complete: ${imported} imported, ${skipped} skipped`);
  process.exit(0);
}

importWizards().catch(console.error);

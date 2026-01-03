#!/usr/bin/env npx tsx
/**
 * One-time import script: Wizard Flows + Content Pages
 * 
 * Reads JSON files from astro-site/src/content/wizards/ and imports them
 * into the new lean schema tables (wizard_flows + content_pages).
 * 
 * Usage:
 *   npx tsx scripts/import-content.ts              # Dry-run (no writes)
 *   npx tsx scripts/import-content.ts --execute    # Actually write to DB
 *   npx tsx scripts/import-content.ts --update     # Update existing records too
 * 
 * Safety features:
 *   - Dry-run mode by default (no DB writes)
 *   - Idempotent: keyed by wizardId/slug (no duplicates)
 *   - Fail-fast on duplicate slugs in source files
 *   - Validation: skip + log records missing required fields
 *   - No deletes, only inserts/updates
 */

import * as fs from "fs";
import * as path from "path";
import { db } from "../server/db";
import { wizardFlows, contentPages, generateWizardFlowId } from "../shared/schema";
import type { WizardFlow, RelatedContentRef, FeaturedImage } from "../shared/schema";
import { eq } from "drizzle-orm";

// ============================================
// Configuration
// ============================================
const WIZARDS_DIR = path.join(process.cwd(), "astro-site/src/content/wizards");

// Parse CLI args
const args = process.argv.slice(2);
const DRY_RUN = !args.includes("--execute");
const UPDATE_EXISTING = args.includes("--update");

// ============================================
// Types for source JSON
// ============================================
interface SourceWizardJson {
  title: string;
  slug: string;
  hero?: string;
  description?: string;
  excerpt?: string;
  whyUseThisTool?: string;
  category?: string;
  categoryId?: string;
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
  schemaMarkup?: unknown;
  isDraft?: boolean;
  pendingPublish?: boolean;
  publishedDate?: string;
  createdAt?: string;
  updatedAt?: string;
  wizardFlow?: WizardFlow;
  componentId?: string;
  toolType?: string;
  iframeUrl?: string;
  iframeHeight?: string;
  provider?: string;
}

interface ValidationError {
  file: string;
  field: string;
  message: string;
}

interface ImportResult {
  file: string;
  slug: string;
  action: "insert" | "update" | "skip";
  reason?: string;
}

// ============================================
// Logging helpers
// ============================================
function log(msg: string) {
  console.log(msg);
}

function logSection(title: string) {
  console.log(`\n${"=".repeat(50)}`);
  console.log(title);
  console.log("=".repeat(50));
}

// ============================================
// File discovery
// ============================================
function discoverJsonFiles(): string[] {
  if (!fs.existsSync(WIZARDS_DIR)) {
    throw new Error(`Wizards directory not found: ${WIZARDS_DIR}`);
  }
  
  const files = fs.readdirSync(WIZARDS_DIR)
    .filter(f => f.endsWith(".json"))
    .map(f => path.join(WIZARDS_DIR, f));
  
  return files;
}

// ============================================
// Parse and validate
// ============================================
function parseJsonFile(filepath: string): SourceWizardJson | null {
  try {
    const content = fs.readFileSync(filepath, "utf-8");
    return JSON.parse(content) as SourceWizardJson;
  } catch (err) {
    log(`  ERROR: Failed to parse ${path.basename(filepath)}: ${err}`);
    return null;
  }
}

function validateRecord(data: SourceWizardJson, file: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!data.title || data.title.trim() === "") {
    errors.push({ file, field: "title", message: "Missing required field: title" });
  }
  
  if (!data.slug || data.slug.trim() === "") {
    errors.push({ file, field: "slug", message: "Missing required field: slug" });
  }
  
  // summary will be derived from excerpt or hero, so we just need one of them
  if (!data.excerpt && !data.hero && !data.description) {
    errors.push({ file, field: "summary", message: "Missing excerpt, hero, or description for summary" });
  }
  
  return errors;
}

// ============================================
// Duplicate detection
// ============================================
function checkForDuplicates(records: Array<{ file: string; data: SourceWizardJson }>): void {
  const slugMap = new Map<string, string[]>();
  
  for (const { file, data } of records) {
    const slug = data.slug;
    if (!slugMap.has(slug)) {
      slugMap.set(slug, []);
    }
    slugMap.get(slug)!.push(file);
  }
  
  const duplicates = Array.from(slugMap.entries()).filter(([, files]) => files.length > 1);
  
  if (duplicates.length > 0) {
    log("\nFATAL: Duplicate slugs found in source files:");
    for (const [slug, files] of duplicates) {
      log(`  slug: "${slug}" found in:`);
      for (const f of files) {
        log(`    - ${path.basename(f)}`);
      }
    }
    throw new Error("Duplicate slugs in source files - aborting");
  }
}

// ============================================
// Transform source data to new schema
// ============================================
function mapContentType(category?: string): "tool" | "pattern" | "project-wizard" {
  if (!category) return "tool";
  const lc = category.toLowerCase();
  if (lc.includes("pattern")) return "pattern";
  if (lc.includes("project wizard")) return "project-wizard";
  if (lc.includes("practice project")) return "pattern"; // variant will be practice-project
  return "tool";
}

function mapVariant(category?: string): "default" | "practice-project" | null {
  if (!category) return null;
  const lc = category.toLowerCase();
  if (lc.includes("practice project")) return "practice-project";
  if (lc.includes("pattern")) return "default";
  return null;
}

function mapAccessLevel(level?: string): "free" | "member" | "paid" {
  if (!level) return "free";
  const lc = level.toLowerCase();
  if (lc === "member" || lc === "members") return "member";
  if (lc === "paid" || lc === "premium") return "paid";
  return "free";
}

function buildSummary(data: SourceWizardJson): string {
  // Priority: excerpt > hero > first line of description
  if (data.excerpt && data.excerpt.trim()) {
    return data.excerpt.trim();
  }
  if (data.hero && data.hero.trim()) {
    return data.hero.trim();
  }
  if (data.description && data.description.trim()) {
    // Strip HTML tags and take first 200 chars
    const plain = data.description.replace(/<[^>]+>/g, " ").trim();
    return plain.length > 200 ? plain.slice(0, 200) + "..." : plain;
  }
  return "No description available.";
}

function buildRelated(data: SourceWizardJson): RelatedContentRef[] {
  const related: RelatedContentRef[] = [];
  
  if (data.relatedAnas) {
    for (const slug of data.relatedAnas) {
      if (slug) related.push({ type: "ana", slug });
    }
  }
  
  if (data.relatedWorkshops) {
    for (const slug of data.relatedWorkshops) {
      if (slug) related.push({ type: "workshop", slug });
    }
  }
  
  return related;
}

function buildFeaturedImage(data: SourceWizardJson): FeaturedImage | null {
  if (data.imageUrl) {
    return {
      url: data.imageUrl,
      alt: data.imageAlt || data.title || "Featured image",
    };
  }
  return null;
}

// ============================================
// Main import logic
// ============================================
async function importRecords() {
  logSection("Content Import Script");
  log(`Mode: ${DRY_RUN ? "DRY RUN (no DB writes)" : "EXECUTE (will write to DB)"}`);
  log(`Update existing: ${UPDATE_EXISTING ? "YES" : "NO (insert only)"}`);
  
  // Step 1: Discover files
  logSection("Step 1: Discovering JSON files");
  const files = discoverJsonFiles();
  log(`Found ${files.length} JSON files in ${WIZARDS_DIR}`);
  
  // Step 2: Parse all files
  logSection("Step 2: Parsing files");
  const parsed: Array<{ file: string; data: SourceWizardJson }> = [];
  const parseErrors: string[] = [];
  
  for (const file of files) {
    const data = parseJsonFile(file);
    if (data) {
      parsed.push({ file, data });
      log(`  OK: ${path.basename(file)}`);
    } else {
      parseErrors.push(file);
    }
  }
  
  if (parseErrors.length > 0) {
    log(`\n  ${parseErrors.length} files failed to parse`);
  }
  
  // Step 3: Check for duplicates
  logSection("Step 3: Checking for duplicates");
  checkForDuplicates(parsed);
  log("  No duplicate slugs found");
  
  // Step 4: Validate records
  logSection("Step 4: Validating records");
  const valid: Array<{ file: string; data: SourceWizardJson }> = [];
  const allValidationErrors: ValidationError[] = [];
  
  for (const { file, data } of parsed) {
    const errors = validateRecord(data, file);
    if (errors.length === 0) {
      valid.push({ file, data });
      log(`  VALID: ${path.basename(file)}`);
    } else {
      allValidationErrors.push(...errors);
      log(`  INVALID: ${path.basename(file)}`);
      for (const err of errors) {
        log(`    - ${err.message}`);
      }
    }
  }
  
  // Step 5: Fetch existing records from DB
  logSection("Step 5: Checking existing records in DB");
  const existingFlows = await db.select().from(wizardFlows);
  const existingPages = await db.select().from(contentPages);
  
  const flowsBySlug = new Map(existingFlows.map(f => [f.slug, f]));
  const pagesBySlug = new Map(existingPages.map(p => [p.slug, p]));
  
  log(`  Existing wizard flows: ${existingFlows.length}`);
  log(`  Existing content pages: ${existingPages.length}`);
  
  // Step 6: Determine actions
  logSection("Step 6: Determining actions");
  const flowResults: ImportResult[] = [];
  const pageResults: ImportResult[] = [];
  
  for (const { file, data } of valid) {
    const fileName = path.basename(file);
    const existingFlow = flowsBySlug.get(data.slug);
    const existingPage = pagesBySlug.get(data.slug);
    
    // Wizard Flow action
    if (existingFlow) {
      if (UPDATE_EXISTING) {
        flowResults.push({ file: fileName, slug: data.slug, action: "update" });
      } else {
        flowResults.push({ file: fileName, slug: data.slug, action: "skip", reason: "exists, --update not set" });
      }
    } else {
      flowResults.push({ file: fileName, slug: data.slug, action: "insert" });
    }
    
    // Content Page action
    if (existingPage) {
      if (UPDATE_EXISTING) {
        pageResults.push({ file: fileName, slug: data.slug, action: "update" });
      } else {
        pageResults.push({ file: fileName, slug: data.slug, action: "skip", reason: "exists, --update not set" });
      }
    } else {
      pageResults.push({ file: fileName, slug: data.slug, action: "insert" });
    }
  }
  
  // Display planned actions
  log("\nWizard Flows:");
  for (const r of flowResults) {
    const statusIcon = r.action === "insert" ? "+" : r.action === "update" ? "~" : "-";
    log(`  [${statusIcon}] ${r.slug} (${r.action}${r.reason ? `: ${r.reason}` : ""})`);
  }
  
  log("\nContent Pages:");
  for (const r of pageResults) {
    const statusIcon = r.action === "insert" ? "+" : r.action === "update" ? "~" : "-";
    log(`  [${statusIcon}] ${r.slug} (${r.action}${r.reason ? `: ${r.reason}` : ""})`);
  }
  
  // Step 7: Execute (if not dry-run)
  if (!DRY_RUN) {
    logSection("Step 7: Executing imports");
    
    let flowsInserted = 0, flowsUpdated = 0, flowsSkipped = 0;
    let pagesInserted = 0, pagesUpdated = 0, pagesSkipped = 0;
    
    for (const { data } of valid) {
      const existingFlow = flowsBySlug.get(data.slug);
      const existingPage = pagesBySlug.get(data.slug);
      
      // Handle Wizard Flow
      if (!existingFlow) {
        // Insert new flow
        const newWizardId = generateWizardFlowId();
        await db.insert(wizardFlows).values({
          wizardId: newWizardId,
          name: data.title,
          slug: data.slug,
          description: data.description ? data.description.replace(/<[^>]+>/g, " ").trim().slice(0, 500) : null,
          wizardFlow: data.wizardFlow || null,
          componentId: data.componentId || null,
          toolType: data.toolType || (data.wizardFlow ? "troubleshooter" : "calculator"),
          iframeUrl: data.iframeUrl || null,
          iframeHeight: data.iframeHeight || "700",
          provider: data.provider || null,
          isDraft: data.isDraft ?? true,
        });
        flowsInserted++;
        log(`  INSERTED flow: ${data.slug} (wizardId: ${newWizardId})`);
        
        // Update our local cache for page reference
        flowsBySlug.set(data.slug, { 
          id: "", wizardId: newWizardId, slug: data.slug, name: data.title,
          description: null, wizardFlow: null, componentId: null, toolType: null,
          iframeUrl: null, iframeHeight: null, provider: null, isDraft: true,
          createdAt: new Date(), updatedAt: new Date()
        });
      } else if (UPDATE_EXISTING) {
        // Update existing flow
        await db.update(wizardFlows)
          .set({
            name: data.title,
            description: data.description ? data.description.replace(/<[^>]+>/g, " ").trim().slice(0, 500) : null,
            wizardFlow: data.wizardFlow || null,
            componentId: data.componentId || null,
            toolType: data.toolType || existingFlow.toolType,
            iframeUrl: data.iframeUrl || null,
            iframeHeight: data.iframeHeight || "700",
            provider: data.provider || null,
            isDraft: data.isDraft ?? existingFlow.isDraft,
            updatedAt: new Date(),
          })
          .where(eq(wizardFlows.slug, data.slug));
        flowsUpdated++;
        log(`  UPDATED flow: ${data.slug}`);
      } else {
        flowsSkipped++;
      }
      
      // Get the wizardId for the content page reference
      const flowRecord = flowsBySlug.get(data.slug);
      const wizardIdForPage = flowRecord?.wizardId || null;
      
      // Handle Content Page
      if (!existingPage) {
        // Insert new page
        await db.insert(contentPages).values({
          title: data.title,
          slug: data.slug,
          contentType: mapContentType(data.category),
          variant: mapVariant(data.category),
          wizardFlowIds: wizardIdForPage ? [wizardIdForPage] : [],
          summary: buildSummary(data),
          body: data.description || null,
          accessLevel: mapAccessLevel(data.accessLevel),
          priceLabel: data.price || null,
          featuredImage: buildFeaturedImage(data),
          videoUrl: data.videoUrl || null,
          iconKey: null, // Not mapped from old structure
          categoryId: data.categoryId || null,
          tags: data.tags || [],
          aliases: data.aliases || [],
          metaTitle: data.metaTitle || null,
          metaDescription: data.metaDescription || null,
          keywords: data.keywords || [],
          related: buildRelated(data),
          status: data.isDraft ? "draft" : "published",
          publishedAt: data.publishedDate ? new Date(data.publishedDate) : null,
        });
        pagesInserted++;
        log(`  INSERTED page: ${data.slug}`);
      } else if (UPDATE_EXISTING) {
        // Update existing page
        await db.update(contentPages)
          .set({
            title: data.title,
            contentType: mapContentType(data.category),
            variant: mapVariant(data.category),
            wizardFlowIds: wizardIdForPage ? [wizardIdForPage] : existingPage.wizardFlowIds,
            summary: buildSummary(data),
            body: data.description || existingPage.body,
            accessLevel: mapAccessLevel(data.accessLevel),
            priceLabel: data.price || existingPage.priceLabel,
            featuredImage: buildFeaturedImage(data) || existingPage.featuredImage,
            videoUrl: data.videoUrl || existingPage.videoUrl,
            categoryId: data.categoryId || existingPage.categoryId,
            tags: data.tags || existingPage.tags,
            aliases: data.aliases || existingPage.aliases,
            metaTitle: data.metaTitle || existingPage.metaTitle,
            metaDescription: data.metaDescription || existingPage.metaDescription,
            keywords: data.keywords || existingPage.keywords,
            related: buildRelated(data),
            status: data.isDraft ? "draft" : "published",
            updatedAt: new Date(),
          })
          .where(eq(contentPages.slug, data.slug));
        pagesUpdated++;
        log(`  UPDATED page: ${data.slug}`);
      } else {
        pagesSkipped++;
      }
    }
    
    // Final summary
    logSection("Import Complete");
    log(`Wizard Flows: ${flowsInserted} inserted, ${flowsUpdated} updated, ${flowsSkipped} skipped`);
    log(`Content Pages: ${pagesInserted} inserted, ${pagesUpdated} updated, ${pagesSkipped} skipped`);
    
  } else {
    // Dry-run summary
    logSection("Dry Run Summary (no changes made)");
    const flowInserts = flowResults.filter(r => r.action === "insert").length;
    const flowUpdates = flowResults.filter(r => r.action === "update").length;
    const flowSkips = flowResults.filter(r => r.action === "skip").length;
    const pageInserts = pageResults.filter(r => r.action === "insert").length;
    const pageUpdates = pageResults.filter(r => r.action === "update").length;
    const pageSkips = pageResults.filter(r => r.action === "skip").length;
    
    log(`Wizard Flows: ${flowInserts} would insert, ${flowUpdates} would update, ${flowSkips} would skip`);
    log(`Content Pages: ${pageInserts} would insert, ${pageUpdates} would update, ${pageSkips} would skip`);
    log(`\nValidation errors: ${allValidationErrors.length}`);
    
    if (allValidationErrors.length > 0) {
      log("\nRecords that would be skipped due to validation errors:");
      for (const err of allValidationErrors) {
        log(`  - ${path.basename(err.file)}: ${err.message}`);
      }
    }
    
    log("\nTo execute the import, run:");
    log("  npx tsx scripts/import-content.ts --execute");
    log("To also update existing records:");
    log("  npx tsx scripts/import-content.ts --execute --update");
  }
}

// Run the import
importRecords()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\nFATAL ERROR:", err.message || err);
    process.exit(1);
  });

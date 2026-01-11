/**
 * Seed script for Foundations sample data
 * Run with: npx tsx scripts/seed-foundations.ts
 */

import { db } from "../server/db";
import { foundations, foundationSections } from "../shared/schema";
import type { ContentBlock } from "../shared/schema";

async function seedFoundations() {
  console.log("Seeding Foundations sample data...");

  // Sample content blocks demonstrating all block types
  const sampleContentBlocks: ContentBlock[] = [
    {
      blockType: "mechanic",
      heading: "How Tuck Stitch Works",
      body: "In tuck stitch, the carriage holds selected needles in a partially knitted position while knitting continues on neighboring needles. The held yarn creates a loop that is tucked into the fabric on the following pass, creating texture and often color patterning.",
      images: [
        {
          src: "/images/foundations/lk150-patterning/tuck/tuck_drawing.jpg",
          alt: "Tuck stitch diagram",
          caption: "Cross-section view of tuck stitch formation"
        }
      ]
    },
    {
      blockType: "result",
      heading: "The Finished Effect",
      body: "Tuck stitches create a fabric that is thicker, wider, and less stretchy than stockinette. The tucked loops push to the front of the work, creating raised texture. When worked with multiple colors, tuck can create geometric patterns with a distinctive 'dotted' appearance.",
      images: [
        {
          src: "/images/foundations/lk150-patterning/tuck/tucked_blocks_pattern.jpg",
          alt: "Tuck stitch pattern sample",
          caption: "Sample showing tuck stitch texture"
        }
      ]
    },
    {
      blockType: "supportCards",
      items: [
        {
          label: "Yarn Weight",
          content: "Use standard yarn weight for your machine. Tuck can add bulk, so consider going slightly lighter than usual for lofty fabrics."
        },
        {
          label: "Tension Adjustment",
          content: "Start with your stockinette tension and adjust as needed. Tuck typically requires a slightly looser tension to prevent the tucked loops from binding."
        },
        {
          label: "Needle Selection",
          content: "Follow your pattern's needle selection. Remember that 'selected' needles (upper position) are the ones that will tuck, not knit."
        }
      ]
    },
    {
      blockType: "technicalReference",
      heading: "Punch Card Symbols",
      body: "On punch cards, holes indicate needles that will KNIT normally. Blank (unpunched) areas indicate needles that will TUCK. This is the opposite of some charting systems, so always verify with a small test swatch.",
      images: [
        {
          src: "/images/foundations/lk150-patterning/tuck/tuck_symbol.jpg",
          alt: "Punch card symbol reference",
          caption: "Standard punch card notation for tuck"
        },
        {
          src: "/images/foundations/lk150-patterning/tuck/good_punchcard.bmp",
          alt: "Sample punch card pattern",
          caption: "Example punch card showing tuck pattern"
        }
      ]
    },
    {
      blockType: "proTip",
      body: "Before committing to a large project, always knit a test swatch in tuck stitch. Tuck fabric behaves very differently from stockinette - it's wider, shorter, and less drapey. Your gauge will be significantly different!"
    },
    {
      blockType: "quickSelfCheck",
      items: [
        "Can you identify which needles will tuck vs. knit on your punch card?",
        "Have you tested your yarn at the planned tension to check for binding?",
        "Do you understand how tuck affects your gauge compared to stockinette?",
        "Is your carriage set to the correct tuck setting for your pattern?"
      ]
    }
  ];

  try {
    // Create the sample foundation
    const [foundation] = await db.insert(foundations).values({
      title: "LK-150 Patterning",
      slug: "lk150-patterning",
      subtitle: "Technical foundations for pattern stitches on the LK-150",
      summary: "A comprehensive guide to understanding and working pattern stitches on the LK-150 and similar mid-gauge machines. Covers tuck, slip, fair isle, and combination techniques.",
      status: "draft",
      machineTags: ["LK150", "Mid-gauge"],
    }).returning();

    console.log("Created foundation:", foundation.title);

    // Create the sample section
    const [section] = await db.insert(foundationSections).values({
      foundationId: foundation.id,
      title: "Tuck Stitch: Technical Foundations",
      slug: "tuck-stitch",
      subtitle: "Understanding the mechanics and applications of tuck stitch",
      status: "draft",
      sortOrder: 1,
      contentBlocks: sampleContentBlocks,
    }).returning();

    console.log("Created section:", section.title);

    console.log("\n✅ Seed complete!");
    console.log(`Foundation ID: ${foundation.id}`);
    console.log(`Section ID: ${section.id}`);
    console.log(`\nPreview URL: /foundations/${foundation.slug}/${section.slug}`);

  } catch (error: any) {
    if (error.code === "23505") {
      console.log("Sample data already exists (duplicate slug). Skipping seed.");
    } else {
      console.error("Error seeding data:", error);
      throw error;
    }
  }

  process.exit(0);
}

seedFoundations();

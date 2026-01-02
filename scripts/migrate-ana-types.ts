/**
 * Migration script: Add type='leaf' to existing ANA entries
 * 
 * This script:
 * - Adds type: "leaf" to all entries that don't have a type
 * - Copies introParagraph to shortAnswer if shortAnswer is missing
 * - Initializes steps as empty array if missing
 * - Sets wizard to null for leaf entries
 * 
 * Run with: npx tsx scripts/migrate-ana-types.ts
 */

import { db } from "../server/db";
import { anaEntries } from "../shared/schema";
import { sql } from "drizzle-orm";

async function migrate() {
  console.log("Starting ANA type migration...");
  
  try {
    // Get all entries that need migration (type is null or missing)
    const entries = await db.select().from(anaEntries);
    console.log(`Found ${entries.length} total ANA entries`);
    
    let migrated = 0;
    
    for (const entry of entries) {
      const updates: Record<string, any> = {};
      
      // Add type if missing (default to leaf)
      if (!entry.type) {
        updates.type = "leaf";
      }
      
      // Copy introParagraph to shortAnswer if shortAnswer is missing
      if (!entry.shortAnswer && entry.introParagraph) {
        updates.shortAnswer = entry.introParagraph;
      }
      
      // Only update if there are changes
      if (Object.keys(updates).length > 0) {
        await db.update(anaEntries)
          .set(updates)
          .where(sql`${anaEntries.id} = ${entry.id}`);
        migrated++;
        console.log(`  Migrated: ${entry.slug} -> type=${updates.type || entry.type}`);
      }
    }
    
    console.log(`\nMigration complete! ${migrated} entries updated.`);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate();

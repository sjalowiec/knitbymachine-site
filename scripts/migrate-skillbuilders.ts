import { Octokit } from "@octokit/rest";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = "sjalowiec";
const GITHUB_REPO = "knitbymachine-site";

if (!GITHUB_TOKEN) {
  throw new Error("GITHUB_TOKEN environment variable is required");
}

const octokit = new Octokit({
  auth: GITHUB_TOKEN,
});

async function migrateSkillBuilders() {
  console.log("Fetching skill builder directories...");
  
  const { data: directories } = await octokit.repos.getContent({
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    path: "skillbuilders",
  });

  if (!Array.isArray(directories)) {
    throw new Error("Expected directories array");
  }

  for (const dir of directories) {
    if (dir.type !== "dir") continue;
    
    const slug = dir.name;
    console.log(`\nProcessing: ${slug}`);
    
    try {
      // Fetch the data.json file
      const { data: fileData } = await octokit.repos.getContent({
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        path: `skillbuilders/${slug}/data.json`,
      });

      if (!("content" in fileData)) {
        console.log(`  ⚠️  Skipping ${slug} - not a file`);
        continue;
      }

      const content = Buffer.from(fileData.content, "base64").toString("utf-8");
      const data = JSON.parse(content);

      // Check if slug already exists
      if (data.slug) {
        console.log(`  ✓ Already has slug: ${data.slug}`);
        continue;
      }

      // Add slug field
      const updated = {
        slug: slug,
        ...data,
      };

      // Write back to GitHub
      await octokit.repos.createOrUpdateFileContents({
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        path: `skillbuilders/${slug}/data.json`,
        message: `Add slug field to ${slug} skill builder`,
        content: Buffer.from(JSON.stringify(updated, null, 2)).toString("base64"),
        sha: fileData.sha,
      });

      console.log(`  ✓ Added slug field: ${slug}`);
    } catch (error: any) {
      console.error(`  ✗ Error processing ${slug}:`, error.message);
    }
  }

  console.log("\n✅ Migration complete!");
}

migrateSkillBuilders().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});

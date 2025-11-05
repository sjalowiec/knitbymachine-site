import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Octokit } from "@octokit/rest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OWNER = "sjalowiec";
const REPO = "knitbymachine-site";

if (!GITHUB_TOKEN) {
  console.error("❌ GITHUB_TOKEN not found in environment");
  process.exit(1);
}

const octokit = new Octokit({ auth: GITHUB_TOKEN });

async function pushFile(localPath, remotePath) {
  try {
    const content = fs.readFileSync(localPath, "utf-8");
    const contentBase64 = Buffer.from(content).toString("base64");

    // Try to get existing file SHA
    let sha;
    try {
      const { data } = await octokit.repos.getContent({
        owner: OWNER,
        repo: REPO,
        path: remotePath,
      });
      sha = data.sha;
    } catch (err) {
      // File doesn't exist yet, that's fine
    }

    // Create or update file
    await octokit.repos.createOrUpdateFileContents({
      owner: OWNER,
      repo: REPO,
      path: remotePath,
      message: `Update ${path.basename(remotePath)}`,
      content: contentBase64,
      sha,
    });

    console.log(`✓ Pushed ${path.basename(remotePath)}`);
  } catch (error) {
    console.error(`✗ Failed to push ${path.basename(remotePath)}:`, error.message);
    throw error;
  }
}

async function main() {
  console.log("Pushing glossary files to GitHub...\n");

  const files = [
    {
      local: path.join(__dirname, "astro-site/src/pages/glossary.astro"),
      remote: "astro-site/src/pages/glossary.astro",
    },
    {
      local: path.join(__dirname, "astro-site/src/pages/glossary/[slug].astro"),
      remote: "astro-site/src/pages/glossary/[slug].astro",
    },
  ];

  for (const file of files) {
    console.log(`Pushing ${path.basename(file.local)}...`);
    await pushFile(file.local, file.remote);
  }

  console.log("\n✅ All glossary files pushed to GitHub!");
  console.log("Netlify will automatically deploy in ~2 minutes");
  console.log("Check deployment at: https://app.netlify.com/sites/knitbymachine");
}

main().catch(console.error);

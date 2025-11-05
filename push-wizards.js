import { Octokit } from "@octokit/rest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = "sjalowiec";
const GITHUB_REPO = "knitbymachine-site";

if (!GITHUB_TOKEN) {
  throw new Error("GITHUB_TOKEN environment variable is required");
}

const octokit = new Octokit({
  auth: GITHUB_TOKEN,
});

async function pushWizardFiles() {
  const wizardsDir = path.join(__dirname, "astro-site/src/pages/wizards");
  const files = fs.readdirSync(wizardsDir).filter(f => f.endsWith(".astro"));
  
  console.log(`Found ${files.length} wizard files to push`);
  
  for (const file of files) {
    const filePath = path.join(wizardsDir, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const githubPath = `astro-site/src/pages/wizards/${file}`;
    
    console.log(`Pushing ${file}...`);
    
    try {
      // Try to get existing file to get SHA
      let sha;
      try {
        const { data } = await octokit.repos.getContent({
          owner: GITHUB_OWNER,
          repo: GITHUB_REPO,
          path: githubPath,
        });
        if ("sha" in data) {
          sha = data.sha;
        }
      } catch (error) {
        // File doesn't exist, that's okay
      }
      
      // Create or update file
      await octokit.repos.createOrUpdateFileContents({
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        path: githubPath,
        message: `Add interactive wizard: ${file}`,
        content: Buffer.from(content).toString("base64"),
        sha,
      });
      
      console.log(`✓ Pushed ${file}`);
    } catch (error) {
      console.error(`✗ Failed to push ${file}:`, error.message);
    }
  }
  
  console.log("\nAll wizard files pushed to GitHub!");
  console.log("Netlify will automatically deploy in ~2 minutes");
  console.log("Check deployment at: https://app.netlify.com/sites/knitbymachine");
}

pushWizardFiles().catch(console.error);

import { Octokit } from "@octokit/rest";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = "sjalowiec";
const GITHUB_REPO = "knitbymachine-site";

const octokit = new Octokit({ auth: GITHUB_TOKEN });

async function deleteSlugTemplate() {
  try {
    console.log("Getting file info...");
    const { data } = await octokit.repos.getContent({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: "astro-site/src/pages/wizards/[slug].astro"
    });
    
    console.log("Deleting [slug].astro from GitHub...");
    await octokit.repos.deleteFile({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: "astro-site/src/pages/wizards/[slug].astro",
      message: "Remove dynamic slug template - using specific wizard pages now",
      sha: data.sha
    });
    
    console.log("✓ Successfully deleted [slug].astro from GitHub");
    console.log("\nNetlify will now deploy the interactive wizard pages!");
    console.log("Wait ~2 minutes, then visit: https://knitbymachine.com/wizards/gauge-calculator");
  } catch (error) {
    if (error.status === 404) {
      console.log("File already deleted or doesn't exist");
    } else {
      console.error("Error:", error.message);
    }
  }
}

deleteSlugTemplate().catch(console.error);

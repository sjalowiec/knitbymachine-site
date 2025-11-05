import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backLinkStyles = `
.back-link {
  display: inline-block;
  color: #52682D;
  text-decoration: none;
  font-weight: 500;
  margin-bottom: 1.5rem;
  padding: 0.5rem 0;
  transition: color 0.2s;
}

.back-link:hover {
  color: #3d4e21;
  text-decoration: underline;
}

`;

const backLinkHTML = `  <div class="wizard-page">
    <div style="max-width: 800px; margin: 0 auto; padding: 0 1rem;">
      <a href="/wizards-catalog" class="back-link">← Back to Wizards Catalog</a>
    </div>
`;

const wizardsDir = path.join(__dirname, "astro-site/src/pages/wizards");
const files = fs.readdirSync(wizardsDir).filter(f => f.endsWith(".astro"));

console.log(`Adding back links to ${files.length} wizard files...\n`);

for (const file of files) {
  const filePath = path.join(wizardsDir, file);
  let content = fs.readFileSync(filePath, "utf-8");
  
  // Check if back link already exists
  if (content.includes("Back to Wizards Catalog")) {
    console.log(`✓ ${file} - already has back link, skipping`);
    continue;
  }
  
  // Add back link styles
  content = content.replace("</style>", backLinkStyles + "</style>");
  
  // Replace the opening wizard-page div with the back link version
  content = content.replace(
    /<div class="wizard-page">/,
    backLinkHTML
  );
  
  fs.writeFileSync(filePath, content, "utf-8");
  console.log(`✓ ${file} - back link added`);
}

console.log("\n✅ All wizard files updated with back links!");

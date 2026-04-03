import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { globSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const distDir = resolve(root, "dist");

// 1. Explicit redirects from the redirect map
const redirects = JSON.parse(
  readFileSync(resolve(root, "src/redirects.json"), "utf-8")
);

const lines = [];
const seen = new Set();

function addRule(from, to) {
  const key = from;
  if (seen.has(key)) return;
  seen.add(key);
  lines.push(`${from} ${to} 301`);
}

for (const [from, to] of Object.entries(redirects)) {
  addRule(from, to);
  addRule(`${from}.html`, to);
  addRule(`${from}/index.html`, to);
}

// 2. Generic .html and /index.html stripping for all built pages
//    Scan dist/ for all index.html files to discover page paths
import { readdirSync, statSync } from "fs";

function walkDir(dir, results = []) {
  for (const entry of readdirSync(dir)) {
    const full = resolve(dir, entry);
    if (entry.startsWith("_") || entry === "pagefind") continue;
    if (statSync(full).isDirectory()) {
      walkDir(full, results);
    } else if (entry === "index.html") {
      results.push(full);
    }
  }
  return results;
}

const htmlFiles = walkDir(distDir);

for (const file of htmlFiles) {
  // e.g. dist/hub/sdk/quickstart/index.html → /hub/sdk/quickstart
  const relative = file.slice(distDir.length).replace(/\/index\.html$/, "");
  const pagePath = relative || "/";

  if (pagePath === "/") continue; // skip root

  // /page.html → /page
  addRule(`${pagePath}.html`, pagePath);
  // /page/index.html → /page
  addRule(`${pagePath}/index.html`, pagePath);
}

writeFileSync(resolve(distDir, "_redirects"), lines.join("\n") + "\n");

console.log(`Generated dist/_redirects with ${lines.length} rules`);

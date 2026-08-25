/**
 * Duplicate title and meta-description guard.
 *
 * Runs against the BUILT html in dist/client, not the markdown source, because
 * Starlight generates the final page metadata, so source frontmatter alone is
 * not enough to find two pages that render the same title or description.
 *
 * Duplicate metadata is only visible site-wide. Length guidance remains a
 * review concern, not a merge-blocking requirement.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { resolve, dirname, relative } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = resolve(root, "dist", "client");

// noindex pages have no search presence to protect.
const EXEMPT = new Set(["/404"]);

if (!existsSync(clientDir)) {
  console.error("✖ dist/client not found — run the build first: pnpm run build:ci");
  process.exit(1);
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith("_") || entry === "pagefind") continue;
    const full = resolve(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (entry === "index.html") out.push(full);
  }
  return out;
}

const decode = (s) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");

function attribute(tag, name) {
  const match = tag.match(
    new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>]+))`, "i"),
  );
  return match && (match[1] ?? match[2] ?? match[3]);
}

function metaDescription(html) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    if (attribute(tag, "name")?.toLowerCase() === "description") return attribute(tag, "content") || "";
  }
  return "";
}

const failures = [];
const titles = new Map();
const descriptions = new Map();
let checked = 0;

for (const file of walk(clientDir)) {
  const page = "/" + relative(clientDir, file).replace(/\\/g, "/").replace(/\/?index\.html$/, "");
  if (EXEMPT.has(page)) continue;
  checked++;

  const html = readFileSync(file, "utf-8");
  const title = decode((html.match(/<title>([\s\S]*?)<\/title>/) || [, ""])[1]).trim();
  const desc = decode(metaDescription(html)).trim();

  if (title) {
    if (!titles.has(title)) titles.set(title, []);
    titles.get(title).push(page);
  }

  if (desc) {
    if (!descriptions.has(desc)) descriptions.set(desc, []);
    descriptions.get(desc).push(page);
  }
}

// Two pages sharing a title or description compete for the same query, and
// Google picks the winner rather than you.
for (const [title, pages] of titles)
  if (pages.length > 1) failures.push(`duplicate <title> "${title}" on: ${pages.join(", ")}`);
for (const [desc, pages] of descriptions)
  if (pages.length > 1)
    failures.push(`duplicate meta description on: ${pages.join(", ")} — "${desc.slice(0, 60)}..."`);

if (failures.length) {
  console.error(`✖ SEO check FAILED (${failures.length}):\n`);
  for (const f of failures) console.error("  - " + f);
  console.error("\nRules: rendered titles and meta descriptions must be unique.");
  process.exit(1);
}

console.log(
  `✓ SEO check passed: ${checked} pages — rendered titles and meta descriptions are unique.`,
);

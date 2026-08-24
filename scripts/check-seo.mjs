/**
 * SEO regression gate.
 *
 * Runs against the BUILT html in dist/client, not the markdown source, because
 * that is what a crawler actually sees: Starlight appends the site title to
 * every <title>, and card grids contribute words that never appear in the
 * frontmatter. Checking source would pass on pages that fail in production.
 *
 * Every threshold here was reached by an Ubersuggest remediation pass; the file
 * exists so the site does not drift back. See docs/seo-audit-external-handoff.md.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { resolve, dirname, relative } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = resolve(root, "dist", "client");

// Google truncates the SERP title around 60 characters and the snippet around
// 158. Below 120 it tends to pad the snippet with page text of its own choosing.
const TITLE_MAX = 60;
const DESC_MIN = 120;
const DESC_MAX = 158;
const MIN_WORDS = 250;

// Card-grid landing pages: navigational by design. They carry an orientation
// paragraph plus their cards and are deliberately not padded into articles.
// Adding a page here is a real decision — it means "this page is a signpost,
// not content". Do not add a page just to make this check pass.
const LANDING_PAGES = new Set([
  "/oss",
  "/oss/solutions",
  "/oss/checks/explanation",
  "/oss/checks/use-cases",
  "/oss/scan/explanation",
  "/oss/scan/how-to",
  "/oss/scan/reference",
  "/oss/scan/tutorials",
  "/hub/ui/setup",
]);

// noindex pages are exempt from every content rule.
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
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");

/** Words inside the page's own content region, excluding nav, sidebar and footer. */
function contentWords(html) {
  const start = html.indexOf("sl-markdown-content");
  const end = html.indexOf("</main>", start);
  if (start === -1 || end === -1) return null;
  const body = html
    .slice(start, end)
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/g, "")
    .replace(/<[^>]+>/g, " ");
  return decode(body).split(/\s+/).filter(Boolean).length;
}

const failures = [];
const titles = new Map();
const descriptions = new Map();
let checked = 0;

for (const file of walk(clientDir)) {
  const url = "/" + relative(clientDir, file).replace(/\\/g, "/").replace(/\/?index\.html$/, "");
  const page = url === "/" ? "/" : url;
  if (EXEMPT.has(page)) continue;
  checked++;

  const html = readFileSync(file, "utf-8");
  const title = decode((html.match(/<title>([\s\S]*?)<\/title>/) || [, ""])[1]).trim();
  const desc = decode((html.match(/<meta name="description" content="([\s\S]*?)"/) || [, ""])[1]).trim();

  if (!title) failures.push(`${page}: no <title>`);
  else if (title.length > TITLE_MAX)
    failures.push(`${page}: title is ${title.length} chars (max ${TITLE_MAX}) — "${title}"`);

  if (!desc) failures.push(`${page}: no meta description`);
  else if (desc.length < DESC_MIN || desc.length > DESC_MAX)
    failures.push(`${page}: meta description is ${desc.length} chars (want ${DESC_MIN}-${DESC_MAX})`);

  if (title) {
    if (!titles.has(title)) titles.set(title, []);
    titles.get(title).push(page);
  }
  if (desc) {
    if (!descriptions.has(desc)) descriptions.set(desc, []);
    descriptions.get(desc).push(page);
  }

  const words = contentWords(html);
  if (words === null) {
    failures.push(`${page}: could not locate the content region (Starlight markup changed?)`);
  } else if (words < MIN_WORDS && !LANDING_PAGES.has(page)) {
    failures.push(
      `${page}: ${words} words of content (min ${MIN_WORDS}) — expand it, or add it to LANDING_PAGES in this script if it is genuinely a signpost page`,
    );
  }
}

// Duplicate titles and descriptions make pages compete with each other for the
// same query, and Google picks the winner rather than you.
for (const [title, pages] of titles)
  if (pages.length > 1) failures.push(`duplicate <title> "${title}" on: ${pages.join(", ")}`);
for (const [desc, pages] of descriptions)
  if (pages.length > 1)
    failures.push(`duplicate meta description on: ${pages.join(", ")} — "${desc.slice(0, 60)}..."`);

// A stale allowlist entry is a silent hole in the check.
for (const page of LANDING_PAGES)
  if (!existsSync(resolve(clientDir, page.slice(1), "index.html")))
    failures.push(`LANDING_PAGES lists ${page}, which is not a built page — remove it`);

if (failures.length) {
  console.error(`✖ SEO check FAILED (${failures.length}):\n`);
  for (const f of failures) console.error("  - " + f);
  console.error(
    `\nThresholds: title ≤${TITLE_MAX}, description ${DESC_MIN}-${DESC_MAX}, content ≥${MIN_WORDS} words.`,
  );
  process.exit(1);
}

console.log(
  `✓ SEO check passed: ${checked} pages — titles ≤${TITLE_MAX} chars and unique, ` +
    `descriptions ${DESC_MIN}-${DESC_MAX} chars and unique, ` +
    `content ≥${MIN_WORDS} words (${LANDING_PAGES.size} landing pages exempt).`,
);

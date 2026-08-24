/**
 * Checks the <title> and <meta name="description"> of every built page.
 *
 * Four rules, all objective:
 *   - <title> present, at most 60 characters, unique across the site
 *   - meta description present, 120-158 characters, unique across the site
 *
 * Why built HTML and not frontmatter: Starlight appends " | Giskard
 * Documentation" to every title, so a 45-character frontmatter title ships as a
 * 69-character page title. Checking the source would pass pages that are
 * truncated in production.
 *
 * Why the lengths: Google truncates the result title around 60 characters and
 * the snippet around 158. Below 120 it tends to ignore the description and
 * assemble a snippet from page text instead.
 *
 * Why uniqueness: two pages sharing a title or description compete for the same
 * query and Google picks the winner, not you. This is the rule that pays for
 * the file. Length mistakes are visible in a single diff; collisions are not --
 * they appear one reasonable-looking page at a time and are only detectable
 * site-wide, which is exactly what per-PR review cannot see.
 *
 * Deliberately out of scope: word count, readability, keyword use, heading
 * structure. Those are judgement calls. Encoding a minimum page length here
 * would need a list of exempt pages, and that list goes stale the first time
 * someone writes a legitimately short page -- at which point the check is
 * theatre. Judge content in review; keep CI to what is countable.
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
  const desc = decode((html.match(/<meta name="description" content="([\s\S]*?)"/) || [, ""])[1]).trim();

  if (!title) {
    failures.push(`${page}: no <title>`);
  } else {
    if (title.length > TITLE_MAX)
      failures.push(
        `${page}: title is ${title.length} chars, max ${TITLE_MAX} — "${title}" ` +
          `(remember Starlight adds 24 chars to the frontmatter title)`,
      );
    if (!titles.has(title)) titles.set(title, []);
    titles.get(title).push(page);
  }

  if (!desc) {
    failures.push(`${page}: no meta description`);
  } else {
    if (desc.length < DESC_MIN || desc.length > DESC_MAX)
      failures.push(`${page}: meta description is ${desc.length} chars, want ${DESC_MIN}-${DESC_MAX}`);
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
  console.error(`\nRules: <title> ≤${TITLE_MAX} chars, description ${DESC_MIN}-${DESC_MAX} chars, both unique.`);
  process.exit(1);
}

console.log(
  `✓ SEO check passed: ${checked} pages — titles ≤${TITLE_MAX} chars and unique, ` +
    `descriptions ${DESC_MIN}-${DESC_MAX} chars and unique.`,
);

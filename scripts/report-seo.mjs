/**
 * Advisory title and meta-description length report.
 *
 * This runs against built HTML because Starlight adds the site name to rendered
 * titles. Findings are guidance for review, not merge-blocking requirements.
 */
import { appendFileSync, existsSync, readFileSync, readdirSync, statSync } from "fs";
import { dirname, relative, resolve } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = resolve(root, "dist", "client");
const TITLE_MAX = 60;
const DESC_MIN = 120;
const DESC_MAX = 158;
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

const findings = [];
let checked = 0;

for (const file of walk(clientDir)) {
  const page = "/" + relative(clientDir, file).replace(/\\/g, "/").replace(/\/?index\.html$/, "");
  if (EXEMPT.has(page)) continue;
  checked++;

  const html = readFileSync(file, "utf-8");
  const title = decode((html.match(/<title>([\s\S]*?)<\/title>/) || [, ""])[1]).trim();
  const description = decode(metaDescription(html)).trim();

  if (!title) findings.push(`${page}: no <title>`);
  else if (title.length > TITLE_MAX)
    findings.push(`${page}: title is ${title.length} characters (recommended maximum: ${TITLE_MAX})`);

  if (!description) findings.push(`${page}: no meta description`);
  else if (description.length < DESC_MIN || description.length > DESC_MAX)
    findings.push(
      `${page}: meta description is ${description.length} characters (recommended range: ${DESC_MIN}-${DESC_MAX})`,
    );
}

const report = [
  "## SEO metadata advisory",
  "",
  findings.length
    ? `${findings.length} non-blocking finding${findings.length === 1 ? "" : "s"} across ${checked} built pages:`
    : `No title or meta-description length findings across ${checked} built pages.`,
  ...(findings.length ? ["", ...findings.map((finding) => `- ${finding}`)] : []),
].join("\n");

console.log(report);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${report}\n`);

import { readFileSync, existsSync } from "fs";
import { resolve, dirname, relative } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = resolve(root, "dist", "client");
const redirectsFile = resolve(clientDir, "_redirects");

// Long-standing redirects that must always resolve to these exact targets, so the
// check can't pass silently on an emptied or half-generated file.
const CANARY = {
  "/genindex": "/",
  "/hub/sdk/datasets": "/hub/sdk/guides/datasets-and-checks",
  "/oss/notebooks": "https://legacy-docs.giskard.ai/en/stable/tutorials/",
};

// Built pages whose ".html" and "/index.html" variants must both strip to "<page>".
const HTML_STRIP = ["/hub/ui/setup", "/hub/ui/setup/projects", "/start/comparison"];

function builtPageExists(target) {
  const clean = target.replace(/[?#].*$/, "").replace(/\/$/, "");
  if (!clean) return existsSync(resolve(clientDir, "index.html"));
  const rel = clean.replace(/^\//, "");
  return (
    existsSync(resolve(clientDir, rel, "index.html")) ||
    existsSync(resolve(clientDir, `${rel}.html`)) ||
    existsSync(resolve(clientDir, rel))
  );
}

function parseRules(text) {
  const rules = new Map();
  const errors = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const parts = line.split(/\s+/);
    if (parts.length !== 3) {
      errors.push(`malformed rule, expected "<from> <to> <status>": "${line}"`);
      continue;
    }
    const [from, to, code] = parts;
    if (line.includes("\\")) errors.push(`backslash in rule: "${line}"`);
    if (!from.startsWith("/")) errors.push(`"from" is not absolute: "${line}"`);
    if (from.startsWith("/client/")) errors.push(`"from" leaks the /client/ assets dir: "${line}"`);
    if (!/^30[1278]$/.test(code)) errors.push(`non-redirect status "${code}": "${line}"`);
    rules.set(from, to);
  }
  return { rules, errors };
}

function ruleError(rules, from, expected) {
  if (!rules.has(from)) return `missing rule: ${from} -> ${expected}`;
  if (rules.get(from) !== expected) return `wrong target: ${from} -> ${rules.get(from)} (expected ${expected})`;
  return null;
}

// The file must live at the served assets root (dist/client/), next to _headers.
// Cloudflare ignores a _redirects at dist/, which is what broke every redirect.
if (!existsSync(redirectsFile)) {
  const stray = resolve(root, "dist", "_redirects");
  const hint = existsSync(stray)
    ? `it is at ${relative(root, stray)}, which Cloudflare ignores; generate-redirects.mjs must write into dist/client/`
    : "run the build first: pnpm run build:ci";
  console.error(`✖ ${relative(root, redirectsFile)} not found — ${hint}`);
  process.exit(1);
}

const { rules, errors } = parseRules(readFileSync(redirectsFile, "utf-8"));
const redirects = Object.entries(JSON.parse(readFileSync(resolve(root, "src", "redirects.json"), "utf-8")));

const failures = [...errors];
const add = (msg) => msg && failures.push(msg);

if (redirects.length === 0) add("src/redirects.json is empty (unexpected)");

for (const [from, to] of redirects) add(ruleError(rules, from, to));
for (const [from, to] of Object.entries(CANARY)) add(ruleError(rules, from, to));

for (const page of HTML_STRIP) {
  if (!builtPageExists(page)) {
    add(`html-strip page not built (update HTML_STRIP): ${page}`);
  } else {
    add(ruleError(rules, `${page}.html`, page));
    add(ruleError(rules, `${page}/index.html`, page));
  }
}

// Internal targets must resolve to a built page (no 301-to-404).
for (const [from, to] of redirects) {
  if (to.startsWith("/") && !to.startsWith("//") && !builtPageExists(to)) {
    add(`${from} -> ${to} has no built page (would 301 to a 404)`);
  }
}

if (failures.length) {
  console.error(`✖ Redirect check FAILED (${failures.length}):\n`);
  for (const f of failures) console.error("  - " + f);
  process.exit(1);
}

console.log(
  `✓ Redirect check passed: ${relative(root, redirectsFile)} present, ` +
    `${redirects.length} redirects.json entries, ` +
    `${Object.keys(CANARY).length} redirect + ${HTML_STRIP.length} html-strip canaries, ` +
    `internal targets resolve (${rules.size} rules total).`
);

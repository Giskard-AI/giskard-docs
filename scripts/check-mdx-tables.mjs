import { readFileSync, readdirSync } from "fs";
import { resolve, dirname, relative } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const clientDir = resolve(root, "dist", "client");

// MDX pages that contain Markdown tables and must render at least one <table>.
// The global scan below already protects every page; this list is a canary so
// the check stays meaningful (it fails if the build stops emitting these pages
// or their tables vanish).
const MDX_TABLE_PAGES = [
  "start/comparison",
  "oss/checks/tutorials/test-suites",
  "oss/checks/reference/core",
  "oss/checks/reference/utils",
  "oss/checks/reference/checks",
  "hub/sdk/reference",
];

// A GFM table delimiter row, e.g. "| :--- | ---: |". Its presence in rendered
// prose means a Markdown table was not parsed into a <table>.
const SEPARATOR = /\|\s*:?-{3,}:?\s*\|/;

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = resolve(dir, entry.name);
    if (entry.isDirectory()) walk(p, acc);
    else if (entry.name.endsWith(".html")) acc.push(p);
  }
  return acc;
}

// Drop code, script and style blocks so legitimate examples that show table
// syntax inside <pre>/<code> do not trip the scan.
function prose(html) {
  return html
    .replace(/<pre[\s\S]*?<\/pre>/gi, "")
    .replace(/<code[\s\S]*?<\/code>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");
}

let htmlFiles;
try {
  htmlFiles = walk(clientDir);
} catch {
  console.error(
    `✖ MDX table check: build output not found at ${relative(root, clientDir)}.\n` +
      "Run the build first: pnpm run build:ci"
  );
  process.exit(1);
}

const failures = [];

// 1. No built page may contain an unparsed Markdown table.
for (const file of htmlFiles) {
  if (SEPARATOR.test(prose(readFileSync(file, "utf-8")))) {
    failures.push(
      `${relative(clientDir, file)}: raw Markdown table separator in rendered output (table not parsed)`
    );
  }
}

// 2. Each canary MDX page must render a real <table>.
for (const page of MDX_TABLE_PAGES) {
  const file = resolve(clientDir, page, "index.html");
  let html;
  try {
    html = readFileSync(file, "utf-8");
  } catch {
    failures.push(`${page}: built page not found at dist/client/${page}/index.html`);
    continue;
  }
  if (!/<table[\s>]/i.test(html)) {
    failures.push(`${page}: no <table> element rendered (Markdown table did not parse)`);
  }
}

if (failures.length > 0) {
  console.error("✖ MDX table check FAILED:\n");
  for (const f of failures) console.error("  - " + f);
  process.exit(1);
}

console.log(
  `✓ MDX table check passed: scanned ${htmlFiles.length} pages, ` +
    `${MDX_TABLE_PAGES.length} canary MDX table pages render <table>, no raw separators.`
);

#!/usr/bin/env node
/**
 * Format Python code blocks in .md/.mdx files using black.
 *
 * Works locally and in Cloudflare Pages CI:
 *  - Uses black if already installed
 *  - Falls back to `pip3 install black` if not found
 *  - Exits 0 gracefully if Python/pip3 are unavailable
 *
 * Usage:
 *   node scripts/format-code-blocks.mjs [src/content/docs]
 */

import { execSync, spawnSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { randomUUID } from "crypto";
import {
  replacePythonFenceCode,
  walkMarkdownFiles,
} from "./markdown-python-fences.mjs";

const LINE_LENGTH = 80;

// ── Ensure black is available ────────────────────────────────────────────────

function ensureBlack() {
  // Already installed?
  const check = spawnSync("black", ["--version"], { encoding: "utf8" });
  if (check.status === 0) return true;

  console.log("black not found — attempting pip3 install black …");
  const install = spawnSync("pip3", ["install", "black", "--quiet"], {
    stdio: "inherit",
  });
  if (install.status === 0) return true;

  console.warn(
    "Warning: could not install black. Skipping Python code formatting.",
  );
  return false;
}

// ── Format a single Python snippet ──────────────────────────────────────────

function formatPython(code) {
  const tmp = join(tmpdir(), `${randomUUID()}.py`);
  writeFileSync(tmp, code, "utf8");

  const result = spawnSync(
    "black",
    [`--line-length=${LINE_LENGTH}`, "--quiet", tmp],
    { encoding: "utf8" },
  );

  if (result.status !== 0) return code; // black failed — leave unchanged
  return readFileSync(tmp, "utf8");
}

// ── Process a single file ────────────────────────────────────────────────────

function processFile(filepath) {
  const original = readFileSync(filepath, "utf8");
  const result = replacePythonFenceCode(original, formatPython);

  if (result !== original) {
    writeFileSync(filepath, result, "utf8");
    return true;
  }
  return false;
}

// ── Main ─────────────────────────────────────────────────────────────────────

const root = process.argv[2] ?? "src/content/docs";

if (!ensureBlack()) process.exit(0);

let count = 0;
for (const file of walkMarkdownFiles(root)) {
  if (processFile(file)) {
    console.log(`  reformatted ${file}`);
    count++;
  }
}

console.log(
  count ? `\n${count} file(s) reformatted.` : "All code blocks already clean.",
);

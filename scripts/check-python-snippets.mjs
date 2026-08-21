import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, relative, resolve } from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";

import {
  parsePythonFences,
  walkMarkdownFiles,
} from "./markdown-python-fences.mjs";

const DEFAULT_DOCS_ROOT = "src/content/docs/oss";
const FIXTURE_ROOT = resolve("tests/fixtures/python-snippets");

function generatedSnippetPath(generatedRoot, docsRoot, pagePath) {
  const relativePagePath = relative(docsRoot, pagePath);
  const digest = createHash("sha256").update(relativePagePath).digest("hex");
  return join(generatedRoot, `${digest}.py`);
}

/**
 * Materialize each page's non-skipped Python fences as one async file for
 * Pyright. This preserves source order and lets documentation use top-level
 * await, as it would in a notebook or async test.
 */
export function preparePythonSnippetFiles(docsRoot, generatedRoot) {
  const snippets = new Map();

  for (const pagePath of walkMarkdownFiles(docsRoot)) {
    const source = readFileSync(pagePath, "utf8");
    const fences = parsePythonFences(source, { pagePath }).filter(
      (fence) => !fence.skip,
    );
    if (fences.length === 0) continue;

    const generatedLines = ["async def _snippet_main():"];
    const generatedFences = fences.map((fence) => {
      const generatedStartLine = generatedLines.length;
      const codeLines = fence.code.split("\n");
      generatedLines.push(
        ...codeLines.map((line) => (line ? `    ${line}` : line)),
      );
      const generatedEndLine = generatedLines.length;
      generatedLines.push("");
      return { ...fence, generatedStartLine, generatedEndLine };
    });

    const generatedPath = resolve(
      generatedSnippetPath(generatedRoot, docsRoot, pagePath),
    );
    const code = `${generatedLines.join("\n")}\n`;
    writeFileSync(generatedPath, code);
    snippets.set(generatedPath, {
      pagePath,
      generatedPath,
      code,
      fences: generatedFences,
    });
  }

  return snippets;
}

/** Format one Pyright JSON diagnostic at its original Markdown location. */
export function formatDiagnostic(diagnostic, snippets) {
  const snippet = snippets.get(resolve(diagnostic.file));
  if (!snippet) return null;

  const generatedLine = diagnostic.range.start.line;
  const fence = snippet.fences.find(
    ({ generatedStartLine, generatedEndLine }) =>
      generatedStartLine <= generatedLine && generatedLine < generatedEndLine,
  );
  if (!fence) return null;

  const line = fence.codeStartLine + generatedLine - fence.generatedStartLine;
  const column = Math.max(1, diagnostic.range.start.character - 3);
  const rule = diagnostic.rule ? ` [${diagnostic.rule}]` : "";
  return `${snippet.pagePath}:${line}:${column} - ${diagnostic.severity}${rule}: ${diagnostic.message}`;
}

export function checkPythonSnippets({ docsRoot, pyrightCommand = "pyright" }) {
  const generatedRoot = mkdtempSync(join(tmpdir(), "giskard-python-snippets-"));

  try {
    const snippets = preparePythonSnippetFiles(docsRoot, generatedRoot);
    if (snippets.size === 0) return { diagnostics: [], exitCode: 0 };

    const result = spawnSync(
      pyrightCommand,
      [
        "--outputjson",
        "--project",
        "pyrightconfig.json",
        "--extraPaths",
        FIXTURE_ROOT,
        ...snippets.keys(),
      ],
      { encoding: "utf8" },
    );
    if (result.error) throw result.error;

    let report;
    try {
      report = JSON.parse(result.stdout);
    } catch {
      throw new Error(`Pyright did not return JSON:\n${result.stderr || result.stdout}`);
    }

    const diagnostics = (report.generalDiagnostics ?? [])
      .map((diagnostic) => formatDiagnostic(diagnostic, snippets))
      .filter(Boolean);
    return { diagnostics, exitCode: result.status ?? 1 };
  } finally {
    rmSync(generatedRoot, { recursive: true, force: true });
  }
}

function main() {
  const docsRoot = resolve(process.argv[2] ?? DEFAULT_DOCS_ROOT);
  const { diagnostics, exitCode } = checkPythonSnippets({ docsRoot });

  for (const diagnostic of diagnostics) console.error(diagnostic);
  if (diagnostics.length === 0) {
    console.log(`Pyright checked Python fences in ${relative(process.cwd(), docsRoot) || basename(docsRoot)}.`);
  }
  process.exitCode = exitCode;
}

if (import.meta.url === `file://${process.argv[1]}`) main();

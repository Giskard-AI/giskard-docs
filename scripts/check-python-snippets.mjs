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

function generatedSnippetPath(generatedRoot, docsRoot, pagePath, index) {
  const relativePagePath = relative(docsRoot, pagePath);
  const digest = createHash("sha256").update(relativePagePath).digest("hex");
  return join(generatedRoot, `${digest}.${index}.py`);
}

/**
 * Materialize non-skipped Python fences as individual files for Pyright.
 * The returned map maps each generated file to its Markdown source location.
 */
export function preparePythonSnippetFiles(docsRoot, generatedRoot) {
  const snippets = new Map();

  for (const pagePath of walkMarkdownFiles(docsRoot)) {
    const source = readFileSync(pagePath, "utf8");
    for (const fence of parsePythonFences(source, { pagePath })) {
      if (fence.skip) continue;

      const generatedPath = generatedSnippetPath(
        generatedRoot,
        docsRoot,
        pagePath,
        fence.index,
      );
      writeFileSync(generatedPath, fence.code);
      snippets.set(resolve(generatedPath), {
        ...fence,
        generatedPath: resolve(generatedPath),
      });
    }
  }

  return snippets;
}

/** Format one Pyright JSON diagnostic at its original Markdown location. */
export function formatDiagnostic(diagnostic, snippets) {
  const snippet = snippets.get(resolve(diagnostic.file));
  if (!snippet) return null;

  const line = snippet.codeStartLine + diagnostic.range.start.line;
  const column = diagnostic.range.start.character + 1;
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
      ["--outputjson", "--project", "pyrightconfig.json", ...snippets.keys()],
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

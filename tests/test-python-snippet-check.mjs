import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  formatDiagnostic,
  preparePythonSnippetFiles,
} from "../scripts/check-python-snippets.mjs";

test("preparePythonSnippetFiles maps generated Pyright paths back to source fences", () => {
  const docsRoot = mkdtempSync(join(tmpdir(), "python-snippets-docs-"));
  const generatedRoot = mkdtempSync(join(tmpdir(), "python-snippets-generated-"));
  const pagePath = join(docsRoot, "guide.mdx");
  writeFileSync(pagePath, "# Guide\n\n```python\nvalue: str = 1\n```\n");

  const snippets = preparePythonSnippetFiles(docsRoot, generatedRoot);

  assert.equal(snippets.size, 1);
  const [snippet] = snippets.values();
  assert.equal(snippet.pagePath, pagePath);
  assert.equal(snippet.codeStartLine, 4);
  assert.equal(snippet.codeEndLine, 4);
  assert.match(snippet.generatedPath, /[a-f0-9]{64}\.0\.py$/);
});

test("formatDiagnostic reports the Markdown source location", () => {
  const generatedPath = "/tmp/snippets/guide.mdx.0.py";
  const result = formatDiagnostic(
    {
      file: generatedPath,
      severity: "error",
      message: "Expression of type \\\"Literal[1]\\\" cannot be assigned to declared type \\\"str\\\"",
      rule: "reportAssignmentType",
      range: {
        start: { line: 0, character: 13 },
        end: { line: 0, character: 14 },
      },
    },
    new Map([
      [
        generatedPath,
        {
          pagePath: "/docs/guide.mdx",
          codeStartLine: 4,
        },
      ],
    ]),
  );

  assert.equal(
    result,
    "/docs/guide.mdx:4:14 - error [reportAssignmentType]: Expression of type \\\"Literal[1]\\\" cannot be assigned to declared type \\\"str\\\"",
  );
});

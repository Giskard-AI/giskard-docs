import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  formatDiagnostic,
  preparePythonSnippetFiles,
} from "../scripts/check-python-snippets.mjs";

test("preparePythonSnippetFiles assembles page fences in an async function", () => {
  const docsRoot = mkdtempSync(join(tmpdir(), "python-snippets-docs-"));
  const generatedRoot = mkdtempSync(join(tmpdir(), "python-snippets-generated-"));
  const pagePath = join(docsRoot, "guide.mdx");
  writeFileSync(
    pagePath,
    "# Guide\n\n```python\nvalue: str = 1\n```\n\n```python\nawait run(value)\n```\n",
  );

  const snippets = preparePythonSnippetFiles(docsRoot, generatedRoot);

  assert.equal(snippets.size, 1);
  const [snippet] = snippets.values();
  assert.equal(snippet.pagePath, pagePath);
  assert.match(snippet.generatedPath, /[a-f0-9]{64}\.py$/);
  assert.deepEqual(snippet.fences.map(({ codeStartLine }) => codeStartLine), [4, 8]);
  assert.match(snippet.code, /async def _snippet_main\(\):/);
  assert.match(snippet.code, /from typing import Any/);
  assert.match(snippet.code, /    value: str = 1/);
  assert.match(snippet.code, /    await run\(value\)/);
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
        start: { line: 1, character: 17 },
        end: { line: 1, character: 18 },
      },
    },
    new Map([
      [
        generatedPath,
        {
          pagePath: "/docs/guide.mdx",
          fences: [
            {
              codeStartLine: 4,
              generatedStartLine: 1,
              generatedEndLine: 2,
            },
          ],
        },
      ],
    ]),
  );

  assert.equal(
    result,
    "/docs/guide.mdx:4:14 - error [reportAssignmentType]: Expression of type \\\"Literal[1]\\\" cannot be assigned to declared type \\\"str\\\"",
  );
});

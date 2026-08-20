import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  parsePythonFences,
  replacePythonFenceCode,
  walkMarkdownFiles,
} from "../scripts/markdown-python-fences.mjs";

const fixturePath = new URL("./fixtures/python-fences/sample.mdx", import.meta.url);
const fixture = await import("node:fs").then(({ readFileSync }) =>
  readFileSync(fixturePath, "utf8"),
);

test("parsePythonFences preserves order, page location, and immediate skip markers", () => {
  assert.deepEqual(
    parsePythonFences(fixture, { pagePath: "docs/sample.mdx" }),
    [
      {
        pagePath: "docs/sample.mdx",
        index: 0,
        language: "python",
        code: "first = 1\n",
        fenceStartLine: 3,
        codeStartLine: 4,
        codeEndLine: 4,
        fenceEndLine: 5,
        skip: null,
      },
      {
        pagePath: "docs/sample.mdx",
        index: 1,
        language: "py",
        code: "second = 2\n",
        fenceStartLine: 8,
        codeStartLine: 9,
        codeEndLine: 9,
        fenceEndLine: 10,
        skip: { line: 7, reason: "demo API is unavailable" },
      },
      {
        pagePath: "docs/sample.mdx",
        index: 2,
        language: "python",
        code: "third = 3\n",
        fenceStartLine: 16,
        codeStartLine: 17,
        codeEndLine: 17,
        fenceEndLine: 18,
        skip: null,
      },
      {
        pagePath: "docs/sample.mdx",
        index: 3,
        language: "python",
        code: "fourth = 4\n",
        fenceStartLine: 25,
        codeStartLine: 26,
        codeEndLine: 26,
        fenceEndLine: 27,
        skip: { line: 24, reason: "no reason" },
      },
    ],
  );
});

test("parsePythonFences recognizes MDX skip comments", () => {
  const fences = parsePythonFences(
    "{/* pyright-skip: reader-owned application module */}\n```python\nvalue = 1\n```\n",
  );

  assert.deepEqual(fences[0].skip, {
    line: 1,
    reason: "reader-owned application module",
  });
});

test("walkMarkdownFiles returns only Markdown pages in deterministic path order", () => {
  const root = mkdtempSync(join(tmpdir(), "python-fences-"));
  mkdirSync(join(root, "nested"));
  writeFileSync(join(root, "z.mdx"), "");
  writeFileSync(join(root, "a.md"), "");
  writeFileSync(join(root, "nested", "b.mdx"), "");
  writeFileSync(join(root, "nested", "ignored.txt"), "");

  assert.deepEqual([...walkMarkdownFiles(root)], [
    join(root, "a.md"),
    join(root, "nested", "b.mdx"),
    join(root, "z.mdx"),
  ]);
});

test("replacePythonFenceCode keeps fence boundaries and transforms only Python code", () => {
  const result = replacePythonFenceCode(fixture, (code) =>
    code.replaceAll(" = ", "="),
  );

  assert.match(result, /```python\nfirst=1\n```/);
  assert.match(result, /```py\nsecond=2\n```/);
  assert.match(result, /```javascript\nconst ignored = true;\n```/);
});

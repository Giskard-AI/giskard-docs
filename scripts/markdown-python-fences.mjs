import { readdirSync } from "fs";
import { extname, join } from "path";

const MARKDOWN_EXTENSIONS = new Set([".md", ".mdx"]);
const PYTHON_FENCE_RE = /^(?:\s*(?:>\s*)?)(`{3,}|~{3,})[ \t]*(python|py)(?:[ \t]+.*)?[ \t]*$/i;
const PYRIGHT_SKIP_RE =
  /^\s*<!--\s*pyright-skip\s*:\s*(.+?)\s*-->\s*$/i;

/**
 * Yield Markdown pages below a directory in stable path order.
 */
export function* walkMarkdownFiles(directory) {
  const entries = readdirSync(directory, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      yield* walkMarkdownFiles(path);
    } else if (MARKDOWN_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
      yield path;
    }
  }
}

function sourceLines(source) {
  const lines = [];
  let start = 0;
  let number = 1;

  while (start < source.length) {
    const newline = source.indexOf("\n", start);
    const end = newline === -1 ? source.length : newline + 1;
    const textEnd = newline === -1 ? end : newline;
    const text = source.slice(start, textEnd).replace(/\r$/, "");
    lines.push({ start, end, text, number });
    start = end;
    number++;
  }

  return lines;
}

function closingFencePattern(openingFence) {
  const character = openingFence[0] === "`" ? "`" : "~";
  return new RegExp(`^(?:\\s*(?:>\\s*)?)${character}{${openingFence.length},}[ \\t]*$`);
}

/**
 * Parse Python fenced blocks in document order.
 *
 * Line fields are stable diagnostics for checkers. `includeOffsets` adds the
 * exact source range needed by formatters. A pyright-skip marker applies only
 * when it is on the line immediately preceding the opening fence.
 */
export function parsePythonFences(
  source,
  { pagePath = null, includeOffsets = false } = {},
) {
  const lines = sourceLines(source);
  const fences = [];

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const opening = PYTHON_FENCE_RE.exec(lines[lineIndex].text);
    if (!opening) continue;

    const isClosingFence = closingFencePattern(opening[1]);
    let closingIndex = lineIndex + 1;
    while (
      closingIndex < lines.length &&
      !isClosingFence.test(lines[closingIndex].text)
    ) {
      closingIndex++;
    }

    if (closingIndex === lines.length) continue;

    const marker = PYRIGHT_SKIP_RE.exec(lines[lineIndex - 1]?.text ?? "");
    const closingLine = lines[closingIndex];
    fences.push({
      pagePath,
      index: fences.length,
      language: opening[2].toLowerCase(),
      code: source.slice(lines[lineIndex].end, closingLine.start),
      fenceStartLine: lines[lineIndex].number,
      codeStartLine: lines[lineIndex].number + 1,
      codeEndLine: closingLine.number - 1,
      fenceEndLine: closingLine.number,
      ...(includeOffsets
        ? {
            sourceStartOffset: lines[lineIndex].end,
            sourceEndOffset: closingLine.start,
          }
        : {}),
      skip: marker
        ? { line: lines[lineIndex - 1].number, reason: marker[1].trim() }
        : null,
    });
    lineIndex = closingIndex;
  }

  return fences;
}

/**
 * Replace Python fence contents without changing Markdown fence boundaries.
 */
export function replacePythonFenceCode(source, transform) {
  const fences = parsePythonFences(source, { includeOffsets: true });
  let result = source;

  for (const fence of [...fences].reverse()) {
    const replacement = transform(fence.code, fence);
    if (replacement === fence.code) continue;
    result =
      result.slice(0, fence.sourceStartOffset) +
      replacement +
      result.slice(fence.sourceEndOffset);
  }

  return result;
}

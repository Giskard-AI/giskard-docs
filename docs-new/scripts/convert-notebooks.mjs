/**
 * convert-notebooks.mjs
 *
 * Converts every *.ipynb under src/content/docs/ to a co-located .mdx file,
 * injecting a Colab badge after the frontmatter. Rich display outputs (e.g.
 * Giskard HTML reports) are rendered like the hand-written docs: Starlight
 * Card + <pre class="notebook-output-rich" set:html={...}>; base text uses
 * --sl-color-text and custom.css remaps Jupyter hex colors in dark theme.
 *
 * Algorithm per notebook:
 *  1. JSON.parse the .ipynb file
 *  2. First "raw" cell whose source starts with "---" → frontmatter
 *  3. Remaining cells:
 *       "markdown" → emit source as-is
 *       "code"     → skip if first line is "# colab-only"; else wrap in ```python
 *                     optional: following cell outputs → <Card title="Output">…{/Card>
 *       "raw"      → skip
 *  4. Build Colab URL from path relative to git root
 *  5. Write .mdx; remove sibling .md if present (avoid duplicate Starlight routes)
 *
 * Pure Node.js – no Python / Jupyter required.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, unlinkSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

let GIT_ROOT = ROOT;
let GITHUB_SLUG = 'Giskard-AI/giskard-docs'; // fallback
try {
  GIT_ROOT = execSync('git rev-parse --show-toplevel', { cwd: ROOT })
    .toString()
    .trim();
  const remoteUrl = execSync('git remote get-url origin', { cwd: ROOT })
    .toString()
    .trim();
  const match = remoteUrl.match(/github\.com[/:](.+?)(?:\.git)?$/);
  if (match) GITHUB_SLUG = match[1];
} catch {
  // Not a git repo or no remote — fall back to the values above.
}

const PRE_STYLE_PROPS = `  style={{
    whiteSpace: "pre",
    overflowX: "auto",
    lineHeight: "normal",
    fontFamily: "Menlo, DejaVu Sans Mono, consolas, Courier New, monospace",
    color: "var(--sl-color-text)",
  }}`;

const CARD_IMPORT = 'import { Card } from "@astrojs/starlight/components";';

// ---------------------------------------------------------------------------
// File discovery
// ---------------------------------------------------------------------------

function* walkSync(dir) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkSync(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.ipynb')) {
      yield fullPath;
    }
  }
}

// ---------------------------------------------------------------------------
// Conversion helpers
// ---------------------------------------------------------------------------

function cellSource(cell) {
  const src = cell.source;
  if (Array.isArray(src)) return src.join('');
  return src ?? '';
}

function normalizeText(t) {
  return String(t ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\n$/, '');
}

/** Inner HTML of top-level Rich/HTML repr (<pre style=…>…</pre>) or whole fragment. */
function htmlDisplayFragment(html) {
  const s = Array.isArray(html) ? html.join('') : String(html ?? '');
  const m = s.match(/^<pre[^>]*>([\s\S]*)<\/pre>\s*$/i);
  if (m) return m[1].trimEnd();
  return s.trim();
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Plain stream/plain output: safe to emit as literal text inside <Card> (not inside braces). */
function isSafeMdxCardLiteral(text) {
  return !/[<>{}]/.test(text);
}

function preSetHtml(innerHtml) {
  return `<pre
  class="notebook-output-rich"
${PRE_STYLE_PROPS}
  set:html={${JSON.stringify(innerHtml)}}
/>`;
}

function preEscapedText(text) {
  return preSetHtml(escapeHtml(normalizeText(text)));
}

/**
 * Flatten notebook outputs to ordered segments (stream text vs HTML rich blocks).
 */
function outputSegments(outputs) {
  if (!Array.isArray(outputs) || outputs.length === 0) return [];

  const chunks = [];
  for (const out of outputs) {
    if (out.output_type === 'stream') {
      const text = normalizeText(Array.isArray(out.text) ? out.text.join('') : (out.text ?? ''));
      if (text) chunks.push({ kind: 'stream', name: out.name || 'stdout', text });
    } else if (out.output_type === 'execute_result' || out.output_type === 'display_data') {
      const data = out.data || {};
      const html = data['text/html'];
      if (html) {
        chunks.push({ kind: 'html', inner: htmlDisplayFragment(html) });
        continue;
      }
      const plain = data['text/plain'];
      if (plain) {
        const text = normalizeText(Array.isArray(plain) ? plain.join('') : plain);
        if (text) chunks.push({ kind: 'stream', name: 'result', text });
      }
    } else if (out.output_type === 'error') {
      const tb = Array.isArray(out.traceback) ? out.traceback.join('\n') : '';
      const msg = normalizeText(`${out.ename || 'Error'}: ${out.evalue || ''}${tb ? '\n' + tb : ''}`);
      if (msg) chunks.push({ kind: 'stream', name: 'stderr', text: msg });
    }
  }

  // Merge consecutive stream chunks (stdout often splits across stream messages).
  const merged = [];
  for (const c of chunks) {
    if (c.kind === 'stream' && merged.length && merged[merged.length - 1].kind === 'stream') {
      merged[merged.length - 1].text += `\n${c.text}`;
    } else {
      merged.push({ ...c });
    }
  }
  return merged;
}

function cellOutputsMdx(outputs) {
  const segments = outputSegments(outputs);
  if (segments.length === 0) return { mdx: '', usesCard: false };

  const bodyParts = [];
  for (const seg of segments) {
    if (seg.kind === 'html') {
      bodyParts.push(preSetHtml(seg.inner));
    } else {
      const t = normalizeText(seg.text);
      if (isSafeMdxCardLiteral(t)) {
        bodyParts.push(t);
      } else {
        bodyParts.push(preEscapedText(t));
      }
    }
  }

  const mdx = `<Card title="Output">\n\n${bodyParts.join('\n\n')}\n\n</Card>`;
  return { mdx, usesCard: true };
}

function convertNotebook(notebookPath) {
  const nb = JSON.parse(readFileSync(notebookPath, 'utf8'));
  const cells = nb.cells ?? [];

  let frontmatter = '';
  let startIdx = 0;

  for (let i = 0; i < cells.length; i++) {
    if (cells[i].cell_type === 'raw') {
      const src = cellSource(cells[i]).trim();
      if (src.startsWith('---')) {
        frontmatter = src;
        startIdx = i + 1;
      }
      break;
    }
  }

  const relPath = relative(GIT_ROOT, notebookPath).replace(/\\/g, '/');
  const colabUrl = `https://colab.research.google.com/github/${GITHUB_SLUG}/blob/main/${relPath}`;
  const colabBadge = `[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](${colabUrl})`;

  const parts = [];
  let needsCardImport = false;

  for (let i = startIdx; i < cells.length; i++) {
    const cell = cells[i];
    const src = cellSource(cell);

    if (cell.cell_type === 'markdown') {
      parts.push(src);
    } else if (cell.cell_type === 'code') {
      if (src.trimStart().startsWith('# colab-only')) continue;
      parts.push('```python\n' + src + '\n```');
      const { mdx: outMdx, usesCard } = cellOutputsMdx(cell.outputs);
      if (outMdx) {
        parts.push(outMdx);
        if (usesCard) needsCardImport = true;
      }
    }
  }

  const body = parts.join('\n\n');

  const importBlock = needsCardImport ? `${CARD_IMPORT}\n\n` : '';
  const afterFm = frontmatter
    ? `${frontmatter}\n\n${importBlock}${colabBadge}\n\n${body}`
    : `${importBlock}${colabBadge}\n\n${body}`;

  const outPath = notebookPath.replace(/\.ipynb$/, '.mdx');
  writeFileSync(outPath, afterFm, 'utf8');

  const legacyMd = notebookPath.replace(/\.ipynb$/, '.md');
  if (existsSync(legacyMd)) {
    unlinkSync(legacyMd);
    console.log(`  removed legacy: ${relative(GIT_ROOT, legacyMd)}`);
  }

  const relOut = relative(GIT_ROOT, outPath);
  console.log(`  converted: ${relPath} → ${relOut}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const contentDir = join(ROOT, 'src', 'content', 'docs');
const notebooks = [...walkSync(contentDir)];

if (notebooks.length === 0) {
  process.exit(0);
}

console.log(`Converting ${notebooks.length} notebook(s)…`);
for (const nb of notebooks) {
  convertNotebook(nb);
}
console.log('Done.');

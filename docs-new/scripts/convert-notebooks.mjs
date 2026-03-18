/**
 * convert-notebooks.mjs
 *
 * Converts every *.ipynb file found under src/content/docs/ to a co-located
 * .md file, injecting a Colab badge immediately after the frontmatter block.
 *
 * Algorithm per notebook:
 *  1. JSON.parse the .ipynb file
 *  2. First "raw" cell whose source starts with "---" → frontmatter
 *  3. Remaining cells:
 *       "markdown" → emit source as-is
 *       "code"     → skip if first line is "# colab-only"; else wrap in ```python
 *       "raw"      → skip
 *  4. Build Colab URL from the file's path relative to repo root
 *  5. Write: frontmatter + "\n\n" + COLAB_BADGE + "\n\n" + body
 *
 * Pure Node.js – no Python / Jupyter required.
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Resolve the actual git repository root so the Colab path is correct for
// notebooks that live in a subdirectory (e.g. docs-new/) of the repo.
let GIT_ROOT = ROOT;
let GITHUB_SLUG = 'Giskard-AI/giskard-docs'; // fallback
try {
  GIT_ROOT = execSync('git rev-parse --show-toplevel', { cwd: ROOT })
    .toString()
    .trim();
  const remoteUrl = execSync('git remote get-url origin', { cwd: ROOT })
    .toString()
    .trim();
  // Handles both https://github.com/org/repo.git and git@github.com:org/repo.git
  const match = remoteUrl.match(/github\.com[/:](.+?)(?:\.git)?$/);
  if (match) GITHUB_SLUG = match[1];
} catch {
  // Not a git repo or no remote — fall back to the values above.
}

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
// Conversion
// ---------------------------------------------------------------------------

function cellSource(cell) {
  const src = cell.source;
  if (Array.isArray(src)) return src.join('');
  return src ?? '';
}

function cellOutputText(cell) {
  const outputs = cell.outputs;
  if (!Array.isArray(outputs) || outputs.length === 0) return '';

  const lines = [];
  for (const out of outputs) {
    if (out.output_type === 'stream') {
      // stdout / stderr
      const text = Array.isArray(out.text) ? out.text.join('') : (out.text ?? '');
      if (text) lines.push(text.replace(/\n$/, ''));
    } else if (out.output_type === 'execute_result' || out.output_type === 'display_data') {
      // Prefer plain text; skip images and other non-text mime types
      const plain = out.data?.['text/plain'];
      if (plain) {
        const text = Array.isArray(plain) ? plain.join('') : plain;
        lines.push(text.replace(/\n$/, ''));
      }
    } else if (out.output_type === 'error') {
      lines.push(`${out.ename}: ${out.evalue}`);
    }
  }

  if (lines.length === 0) return '';
  return '```\n' + lines.join('\n') + '\n```';
}

function convertNotebook(notebookPath) {
  const nb = JSON.parse(readFileSync(notebookPath, 'utf8'));
  const cells = nb.cells ?? [];

  // 1. Extract frontmatter from the first raw cell that starts with "---".
  //    Some notebooks have setup code cells (e.g. nest-asyncio-setup) before
  //    the frontmatter, so we scan rather than hard-coding index 0.
  let frontmatter = '';
  let startIdx = 0;

  for (let i = 0; i < cells.length; i++) {
    if (cells[i].cell_type === 'raw') {
      const src = cellSource(cells[i]).trim();
      if (src.startsWith('---')) {
        frontmatter = src;
        startIdx = i + 1;
      }
      break; // stop after first raw cell regardless
    }
  }

  // 2. Build Colab badge — path must be relative to the git repo root, not
  //    just the docs-new/ working directory.
  const relPath = relative(GIT_ROOT, notebookPath).replace(/\\/g, '/');
  const colabUrl = `https://colab.research.google.com/github/${GITHUB_SLUG}/blob/main/${relPath}`;
  const colabBadge = `[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](${colabUrl})`;

  // 3. Convert remaining cells
  const parts = [];
  for (let i = startIdx; i < cells.length; i++) {
    const cell = cells[i];
    const src = cellSource(cell);

    if (cell.cell_type === 'markdown') {
      parts.push(src);
    } else if (cell.cell_type === 'code') {
      // Skip colab-only cells (e.g. !pip install)
      if (src.trimStart().startsWith('# colab-only')) continue;
      parts.push('```python\n' + src + '\n```');
      const outText = cellOutputText(cell);
      if (outText) parts.push(outText);
    }
    // raw cells (non-frontmatter) are intentionally skipped
  }

  const body = parts.join('\n\n');

  // 4. Assemble output
  const output = frontmatter
    ? frontmatter + '\n\n' + colabBadge + '\n\n' + body
    : colabBadge + '\n\n' + body;

  // 5. Write .md next to the .ipynb
  const outPath = notebookPath.replace(/\.ipynb$/, '.md');
  writeFileSync(outPath, output, 'utf8');

  const relOut = relative(GIT_ROOT, outPath);
  console.log(`  converted: ${relPath} → ${relOut}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const contentDir = join(ROOT, 'src', 'content', 'docs');
const notebooks = [...walkSync(contentDir)];

if (notebooks.length === 0) {
  // Safe no-op: astro build will use the pre-committed .md files
  process.exit(0);
}

console.log(`Converting ${notebooks.length} notebook(s)…`);
for (const nb of notebooks) {
  convertNotebook(nb);
}
console.log('Done.');

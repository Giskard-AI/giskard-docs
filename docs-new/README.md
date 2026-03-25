# Giskard Docs (Starlight)

New documentation site built with [Astro](https://astro.build) + [Starlight](https://starlight.astro.build), deployed to Cloudflare Pages at `docs-v3.giskard.ai`.

## Requirements

- Node.js 18+
- Python 3 + `black` (optional — only needed for `npm run format`)

## Commands

Run from inside the `docs-new/` directory:

| Command                 | Description                                                           |
| :---------------------- | :-------------------------------------------------------------------- |
| `npm install`           | Install dependencies                                                  |
| `npm run dev`           | Start local dev server at `localhost:4321` (converts notebooks first) |
| `npm run build`         | Format, convert notebooks, and build production site to `dist/`       |
| `npm run build:ci`      | Convert notebooks and build without formatting — use this in CI       |
| `npm run preview`       | Preview the production build locally                                  |
| `npm run format`        | Run Prettier + black on all `.md`/`.mdx` files                        |
| `npm run format:prose`  | Run Prettier only                                                     |
| `npm run format:code`   | Run black on Python code blocks only                                  |

## Project structure

```
docs-new/
├── public/               # Static assets (fonts, favicon, og image, llms.txt)
├── scripts/
│   ├── convert-notebooks.mjs   # Converts .ipynb -> .mdx at build time
│   └── format-code-blocks.mjs  # Formats Python blocks with black
├── src/
│   ├── assets/           # Images and logos
│   ├── components/       # Starlight component overrides
│   ├── content/
│   │   └── docs/
│   │       ├── start/    # Overview pages (comparison, trial, glossary)
│   │       ├── hub/ui/   # Hub UI documentation (for business users)
│   │       ├── hub/sdk/  # Hub SDK documentation (for developers)
│   │       └── oss/      # Open Source (Checks) documentation
│   └── styles/custom.css # Global CSS overrides
├── astro.config.mjs      # Astro + Starlight configuration
└── package.json
```

## Adding content

- **Markdown/MDX pages**: drop `.md` or `.mdx` files into `src/content/docs/`. The URL mirrors the file path.
- **Jupyter notebooks**: add `.ipynb` files alongside other content. Running `npm run dev` or `npm run build:ci` converts them to `.mdx` automatically. The generated `.mdx` files are git-ignored — do not commit them.
- **Sidebar ordering**: controlled by `_meta.yaml` files in each content directory (via `starlight-auto-sidebar`).

## Notebook conventions

- First cell must be a `raw` cell starting with `---` (YAML frontmatter).
- Include a `description:` field in the frontmatter (build will warn if missing).
- Cells whose first line is `# colab-only` are excluded from the rendered docs.
- Generated `.mdx` files are written next to their `.ipynb` source and are git-ignored.

## Testing notebooks

Notebook tests are run with [nbmake](https://github.com/treebeardtech/nbmake) via pytest. Tests require an `OPENAI_API_KEY` in the environment (notebooks that need no key are listed in `NO_API_NOTEBOOKS` in `tests/test_docs_nb.py`).

Run from the **project root** (not `docs-new/`):

| Command | Description |
| :--- | :--- |
| `make test-docs-nb` | Run all notebooks and write fresh outputs back into `.ipynb` files (default) |
| `make test-docs-nb-readonly` | Run notebooks without overwriting outputs (`OVERWRITE_NB=0`) |
| `make regen-mdx` | Regenerate `.mdx` files from `.ipynb` notebooks (run after updating outputs) |

**Output overwrite behaviour** — by default (`OVERWRITE_NB` unset or `1`) each notebook's outputs are written back into the `.ipynb` file after a successful run. Pass `OVERWRITE_NB=0` to run in read-only mode without touching the source files.

**Typical workflow for updating a notebook:**

```bash
# 1. Edit the .ipynb file
# 2. Run tests — outputs are refreshed automatically
make test-docs-nb

# 3. Regenerate the .mdx files from the updated notebooks
make regen-mdx

# 4. Commit both the .ipynb and any hand-written .mdx changes
#    (generated .mdx files in oss/checks/ are git-ignored — CI regenerates them)
```

On CI, output overwrite and `.mdx` regeneration only happen on pushes to `main`. Pull-request runs execute notebooks in read-only mode (`OVERWRITE_NB=0`).

## Deployment

Deployed automatically via Cloudflare Pages on push to `main`. Preview deployments are created for every PR.

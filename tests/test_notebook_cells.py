"""Every notebook code cell must parse.

A sweep that rewrites cells mechanically can dedent a line into a syntax error,
which then ships to the published page: the generated .mdx files are gitignored,
so the pyright gate never sees them, and the notebook execution job only runs
when a change is judged notebook-relevant. This check is the cheap backstop --
no API key, no execution, no pyright.
"""

import json
from pathlib import Path

import pytest

DOCS_ROOT = Path(__file__).parent.parent / "src" / "content" / "docs"

# Cells that install packages in Colab are shell, not Python.
COLAB_MARKER = "# colab-only"

# Notebooks are authored to be read top to bottom, so a cell may legitimately
# `await` at top level the way Jupyter allows.
ALLOW_TOP_LEVEL_AWAIT = 0x2000


def _notebooks():
    return sorted(DOCS_ROOT.rglob("*.ipynb"))


def pytest_generate_tests(metafunc):
    if "notebook" in metafunc.fixturenames:
        paths = _notebooks()
        metafunc.parametrize(
            "notebook", paths, ids=[str(p.relative_to(DOCS_ROOT)) for p in paths]
        )


def test_every_code_cell_parses(notebook):
    cells = json.loads(notebook.read_text())["cells"]
    failures = []
    for index, cell in enumerate(cells):
        if cell["cell_type"] != "code":
            continue
        source = "".join(cell["source"])
        if source.lstrip().startswith(COLAB_MARKER) or source.lstrip().startswith("!"):
            continue
        try:
            compile(source, f"cell {index}", "exec", ALLOW_TOP_LEVEL_AWAIT)
        except SyntaxError as exc:
            failures.append(f"cell {index}: {exc.msg} (line {exc.lineno})")
    assert not failures, "\n".join(failures)

# tests/test_docs_nb.py
"""
End-to-end tests for Jupyter notebooks in docs-new/.

Cells tagged skip-execution (the colab-install cells) are skipped automatically.

- No OPENAI_API_KEY → only NO_API_NOTEBOOKS run; the rest skip.
- OVERWRITE_NB=0    → skip writing outputs back (default is to overwrite).
                      After the run, regenerate .mdx files:
                      cd docs-new && node scripts/convert-notebooks.mjs

Run from the project root:
    uv run pytest tests/test_docs_nb.py
"""
import os
import pytest
from pathlib import Path

DOCS_ROOT = (
    Path(__file__).parent.parent
    / "docs-new" / "src" / "content" / "docs" / "oss" / "checks"
)

# Notebooks confirmed to need no API key.
NO_API_NOTEBOOKS = {
    "tutorials/your-first-test.ipynb",
}


def _nb_files():
    return sorted(DOCS_ROOT.rglob("*.ipynb"))


def _needs_api(path: Path) -> bool:
    return str(path.relative_to(DOCS_ROOT)) not in NO_API_NOTEBOOKS


def pytest_generate_tests(metafunc):
    if "nb_path" in metafunc.fixturenames:
        paths = _nb_files()
        metafunc.parametrize(
            "nb_path", paths,
            ids=[str(p.relative_to(DOCS_ROOT)) for p in paths],
        )


def test_notebook(nb_path):
    if _needs_api(nb_path):
        if not os.environ.get("OPENAI_API_KEY"):
            pytest.skip("OPENAI_API_KEY not set")

    from nbmake.nb_run import NotebookRun
    import nbformat

    # default_timeout is positional (not keyword)
    run = NotebookRun(nb_path, 300)
    result = run.execute()
    assert result.error is None, f"Notebook {nb_path.name} failed:\n{result.error}"

    if os.environ.get("OVERWRITE_NB", "1") != "0":
        with open(nb_path, "w", encoding="utf-8") as fh:
            nbformat.write(result.nb, fh)

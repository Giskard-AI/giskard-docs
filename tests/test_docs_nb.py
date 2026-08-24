# tests/test_docs_nb.py
"""
End-to-end tests for Jupyter notebooks.

Cells tagged skip-execution (the colab-install cells) are skipped automatically.

- No OPENAI_API_KEY / OPENAI_BASE_URL → only NO_API_NOTEBOOKS run; the rest skip.
- RUN_SLOW_NOTEBOOKS=1 → also run SLOW_NOTEBOOKS (full scans; minutes and dollars each).
- OVERWRITE_NB=0    → skip writing outputs back (default is to overwrite).
                      After the run, regenerate .mdx files:
                      node scripts/convert-notebooks.mjs

Run from the project root:
    uv run pytest tests/test_docs_nb.py
"""
import os
import pytest
from pathlib import Path

DOCS_ROOT = Path(__file__).parent.parent / "src" / "content" / "docs" / "oss"

# Notebooks confirmed to need no API key.
NO_API_NOTEBOOKS = {
    "checks/tutorials/your-first-test.ipynb",
    "checks/how-to/custom-trace.ipynb",
}

# A full vulnerability_scan fans out over every generator: minutes of wall clock
# and real money per run, which is too much to spend on every pull request. They
# stay opt-in via RUN_SLOW_NOTEBOOKS=1. scan/quickstart.ipynb is deliberately not
# here -- it caps itself at max_scenarios=4 so it is cheap enough to gate on.
SLOW_NOTEBOOKS = {
    "scan/tutorials/your-first-scan.ipynb",
    "scan/tutorials/redteam-to-regression.ipynb",
    "scan/tutorials/scan-a-rag-agent.ipynb",
    "scan/tutorials/custom-scenario-generator.ipynb",
    "scan/how-to/quality-scan.ipynb",
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
    relative = str(nb_path.relative_to(DOCS_ROOT))
    if relative in SLOW_NOTEBOOKS and os.environ.get("RUN_SLOW_NOTEBOOKS") != "1":
        pytest.skip("full scan: set RUN_SLOW_NOTEBOOKS=1 to run it")

    if _needs_api(nb_path):
        if not (os.environ.get("OPENAI_API_KEY") and os.environ.get("OPENAI_BASE_URL")):
            pytest.skip("OPENAI_API_KEY and OPENAI_BASE_URL not set")

    from nbmake.nb_run import NotebookRun
    import nbformat

    # default_timeout is positional (not keyword)
    run = NotebookRun(nb_path, 300)
    result = run.execute()
    assert result.error is None, f"Notebook {nb_path.name} failed:\n{result.error}"

    if os.environ.get("OVERWRITE_NB", "1") != "0":
        with open(nb_path, "w", encoding="utf-8") as fh:
            nbformat.write(result.nb, fh)

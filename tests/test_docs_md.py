# tests/test_docs_md.py
"""
End-to-end tests for Python code blocks in .mdx documentation files.

For each .mdx file:
  - Extracts all ```python blocks.
  - Removes blocks with bare top-level `await` (notebook-only variants).
  - Writes remaining blocks to a temp .md file.
  - Calls mktestdocs.check_md_file(tmp, memory=True) to run them sequentially.

Run from the project root:
    uv run pytest tests/test_docs_md.py
"""
import os
import re
import tempfile
import mktestdocs
import pytest
from pathlib import Path

DOCS_ROOT = (
    Path(__file__).parent.parent
    / "docs-new" / "src" / "content" / "docs" / "oss" / "checks"
)

# .mdx files known to call LLM-based checks — need OPENAI_API_KEY.
# Remove entries here once you confirm a file is API-free.
REQUIRES_API = {
    "quickstart.mdx",
    "how-to/batch-evaluation.mdx",
    "how-to/ci-cd.mdx",
    "how-to/custom-checks.mdx",
    "how-to/run-in-pytest.mdx",
    "how-to/simulate-users.mdx",
    "how-to/spy-on-calls.mdx",
    "how-to/stateful-checks.mdx",
    "how-to/structured-output.mdx",
    "tutorials/dynamic-scenarios.mdx",
    "tutorials/multi-turn.mdx",
    "tutorials/single-turn.mdx",
    "tutorials/test-suites.mdx",
    "use-cases/chatbot-testing.mdx",
    "use-cases/content-moderation.mdx",
    "use-cases/rag-evaluation.mdx",
    "use-cases/testing-agents.mdx",
}


def _has_top_level_await(block: str) -> bool:
    """True if any non-indented, non-comment line contains the await keyword.

    Catches both bare `await expr` and assignment forms like `x = await expr`.
    Indented awaits (inside async def bodies) are fine to keep.
    """
    for line in block.splitlines():
        if not line or line[0] in (" ", "\t", "#"):
            continue
        if re.search(r"\bawait\b", line):
            return True
    return False


def _filter_await_blocks(text: str) -> str:
    """Remove ```python blocks that contain bare top-level await."""
    def maybe_remove(m: re.Match) -> str:
        return "" if _has_top_level_await(m.group(1)) else m.group(0)

    return re.sub(r"```python\n(.*?)```", maybe_remove, text, flags=re.DOTALL)


def _mdx_files():
    return sorted(DOCS_ROOT.rglob("*.mdx"))


def _needs_api(path: Path) -> bool:
    return str(path.relative_to(DOCS_ROOT)) in REQUIRES_API


def pytest_generate_tests(metafunc):
    if "mdx_path" in metafunc.fixturenames:
        paths = _mdx_files()
        metafunc.parametrize(
            "mdx_path", paths,
            ids=[str(p.relative_to(DOCS_ROOT)) for p in paths],
        )


def test_mdx_codeblocks(mdx_path):
    if _needs_api(mdx_path):
        if not os.environ.get("OPENAI_API_KEY"):
            pytest.skip("OPENAI_API_KEY not set")

    filtered = _filter_await_blocks(mdx_path.read_text(encoding="utf-8"))

    if not re.search(r"```python\n", filtered):
        pytest.skip("no runnable Python blocks found")

    with tempfile.NamedTemporaryFile(
        suffix=".md", mode="w", encoding="utf-8", delete=False
    ) as tmp:
        tmp.write(filtered)
        tmp_path = tmp.name

    try:
        mktestdocs.check_md_file(tmp_path, memory=True)
    finally:
        Path(tmp_path).unlink(missing_ok=True)

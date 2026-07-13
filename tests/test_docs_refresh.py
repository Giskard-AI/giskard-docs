"""Tests for the docs-refresh engine (snapshot / diff / triage).

These guard the three properties the whole refresh workflow rests on. Each one
was a real bug caught during development, and each would silently corrupt a
refresh PR if it regressed:

1. The snapshot is stable across interpreter runs. (Pydantic's Annotated[...]
   metadata embeds memory addresses; without normalization 13 of 49 symbols
   reported a phantom change on every run.)
2. The diff distinguishes a changed default from a changed signature. (The two
   route to different editors with different aggressiveness.)
3. Triage never targets a generated .mdx, and never searches class members by
   their bare leaf name. ("Check.run" searched as "run" matched the English word
   across the entire corpus.)
"""

from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
from pathlib import Path
from types import ModuleType

import pytest

REPO = Path(__file__).resolve().parent.parent
SCRIPTS = REPO / "scripts"
BASELINE = REPO / "docs" / "api-baseline" / "giskard-checks.json"


def load_script(filename: str) -> ModuleType:
    """Import a script by path -- the hyphens in the filenames make them invalid
    module names, so they cannot be imported normally."""
    name = filename.removesuffix(".py").replace("-", "_")
    spec = importlib.util.spec_from_file_location(name, SCRIPTS / filename)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def run_script(name: str, *args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(SCRIPTS / name), *args],
        capture_output=True,
        text=True,
        cwd=REPO,
    )


@pytest.fixture(scope="module")
def baseline() -> dict:
    return json.loads(BASELINE.read_text())


def test_snapshot_is_stable_across_processes(tmp_path: Path) -> None:
    """An unchanged API must snapshot byte-identically, or every refresh run
    reports phantom deltas and reviewers learn to ignore the diff."""
    first = tmp_path / "a.json"
    second = tmp_path / "b.json"

    for out in (first, second):
        result = run_script(
            "snapshot-api.py",
            "giskard.checks",
            "--distribution",
            "giskard-checks",
            "-o",
            str(out),
        )
        assert result.returncode == 0, result.stderr

    assert first.read_bytes() == second.read_bytes()


def test_snapshot_has_no_memory_addresses(baseline: dict) -> None:
    """Memory addresses are the specific nondeterminism that broke stability."""
    assert "0x" not in json.dumps(baseline)


def test_snapshot_deduplicates_reexports(baseline: dict) -> None:
    """Symbols re-exported from submodules are recorded once, with aliases.

    Groundedness is exported from giskard.checks, .builtin and .judges alike; a
    single signature change must surface as one delta, not three.
    """
    symbols = baseline["symbols"]
    groundedness = [k for k in symbols if k.endswith("Groundedness")]
    assert groundedness == ["giskard.checks.Groundedness"]
    assert "giskard.checks.judges.Groundedness" in symbols[groundedness[0]]["aliases"]


def _delta_for(tmp_path: Path, mutate) -> list[dict]:
    """Diff the baseline against a mutated copy of itself."""
    new = json.loads(BASELINE.read_text())
    new["version"] = "9.9.9"
    mutate(new["symbols"])

    new_path = tmp_path / "new.json"
    new_path.write_text(json.dumps(new))
    out = tmp_path / "delta.json"

    run_script("diff-api.py", str(BASELINE), str(new_path), "-o", str(out))
    return json.loads(out.read_text())["deltas"]


def test_changed_default_is_not_a_changed_signature(tmp_path: Path) -> None:
    """Moving a default value is weaker than renaming a parameter: existing calls
    still work, but prose asserting the old value is now false."""

    def mutate(symbols: dict) -> None:
        key = "giskard.checks.generate_suite"
        symbols[key]["signature"] = symbols[key]["signature"].replace(
            "seed: int = 42", "seed: int = 1337"
        )

    deltas = _delta_for(tmp_path, mutate)
    (delta,) = [d for d in deltas if d["symbol"] == "giskard.checks.generate_suite"]

    assert delta["kind"] == "default_changed"
    assert delta["severity"] == "warning"
    assert delta["defaults"]["seed"] == {"old": "42", "new": "1337"}


def test_renamed_parameter_is_an_error(tmp_path: Path) -> None:
    def mutate(symbols: dict) -> None:
        symbols["giskard.checks.Suite"]["signature"] = "(*, renamed: str) -> None"

    deltas = _delta_for(tmp_path, mutate)
    (delta,) = [d for d in deltas if d["symbol"] == "giskard.checks.Suite"]

    assert delta["kind"] == "signature_changed"
    assert delta["severity"] == "error"


def test_removed_symbol_is_an_error(tmp_path: Path) -> None:
    """A page referencing a deleted symbol is wrong, not merely stale."""

    def mutate(symbols: dict) -> None:
        symbols.pop("giskard.checks.UserSimulator")

    deltas = _delta_for(tmp_path, mutate)
    (delta,) = [d for d in deltas if d["symbol"] == "giskard.checks.UserSimulator"]

    assert delta["kind"] == "symbol_removed"
    assert delta["severity"] == "error"


def test_annotated_defaults_parse_without_mangling(tmp_path: Path) -> None:
    """Pydantic renders Annotated[...] metadata containing both ':' and '=' inside
    brackets; a naive split lands inside the metadata and yields garbage."""
    diff_api = load_script("diff-api.py")

    signature = (
        "(*, key: Annotated[str, AfterValidator(func=<function f>)] = 'trace.last.outputs',"
        " threshold: float = 0.95) -> None"
    )
    defaults = diff_api.parse_defaults(signature)

    assert defaults["key"] == "'trace.last.outputs'"
    assert defaults["threshold"] == "0.95"


def test_triage_never_targets_a_generated_mdx(tmp_path: Path) -> None:
    """The .mdx files beside notebooks are git-ignored build output. Editing one
    produces a diff that evaporates on the next `make regen-mdx`."""

    def mutate(symbols: dict) -> None:
        # UserSimulator appears in both notebooks and their generated .mdx.
        symbols.pop("giskard.checks.UserSimulator")

    new = json.loads(BASELINE.read_text())
    new["version"] = "9.9.9"
    mutate(new["symbols"])
    new_path = tmp_path / "new.json"
    new_path.write_text(json.dumps(new))

    delta = tmp_path / "delta.json"
    run_script("diff-api.py", str(BASELINE), str(new_path), "-o", str(delta))

    order = tmp_path / "order.json"
    result = run_script("triage-docs.py", str(delta), "-o", str(order))
    assert result.returncode == 0, result.stderr

    work = json.loads(order.read_text())
    targets = [
        entry["path"]
        for entries in work["work_by_type"].values()
        for entry in entries
    ]
    assert targets, "expected UserSimulator to match some pages"

    for target in targets:
        ignored = subprocess.run(
            ["git", "check-ignore", "-q", target], cwd=REPO, capture_output=True
        )
        assert ignored.returncode != 0, f"triage targeted a git-ignored file: {target}"

    # And the notebook, not its shadow, is what gets edited.
    assert "src/content/docs/oss/checks/how-to/simulate-users.ipynb" in targets
    assert "src/content/docs/oss/checks/how-to/simulate-users.mdx" not in targets


def test_class_members_are_searched_as_attribute_access(tmp_path: Path) -> None:
    """`Check.run` must not be searched as the bare word "run" -- that matches
    ordinary English prose across the whole corpus."""
    triage = load_script("triage-docs.py")

    member = triage.symbol_pattern("giskard.checks.Check.run", member_of="giskard.checks.Check")
    toplevel = triage.symbol_pattern("giskard.checks.Suite", member_of=None)

    prose = "You can run the suite whenever you like."
    call = "result = await scenario.run()"

    assert not member.search(prose), "member pattern matched the English word 'run'"
    assert member.search(call)
    assert toplevel.search("Suite(checks=[...])")

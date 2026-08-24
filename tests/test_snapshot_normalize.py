"""Union/Optional spelling must not depend on the interpreter taking the snapshot.

Python 3.12 renders ``str | MISSING`` where 3.13 renders ``Union[str, MISSING]``.
Without normalization a version bump produces dozens of phantom API deltas.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))

import importlib.util

_spec = importlib.util.spec_from_file_location(
    "snapshot_api", Path(__file__).parent.parent / "scripts" / "snapshot-api.py"
)
snapshot_api = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(snapshot_api)

normalize = snapshot_api.normalize


def test_union_and_optional_collapse_to_pipe_form():
    assert normalize("typing.Union[str, MISSING]") == "str | MISSING"
    assert normalize("typing.Optional[int]") == "int | None"
    assert normalize("str | MISSING") == "str | MISSING"


def test_nested_and_multi_argument_unions():
    assert normalize("Union[str, list[str], MISSING]") == "str | list[str] | MISSING"
    assert normalize("Union[dict[str, int], None]") == "dict[str, int] | None"
    assert (
        normalize("Optional[typing.Literal['NFC', 'NFD']]")
        == "Literal['NFC', 'NFD'] | None"
    )


def test_memory_addresses_still_stripped():
    assert normalize("<function f at 0x10cc094e0>") == "<function f>"


def test_unbalanced_brackets_are_left_alone():
    assert normalize("Union[str, MISSING") == "Union[str, MISSING"


if __name__ == "__main__":
    test_union_and_optional_collapse_to_pipe_form()
    test_nested_and_multi_argument_unions()
    test_memory_addresses_still_stripped()
    test_unbalanced_brackets_are_left_alone()
    print("ok")

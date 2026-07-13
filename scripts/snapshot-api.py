#!/usr/bin/env python3
"""Snapshot the public API of a giskard package to stable JSON.

The output feeds the docs-refresh workflow: it is committed to
``docs/api-baseline/`` and diffed against a freshly-introspected snapshot to
find out what changed between two revisions of giskard-oss.

Two properties matter more than completeness:

1. **Stable.** An unchanged API must produce a byte-identical file, or every
   run yields spurious deltas and reviewers learn to ignore the diff.
2. **Quiet.** Only the public surface, and only the first line of each
   docstring -- a typo fix in a docstring is not an API change.

Usage:
    python scripts/snapshot-api.py giskard.checks --ref main -o out.json
"""

from __future__ import annotations

import argparse
import importlib
import importlib.metadata
import inspect
import json
import re
import sys
from typing import Any

# Object reprs that embed a memory address: "<function f at 0x10cc094e0>",
# "<Foo object at 0x10cbe8ec0>". Pydantic's Annotated[...] validator metadata is
# full of these, and the address changes on every interpreter run -- left alone,
# 13 of the 49 giskard.checks symbols would report a phantom signature change on
# every snapshot, which would make the diff worthless. Collapse the address so
# the identity of the object still shows but the run-to-run noise does not.
_MEMORY_ADDRESS = re.compile(r" at 0x[0-9a-fA-F]+")


def normalize(signature: str) -> str:
    """Strip run-to-run noise so an unchanged API renders byte-identically."""
    return _MEMORY_ADDRESS.sub("", signature)

# Public names in a module's __all__ that are re-exported from elsewhere are
# recorded once, at their canonical location, with the other paths listed as
# aliases. Without this, `Groundedness` (exported from giskard.checks,
# giskard.checks.builtin and giskard.checks.judges alike) would appear three
# times and a single signature change would surface as three deltas.


def public_names(obj: Any) -> list[str]:
    """Public names of a module, honouring __all__ when the author defined one."""
    declared = getattr(obj, "__all__", None)
    if declared is not None:
        return sorted(declared)
    return sorted(n for n in dir(obj) if not n.startswith("_"))


def doc_summary(obj: Any) -> str:
    """First line of the docstring, or empty. Deliberately not the full text."""
    doc = inspect.getdoc(obj)
    if not doc:
        return ""
    return doc.strip().splitlines()[0].strip()


def signature_of(obj: Any) -> str:
    """Rendered signature, or empty when introspection is not possible.

    Builtins and C extensions raise here; an empty signature is honest, whereas
    a guessed one would produce a phantom delta the day it becomes readable.
    """
    try:
        return normalize(str(inspect.signature(obj)))
    except (ValueError, TypeError):
        return ""


def describe_callable(obj: Any, kind: str) -> dict[str, Any]:
    return {"kind": kind, "signature": signature_of(obj), "doc_summary": doc_summary(obj)}


def describe_class(obj: Any) -> dict[str, Any]:
    """Class with its public methods. Inherited members are skipped.

    Only methods defined on the class itself are recorded: pulling in inherited
    members would make an unrelated change to a base class light up every
    subclass in the diff.
    """
    members: dict[str, Any] = {}
    for name in public_names(obj):
        try:
            member = inspect.getattr_static(obj, name)
        except AttributeError:
            continue

        # Skip anything inherited -- it belongs to the base class's entry.
        if name not in vars(obj):
            continue

        if isinstance(member, staticmethod):
            members[name] = describe_callable(member.__func__, "staticmethod")
        elif isinstance(member, classmethod):
            members[name] = describe_callable(member.__func__, "classmethod")
        elif isinstance(member, property):
            members[name] = {"kind": "property", "doc_summary": doc_summary(member)}
        elif inspect.isfunction(member):
            members[name] = describe_callable(member, "method")

    return {
        "kind": "class",
        "bases": [f"{b.__module__}.{b.__qualname__}" for b in obj.__bases__ if b is not object],
        "signature": signature_of(obj),
        "doc_summary": doc_summary(obj),
        "members": dict(sorted(members.items())),
    }


def walk(module: Any, root: str, symbols: dict[str, Any], seen: dict[int, str]) -> None:
    """Record the public surface of `module`, recursing into public submodules.

    `seen` maps id(obj) -> the path where the object was first recorded, so a
    re-exported symbol becomes an alias rather than a duplicate entry.
    """
    for name in public_names(module):
        try:
            obj = getattr(module, name)
        except AttributeError:
            continue

        path = f"{root}.{name}"

        if inspect.ismodule(obj):
            # Only follow submodules of the package being snapshotted; never
            # wander into third-party modules that happen to be re-exported.
            if obj.__name__.startswith(module.__name__):
                walk(obj, path, symbols, seen)
            continue

        if id(obj) in seen:
            canonical = seen[id(obj)]
            symbols[canonical].setdefault("aliases", []).append(path)
            symbols[canonical]["aliases"].sort()
            continue

        if inspect.isclass(obj):
            entry = describe_class(obj)
        elif inspect.isroutine(obj):
            entry = describe_callable(obj, "function")
        else:
            # Module-level constants: record the type, never the value. Values
            # can be environment-dependent and would make the snapshot unstable.
            entry = {"kind": "constant", "type": type(obj).__name__}

        symbols[path] = entry
        seen[id(obj)] = path


def build_snapshot(module_name: str, distribution: str, source_ref: str) -> dict[str, Any]:
    module = importlib.import_module(module_name)

    symbols: dict[str, Any] = {}
    walk(module, module_name, symbols, seen={})

    try:
        version = importlib.metadata.version(distribution)
    except importlib.metadata.PackageNotFoundError:
        version = "unknown"

    return {
        "package": distribution,
        "module": module_name,
        "version": version,
        "source_ref": source_ref,
        "symbols": dict(sorted(symbols.items())),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("module", help="Importable module, e.g. giskard.checks")
    parser.add_argument(
        "--distribution",
        help="Distribution name for the version lookup (default: module with dots as dashes)",
    )
    parser.add_argument("--ref", default="unknown", help="giskard-oss git ref this was built from")
    parser.add_argument("-o", "--output", help="Write here instead of stdout")
    args = parser.parse_args()

    distribution = args.distribution or args.module.replace(".", "-")
    snapshot = build_snapshot(args.module, distribution, args.ref)

    # sort_keys + trailing newline: a stable file that diffs cleanly in review.
    text = json.dumps(snapshot, indent=2, sort_keys=True, ensure_ascii=False) + "\n"

    if args.output:
        with open(args.output, "w", encoding="utf-8") as fh:
            fh.write(text)
        print(
            f"{distribution} {snapshot['version']}: {len(snapshot['symbols'])} symbols -> {args.output}",
            file=sys.stderr,
        )
    else:
        sys.stdout.write(text)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

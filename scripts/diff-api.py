#!/usr/bin/env python3
"""Diff two API snapshots into a doc-impact report.

Reads two files produced by ``snapshot-api.py`` and classifies every change into
a fixed taxonomy, so that deciding *which docs are stale* is a lookup rather than
a judgment call:

    symbol_removed       a page mentioning it is WRONG, not merely stale (error)
    symbol_added         needs a reference entry; feature may be undocumented
    signature_changed    any snippet calling it may break
    default_changed      prose asserting the old default is now false
    doc_summary_changed  cosmetic; reference only

Exit codes:
    0  no changes (nothing to refresh)
    1  changes found
    2  usage/IO error

Usage:
    python scripts/diff-api.py docs/api-baseline/giskard-checks.json new.json -o delta.json
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from typing import Any

_NAME = re.compile(r"^(?P<name>\*{0,2}\w+)\s*(?::\s*)?")


def split_param(param: str) -> tuple[str, str, str | None]:
    """Split one rendered parameter into (name, annotation, default).

    Must be bracket-aware. Pydantic renders annotations like
    ``Annotated[str, AfterValidator(func=<...>)] = 'x'`` -- both the ":" and the
    "=" that matter are the *top-level* ones, and a naive split lands inside the
    Annotated[...] metadata and returns garbage.
    """
    match = _NAME.match(param)
    if not match:
        return param, "", None
    name = match.group("name")
    rest = param[match.end() :]

    # Find the top-level "=" (depth 0), if any.
    depth = 0
    for index, char in enumerate(rest):
        if char in "[({":
            depth += 1
        elif char in "])}":
            depth -= 1
        elif char == "=" and depth == 0:
            return name, rest[:index].strip(), rest[index + 1 :].strip()

    return name, rest.strip(), None


def split_params(signature: str) -> list[str]:
    """Split a rendered signature into top-level parameter strings.

    Bracket-aware: `list[int, str]` and `dict[str, Any]` contain commas that are
    not parameter separators.
    """
    inner = signature.strip()
    # Take what is inside the outermost parens, dropping any return annotation.
    # Scanning for the matching close paren is necessary because both the
    # parameter list and the return type may contain nested parens.
    if inner.startswith("("):
        depth = 0
        for index, char in enumerate(inner):
            if char == "(":
                depth += 1
            elif char == ")":
                depth -= 1
                if depth == 0:
                    inner = inner[1:index]
                    break

    params: list[str] = []
    depth = 0
    current: list[str] = []
    for char in inner:
        if char in "[({":
            depth += 1
        elif char in "])}":
            depth -= 1
        if char == "," and depth == 0:
            params.append("".join(current).strip())
            current = []
        else:
            current.append(char)
    if "".join(current).strip():
        params.append("".join(current).strip())
    return [p for p in params if p and p not in {"self", "/", "*"}]


def param_identities(signature: str) -> set[tuple[str, str]]:
    """(name, annotation) for each parameter, ignoring default VALUES.

    Two signatures with equal identities differ only in what their defaults are
    set to -- a weaker change than a renamed or retyped parameter.
    """
    identities: set[tuple[str, str]] = set()
    for param in split_params(signature):
        name, annotation, _ = split_param(param)
        identities.add((name, annotation))
    return identities


def parse_defaults(signature: str) -> dict[str, str]:
    """Map parameter name -> rendered default value, for params that have one."""
    defaults: dict[str, str] = {}
    for param in split_params(signature):
        name, _, default = split_param(param)
        if default is not None:
            defaults[name] = default
    return defaults


def compare_entry(path: str, old: dict[str, Any], new: dict[str, Any]) -> list[dict[str, Any]]:
    """Classify the changes between two snapshot entries for the same symbol."""
    deltas: list[dict[str, Any]] = []

    old_sig = old.get("signature", "")
    new_sig = new.get("signature", "")

    if old_sig != new_sig:
        # A changed default is a strictly weaker claim than a changed signature:
        # existing call sites keep working, but prose stating the old value is now
        # false. Report it separately so the editors can be told to touch prose
        # rather than rewrite code.
        old_defaults = parse_defaults(old_sig)
        new_defaults = parse_defaults(new_sig)
        changed_defaults = {
            name: {"old": old_defaults[name], "new": new_defaults[name]}
            for name in old_defaults.keys() & new_defaults.keys()
            if old_defaults[name] != new_defaults[name]
        }

        # Same parameters (name AND annotation), only default values moved ->
        # default_changed. Compare via the parser rather than a naive split on
        # "=", because annotations themselves contain "=" (e.g. Annotated[...]
        # metadata such as AfterValidator(func=...)).
        params_unchanged = param_identities(old_sig) == param_identities(new_sig)

        if changed_defaults and params_unchanged:
            deltas.append(
                {
                    "kind": "default_changed",
                    "symbol": path,
                    "severity": "warning",
                    "defaults": changed_defaults,
                    "old_signature": old_sig,
                    "new_signature": new_sig,
                }
            )
        else:
            deltas.append(
                {
                    "kind": "signature_changed",
                    "symbol": path,
                    "severity": "error",
                    "old_signature": old_sig,
                    "new_signature": new_sig,
                    "defaults": changed_defaults or None,
                }
            )

    if old.get("doc_summary", "") != new.get("doc_summary", ""):
        deltas.append(
            {
                "kind": "doc_summary_changed",
                "symbol": path,
                "severity": "info",
                "old": old.get("doc_summary", ""),
                "new": new.get("doc_summary", ""),
            }
        )

    # Class members: recurse one level. Members are not full symbols, so they are
    # reported against the owning class's path.
    old_members = old.get("members", {})
    new_members = new.get("members", {})
    for name in sorted(old_members.keys() - new_members.keys()):
        deltas.append(
            {"kind": "symbol_removed", "symbol": f"{path}.{name}", "severity": "error", "member_of": path}
        )
    for name in sorted(new_members.keys() - old_members.keys()):
        deltas.append(
            {
                "kind": "symbol_added",
                "symbol": f"{path}.{name}",
                "severity": "info",
                "member_of": path,
                "signature": new_members[name].get("signature", ""),
                "doc_summary": new_members[name].get("doc_summary", ""),
            }
        )
    for name in sorted(old_members.keys() & new_members.keys()):
        deltas.extend(compare_entry(f"{path}.{name}", old_members[name], new_members[name]))

    return deltas


def diff(old_snapshot: dict[str, Any], new_snapshot: dict[str, Any]) -> dict[str, Any]:
    old_symbols = old_snapshot["symbols"]
    new_symbols = new_snapshot["symbols"]

    deltas: list[dict[str, Any]] = []

    for path in sorted(old_symbols.keys() - new_symbols.keys()):
        deltas.append(
            {
                "kind": "symbol_removed",
                "symbol": path,
                "severity": "error",
                "was": old_symbols[path].get("doc_summary", ""),
            }
        )

    for path in sorted(new_symbols.keys() - old_symbols.keys()):
        entry = new_symbols[path]
        deltas.append(
            {
                "kind": "symbol_added",
                "symbol": path,
                "severity": "info",
                "signature": entry.get("signature", ""),
                "doc_summary": entry.get("doc_summary", ""),
            }
        )

    for path in sorted(old_symbols.keys() & new_symbols.keys()):
        deltas.extend(compare_entry(path, old_symbols[path], new_symbols[path]))

    by_kind: dict[str, int] = {}
    for delta in deltas:
        by_kind[delta["kind"]] = by_kind.get(delta["kind"], 0) + 1

    return {
        "package": new_snapshot.get("package"),
        "from_version": old_snapshot.get("version"),
        "to_version": new_snapshot.get("version"),
        "from_ref": old_snapshot.get("source_ref"),
        "to_ref": new_snapshot.get("source_ref"),
        "summary": {"total": len(deltas), "by_kind": dict(sorted(by_kind.items()))},
        "deltas": deltas,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("old", help="Baseline snapshot (committed)")
    parser.add_argument("new", help="Freshly-introspected snapshot")
    parser.add_argument("-o", "--output", help="Write delta JSON here instead of stdout")
    args = parser.parse_args()

    try:
        with open(args.old, encoding="utf-8") as fh:
            old_snapshot = json.load(fh)
        with open(args.new, encoding="utf-8") as fh:
            new_snapshot = json.load(fh)
    except (OSError, json.JSONDecodeError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2

    report = diff(old_snapshot, new_snapshot)
    text = json.dumps(report, indent=2, sort_keys=True, ensure_ascii=False) + "\n"

    if args.output:
        with open(args.output, "w", encoding="utf-8") as fh:
            fh.write(text)
    else:
        sys.stdout.write(text)

    summary = report["summary"]
    print(
        f"{report['from_version']} -> {report['to_version']}: "
        f"{summary['total']} deltas {summary['by_kind'] or '(none)'}",
        file=sys.stderr,
    )

    return 1 if summary["total"] else 0


if __name__ == "__main__":
    raise SystemExit(main())

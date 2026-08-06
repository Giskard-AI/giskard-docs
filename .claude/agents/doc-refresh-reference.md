---
name: doc-refresh-reference
description: Use when refreshing Giskard OSS reference pages (src/content/docs/oss/checks/reference/*.mdx) against a giskard-oss API delta.
---

You refresh **reference pages (src/content/docs/oss/checks/reference/*.mdx)** so they match a new revision of `giskard-checks`.

## Inputs

You are given:

- a **work order** (JSON) listing the pages you own and, for each, the API deltas
  that touch it — with old and new signatures, changed defaults, and the exact
  line numbers or notebook cell indices where the symbol appears;
- the path to the **new API snapshot**, which is ground truth for any signature.

You edit **hand-written `.mdx`**.

## Policy

**Assertive.** The snapshot signature is ground truth — rewrite entries to match it.

Read `references/edit-policy.md` for the full policy, and
`references/diataxis-reference.md` for what this Diataxis type is *for* — it governs
what belongs on the page at all.

## Reference-specific rules

- **The signature in the work order is authoritative.** If the page disagrees, the
  page is wrong. Update it — including parameter names, types, defaults, and
  return types.
- **New symbols get an entry.** Match the structure of neighbouring entries on the
  same page (the pages use `<MethodCard>`, `<TypeTable>` and similar components —
  copy the local idiom rather than inventing one).
- **Removed symbols get their entry deleted**, and any cross-reference to them
  fixed. Do not leave a dangling link.
- **A `default_changed` delta means the prose asserting the old default is now
  false.** Find it and correct the value, not just the signature block.

## Work one page at a time

Read a page, edit it, write it, then move to the next. `checks.mdx` alone is 23 KB
and this type is touched by *every* API delta — reading them all up front will
exhaust your context before you have written anything.

## Escalation

Flag, do not edit, when: Never. Reference work is mechanical: the API says what it says.

Escalating is a **good outcome**, not a failure. Write the flag and move on.

## Verifying a signature

Never guess. The work order carries the new signature. If you need more, read the
snapshot JSON — do not invent an API, and do not trust the page you are editing.

## Report

Return **only** this JSON. No prose, no diffs, no narration.

```json
{
  "type": "reference",
  "pages": [
    {
      "path": "src/content/docs/oss/checks/...",
      "status": "edited | flagged | no_change_needed",
      "changes": ["one line per edit made"],
      "reason": "why flagged (flagged only)"
    }
  ]
}
```

Keep `changes` to one short line per edit. The orchestrator turns these into the
PR body; it never sees your diffs.

/**
 * check-notebook-output.mjs
 *
 * Guards isSafeMdxCardLiteral() in convert-notebooks.mjs: notebook output that
 * markdown would read as a setext underline must go through the <pre> path, and
 * ordinary output must not be pushed there needlessly.
 */
import assert from "node:assert/strict";
import { isSafeMdxCardLiteral } from "./convert-notebooks.mjs";

// A run of only - or = under a text line is a setext underline: must NOT be a literal.
assert.equal(isSafeMdxCardLiteral("Scenario\n--------"), false);
assert.equal(isSafeMdxCardLiteral("Scenario\n========"), false);
assert.equal(isSafeMdxCardLiteral("Total\n----------------------\n"), false);

// A table separator row has dashes in groups: markdown never reads it as an
// underline, so it stays on the cheap literal path.
assert.equal(
  isSafeMdxCardLiteral(
    "Scenario  Status  Duration\n--------  ------  --------",
  ),
  true,
);
assert.equal(isSafeMdxCardLiteral("refuse_digital_refund  PASS  812 ms"), true);

// Angle brackets and braces still force the <pre> path.
assert.equal(isSafeMdxCardLiteral("<Trace id=1>"), false);
assert.equal(isSafeMdxCardLiteral('{"passed": true}'), false);

console.log("check-notebook-output: ok");

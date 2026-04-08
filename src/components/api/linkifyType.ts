/**
 * Auto-linker for SDK type strings.
 *
 * Given a Python-style type string (e.g. `list[Agent] | None`), wraps any
 * identifier that matches a known SDK type with a link to its anchor in the
 * Types section of the API reference.
 *
 * The set of known types is maintained as a single source of truth here so it
 * stays in sync between Property.astro and MethodCard.astro.
 */

export const KNOWN_TYPES: ReadonlySet<string> = new Set([
  // Core
  "ChatMessage",
  "ChatMessageParam",
  "ChatMessageWithMetadata",
  "ChatMessageWithMetadataParam",
  "Header",
  "HeaderParam",
  "ExecutionError",
  "User",
  "UserReference",
  "TaskProgress",
  "TaskState",
  "APIPaginatedMetadata",
  // Agent
  "Agent",
  "AgentReference",
  "AgentOutput",
  "AgentOutputParam",
  "AgentDetectStatefulness",
  "MinimalAgent",
  "MinimalAgentParam",
  // Check
  "Check",
  "CheckResult",
  "CheckConfig",
  "CheckConfigParam",
  "CheckTypeParam",
  "OutputAnnotation",
  "JsonPathRule",
  // Dataset & test cases
  "Dataset",
  "DatasetReference",
  "DatasetSubset",
  "TestCase",
  "TestCaseReference",
  "TestCaseComment",
  // Evaluation
  "Evaluation",
  "EvaluationReference",
  "Metric",
  "TestCaseEvaluation",
  "TestCaseEvaluationReference",
  "DivergenceWarning",
  "FailureCategory",
  "FailureCategoryParam",
  "FailureCategoryResult",
  // Scan
  "Scan",
  "ScanCategory",
  "ScanProbe",
  "ScanProbeMetric",
  "ScanProbeAttempt",
  "ScanProbeAttemptError",
  "ScanProbeAttemptReference",
  "Severity",
  "ReviewStatus",
  // Knowledge base
  "KnowledgeBase",
  "KnowledgeBaseReference",
  "KnowledgeBaseDocumentRow",
  "KnowledgeBaseDocumentDetail",
  "Topic",
  // Project & scenario
  "Project",
  "Scenario",
  "ScenarioPreview",
  // Scheduled evaluation
  "ScheduledEvaluation",
  "FrequencyOption",
  "LastExecutionStatus",
  "LastExecutionStatusParam",
  // Task
  "Task",
  "TaskStatus",
  "TaskPriority",
  // Playground chat
  "PlaygroundChat",
  // Audit
  "Audit",
  "AuditDisplay",
  "AuditDiffItem",
  "AuditDisplayDiffItem",
]);

/** Slug used for the anchor `id` of a type's TypeTable in the docs. */
export function typeAnchorId(typeName: string): string {
  return `type-${typeName}`;
}

/**
 * Escape characters that are special in HTML.
 */
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// `g` flag is required for `String.replace` to walk every match. `lastIndex`
// is automatically reset on each `replace` call so the module-level regex
// is safe to share across invocations.
const IDENTIFIER_RE = /[A-Za-z_][A-Za-z0-9_]*/g;

/**
 * Tokenize a type string and replace any token that matches a known SDK type
 * with a link to its anchor. Non-matching tokens, punctuation, and whitespace
 * are preserved verbatim (with HTML special characters escaped).
 *
 * Tokenization happens BEFORE HTML escaping so an entity like `&amp;` cannot
 * be tokenized as the identifier `amp` and falsely linked.
 */
export function linkifyType(typeStr: string): string {
  let out = "";
  let cursor = 0;
  for (const match of typeStr.matchAll(IDENTIFIER_RE)) {
    const [token] = match;
    const start = match.index ?? 0;
    // Escape the gap between the previous match and this one.
    if (start > cursor) {
      out += escapeHtml(typeStr.slice(cursor, start));
    }
    if (KNOWN_TYPES.has(token)) {
      out += `<a class="api-type-link" href="#${typeAnchorId(token)}">${token}</a>`;
    } else {
      // Identifiers can never contain HTML-significant characters, so the
      // token itself is safe to emit as-is.
      out += token;
    }
    cursor = start + token.length;
  }
  // Escape any trailing punctuation/whitespace after the last match.
  if (cursor < typeStr.length) {
    out += escapeHtml(typeStr.slice(cursor));
  }
  return out;
}

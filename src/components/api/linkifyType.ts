/**
 * Auto-linker and presentation helper for API reference type strings.
 *
 * Two API surfaces use these components:
 *   - Hub SDK reference (`/hub/sdk/reference`) — the giskard-hub-python SDK,
 *     all types live in one big `## Types` section. Components default to
 *     collapsible cards because the page is long.
 *   - OSS Checks reference (`/oss/checks/reference/*`) — the giskard-checks
 *     library, types are interleaved with their classes. Components default
 *     to always-open cards because each page is small and users want to scan
 *     it without clicking.
 *
 * Each surface gets its own set of "linkable" type names so a reference to
 * `Trace` on an OSS page doesn't dead-end on a Hub SDK anchor (or vice versa).
 */

/** Types defined as `<TypeTable>` in /hub/sdk/reference. */
export const HUB_SDK_KNOWN_TYPES: ReadonlySet<string> = new Set([
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

/**
 * Page URL where each OSS Checks type is defined. Used to emit cross-page
 * `<a href="/oss/checks/reference/core#type-Trace">` links because the OSS
 * reference is split into multiple pages, unlike the Hub SDK page.
 *
 * Keys must match `<TypeTable name="...">` in those files. Add a new entry
 * here when introducing a new TypeTable.
 */
export const OSS_CHECKS_TYPE_PAGES: Readonly<Record<string, string>> = {
  // Core (giskard-docs/src/content/docs/oss/checks/reference/core.mdx)
  Check: "/oss/checks/reference/core",
  CheckResult: "/oss/checks/reference/core",
  Interaction: "/oss/checks/reference/core",
  Trace: "/oss/checks/reference/core",
  // Built-in / LLM checks (checks.mdx)
  BaseLLMCheck: "/oss/checks/reference/checks",
  LLMCheckResult: "/oss/checks/reference/checks",
  // Generators (generators.mdx)
  UserSimulatorOutput: "/oss/checks/reference/generators",
  // Scenarios (scenarios.mdx)
  ScenarioResult: "/oss/checks/reference/scenarios",
  SuiteResult: "/oss/checks/reference/scenarios",
  // Testing utilities (testing-utils.mdx)
  TestCase: "/oss/checks/reference/testing-utils",
  TestCaseResult: "/oss/checks/reference/testing-utils",
  WithSpy: "/oss/checks/reference/testing-utils",
};

/** Types defined as `<TypeTable>` in /oss/checks/reference/*. */
export const OSS_CHECKS_KNOWN_TYPES: ReadonlySet<string> = new Set(
  Object.keys(OSS_CHECKS_TYPE_PAGES),
);

const EMPTY_TYPES: ReadonlySet<string> = new Set();
const EMPTY_TYPE_PAGES: Readonly<Record<string, string>> = {};

export interface TypeLinkConfig {
  /** Type identifiers that should become clickable on this page. */
  knownTypes: ReadonlySet<string>;
  /**
   * For multi-page references, the URL where each type is defined. The
   * linkifier emits `${typePage}#type-X` when the type lives on a different
   * page than the current one.
   */
  typePages: Readonly<Record<string, string>>;
}

/**
 * Pick the appropriate type registry + cross-page map for the page being
 * rendered. Falls back to an empty config so neither component creates
 * broken links on unrelated pages.
 */
export function getTypeLinkConfig(pathname: string): TypeLinkConfig {
  if (pathname.startsWith("/oss/checks/reference")) {
    return {
      knownTypes: OSS_CHECKS_KNOWN_TYPES,
      typePages: OSS_CHECKS_TYPE_PAGES,
    };
  }
  if (pathname.startsWith("/hub/sdk/reference")) {
    return { knownTypes: HUB_SDK_KNOWN_TYPES, typePages: EMPTY_TYPE_PAGES };
  }
  return { knownTypes: EMPTY_TYPES, typePages: EMPTY_TYPE_PAGES };
}

/**
 * Whether the page should render method/type cards as collapsible accordions.
 *
 * The Hub SDK reference is one long page with ~100 methods, so collapsing
 * keeps it scannable. The OSS Checks reference is split into smaller pages,
 * so users want every card visible at a glance.
 */
export function isCollapsibleByDefault(pathname: string): boolean {
  return pathname.startsWith("/hub/sdk/reference");
}

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

// `g` flag is required for `String.matchAll` to walk every match. The regex
// has no internal state across calls because we use `matchAll`, so the
// module-level constant is safe to share across invocations.
const IDENTIFIER_RE = /[A-Za-z_][A-Za-z0-9_]*/g;

/**
 * Strip a single trailing slash so paths from `Astro.url.pathname` and the
 * hand-written entries in `OSS_CHECKS_TYPE_PAGES` always compare equal.
 */
function stripTrailingSlash(path: string): string {
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}

/**
 * Tokenize a type string and replace any token that matches a known SDK type
 * with a link to its anchor. Non-matching tokens, punctuation, and whitespace
 * are preserved verbatim (with HTML special characters escaped).
 *
 * Tokenization happens BEFORE HTML escaping so an entity like `&amp;` cannot
 * be tokenized as the identifier `amp` and falsely linked.
 *
 * If `currentPath` matches the page where the type is defined, the link is
 * emitted as a same-page anchor (`#type-Foo`). Otherwise the link is absolute
 * (`/oss/checks/reference/core#type-Foo`) so cross-page references work.
 */
export function linkifyType(
  typeStr: string,
  knownTypes: ReadonlySet<string> = EMPTY_TYPES,
  currentPath: string = "",
  typePages: Readonly<Record<string, string>> = EMPTY_TYPE_PAGES,
): string {
  const normalizedCurrent = stripTrailingSlash(currentPath);
  let out = "";
  let cursor = 0;
  for (const match of typeStr.matchAll(IDENTIFIER_RE)) {
    const [token] = match;
    const start = match.index ?? 0;
    // Escape the gap between the previous match and this one.
    if (start > cursor) {
      out += escapeHtml(typeStr.slice(cursor, start));
    }
    if (knownTypes.has(token)) {
      const targetPage = typePages[token];
      let href = `#${typeAnchorId(token)}`;
      if (targetPage && stripTrailingSlash(targetPage) !== normalizedCurrent) {
        href = `${targetPage}${href}`;
      }
      out += `<a class="api-type-link" href="${href}">${token}</a>`;
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

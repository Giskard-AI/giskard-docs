---
name: api-reference-generator
description: Regenerates and updates API reference documentation for giskard packages (like giskard-checks) using pdoc3. Use when the user asks to "regenerate api reference" or update API docs.
---

You are an expert in Python documentation and API reference generation. Your goal is to regenerate the API reference for specific packages and update the documentation source files.

**Workflow:**

1.  **Check Dependencies:**
    *   Ensure `pdoc3` is installed. If not, run: `uv pip install pdoc3`.
    *   Ensure the target package is installed and up-to-date.
        *   For `giskard-checks`, run: `uv pip install "giskard-checks @ git+ssh://git@github.com/Giskard-AI/giskard-oss.git@main#subdirectory=libs/giskard-checks"`.

2.  **Generate Documentation:**
    *   Run the documentation generator.
    *   Command: `uv run pdoc3 --output-dir={package}-api-reference {package}`
    *   This generates files into the temporary directory `package-api-reference`.
        *   For `giskard-checks`, run `uv run pdoc3 --output-dir=checks-api-reference giskard.checks`

3.  **Update Reference Documentation:**
    *   **Target Directory:** `path/to/docs/{package}/reference/`
        * For `giskard-checks`, the path is `docs-new/src/content/docs/oss/checks/reference/`
    *   **Source Directory:** `{package}-api-reference/` (the temp dir you just created)
    *   **Compare and Sync Strategy:**
        *   **Analyze Structure:** First, understand the structure of the existing documentation in the Target Directory (e.g., are functions grouped by module? are they in `.mdx` files?).
        *   **Extract & Update:** For each module/class/function in the Source:
            *   Find the corresponding file in the Target.
            *   **Do NOT simply overwrite.** Parse the Source to extract updated signatures, docstrings, and parameters.
            *   Carefully update the Target file to reflect these changes while **preserving existing frontmatter, custom descriptions, and manual examples**.
        *   **Handle New Content:** If the Source contains new modules or functions not in the Target, propose where to add them (e.g., adding to an existing relevant file or creating a new one following the project's style).
        *   **Handle Obsolete Content:** Identify items in the Target that are no longer in the Source. Mark them for removal or ask the user for confirmation.
    *   **Cleanup:**
        *   Remove the temporary directory `{package}-api-reference` after the update is complete.

**Important Notes:**
*   Be careful with file extensions. `pdoc3` might generate `.html` but the target has `.md` or `.mdx`, you might need to adjust the content and adhere to target files.
 


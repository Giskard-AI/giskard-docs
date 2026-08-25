# Set Access Rights Page Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the Hub “Set access rights” page with current Hub (ART off, light mode) by replacing six screenshots in place and fixing stale copy, without changing page structure.

**Architecture:** Single MDX how-to plus six existing PNGs. Copy is overwritten in `access-rights.mdx`. Screenshots are captured from local Hub and saved over the same `_static` paths. No Hub application code changes. PR targets the parent docs feature branch, not `main`.

**Tech Stack:** Starlight MDX (`@astrojs/starlight` Tabs), static PNGs under `public/_static/images/hub/`, local Hub at `https://app.llm.localhost`, pnpm/Astro for preview.

## Global Constraints

- Keep title, sidebar order, three headings, and User/Group tabs.
- Overwrite existing PNG paths. Do not add new image filenames.
- Screenshots: light mode, no ART badge, no Red Team Audit permission row.
- Hub launch flag: `GISKARD_HUB_AGENTIC_RED_TEAMER__ENABLED=false`.
- PR target: `feature/eng-1682-v30-align-documentation`, not `main`.
- Work branch: `feature/eng-1713-update-set-access-right-page`.
- Isolated git worktree: `/Users/kevinmessiaen/work/giskard-docs/.worktrees/eng-1713-update-set-access-right-page` (do not edit the primary checkout).
- Do not mention Red Team Audit, ART, or a feature flag in the page.
- Do not reseed Hub demo data or invent Finance/Healthcare projects.
- Do not change Hub application code.
- Implementation is one docs commit for the mdx + six PNGs (`docs(hub): refresh Set access rights for Hub v3`).

Spec: `docs/superpowers/specs/2026-08-25-set-access-rights-design.md`

---

## File Map

| File | Responsibility |
| --- | --- |
| `src/content/docs/hub/ui/access-rights.mdx` | Page copy, tabs, image references, alt text |
| `public/_static/images/hub/access-settings.png` | Users list screenshot |
| `public/_static/images/hub/access-settings-group.png` | Groups list screenshot |
| `public/_static/images/hub/access-settings-group-user.png` | Overflow menu on **Edit groups** |
| `public/_static/images/hub/access-settings-group-assign.png` | Edit groups dialog |
| `public/_static/images/hub/access-permissions.png` | Edit permissions, Global grid |
| `public/_static/images/hub/access-scope.png` | Edit permissions, Scoped section |

Do not create new files besides this plan and the spec (already committed).

---

### Task 1: Replace page copy

**Files:**
- Modify: `src/content/docs/hub/ui/access-rights.mdx` (entire file)

**Interfaces:**
- Consumes: spec copy rules (User Management nav, ART-off entity inventory, remove first-login tip)
- Produces: updated MDX that still references the six existing image paths

- [ ] **Step 1: Confirm the old copy is what we will replace**

From the worktree root:

```bash
rg -n "select \"Users\"|Edit Group|Permission|log in first|Red Team|ART" src/content/docs/hub/ui/access-rights.mdx
```

Expected: matches for `select "Users"`, `Edit Group`, `Permission`, and `log in first`. No `Red Team` or `ART` (those must stay absent after the edit too).

- [ ] **Step 2: Overwrite `src/content/docs/hub/ui/access-rights.mdx` with this exact file**

```mdx
---
title: "Set access rights"
description: "Configure role-based access control and manage user permissions for secure collaboration across LLM agent testing projects."
sidebar:
  order: 9
---

import { Tabs, TabItem } from "@astrojs/starlight/components";

This section provides guidance on managing users in the Hub.

The Hub allows you to set access rights at two levels: global and scoped for both users and groups. To begin, click the Settings icon on the left panel, then open **User Management**.

## Configure users and groups

<Tabs>
  <TabItem label="User-level permissions">
    To manage user-level permissions, click the Settings icon in the left panel, open **User Management**, then select **Users**.

    ![Users settings page with the Invite user button and user cards](/_static/images/hub/access-settings.png)

  </TabItem>
  <TabItem label="Group-level permissions">
    To manage group-level permissions, click the Settings icon in the left panel, open **User Management**, then select **Groups**.

    ![Groups settings page with the Create group button and group cards](/_static/images/hub/access-settings-group.png)

    After creating a group, go back to **Users**. Open the three-dot menu on a user card and click **Edit groups**.

    ![User list with the overflow menu open on Edit groups](/_static/images/hub/access-settings-group-user.png)

    This opens a dialog titled **Editing groups for** the user, where you select the groups to assign.

    ![Group assignment dialog for adding a user to a group](/_static/images/hub/access-settings-group-assign.png)

    To set global and scoped permissions, use **Edit permissions** in the same menu. That opens a dialog, not a separate page.

  </TabItem>
</Tabs>

## Configure Global Permissions

Global permissions apply to all projects. You can configure Create, Read, Edit, and Delete for Project, Check, Dataset, Agent, Knowledge Base, Evaluation, Scan, Task, and User Management. For Playground, API Key Authentication, and Audit, you can enable or disable Use.

The rights are as follows:

- **Create**: users can create a new entity of the given type.
- **Read**: users can see entities of the given type.
- **Edit**: users can modify entities of the given type.
- **Delete**: users can permanently remove entities of the given type.
- **Use**: users can use the given feature.

![Global permissions grid in the Edit permissions dialog](/_static/images/hub/access-permissions.png)

## Configure Scoped Permissions

Scoped permissions allow for granular control. For each project, you can specify which entities users can access — a project, a dataset, or an agent. An example of where this may be useful is if you want users to read everything in a project but only allow a few people to edit the dataset.

![Scoped permissions in the Edit permissions dialog](/_static/images/hub/access-scope.png)
```

Do not add a `:::tip` block. Do not mention Red Team Audit, ART, or a feature flag.

- [ ] **Step 3: Format the MDX**

```bash
pnpm exec prettier --write src/content/docs/hub/ui/access-rights.mdx
```

Expected: Prettier rewrites the file in place or reports it unchanged.

- [ ] **Step 4: Run copy checks**

```bash
rg -n "Edit Group|log in first|select \"Users\"|Permission,|Red Team|ART" src/content/docs/hub/ui/access-rights.mdx
rg -n "User Management|Edit groups|Edit permissions|API Key Authentication|Audit" src/content/docs/hub/ui/access-rights.mdx
```

Expected first command: no matches.

Expected second command: matches for `User Management`, `Edit groups`, `Edit permissions`, `API Key Authentication`, and `Audit`.

Also confirm the three headings still exist:

```bash
rg -n "^## " src/content/docs/hub/ui/access-rights.mdx
```

Expected:

```
## Configure users and groups
## Configure Global Permissions
## Configure Scoped Permissions
```

Do not commit yet. Screenshots land in the same commit.

---

### Task 2: Capture and overwrite the six screenshots

**Files:**
- Modify: `public/_static/images/hub/access-settings.png`
- Modify: `public/_static/images/hub/access-settings-group.png`
- Modify: `public/_static/images/hub/access-settings-group-user.png`
- Modify: `public/_static/images/hub/access-settings-group-assign.png`
- Modify: `public/_static/images/hub/access-permissions.png`
- Modify: `public/_static/images/hub/access-scope.png`

**Interfaces:**
- Consumes: local Hub at `https://app.llm.localhost` with `GISKARD_HUB_AGENTIC_RED_TEAMER__ENABLED=false`; MDX image paths from Task 1
- Produces: six light-mode PNGs with no ART badge and no Red Team Audit row

- [ ] **Step 1: Confirm Hub is ART-off**

From `/Users/kevinmessiaen/work/llm-hub`:

```bash
docker compose exec -T frontend printenv GISKARD_HUB_AGENTIC_RED_TEAMER_ENABLED
```

Expected: `false`

If it is `true` or empty, restart frontend with the flag and re-check:

```bash
GISKARD_HUB_AGENTIC_RED_TEAMER__ENABLED=false docker compose up -d frontend
```

- [ ] **Step 2: Sign in as an admin and set Light theme**

1. Open `https://app.llm.localhost`.
2. Sign in. Try `user` / `user` first. If Settings → User Management is missing, sign in as `admin` (local admin account).
3. Open the user menu (bottom of the sidebar) → theme → **Light**.
4. Confirm the UI is light (white/gray chrome, not dark).
5. Confirm there is no ART badge in the sidebar or header.

- [ ] **Step 3: Shoot Users list → `access-settings.png`**

1. Go to `https://app.llm.localhost/settings/permissions`.
2. Crop to the Hub UI (sidebar + Users list). No browser chrome.
3. Reject the frame if ART or Red Team Audit appears.
4. Overwrite `public/_static/images/hub/access-settings.png` in the worktree.

- [ ] **Step 4: Shoot Groups list → `access-settings-group.png`**

1. Go to `https://app.llm.localhost/settings/permissions/groups`.
2. Crop to the Hub UI (sidebar + Groups list with **Create group**).
3. Overwrite `public/_static/images/hub/access-settings-group.png`.

- [ ] **Step 5: Shoot overflow menu → `access-settings-group-user.png`**

1. Go to `https://app.llm.localhost/settings/permissions`.
2. Open the three-dot menu on a user card.
3. Capture with **Edit groups** visible (also fine if **Edit permissions** is visible in the same menu).
4. Overwrite `public/_static/images/hub/access-settings-group-user.png`.

- [ ] **Step 6: Shoot Edit groups dialog → `access-settings-group-assign.png`**

1. Click **Edit groups**.
2. Capture the dialog titled **Editing groups for {name} ({email})**.
3. Overwrite `public/_static/images/hub/access-settings-group-assign.png`.

- [ ] **Step 7: Shoot Global permissions → `access-permissions.png`**

1. From the same user menu, click **Edit permissions** (or open `/settings/permissions/{userId}`).
2. Capture the **Global permissions** section.
3. The grid must include CRUD rows: Project, Check, Dataset, Agent, Knowledge Base, Evaluation, Scan, Task, User Management.
4. The grid must include Use rows: Playground, API Key Authentication, Audit.
5. Reject the frame if a **Red Team Audit** row is present.
6. Overwrite `public/_static/images/hub/access-permissions.png`.

- [ ] **Step 8: Shoot Scoped permissions → `access-scope.png`**

1. In the same dialog, scroll to **Scoped permissions**.
2. Capture the scoped UI (project picker and **Add Scope**). If a Notice about group-granted permissions is visible, include it.
3. If local projects are sparse, still shoot the empty/thin scoped UI. Do not create fake Finance/Healthcare projects.
4. Overwrite `public/_static/images/hub/access-scope.png`.

- [ ] **Step 9: Visual reject checklist**

Open each of the six PNGs and confirm:

- Light mode
- No ART badge
- No Red Team Audit row
- Filename matches the table in the spec
- No browser chrome

If any file fails, recapture that file only. Do not commit yet.

---

### Task 3: Verify the page and commit

**Files:**
- Test: `src/content/docs/hub/ui/access-rights.mdx`
- Test: the six PNGs from Task 2

**Interfaces:**
- Consumes: Task 1 MDX + Task 2 PNGs
- Produces: one implementation commit on `feature/eng-1713-update-set-access-right-page`

- [ ] **Step 1: Confirm image paths still match the MDX**

```bash
rg -o "/_static/images/hub/access-[a-z-]+\.png" src/content/docs/hub/ui/access-rights.mdx
ls public/_static/images/hub/access-*.png
```

Expected MDX paths (exactly these six, no extras):

```
/_static/images/hub/access-settings.png
/_static/images/hub/access-settings-group.png
/_static/images/hub/access-settings-group-user.png
/_static/images/hub/access-settings-group-assign.png
/_static/images/hub/access-permissions.png
/_static/images/hub/access-scope.png
```

- [ ] **Step 2: Re-run forbidden-string checks**

```bash
rg -n "Red Team|ART|Edit Group|log in first" src/content/docs/hub/ui/access-rights.mdx
```

Expected: no matches.

- [ ] **Step 3: Preview the page**

From the worktree, if `node_modules` is missing run `pnpm install` once. Then:

```bash
pnpm start
```

Open `http://localhost:4321/hub/ui/access-rights/` (Starlight may redirect; use the URL the dev server prints).

Confirm:

- Three headings and User/Group tabs render
- All six images load
- Global inventory in the text matches the Global screenshot grid
- Nav labels in the text match the screenshots

Stop the preview after checking (`Ctrl+C`).

If `pnpm start` is too heavy, run:

```bash
pnpm exec astro build
```

Expected: build succeeds. Then spot-check `dist/hub/ui/access-rights/index.html` contains `User Management` and does not contain `log in first`.

- [ ] **Step 4: Commit implementation (mdx + six PNGs only)**

Worktree root. Do not `git add -A`.

```bash
git add \
  src/content/docs/hub/ui/access-rights.mdx \
  public/_static/images/hub/access-settings.png \
  public/_static/images/hub/access-settings-group.png \
  public/_static/images/hub/access-settings-group-user.png \
  public/_static/images/hub/access-settings-group-assign.png \
  public/_static/images/hub/access-permissions.png \
  public/_static/images/hub/access-scope.png
git commit -m "$(cat <<'EOF'
docs(hub): refresh Set access rights for Hub v3

EOF
)"
```

Expected: commit succeeds. If a pre-commit hook rewrites whitespace, add the modified file and create a **new** commit with the same message (do not amend unless the first commit succeeded and only the hook touched files).

- [ ] **Step 5: Confirm branch and parent**

```bash
git status -sb
git log --oneline -3
```

Expected: on `feature/eng-1713-update-set-access-right-page`. Do not open a PR against `main`. When opening a PR later, set the base to `feature/eng-1682-v30-align-documentation`.

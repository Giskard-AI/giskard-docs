# Refresh Hub “Set access rights” page (ENG-1713)

Parent: [ENG-1682](https://linear.app/giskard/issue/ENG-1682/v30-align-documentation)
Issue: [ENG-1713](https://linear.app/giskard/issue/ENG-1713/update-set-access-right-page)

## Goal

Bring `src/content/docs/hub/ui/access-rights.mdx` in line with current Hub (latest `dev`, ART off, light mode). Keep the existing page structure. Replace the six screenshots in place and fix copy that no longer matches the UI.

## Constraints

- Keep title, sidebar order, three headings, and User/Group tabs.
- Overwrite existing PNG paths. Do not add new image filenames.
- Screenshots: light mode, no ART badge, no Red Team Audit permission row.
- Hub launch flag: `GISKARD_HUB_AGENTIC_RED_TEAMER__ENABLED=false`.
- PR target: `feature/eng-1682-v30-align-documentation`, not `main`.
- Work branch: `feature/eng-1713-update-set-access-right-page`.
- Isolated git worktree (do not edit the primary checkout, which may be on another docs issue).

## In scope

- `src/content/docs/hub/ui/access-rights.mdx`
- These six files under `public/_static/images/hub/`:
  - `access-settings.png`
  - `access-settings-group.png`
  - `access-settings-group-user.png`
  - `access-settings-group-assign.png`
  - `access-permissions.png`
  - `access-scope.png`

## Out of scope

- Event Log (ENG-1712)
- Other Hub UI pages
- Glossary / comparison links that point at this page
- Documenting ART, Red Team Audit, or the feature flag
- Reseeding Hub demo data or inventing Finance/Healthcare projects if they are not in the local instance

## Copy

### Navigation

Settings icon → **User Management** → **Users** or **Groups**.

Do not say the parent item is still labeled “Users”.

### User tab

Path above. Screenshot: Users list (`Invite user`, user cards).

### Group tab

Same Settings path, then **Groups**. Screenshot: Groups list (`Create group`).

To assign a user to a group: Users list → three-dot menu → **Edit groups** (not “Edit Group”). Screenshot: menu open on that item.

That opens the dialog titled **Editing groups for {name} ({email})**. Screenshot: group checkboxes.

Mention **Edit permissions** as the entry to Global/Scoped. That is a separate dialog, not a full page.

### Configure Global Permissions

Keep the heading, “apply to all projects”, and these bullets:

- **Create**: users can create a new entity of the given type.
- **Read**: users can see entities of the given type.
- **Edit**: users can modify entities of the given type.
- **Delete**: users can permanently remove entities of the given type.
- **Use**: users can use the given feature.

Replace the entity sentence with the ART-off inventory, using Hub labels:

- CRUD: Project, Check, Dataset, Agent, Knowledge Base, Evaluation, Scan, Task, User Management
- Use: Playground, API Key Authentication, Audit

Do not mention Red Team Audit, ART, or a feature flag.

### Configure Scoped Permissions

Keep the heading and the example: read everything in a project, but only some people can edit the dataset.

Align leftover “pages” wording with Hub copy: permissions on a project, a dataset, or an agent.

### Tip

Remove the tip “Users need to log in first before an admin can give them any permissions.” Invite user can assign permissions at invite time (`frontend/src/app/(app)/settings/permissions/invite-user.tsx`). Do not document a false gate.

## Screenshots

Source: local Hub at `https://app.llm.localhost`, ART off, Light theme.

Account: an admin who can open User Management. Prefer `admin` if `user` cannot see Settings → User Management. Use whatever users/groups exist locally.

Crop to the Hub UI, not browser chrome. Keep descriptive alt text; update it to the new labels.

| File | Content |
| --- | --- |
| `access-settings.png` | Users list |
| `access-settings-group.png` | Groups list |
| `access-settings-group-user.png` | Users list, overflow open on **Edit groups** |
| `access-settings-group-assign.png` | Edit groups dialog |
| `access-permissions.png` | Edit permissions dialog, Global section, full ART-off grid |
| `access-scope.png` | Same dialog scrolled to Scoped (and Notice if it is visible) |

If scoped demo data is thin, still shoot the scoped UI (project picker and Add Scope). Do not seed fake projects for the docs.

Reject any frame that shows an ART badge or a Red Team Audit row.

## Git

- Worktree: `.worktrees/eng-1713-update-set-access-right-page`
- Branch: `feature/eng-1713-update-set-access-right-page`
- Base / PR target: `feature/eng-1682-v30-align-documentation`
- Implementation: one docs commit replacing the six PNGs and updating the mdx
- Message shape: `docs(hub): refresh Set access rights for Hub v3`

## Verification

- Hub still ART-off and light mode when shooting
- No ART badge or Red Team Audit row in any PNG
- Nav labels in the mdx match the shots
- Global inventory in the mdx matches the Global grid
- Docs preview or site build so the page and images render

## Non-goals

- Do not restructure the page into a different Diataxis type
- Do not add a permissions reference table beyond the two-sentence inventory
- Do not change Hub application code

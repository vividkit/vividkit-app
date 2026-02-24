# Debug Report — Git Setup folder browse issue (macOS)

## Executive summary
- Symptom: click Browse in Git Setup, user cannot select local folder.
- Root cause most likely: frontend invokes non-existent Tauri command `open_directory_dialog`; error swallowed.
- Severity: medium (onboarding UX blocked for users who rely on picker).
- Scope status: real bug in current code, but not M1 milestone blocker (M1 is data foundation; onboarding real picker is M4 scope).

## Trace map (required path)
1) UI event → React handler
- `/Users/thieunv/projects/solo-builder/vividkit-workspace/vividkit-app/src/components/onboarding/step-git-setup.tsx:71`
  - Browse button `onClick={browse}`
- `/Users/thieunv/projects/solo-builder/vividkit-workspace/vividkit-app/src/components/onboarding/step-git-setup.tsx:19-29`
  - `browse()` calls `invoke<string | null>('open_directory_dialog')`

2) React state/store path
- `/Users/thieunv/projects/solo-builder/vividkit-workspace/vividkit-app/src/components/onboarding/step-git-setup.tsx:23`
  - On success, only patches local wizard state `patch({ gitPath: selected })`
- `/Users/thieunv/projects/solo-builder/vividkit-workspace/vividkit-app/src/components/onboarding/onboarding-wizard.tsx:34-36`
  - `patch` updates component-local `useState`
- `/Users/thieunv/projects/solo-builder/vividkit-workspace/vividkit-app/src/components/onboarding/onboarding-wizard.tsx:41-52`
  - Store path (`addProject`) happens only at finish, not during browse.

3) lib/tauri invoke wrapper
- No wrapper used for folder browse.
- Direct invoke from UI in `step-git-setup.tsx:22`.
- Contrasts with wrapped style in `/Users/thieunv/projects/solo-builder/vividkit-workspace/vividkit-app/src/lib/tauri-project.ts:16-34`.

4) Tauri command/plugin path
- Command invoked by UI: `open_directory_dialog`.
- Registered commands list has no `open_directory_dialog`:
  - `/Users/thieunv/projects/solo-builder/vividkit-workspace/vividkit-app/src-tauri/src/lib.rs:22-69`
- Grep confirms only callsite exists:
  - `src/components/onboarding/step-git-setup.tsx:22`
- Dialog plugin is initialized:
  - `/Users/thieunv/projects/solo-builder/vividkit-workspace/vividkit-app/src-tauri/src/lib.rs:12`

5) Capability/permission config
- Dialog permission exists:
  - `/Users/thieunv/projects/solo-builder/vividkit-workspace/vividkit-app/src-tauri/capabilities/default.json:12` (`dialog:default`)

6) Error handling/user-facing message
- Browse catch block is silent:
  - `/Users/thieunv/projects/solo-builder/vividkit-workspace/vividkit-app/src/components/onboarding/step-git-setup.tsx:24-26`
  - Comment says cancelled or failed, no toast/log → user sees nothing.

## Root cause hypothesis + evidence
### Hypothesis A (primary, high confidence)
Frontend calls a command that does not exist in backend command registry.

Evidence:
- Call: `invoke('open_directory_dialog')` at `step-git-setup.tsx:22`.
- `open_directory_dialog` missing from `generate_handler![]` in `src-tauri/src/lib.rs:22-69`.
- No Rust function with that name in `src-tauri/src/**` (grep no matches).
- Silent catch hides invoke error from user.

Expected runtime behavior:
- Tauri returns command-not-found error for invoke.
- catch consumes error; button appears to do nothing.

### Hypothesis B (secondary)
Feature was scaffolded as UI prototype and never wired to real dialog API/command.

Evidence:
- Roadmap marks onboarding route as UI prototype and real git picker under M4:
  - `/Users/thieunv/projects/solo-builder/vividkit-workspace/vividkit-app/docs/development-roadmap.md:18`
  - `/Users/thieunv/projects/solo-builder/vividkit-workspace/vividkit-app/docs/development-roadmap.md:108`
- Yet phase doc earlier specified browse should invoke dialog:
  - `/Users/thieunv/projects/solo-builder/vividkit-workspace/vividkit-app/plans/260222-2244-screen-implementation/phase-02-onboarding.md:43`

## Bug vs out-of-scope conclusion
Conclusion: **real bug in current behavior** and **also outside strict M1 objectives**.

Why bug:
- Code path is present in UI now; user action triggers broken invoke call.
- This is not just “missing enhancement”; it is an invalid IPC contract.

Why out-of-scope for M1:
- M1 target is SQLite persistence + CRUD wiring, not onboarding completion.
- Roadmap says onboarding real picker belongs to M4, and onboarding overall still prototype.

Practical prioritization:
- Not M1 release blocker.
- Should still fix soon because onboarding entry flow is user-facing.

## Minimal in-scope fix plan (no edits yet)
Option 1 (prefer, smallest code change + aligns Tauri v2 plugin model):
1. Frontend replace `invoke('open_directory_dialog')` with dialog plugin API (`@tauri-apps/plugin-dialog` open/select directory).
2. Keep return type `string | null`; set `gitPath` when selected.
3. Add visible error feedback in catch (existing toast event pattern).
4. Keep cancellation non-error path.

Option 2:
1. Add Rust `#[tauri::command] open_directory_dialog` wrapping dialog plugin.
2. Register command in `generate_handler![]`.
3. Keep current frontend invoke call.

Recommendation:
- Choose Option 1 for KISS/DRY (remove unnecessary custom IPC).

## Risks / side effects
- If plugin import/API signature differs from expected, TypeScript compile errors until adjusted.
- Must ensure capability allows dialog (already present).
- Adding error toast may expose technical messages; should map to friendly i18n key later.
- For clone flow, path semantics still weak (`cloneUrl` may be passed to create_project in some paths) — separate issue.

## Unresolved questions
1. Should onboarding in current branch be treated as production flow now, or still prototype-only for internal testing?
2. Team preference: plugin-dialog direct frontend use vs custom Rust command for policy centralization?
3. Do we want browse action available in both `/onboarding` and `/new-project` immediately (shared component implies yes)?

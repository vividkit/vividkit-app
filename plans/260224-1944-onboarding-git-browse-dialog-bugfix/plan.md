---
title: "Fix onboarding Git browse dialog command mismatch"
description: "Replace missing IPC command usage in Onboarding Git Setup with a safe folder picker path using Tauri dialog plugin API."
status: completed
priority: P1
effort: 1h
branch: mvp
tags: [bugfix, onboarding, tauri, dialog]
created: 2026-02-24
---

# Plan overview

## Goal
Fix Browse folder button in Onboarding Git Setup (macOS-first, cross-platform safe) with minimal change. Current bug: frontend calls non-existent Tauri command `open_directory_dialog`.

## Decision (low-risk path)
**Choose frontend Tauri dialog plugin API** (`@tauri-apps/plugin-dialog`) instead of adding a Rust command wrapper.

### Why this is lower risk
- Root cause is frontend/IPC mismatch; fix at callsite removes mismatch directly.
- Backend already initializes `tauri_plugin_dialog` and capability includes `dialog:default`.
- Fewer moving parts than adding Rust command + registration + IPC contract.
- Avoids creating/maintaining a one-off command wrapper for a built-in plugin capability.

### Rejected option (for this bugfix)
- **Rust command wrapper (`open_directory_dialog`)**: works, but adds backend surface area and extra IPC plumbing for a simple folder picker.

## Scope (minimal)
- Replace `invoke('open_directory_dialog')` in Onboarding Git Setup browse handler with dialog plugin folder picker call.
- Keep cancel dialog as non-error path.
- Keep existing state patch behavior (`patch({ gitPath })`) unchanged.
- No platform-specific frontend branching.

## Files to modify
- `/Users/thieunv/projects/solo-builder/vividkit-workspace/vividkit-app/src/components/onboarding/step-git-setup.tsx`
- `/Users/thieunv/projects/solo-builder/vividkit-workspace/vividkit-app/package.json` (only if `@tauri-apps/plugin-dialog` dependency is missing)
- Lockfile if dependency add is required (repo-managed lockfile)

## Validation plan
1. **Static check (TS/build)**
   - `npm run build` (or at least `tsc`) passes.
   - No import/type errors for dialog plugin API.
2. **Manual smoke (macOS)**
   - Open Onboarding → Git Setup.
   - Click Browse in both modes:
     - Local Repository → Project Path
     - Clone Repository → Destination Path
   - Select folder → input updates with chosen path.
   - Cancel dialog → no crash, no invalid path overwrite.
3. **Cross-platform sanity (non-functional)**
   - No hardcoded path separators or platform checks introduced in frontend.

## DONE criteria
- Browse button opens folder picker instead of silently failing.
- Selected folder path is written to the correct input field (`gitPath`).
- Cancel remains safe/no-op.
- No new Rust command added.
- Build/typecheck passes after change.

## Risks / notes
- If JS package `@tauri-apps/plugin-dialog` is not installed, adding dependency may touch lockfile (acceptable, still low risk).
- Dialog API return type may be union (`string | string[] | null`); implementation should defensively handle only single-folder string for this flow.

## Unresolved questions
- None for this minimal bugfix plan.

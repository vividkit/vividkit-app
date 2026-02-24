---
title: "Phase 2: Auto-fix in-scope M1 (CCS profile list wiring)"
description: "Wire Settings CCS Test Console to backend list_ccs_profiles with minimal M1-only changes."
status: completed
priority: P2
effort: 1.5h
branch: mvp
tags: [m1, phase-2, settings, ccs, tauri, ui]
created: 2026-02-24
---

# Phase 2 (Auto-fix in-scope M1) — Short Implementation Plan

## Scope (strict M1 only)
- Fix known M1 follow-up: **Settings CCS Test Console profile picker still hardcoded**.
- Use existing backend command `list_ccs_profiles` (already implemented + registered).
- No changes to M2/M3/M4 mock/runtime issues.

## Minimal code changes (file-level)
1. **`/Users/thieunv/projects/solo-builder/vividkit-workspace/vividkit-app/src/lib/tauri-ccs.ts`**
   - Add TS type for backend response (e.g. `CcsProfile { name, profileType }` matching camelCase serde).
   - Add `listCcsProfiles()` invoke wrapper for `list_ccs_profiles`.
   - Keep existing `spawnCcs/stopCcs/sendCcsInput` unchanged.

2. **`/Users/thieunv/projects/solo-builder/vividkit-workspace/vividkit-app/src/components/settings/ccs-test-console.tsx`**
   - Replace hardcoded `PROFILES` as primary source.
   - Load profile list from `listCcsProfiles()` on mount (or same init effect area).
   - Map backend response to Select items (`profile.name`).
   - Keep a small fallback list (existing hardcoded array) only when command fails or returns empty (UX-safe for M1).
   - Preserve current run/stop terminal behavior; no PTY flow changes.
   - Ensure selected `profile` remains valid after async load (fallback to first available if needed).

## Out of scope (explicit)
- Onboarding/profile picker wiring (unless user expands scope)
- Backend `list_ccs_profiles` logic changes
- Broader mock-runtime cleanup in M2/M3/M4
- i18n/string cleanup in this screen (follow-up only if already touching labels becomes necessary)

## Validation steps (typecheck / build / test)
1. **Typecheck + frontend build**
   - Run `npm run build` (includes `tsc && vite build`).
2. **Lint (targeted quality check)**
   - Run `npm run lint` (or at minimum verify touched files compile clean with no TS errors).
3. **Rust compile sanity (only if Rust files accidentally touched)**
   - Run `cargo check` in `src-tauri/`.
4. **Manual smoke test (required)**
   - Open Settings → CCS Test Console.
   - Verify profile dropdown loads dynamic profiles from local `~/.ccs` (including custom profile if present).
   - Verify fallback list appears if backend returns empty/error.
   - Run a test command and confirm run/stop behavior unchanged.

## DONE criteria
- CCS Test Console profile dropdown no longer depends on hardcoded list as canonical source.
- UI calls backend `list_ccs_profiles` through TS wrapper successfully.
- Custom CCS profiles (in `~/.ccs`) are selectable in Settings test console.
- `npm run build` passes.
- No regression to existing run/stop terminal flow in manual smoke test.

## Risks + simple rollback
### Risks
- **Response shape mismatch** (`profile_type` vs `profileType`) causing empty render/undefined values.
- **Async state race** may reset selected profile unexpectedly.
- **Empty profile list UX** if backend returns no profiles and no fallback applied.

### Mitigation
- Use typed wrapper + explicit mapping from `name` only.
- Keep fallback list and defensive profile selection logic.
- Limit changes to 2 files; do not touch PTY runtime code.

### Rollback (simple)
- Revert only the two touched files:
  - `src/lib/tauri-ccs.ts`
  - `src/components/settings/ccs-test-console.tsx`
- Restore hardcoded profile list behavior if dynamic loading causes regression.

## Unresolved questions
- Có cần mở rộng cùng fix này sang onboarding/profile picker trong cùng Phase 2 không (hiện plan giữ ngoài scope để tránh scope creep)?

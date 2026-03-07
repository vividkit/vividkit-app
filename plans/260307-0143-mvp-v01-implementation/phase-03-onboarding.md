# Phase 03 — Onboarding (M2)

## Overview
- **Priority:** P0
- **Status:** done
- **Goal:** 4-step wizard — Welcome, Git Setup, AI Tools Detection, Project Creation. User exits with project + deck created.

## Key Insights
- No terminal/StreamView needed — pure form UI
- Step 3 (AI Tools) reuses CCS discovery from M0
- Project creation auto-creates default "Main" deck
- After onboarding: redirect to Dashboard or Decks

## Requirements
- Step 1: Welcome screen with "Get Started" CTA
- Step 2: Git repo picker (local browse via Tauri dialog) or clone URL
- Step 3: Show detected Claude Code CLI + CCS profiles (from discover_ccs_profiles)
- Step 4: Project name + description, confirm git path, create project
- On completion: project set as active, default deck created, redirect to `/`

## Related Code Files

**CREATE:**
- `src-tauri/src/commands/project.rs` — create_project (+ auto-create default deck), list_projects, set_active_project, validate_git_repo
- `src/hooks/use-onboarding.ts` — wizard state machine, validation, project creation

**MODIFY:**
- `src/pages/onboarding.tsx` — wire wizard steps
- `src/components/onboarding/` — all step components (already exist as shells)
- `src/stores/project-store.ts` — setActiveProject from DB
- `src/lib/tauri.ts` — add project command wrappers
- `src-tauri/src/commands/mod.rs` — export project module
- `src-tauri/src/lib.rs` — register project commands
- `src/router.tsx` — redirect to /onboarding if no projects exist

## Implementation Steps

1. Create `commands/project.rs`:
   - `create_project(name, description, git_path) -> Project` — also inserts default Deck("Main")
   - `list_projects() -> Vec<Project>`
   - `get_active_project() -> Option<Project>`
   - `set_active_project(id)`
   - `validate_git_repo(path) -> bool` — check if valid git repo via git2
2. Register in lib.rs, add wrappers to tauri.ts
3. Create `use-onboarding.ts`: currentStep, canProceed, formData, handleCreate
4. Wire each onboarding step component:
   - Welcome: static, "Get Started" advances step
   - Git: Tauri `dialog.open()` for folder picker, validate_git_repo
   - AI Tools: invoke discover_ccs_profiles, display results
   - Project: name/desc form, create_project on submit
5. Update router.tsx: check if projects exist on app load, redirect to /onboarding if empty
6. Update project-store to load active project on init

## Todo List
- [x] commands/project.rs — CRUD + validate
- [x] use-onboarding.ts hook
- [x] Wire 4 wizard steps
- [x] Router redirect logic
- [x] Project creation auto-creates default deck
- [x] project-store wired to DB

## Success Criteria
- New user completes 4-step wizard in <2 minutes
- Project + default deck created in DB
- App redirects to Dashboard after completion
- Git repo validation works (valid/invalid feedback)

## Risk Assessment
- Tauri dialog API may differ across platforms — test folder picker on macOS/Windows

## Next Steps
- M4 (Decks + Project Switcher) builds on project creation

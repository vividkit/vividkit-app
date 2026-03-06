# Phase 11 — Settings (M10)

## Overview
- **Priority:** P0
- **Status:** pending
- **Goal:** 4 tabs (General, AI & Commands, Git, Editor), persist to DB. CCS Test Console behind dev mode.

## Key Insights
- CCS Test Console already built and working — just hide behind dev mode
- Dev mode toggle: triple-click version number in About section
- Settings stored in DB (key-value or structured table)
- AI & Commands tab: read-only profiles from CCS, editable command→profile mapping
- Git tab: branch naming, worktree dir, auto-cleanup preferences

## Requirements
- General: language, theme, default IDE, updates, about
- AI & Commands: profiles list (from CCS discovery), command→provider mapping
- Git: default branch, naming pattern, worktree dir, auto-cleanup checkboxes
- Editor: diff theme, font, size, StreamView options
- All settings persisted to DB
- CCS Test Console tab visible only in dev mode

## Related Code Files

**CREATE:**
- `src-tauri/src/commands/settings.rs` — get/set settings
- `src/hooks/use-settings.ts` — CRUD for all settings

**MODIFY:**
- `src/pages/settings.tsx` — wire 4 tabs
- `src/components/settings/settings-general.tsx` — wire to DB
- `src/components/settings/settings-ai-commands.tsx` — profiles + mapping
- `src/components/settings/settings-git.tsx` — git preferences
- `src/components/settings/settings-editor.tsx` — editor preferences
- `src/components/settings/ccs-test-console.tsx` — hide behind dev mode flag
- `src/stores/settings-store.ts` — wire to DB
- `src/lib/tauri.ts` — add settings wrappers

## Implementation Steps

1. Create `commands/settings.rs`:
   - `get_settings() -> AppSettings` — all settings as struct
   - `update_settings(partial) -> AppSettings` — merge partial updates
   - Settings stored as JSON blob or key-value rows in settings table
2. Register commands, add tauri.ts wrappers
3. Create `use-settings.ts`: load on mount, update on change, debounce saves
4. Wire General tab: language selector, theme radio, IDE dropdown, about section
5. Wire AI & Commands tab: display profiles from discover_ccs_profiles, command mapping editor
6. Wire Git tab: default branch, naming pattern input, worktree dir picker, cleanup checkboxes
7. Wire Editor tab: diff theme, font, size slider, StreamView checkboxes
8. Dev mode: track click count on version text, toggle devMode in settings-store
9. Conditionally show CCS Test Console tab when devMode=true

## Todo List
- [ ] commands/settings.rs — get/set
- [ ] use-settings.ts hook
- [ ] General tab functional
- [ ] AI & Commands tab with profiles + mapping
- [ ] Git tab with preferences
- [ ] Editor tab with options
- [ ] Settings persisted to DB
- [ ] Dev mode toggle for CCS Test Console

## Success Criteria
- All 4 tabs display and save settings
- Settings persist across app restarts
- CCS Test Console hidden by default, visible in dev mode
- Profile refresh updates list from ~/.ccs/

## Risk Assessment
- Settings schema evolution: use flexible JSON blob to avoid migrations for new settings

## Next Steps
- Independent of other milestones

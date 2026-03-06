# Phase 05 — Decks + Project Switcher (M4)

## Overview
- **Priority:** P0
- **Status:** pending
- **Goal:** Deck CRUD, active toggle, sidebar project switcher, New Project page.

## Key Insights
- Exactly 1 deck active per project at a time
- Every feature scoped to active project + active deck
- Project switcher lives in sidebar, always visible
- New Project page at `/new-project` reuses project creation logic from onboarding
- Create Deck dialog optionally links to a Key Insight

## Requirements
- Decks page: list all decks for active project, show task/session counts
- Create Deck dialog: name, description, optional Key Insight link, set-active checkbox
- Set Active button toggles deck, re-scopes all data
- Sidebar project switcher dropdown: list projects, active indicator, "+ New Project"
- New Project page: name, description, git path picker, creates project + default deck

## Related Code Files

**CREATE:**
- `src-tauri/src/commands/deck.rs` — CRUD + set_active_deck
- `src/hooks/use-decks.ts` — deck CRUD, active toggle
- `src/components/decks/create-deck-dialog.tsx`
- `src/components/layout/project-switcher.tsx`

**MODIFY:**
- `src/pages/decks.tsx` — wire to real data
- `src/pages/new-project.tsx` — wire to project creation
- `src/components/decks/` — existing shells
- `src/components/layout/sidebar.tsx` — embed project switcher
- `src/stores/deck-store.ts` — wire to DB
- `src/stores/project-store.ts` — wire switching logic
- `src/lib/tauri.ts` — add deck + project wrappers

## Implementation Steps

1. Create `commands/deck.rs`:
   - `create_deck(project_id, name, description, insight_id?, set_active) -> Deck`
   - `list_decks(project_id) -> Vec<Deck>` (with task/session counts)
   - `set_active_deck(project_id, deck_id)` — deactivates other decks
   - `delete_deck(id)` — prevent deleting last deck
2. Register commands, add tauri.ts wrappers
3. Create `use-decks.ts` hook: list, create, setActive, delete
4. Wire decks page: deck cards with counts, Set Active button, Create Deck dialog
5. Create `project-switcher.tsx`: dropdown showing all projects with active deck name
6. Embed project switcher in sidebar.tsx
7. Wire project switching: on select, update active project in store + DB, load that project's active deck
8. Wire `/new-project` page: reuse create_project from Phase 03

## Todo List
- [ ] commands/deck.rs — CRUD
- [ ] use-decks.ts hook
- [ ] Create Deck dialog
- [ ] Project switcher in sidebar
- [ ] Decks page wired to real data
- [ ] New Project page functional
- [ ] Project/deck switching re-scopes all data

## Success Criteria
- Can create/switch/delete decks
- Project switcher shows all projects + active deck
- Switching project loads correct deck and data context
- Only 1 deck active per project at a time

## Risk Assessment
<!-- Updated: Validation Session 1 - Global context event for re-scoping -->
- Data re-scoping on switch: implement global `context-changed` event emitter. Each store subscribes independently and refetches data. Centralized, decoupled approach confirmed.

## Next Steps
- All downstream features (Brainstorm, Tasks, etc.) use active project+deck context

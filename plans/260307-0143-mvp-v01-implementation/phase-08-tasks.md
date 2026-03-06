# Phase 08 — Tasks (M7)

## Overview
- **Priority:** P0
- **Status:** pending
- **Goal:** Task CRUD, list + kanban views (4 columns), Add Task dialog, task detail slide-out. NO drag-drop.

## Key Insights
- Task states: backlog, todo, cooking, paused, review, done, failed
- Kanban: 4 columns (Backlog, Todo, In Progress, Done) — "In Progress" = cooking + paused
- Status changes via buttons only, no drag-drop (v0.2)
- Tasks scoped to active deck
- Cook button on task triggers Cook Sheet (implemented in M8)
- Task can be linked to plan+phase or be standalone ("custom task")

## Requirements
- `/tasks` page with List/Kanban view toggle
- List view: task rows with status/priority badges + Cook button
- Kanban view: 4 columns, task cards with status + Cook button
- Add Task dialog: name, description, priority, type (plan-linked or custom)
- Task detail slide-out: full task info, status change buttons, worktree info
- Filter by status, priority

## Related Code Files

**CREATE:**
- `src-tauri/src/commands/task.rs` — CRUD + status transitions
- `src/hooks/use-tasks.ts` — task list, create, update, status change
- `src/components/tasks/add-task-dialog.tsx`
- `src/components/tasks/task-detail-sheet.tsx`
- `src/components/tasks/task-card.tsx` — kanban card
- `src/components/tasks/task-row.tsx` — list row
- `src/components/tasks/task-kanban-board.tsx`
- `src/components/tasks/task-list-view.tsx`

**MODIFY:**
- `src/pages/tasks.tsx` — wire to real data + view toggle
- `src/components/tasks/` — existing shells
- `src/stores/task-store.ts` — wire to DB
- `src/lib/tauri.ts` — add task command wrappers
- `src-tauri/src/commands/mod.rs` — export task module
- `src-tauri/src/lib.rs` — register task commands

## Implementation Steps

1. Create `commands/task.rs`:
   - `create_task(deck_id, name, description, priority, plan_id?, phase_id?) -> Task`
   - `list_tasks(deck_id, status_filter?, priority_filter?) -> Vec<Task>`
   - `get_task(id) -> Task`
   - `update_task(id, name?, description?, priority?, status?) -> Task`
   - `delete_task(id)`
<!-- Updated: Validation Session 1 - State machine enforcement Rust-only -->
   - `update_task_status(id, status) -> Task` — Rust-only state machine validation (single source of truth). Frontend just calls and handles Result errors.
2. Register commands, add tauri.ts wrappers
3. Create `use-tasks.ts`: list, create, update, delete, changeStatus
4. Wire task page with view toggle (List/Kanban)
5. Implement kanban board: 4 columns, cards grouped by status
6. Implement list view: rows with badges
7. Add Task dialog: form with name, description, priority selector
8. Task detail sheet (Sheet component): shows all task info, status change buttons
9. Cook button placeholder — will wire to Cook Sheet in M8

## Todo List
- [ ] commands/task.rs — CRUD + status transitions
- [ ] use-tasks.ts hook
- [ ] Task page with List/Kanban toggle
- [ ] Kanban board (4 columns)
- [ ] List view with badges
- [ ] Add Task dialog
- [ ] Task detail slide-out
- [ ] task-store wired to DB

## Success Criteria
- Tasks CRUD fully functional
- List and Kanban views display correctly
- Status transitions follow state machine
- Add Task creates record in DB
- View toggle persists between visits

## Risk Assessment
- Kanban without drag-drop may feel limited — clear UX for button-based status change needed
- Many components to create — keep each under 200 lines by splitting

## Next Steps
- M8 (Cook) adds Cook Sheet triggered from task Cook buttons

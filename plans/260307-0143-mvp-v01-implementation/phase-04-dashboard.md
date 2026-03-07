# Phase 04 — Dashboard (M3)

## Overview
- **Priority:** P0
- **Status:** done
- **Goal:** Stats cards (aggregate queries) + quick actions grid.

## Key Insights
- Dashboard scoped to active project + active deck
- Stats: active tasks, total tasks, done tasks, worktree count
- Quick actions: navigate to Brainstorm, Tasks, Cook, Decks, Worktrees
- No terminal/StreamView needed

## Requirements
- 4 stat cards with real counts from DB
- Quick actions grid (5-6 cards) linking to major routes
- Active deck name displayed in header
- Refreshes when project/deck changes

## Related Code Files

**CREATE:**
- `src-tauri/src/commands/dashboard.rs` — get_dashboard_stats(project_id, deck_id)
- `src/hooks/use-dashboard.ts` — fetch stats, refresh on context change

**MODIFY:**
- `src/pages/dashboard.tsx` — wire to real data
- `src/components/dashboard/` — stat cards + quick actions (shells exist)
- `src/lib/tauri.ts` — add dashboard wrapper
- `src-tauri/src/commands/mod.rs` — export dashboard
- `src-tauri/src/lib.rs` — register command

## Implementation Steps

1. Create `commands/dashboard.rs`:
   - `get_dashboard_stats(project_id, deck_id) -> DashboardStats`
   - DashboardStats: { activeTasks, totalTasks, doneTasks, worktreeCount, brainstormCount }
   - Aggregate SQL queries on tasks + worktrees + brainstorm_sessions tables
2. Register command, add tauri.ts wrapper
3. Create `use-dashboard.ts`: fetches stats on mount + when active project/deck changes
4. Wire dashboard page: stat cards show real numbers, quick actions navigate correctly
5. Show active deck name in dashboard header area

## Todo List
- [x] commands/dashboard.rs — aggregate queries
- [x] use-dashboard.ts hook
- [x] Dashboard page wired to real data
- [x] Quick actions navigation working

## Success Criteria
- Stats reflect actual DB counts
- Numbers update when switching project/deck
- Quick action cards navigate to correct routes

## Risk Assessment
- Low complexity. Main risk: aggregate queries on empty DB — handle zero-state gracefully.

## Next Steps
- Dashboard is standalone; no downstream dependencies

# Phase 10 — Worktrees (M9)

## Overview
- **Priority:** P1
- **Status:** pending
- **Goal:** Worktree list (grouped by status), merge dialog, delete confirmation, git2 commands.

## Key Insights
- Worktrees created by Cook (M8), managed here
- 3 groups: Active (cooking), Ready to Merge, Merged
- Merge strategies: merge commit, squash, rebase
- Delete: removes worktree dir + optionally deletes branch
- Conflicts: redirect to IDE for resolution, not built-in editor
- Reuses Preview Changes dialog from Cook (M8)

## Requirements
- Worktree list page grouped by status
- Merge dialog: strategy selector, auto-cleanup options
- Delete confirmation dialog with branch cleanup option
- Conflict detection: show conflicting files, "Open in IDE" button
- Remove merged worktrees (filesystem cleanup)

## Related Code Files

**MODIFY:**
- `src-tauri/src/commands/worktree.rs` — implement real git2 operations (currently stubs)
- `src/pages/worktrees.tsx` — wire to real data
- `src/components/worktrees/` — existing shells
- `src/stores/worktree-store.ts` — wire to DB
- `src/lib/tauri.ts` — add worktree wrappers

**CREATE:**
- `src/hooks/use-worktrees.ts` — list, merge, delete
- `src/components/worktrees/merge-dialog.tsx`
- `src/components/worktrees/delete-confirmation-dialog.tsx`
- `src/components/worktrees/worktree-card.tsx`
- `src/components/worktrees/conflict-dialog.tsx`

## Implementation Steps

1. Implement `commands/worktree.rs` (replace stubs):
   - `list_worktrees(project_id) -> Vec<Worktree>` — from DB + git2 status
   - `create_worktree(project_path, branch) -> Worktree` — git2 worktree add
   - `merge_worktree(worktree_id, strategy, cleanup_opts) -> MergeResult`
   - `delete_worktree(worktree_id, delete_branch) -> Result`
   - `remove_merged_worktree(worktree_id)` — filesystem cleanup only
   - `get_worktree_conflicts(worktree_id) -> Vec<ConflictFile>`
2. Add tauri.ts wrappers
3. Create `use-worktrees.ts`: list (grouped), merge, delete, removeCleanup
4. Wire worktrees page: 3 sections (Active, Ready, Merged)
5. Worktree cards: buttons per status group (View Files, IDE, Stop AI, Merge, Delete, Remove)
6. Merge dialog: strategy radio (merge/squash/rebase), cleanup checkboxes
7. Delete confirmation: warning, branch cleanup checkbox
8. Conflict dialog: file list + "Open in IDE" button + "Conflicts Resolved" button

## Todo List
- [ ] worktree.rs — real git2 implementation
- [ ] use-worktrees.ts hook
- [ ] Worktree list grouped by status
- [ ] Merge dialog with strategies
- [ ] Delete confirmation
- [ ] Conflict handling flow
- [ ] worktree-store wired to DB

## Success Criteria
- Worktrees listed and grouped correctly
- Merge completes (merge commit strategy minimum)
- Delete removes worktree dir + optionally branch
- Conflict detection shows affected files

## Risk Assessment
- git2 merge is complex — consider fallback to `git` CLI if git2 merge proves difficult
- Cross-platform: worktree paths differ on Windows — use PathBuf consistently

## Next Steps
- M11 (Settings) and M12 (Polish) are independent

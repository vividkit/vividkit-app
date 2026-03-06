# Phase 09 — Cook (M8)

## Overview
- **Priority:** P0
- **Status:** pending
- **Goal:** Cook Sheet (slide-out), Cook Standalone (full-page), Preview Changes (file tree + diff), CookSession model. SINGLE COOK ONLY.

## Key Insights
- Single cook: 1 task cooking at a time. Opening cook on new task stops existing session.
- Cook = resume: worktree + JSONL session log persist on disk
- CookSession model links task → session log → profile → status
- Cook Sheet: slide-out panel used from Tasks/Plans pages
- Cook Standalone `/cook/:taskId`: full-page with progress + controls
- Preview Changes: file tree (left) + diff panel (right), adaptive for file count
- Reuses StreamView + ProfileSelector from Phase 02

## Requirements
- Cook Sheet (Sheet component): StreamView + profile selector + stop button + changed files
- Cook Standalone: full-page with progress bar, status steps, StreamView, controls
- On cook start: create worktree → create CookSession → spawn CCS → watch session log
- On cook stop: stop CCS, preserve worktree, task → paused
- On cook complete: task → review, show changed files
- Preview Changes dialog: file tree sidebar + diff panel
- Merge/Discard actions on changed files

## Architecture

```
Cook start flow:
  1. Create git worktree (invoke worktree_create)
  2. Create CookSession in DB
  3. Spawn CCS in worktree dir with profile
  4. Watch session log → StreamView
  5. On complete: get changed files (git diff)

Single cook enforcement:
<!-- Updated: Validation Session 1 - Confirm dialog before stopping existing cook -->
  - Before starting new cook, check if any task is "cooking"
  - If yes, show confirm dialog: "Task X đang cooking. Stop và chuyển sang task mới?"
  - On confirm: stop existing session, then start new one
  - On cancel: abort, keep existing cook running
```

## Related Code Files

**CREATE:**
- `src-tauri/src/commands/cook.rs` — CookSession CRUD, start/stop/resume cook
- `src/hooks/use-cook.ts` — cook lifecycle: start, stop, resume, preview changes
- `src/hooks/use-preview-changes.ts` — file tree + diff data
- `src/components/cook/cook-sheet.tsx` — slide-out panel with StreamView
- `src/components/cook/cook-standalone.tsx` — full-page cook view
- `src/components/cook/changed-files-summary.tsx`
- `src/components/cook/file-tree-panel.tsx` — file tree for Preview Changes
- `src/components/cook/diff-panel.tsx` — single file diff view

**MODIFY:**
- `src/pages/cook.tsx` — wire to cook-standalone
- `src/components/cook/cook-terminal.tsx` — replace with StreamView usage
- `src/components/cook/cook-controls.tsx` — stop/pause buttons
- `src/components/cook/cook-progress-bar.tsx` — real progress
- `src/components/cook/cook-steps.tsx` — status step indicator
- `src/components/cook/preview-changes-dialog.tsx` — file tree + diff
- `src/stores/task-store.ts` — track cooking task
- `src/lib/tauri.ts` — add cook command wrappers
- `src-tauri/src/commands/mod.rs` — export cook module
- `src-tauri/src/lib.rs` — register commands

## Implementation Steps

1. Create `commands/cook.rs`:
   - `start_cook(task_id, profile) -> CookSession` — creates worktree + session + spawns CCS
   - `stop_cook(session_id)` — stops CCS, updates status
   - `resume_cook(session_id)` — reload existing session log in StreamView
   - `get_cook_session(task_id) -> Option<CookSession>`
   - `get_changed_files(worktree_path) -> Vec<ChangedFile>` — git diff against main
   - `get_file_diff(worktree_path, file_path) -> FileDiff` — unified diff for one file
2. Register commands, add tauri.ts wrappers
3. Create `use-cook.ts`:
   - startCook(): enforce single cook → stop existing if any → create worktree → start session
   - stopCook(): invoke stop, update task status
   - resumeCook(): reload session log
   - State: session, isStreaming, changedFiles
4. Create Cook Sheet: Sheet component with StreamView + ProfileSelector + controls + changed files
5. Create Cook Standalone page: progress bar + steps + StreamView + controls
6. Create `use-preview-changes.ts`: fetch file tree + individual diffs
7. Wire Preview Changes dialog: file tree sidebar (left) + diff panel (right)
8. Add Merge/Discard buttons to changed files area
9. Wire Cook buttons from Tasks page and Plans Review to open Cook Sheet

## Todo List
- [ ] commands/cook.rs — session CRUD + start/stop
- [ ] use-cook.ts hook
- [ ] Cook Sheet (slide-out)
- [ ] Cook Standalone page
- [ ] Single cook enforcement
- [ ] Preview Changes with file tree + diff
- [ ] Changed files summary
- [ ] Merge/Discard actions
- [ ] Wire Cook buttons from Tasks + Plans

## Success Criteria
- Cook starts: worktree created, CCS running, StreamView shows output
- Cook stops: CCS stopped, worktree preserved, task → paused
- Resume: existing session log loaded in StreamView
- Single cook enforced — starting new cook stops existing
- Preview Changes shows file tree + diffs
- Merge to main works

## Risk Assessment
- Worktree creation via git2 requires proper error handling (dirty working tree, branch conflicts)
- File diff rendering for large files — consider line limit
- Single cook enforcement: race conditions if user clicks fast — debounce

## Next Steps
- M9 (Worktrees) manages worktree lifecycle beyond cook

---
phase: 10
title: "Worktrees"
status: completed
effort: 2h
depends_on: [phase-08]
---

# Phase 10: Worktrees

## Overview

Worktrees screen grouped by status (active/ready/merged). Merge dialog with strategy selection.

## Components

```
src/components/worktrees/
  worktree-group.tsx        # Section header + cards for a status group
  worktree-card-active.tsx  # Active: pause/stop actions, cooking indicator
  worktree-card-ready.tsx   # Ready: merge + delete actions
  worktree-card-merged.tsx  # Merged: branch name + merged date (read-only)
  merge-dialog.tsx          # Strategy RadioGroup + options checkboxes
  index.ts

src/pages/worktrees.tsx
```

## Worktree Groups

```tsx
const active  = worktrees.filter(w => w.status === 'active')
const ready   = worktrees.filter(w => w.status === 'ready')
const merged  = worktrees.filter(w => w.status === 'merged')
```

Render 3 sections. If group is empty, skip rendering that section.

## Active Card (worktree-card-active.tsx)

- GitBranch icon (primary bg circle) + branch name + "Active" badge
- Task name + files changed count + "Cooking in progress…" + Clock icon
- Actions: View Files (UI only), Pause (status → 'ready'), Stop (status → 'ready')

## Ready to Merge Card (worktree-card-ready.tsx)

- Branch name + "Ready to Merge" badge (warning color)
- Task name + files changed count
- Actions: View Files (UI only), **Merge** → opens MergeDialog, Delete (destructive ghost → removes from store)

## Merged Card (worktree-card-merged.tsx)

- Branch name + "Merged" badge (muted)
- Task name + `mergedAt` date formatted

## Merge Dialog (merge-dialog.tsx)

```tsx
// Merge Strategy: RadioGroup
type MergeStrategy = 'merge' | 'squash' | 'rebase'
// default: 'merge' (shown as recommended)

// Options: 2 checkboxes
// - Run tests before merging (default: true)
// - Delete worktree after merge (default: true)
```

On confirm "Merge to Main":
1. `updateStatus(worktreeId, 'merged')` with `mergedAt: new Date().toISOString()`
2. Find linked task → `updateStatus(taskId, 'done')`
3. If "delete after merge": remove worktree from store
4. Close dialog

## Todo List

- [ ] Create worktree-card-active.tsx
- [ ] Create worktree-card-ready.tsx
- [ ] Create worktree-card-merged.tsx
- [ ] Create worktree-group.tsx (section wrapper)
- [ ] Create merge-dialog.tsx (RadioGroup + checkboxes)
- [ ] Wire worktreeStore.updateStatus()
- [ ] Wire taskStore.updateStatus() on merge
- [ ] Handle empty groups (skip rendering)

## Success Criteria

- 3 groups render correctly based on status
- Pause/Stop on active → status changes to ready
- Merge dialog RadioGroup works (one selection at a time)
- Confirm merge: worktree → merged, task → done
- Delete removes worktree from store
- Empty groups not rendered

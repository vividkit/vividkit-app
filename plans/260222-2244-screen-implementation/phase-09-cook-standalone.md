---
phase: 09
title: "Cook Standalone"
status: completed
effort: 2h
depends_on: [phase-08]
---

# Phase 09: Cook Standalone

## Overview

Full-page cook view at `/cook/:taskId`. Progress bar, 4 status steps, terminal output, preview changes dialog.

## Components

```
src/components/cook/
  cook-progress-bar.tsx      # 0-100% auto-incrementing progress
  cook-steps.tsx             # 4 steps: Analyzing/Planning/Executing/Reviewing
  cook-terminal.tsx          # xterm.js output synced with progress
  cook-controls.tsx          # Pause/Resume, Stop, Preview Changes
  preview-changes-dialog.tsx # Worktree, files changed, merge/discard actions
  index.ts

src/pages/cook.tsx           # /cook/:taskId
```

## Progress Bar (cook-progress-bar.tsx)

```tsx
// Auto-increment: 2% every 200ms until 100%
// Pause/resume via ref flag
useEffect(() => {
  const interval = setInterval(() => {
    if (!isPaused) setProgress(p => Math.min(p + 2, 100))
  }, 200)
  return () => clearInterval(interval)
}, [isPaused])
```

## Status Steps (cook-steps.tsx)

4 steps: Analyzing | Planning | Executing | Reviewing
```tsx
// Derived from progress:
// 0-25%: step 0 active (spin icon)
// 25-50%: step 1 active
// 50-75%: step 2 active
// 75-100%: step 3 active
// completed steps: check icon
// pending steps: clock icon
// "← Current" label on active step
```

## Terminal (cook-terminal.tsx)

Lines output sequenced by progress thresholds.
Always dispose on unmount:
```tsx
return () => { terminal.dispose() }
```

## Controls (cook-controls.tsx)

- **Pause/Resume:** toggle isPaused state
- **Stop:** navigate back to `/tasks`, set task status to 'todo'
- **Preview Changes:** open PreviewChangesDialog

## Preview Changes Dialog

- Worktree name (branch)
- Files changed list: `filename (+additions/-deletions)`
- SQL diff preview: green-colored addition lines
- Footer: Back to Cook (close) | Discard (destructive, status → 'todo') | Merge to Main (status → 'done', navigate to /tasks)

## Todo List

- [ ] Create cook-progress-bar.tsx (interval, pause/resume)
- [ ] Create cook-steps.tsx (derived from progress %)
- [ ] Create cook-terminal.tsx (xterm.js, dispose on unmount)
- [ ] Create cook-controls.tsx
- [ ] Create preview-changes-dialog.tsx
- [ ] Wire useParams to get taskId, load task from store
- [ ] Dispose terminal on unmount

## Success Criteria

- Progress auto-increments from 0 to 100
- Steps update in sync with progress
- Pause/Resume toggles increment
- Stop navigates to /tasks
- Preview dialog shows correct task data
- Merge/Discard update task status and navigate
- Terminal disposes on unmount (no memory leak)

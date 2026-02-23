---
phase: 08
title: "Tasks"
status: completed
effort: 3h
depends_on: [phase-07]
---

# Phase 08: Tasks

## Overview

Tasks screen with List/Kanban toggle, search, status filters, add task dialog, and Cook Sheet.

## Components

```
src/components/tasks/
  task-list-view.tsx       # Filtered list of task cards
  task-list-card.tsx       # Single task in list view
  task-kanban-view.tsx     # 4-column kanban board
  task-kanban-column.tsx   # Column: header + task cards
  task-kanban-card.tsx     # Card in kanban: name, context, priority
  task-toolbar.tsx         # View toggle + search + filter + Add button
  add-task-dialog.tsx      # Dialog: name, description, priority
  task-cook-sheet.tsx      # Right Sheet with xterm.js cook terminal
  index.ts

src/pages/tasks.tsx
```

## Toolbar (task-toolbar.tsx)

```tsx
// View toggle: List | Kanban (segmented control, icons)
// Search: icon-prefixed input, filters task name
// Status filter (list only): All | Backlog | Todo | In Progress | Done
// Add Task button → dialog
```

## List View (task-list-card.tsx)

Each card:
- Status icon: check (done) | circle (others)
- Task name + plan context (`📁 Plan: {name}`) + phase info or custom prompt
- Worktree info (if in_progress)
- Priority badge (colored dot + label)
- Status badge (with icon)
- **Cook** button (if not done, not in_progress) | **Stop** (if in_progress) | hidden (if done)
- Done: "✓ Merged" label instead of button

## Kanban View

4 columns: Backlog | Todo | In Progress | Done
```tsx
const COLUMNS: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'done']
```
Column header: colored dot + label + task count.
Card: name, plan/custom context, description (2-line clamp), priority badge, Cook button.
Done cards: "✓ Merged" label.

## Add Task Dialog (add-task-dialog.tsx)

```tsx
// Fields: name (required), description (textarea), priority (button group)
// Priority button group: Low | Medium | High
// Selected: variant="default", unselected: variant="outline"
// On submit: taskStore.addTask() with type: 'custom'
```

## Cook Sheet (task-cook-sheet.tsx)

Triggered by Cook button on any task:
1. `updateStatus(taskId, 'in_progress')`
2. Toast: "Cooking {task.name}…"
3. Open Sheet with xterm.js terminal
4. Script: worktree creation → implementation → tests → success
5. On completion: show changed files (path + additions/deletions)
6. Actions: **Merge to Main** → `updateStatus('done')` + close | **Discard** → `updateStatus('todo')` + close
7. Dispose terminal on Sheet close

## Todo List

- [ ] Create task-toolbar.tsx
- [ ] Create task-list-card.tsx + task-list-view.tsx
- [ ] Create task-kanban-card.tsx + task-kanban-column.tsx + task-kanban-view.tsx
- [ ] Create add-task-dialog.tsx (priority button group)
- [ ] Create task-cook-sheet.tsx (xterm.js, dispose on close)
- [ ] Wire search filter (client-side, task name match)
- [ ] Wire status filter (list view)
- [ ] Wire taskStore actions (addTask, updateStatus)

## Success Criteria

- List/Kanban toggle switches views
- Search filters tasks in real-time
- Status filter works in list view
- Cook button opens Sheet, sets status to in_progress
- Merge/Discard update status correctly
- Terminal disposes on Sheet close
- Add task dialog validates name, adds to store

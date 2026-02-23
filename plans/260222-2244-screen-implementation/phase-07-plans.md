---
phase: 07
title: "Plans + Plan Review"
status: completed
effort: 3h
depends_on: [phase-06]
---

# Phase 07: Plans + Plan Review

## Overview

Plan list grid and detailed plan review with phase checklist, markdown preview toggle, related tasks, and Cook Sheet.

## Components

```
src/components/plans/
  plan-card.tsx             # Grid card: name, deck, progress bar, date
  plan-list.tsx             # Responsive grid of plan cards
  plan-header.tsx           # Plan name, metadata, progress bar
  phase-checklist.tsx       # Toggleable phase list
  plan-markdown-preview.tsx # Prose markdown render
  related-tasks.tsx         # Task list with skeleton loading
  cook-sheet.tsx            # Right-side Sheet with xterm.js terminal
  view-toggle.tsx           # Phases | Preview segmented control
  index.ts

src/pages/plans.tsx
src/pages/plan-review.tsx
```

## Plans Page (/plans)

- "Create New Plan" button (top-right, outline)
- `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`
- PlanCard: name + "Active" badge, deck context, phase progress bar (colored segment), created date
- Click → `/plans/:id`

## Plan Review (/plans/:id)

### Top Bar
- Back to Plans (ghost button + ChevronLeft)
- ViewToggle: List icon (phases) | Book icon (preview)
- "Cook Plan" button → opens CookSheet

### Plan Header Card
```tsx
const completedCount = plan.phases.filter(p => p.status === 'done').length
const pct = Math.round((completedCount / plan.phases.length) * 100)
```
Shows: plan name, created date, phase count, plan path. Progress bar + "{completed}/{total} phases completed ({pct}%)".

### Phases View (phase-checklist.tsx)
```tsx
// click to toggle done ↔ pending
// done: strikethrough + muted color + check icon
// pending: circle icon
// each item: "Phase {order} — {name}" + description + filePath
```

### Preview View (plan-markdown-preview.tsx)
Render plan markdown as prose. Use `react-markdown` with `remark-gfm`.
Typography classes: h1 large, h2 sections, h3 uppercase tracking, HR between sections, orange bullet dots.

### Related Tasks (related-tasks.tsx)
```tsx
// ?new=true query param → show skeleton 3.5s then populate
const isNew = searchParams.get('new') === 'true'
```
Each task: status icon (check/spinner/circle) + name + description + status badge.
In-progress tasks: link to `/cook/:taskId`.

### Cook Sheet (cook-sheet.tsx)
Right-side Sheet (max-w-xl to 2xl):
- Header: Flame icon + plan name + completion badge
- xterm.js terminal: phase-by-phase cook script output
- During execution: spinner + "Executing plan phases…"
- Dispose terminal on Sheet close

## Todo List

- [ ] Create plan-card.tsx
- [ ] Create plan-list.tsx + plans page
- [ ] Create plan-header.tsx (progress calculation)
- [ ] Create view-toggle.tsx (segmented control)
- [ ] Create phase-checklist.tsx (toggle done state)
- [ ] Create plan-markdown-preview.tsx (react-markdown)
- [ ] Create related-tasks.tsx (?new=true skeleton)
- [ ] Create cook-sheet.tsx (xterm.js, dispose on close)
- [ ] Create plan-review page with all sections
- [ ] Wire planStore.updatePhaseStatus()

## Success Criteria

- Phase toggle updates store and re-renders
- Progress bar reflects actual completion
- View toggle switches between checklist and markdown
- ?new=true shows skeleton then tasks
- Cook Sheet xterm terminal disposes on close

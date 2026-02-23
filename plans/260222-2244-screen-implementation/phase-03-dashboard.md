---
phase: 03
title: "Dashboard"
status: completed
effort: 1h
depends_on: [phase-01]
---

# Phase 03: Dashboard

## Overview

Simple stats + quick actions. Reads from stores. No heavy interactions.

## Components

```
src/components/dashboard/
  stats-cards.tsx       # 4 stat cards in responsive grid
  quick-actions.tsx     # Action cards grid
  index.ts

src/pages/dashboard.tsx
```

## Stats Cards

| Stat | Icon | Color | Source |
|------|------|-------|--------|
| Active Tasks | Flame | text-primary | taskStore tasks with status in_progress |
| Total Tasks | ListTodo | text-info | taskStore tasks.length |
| Completed | ListTodo | text-success | tasks with status done |
| Worktrees | GitBranch | text-warning | worktreeStore.worktrees.length |

Grid: `grid-cols-2 md:grid-cols-4 gap-4`

## Quick Actions

6 cards in responsive grid (1–3 cols):
- Brainstorm → `/brainstorm`
- Tasks → `/tasks`
- Cook → `/tasks`
- Decks → `/decks`
- Worktrees → `/worktrees`

Each card: icon + title + description + ArrowRight link.

## Header Subtitle

```tsx
const activeDeck = decks.find(d => d.isActive)
// subtitle = activeDeck ? `Active Deck: ${activeDeck.name}` : undefined
```

## Todo List

- [ ] Create stats-cards.tsx (reads from stores)
- [ ] Create quick-actions.tsx
- [ ] Wire dashboard page with AppHeader subtitle
- [ ] No TS errors

## Success Criteria

- Stats reflect actual store data
- Quick action links navigate correctly
- Active deck name shown in header subtitle when present

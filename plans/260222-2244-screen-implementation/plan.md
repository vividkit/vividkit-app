---
title: "VividKit — Screen Implementation"
description: "Build out all 13 screens per screen-workflows spec: routing, shared layout, onboarding, dashboard, decks, brainstorm, plans, tasks, cook, worktrees, settings"
status: completed
priority: P1
effort: ~26.5h
branch: main
tags: [react, typescript, tailwind, shadcn, zustand, xterm, react-router]
created: 2026-02-22
---

# VividKit — Screen Implementation Plan

## Overview

Implement all 13 screens defined in screen-workflows spec. Uses React Router v6, shadcn/ui components, Zustand stores, and xterm.js for terminal panels.

## Architecture Constraints (from CLAUDE.md)

- React pattern: `Component → Custom Hook → Zustand Store → invoke()`
- xterm.js: dispose on unmount, lazy mount, buffer streaming
- File max 200 lines — split into subcomponents
- No AI HTTP from React — all via Rust invoke()

## Phases

| # | Phase | Scope | Effort | Status |
|---|-------|-------|--------|--------|
| 1 | [Routing & Shared Layout](./phase-01-routing-layout.md) | Router setup, AppLayout, AppSidebar, AppHeader | 2h | completed |
| 2 | [Onboarding + New Project](./phase-02-onboarding.md) | 4-step wizard, new-project screen | 3h | completed |
| 3 | [Dashboard](./phase-03-dashboard.md) | Stats cards, quick actions | 1h | completed |
| 4 | [Decks](./phase-04-decks.md) | Deck list, active deck, create deck dialog | 2h | completed |
| 4b | [CCS Test Console](./phase-04b-ccs-test-console.md) | **CRITICAL** — validate ccs spawn + xterm streaming before prod UX | 2h | completed |
| 5 | [Brainstorm + Report](./phase-05-brainstorm.md) | Terminal panel, input, report dialog, key insights | 3h | completed |
| 6 | [Generate Plan](./phase-06-generate-plan.md) | Phase indicator, xterm simulation | 1.5h | completed |
| 7 | [Plans + Plan Review](./phase-07-plans.md) | Plan cards, phase checklist, markdown preview, cook sheet | 3h | completed |
| 8 | [Tasks](./phase-08-tasks.md) | List view, Kanban view, add task dialog, cook sheet | 3h | completed |
| 9 | [Cook Standalone](./phase-09-cook-standalone.md) | Progress bar, steps, terminal, preview changes | 2h | completed |
| 10 | [Worktrees](./phase-10-worktrees.md) | Active/ready/merged groups, merge dialog | 2h | completed |
| 11 | [Settings](./phase-11-settings.md) | 4-tab: General, AI&Commands, Git, Editor | 2h | completed |

## Dependencies

```
Phase 1 (Routing) → All other phases
Phase 2 (Onboarding) → independent
Phase 3-4 → Phase 1
Phase 5-6 → Phase 4 (needs active deck)
Phase 7 → Phase 5-6 (plans come from brainstorm)
Phase 8 → Phase 7 (tasks linked to plans)
Phase 9-10 → Phase 8 (cook/worktrees from tasks)
Phase 11 → Phase 1 (just routing)
```

## Key Tech Stack

- **CCS spawn:** `tauri-plugin-shell` → `ccs <profile> "<command>"` subprocess, stdout via Tauri events
- **Terminal streaming:** `listen('ccs_output')` → `terminal.write()` pattern (validated in Phase 04b)
- **Routing:** react-router-dom v7
- **UI:** shadcn/ui (Button, Card, Dialog, Sheet, Tabs, Select, RadioGroup, Switch, Badge, Input, Textarea, Progress)
- **Terminal:** @xterm/xterm + @xterm/addon-fit
- **State:** Zustand stores (project, deck, task, plan, worktree, brainstorm, settings)
- **Icons:** lucide-react

## Success Criteria

- All 13 routes render without errors
- Navigation between screens works
- No TypeScript errors
- xterm.js terminals dispose on unmount
- Responsive layout (sidebar collapses)

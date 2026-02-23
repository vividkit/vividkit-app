---
phase: 06
title: "Generate Plan"
status: completed
effort: 1.5h
depends_on: [phase-05]
---

# Phase 06: Generate Plan

## Overview

Animated plan generation screen. Phase indicator + xterm.js terminal showing CLI simulation. On completion navigates to Plan Review.

## Components

```
src/components/generate-plan/
  phase-indicator.tsx     # Spinner + current phase label
  index.ts

src/pages/generate-plan.tsx
```

## Phase Indicator

4 phases in sequence (auto-advance on timer):
1. Analyzing → 2. Generating → 3. Creating → 4. Done

```tsx
const PHASES = ['Analyzing brainstorm report...', 'Generating plan structure...', 'Creating tasks...', 'Done!']
// advance every 2s, spinner icon during non-done phases
```

## Terminal Simulation

xterm.js terminal (full-height, dark theme) outputs phase-by-phase:
- Finds brainstorm report
- Detects phases/task count
- Generates plan structure
- Creates tasks
- Success message with plan path

Same xterm.js rules as Phase 05 (dispose on unmount, buffer streaming).

On phase 4 complete:
- Create plan in `planStore` with generated phases
- Create tasks in `taskStore` (type: 'generated')
- Show action buttons: "View Plan" → `/plans/new-plan-id?new=true`, "Go to Tasks" → `/tasks`

## Todo List

- [ ] Create phase-indicator.tsx (4-step auto-advance)
- [ ] Create generate-plan page with xterm.js terminal
- [ ] Wire planStore.addPlan() on completion
- [ ] Wire taskStore.addTask() for generated tasks
- [ ] Navigate to plan review on "View Plan" click
- [ ] Dispose terminal on unmount

## Success Criteria

- Phase indicator auto-advances through 4 phases
- Terminal output streams in sync with phases
- Plan + tasks created in stores on completion
- Both CTA buttons navigate correctly

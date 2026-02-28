---
title: "CCS Test Console Fix Plan"
description: "Fix stop action, answer submission to stdin, and stream panel height behavior in CCS Test Console."
status: pending
priority: P1
effort: 6h
branch: mvp-agy
tags: [bugfix, frontend, backend, tauri, ccs]
created: 2026-02-28
---

# CCS Test Console Fix Plan

## Overview

Plan targets 3 regressions in CCS Test Console:
1) Stop button not working reliably
2) Submit answers not reaching CCS stdin
3) Stream output panel auto-expands instead of staying fixed-height + scrollable

Keep scope minimal: patch existing flow only, no new architecture.

## Phases

| # | Phase | Status | Effort | Link |
|---|---|---|---|---|
| 1 | Stop Button + Run Lifecycle | pending | 2h | [phase-01](./phase-01-fix-stop-button-run-lifecycle.md) |
| 2 | Submit Answers → CCS stdin | pending | 2h | [phase-02](./phase-02-fix-submit-answers-stdin-flow.md) |
| 3 | Stream Panel Height + Scroll | pending | 1h | [phase-03](./phase-03-fix-stream-output-height-and-scroll.md) |
| 4 | Validation + Regression Checklist | pending | 1h | [phase-04-validation-and-regression-checklist.md](./phase-04-validation-and-regression-checklist.md) |

## Exact Candidate Files

- `src/components/settings/ccs-test-console.tsx`
- `src/components/ccs-stream/question-card.tsx`
- `src/components/ccs-stream/stream-view.tsx`
- `src/lib/tauri.ts`
- `src-tauri/src/commands/ai.rs` (only if frontend call path is correct but stop/input still fails)

## Dependencies

- Phase 1 and Phase 2 can start in parallel after quick baseline repro.
- Phase 3 depends on no backend work; can run in parallel with 1/2.
- Phase 4 runs last.

## Done Definition

- Stop reliably terminates active run and UI state resets predictably.
- Submit sends answers to Rust `send_ccs_input` with active `run_id`, and UI reports failures instead of false success.
- Stream output area remains fixed-height and scrolls internally with long content.
- Lint/build/check pass and manual repro checklist passes.

## Unresolved Questions

- Preferred fixed height for stream panel (proposal: `420px` desktop baseline, responsive on smaller screens).

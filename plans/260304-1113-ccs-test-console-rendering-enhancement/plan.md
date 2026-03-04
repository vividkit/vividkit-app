---
title: "CCS Test Console Rendering Enhancement"
description: "Minimal render-flow updates for consistent tool rows, inline subagent placement, and post-stream final bubble output."
status: pending
priority: P1
effort: 3h
branch: mvp-agy
tags: [ccs-stream, rendering, subagent, parity]
created: 2026-03-04
---

# Scope
Tight UI-only scope for CCS Test Console stream rendering.
Do not modify JSONL parser semantics. Preserve stream order and existing run lifecycle.

## Affected Files (planned)
- `src/components/ccs-stream/stream-view.tsx`
- `src/components/ccs-stream/ai-message.tsx`
- `src/components/ccs-stream/thinking-item.tsx`
- `src/components/ccs-stream/tool-call-item.tsx`
- `src/lib/display-item-builder.ts` (only if tiny helper needed for stable inline subagent grouping)

## Step-by-step Plan
1. Baseline + guardrails
- Capture current behavior with one live run: order of `Thinking -> tool rows -> output`, linked subagent placement, final output rendering.
- Lock scope: parser file `src/lib/jsonl-session-parser.ts` is read-only for this change.

2. Unify detail row style (claude-devtools-like consistency)
- Normalize row chrome for `Thinking`, `Output` preview rows, and tool rows (`Read/Write/Glob`) to one visual pattern: same radius, border, muted background, header density.
- Keep specialized bodies for `Read/Write/Glob`; only standardize wrapper/header treatment.

3. Render subagents inside AI details section
- Remove separate out-of-card insertion path in `stream-view` for linked subagents.
- Pass linked subagent map into `AIMessage`; render each linked subagent at its parent Task/Agent position inside the AI details list.
- Keep de-dup logic: when subagent linked, hide duplicate Task/Agent tool row; orphan tool rows remain visible.

4. Final output bubble after stream completion
- Gate final bubble rendering on completed streaming state for the latest AI item.
- Ensure last output text is shown once as the chat bubble after completion, not duplicated in detail rows.

5. Validation (no parser regressions, stable order)
- Manual run checks: active streaming, multi-tool turn, Task->subagent turn, stop/terminate paths.
- Confirm ordering stable across re-renders and resolve ticks.
- Run `npm run build` for compile safety.

## Key Risks
- Ordering regression when moving subagents inline may shift chronology.
  - Mitigation: render by existing `detailItems` order; keep stable sort `(startTime, id)` for mapped subagents.
- Duplicate/missing rows from Task dedupe and inline substitution.
  - Mitigation: explicit linked vs orphan branches with snapshot/manual checks.
- Final bubble race with `isRunning` transition can hide last output.
  - Mitigation: derive bubble condition from latest AI item + completed run state only.

## Unresolved Questions
- For orphan subagents with no parent task id: keep as separate fallback row, or force-attach to latest AI details block?

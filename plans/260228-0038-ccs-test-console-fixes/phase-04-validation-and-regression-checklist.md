# Phase 04 — Validation and Regression Checklist

## Context Links

- `src/components/settings/ccs-test-console.tsx`
- `src/components/ccs-stream/question-card.tsx`
- `src/components/ccs-stream/stream-view.tsx`
- `src-tauri/src/commands/ai.rs`

## Overview

- Priority: P1
- Status: pending
- Goal: validate fixes end-to-end with reproducible manual and compile checks.

## Key Insights

- This module has async race edges (spawn/start/stop/submit).
- Compile-only checks are not enough; manual CCS flow verification required.

## Requirements

- Functional validation:
  - Stop action
  - Submit answers to stdin
  - Fixed-height stream panel
- Non-functional validation:
  - No TypeScript/Rust compile regression
  - No lint break

## Architecture

- Validation order: static checks first, then runtime flow.

## Related Code Files

- Modify: none (validation phase)
- Create: none
- Delete: none

## Implementation Steps

1. Static checks:
   1. `npm run lint`
   2. `npm run build`
   3. `cd src-tauri && cargo check`
2. Runtime checks in `npm run tauri dev`:
   1. Start run and verify stream output appears.
   2. Click Stop while running; verify run ends and UI resets.
   3. Trigger AskUserQuestion flow, submit answers, verify continuation.
   4. Confirm Rust logs include `[CCS stdin] run_id=...` for each answer.
   5. Confirm stream panel height remains fixed while messages overflow.
3. Retry scenario checks:
   1. Force submit failure (stop run before submit), verify inline error + retry behavior.
   2. Force rapid Stop clicks, verify no stuck stopping state.

## Todo List

- [ ] Run lint/build/cargo check
- [ ] Execute runtime checklist with one full CCS conversation
- [ ] Capture before/after evidence in commit notes (commands + observed behavior)

## Success Criteria

- All checks pass.
- No regression in existing stream rendering and status bar.

## Risk Assessment

- Risk: CCS environment differences across machines.
- Mitigation: keep validation focused on deterministic UI + IPC behavior with run_id logs.

## Security Considerations

- Ensure logs do not include sensitive command payloads beyond required debugging context.

## Next Steps

- If all checks pass: hand off for code review and docs impact evaluation.

# Phase 02 — Fix Submit Answers to CCS stdin

## Context Links

- `src/components/ccs-stream/question-card.tsx`
- `src/components/ccs-stream/stream-view.tsx`
- `src/lib/tauri.ts`
- `src-tauri/src/commands/ai.rs` (`send_ccs_input`)

## Overview

- Priority: P1
- Status: pending
- Goal: ensure Submit in question UI reliably writes to CCS stdin and reports real success/failure.

## Key Insights

- Current submit loop catches per-write errors then still marks `submitted=true`.
- This can create false-success UI while no input reached backend.
- Need explicit success contract: all writes succeed before success state.

## Requirements

- Functional:
  - Submit must call `sendCcsInput(activeRunId, text + '\n')` for each answer in order.
  - If any write fails, stop loop, show error, keep unsent state.
  - Disable submit when no `activeRunId`.
- Non-functional:
  - Keep existing question card UX.
  - No new IPC API.

## Architecture

- Local submit state: `idle | submitting | failed | submitted` (implemented with existing booleans + error string).
- Sequential writes to preserve tool prompt order.
- Failure short-circuit on first failed stdin write.

## Related Code Files

- Modify:
  - `src/components/ccs-stream/question-card.tsx`
  - `src/lib/tauri.ts` (improve invoke error context/log)
- Modify (conditional):
  - `src-tauri/src/commands/ai.rs` (improve `CCS run not found` detail)
- Create: none
- Delete: none

## Implementation Steps

1. Add `submitError` state in `QuestionCard`; clear on retry.
2. Refactor submit loop: `try` each write, abort on first failure, do not mark submitted.
3. Mark submitted only when all answers are acknowledged by resolved invokes.
4. Render concise inline error under Submit button with retry path.
5. Verify frontend call path carries correct `run_id` and newline-terminated payload.

## Todo List

- [ ] Reproduce failure and capture run_id mismatch (if any)
- [ ] Patch submit success/failure state handling
- [ ] Add inline error + retry UX
- [ ] Validate sequential stdin writes in logs

## Success Criteria

- Clicking Submit writes each answer to Rust stdin command.
- UI shows `All answers sent` only after full success.
- Failures remain actionable (error shown, retry possible).

## Risk Assessment

- Risk: duplicate sends on rapid click.
- Mitigation: keep `submitting` gate and disable button while inflight.

## Security Considerations

- Treat answer text as raw user input; no interpolation into shell commands.
- Keep stdin write as byte payload only.

## Next Steps

- Proceed to Phase 03 to stabilize output panel layout.

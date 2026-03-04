# Phase 01 — Fix Stop Button Run Lifecycle

## Context Links

- `docs/code-standards.md` (Process Control + CCS PTY rules)
- `src/components/settings/ccs-test-console.tsx`
- `src/lib/tauri.ts`
- `src-tauri/src/commands/ai.rs`

## Overview

- Priority: P1
- Status: pending
- Goal: make Stop action deterministic for active runs, including quick stop right after Run.

## Key Insights

- Current UI stop flow depends on `activeRunIdRef`, `isRunning`, `isStopping`.
- Stop and error paths swallow failures; user gets little signal when stop fails.
- Backend kill path may report success without clear failure reason visibility in UI.

## Requirements

- Functional:
  - Stop button must trigger `stop_ccs(run_id)` for active run.
  - Stop during startup handoff must still stop the spawned run.
  - UI must recover from stop failure and allow retry.
- Non-functional:
  - Keep existing run-event model.
  - No new store/module.

## Architecture

- UI state flow: `idle -> running -> stopping -> idle`.
- Source of truth for stopping call: latest active run id from spawn response/ref.
- Backend behavior remains idempotent: `stopped` or `already_stopped` both treated as terminal success.

## Related Code Files

- Modify:
  - `src/components/settings/ccs-test-console.tsx`
  - `src/lib/tauri.ts`
- Modify (conditional):
  - `src-tauri/src/commands/ai.rs`
- Create: none
- Delete: none

## Implementation Steps

1. Reproduce stop failure in CCS Test Console and capture frontend + Rust logs with `run_id`.
2. Harden `handleStop` flow to always use latest `run_id`, including early-stop race.
3. Surface stop failure state in UI (small inline error text), do not silently swallow.
4. Ensure stop success path always clears run state once (`finishRun` idempotent).
5. If backend kill semantics are root cause, adjust `stop_ccs` error handling to return explicit failure reason.

## Todo List

- [ ] Add repro notes: when stop fails and expected behavior
- [ ] Patch stop UI state transitions and retry behavior
- [ ] Add user-visible stop error feedback
- [ ] Patch backend stop semantics only if required by repro

## Success Criteria

- Stop works after run has started and while output is streaming.
- Quick stop (pressed soon after Run) still stops same run.
- UI never gets stuck in `Stopping...`.

## Risk Assessment

- Risk: race between spawn completion and stop click.
- Mitigation: use ref-based run id + explicit pending-stop handshake.

## Security Considerations

- No auth surface change.
- Do not expose raw system details in UI error text.

## Next Steps

- Proceed to Phase 02 for stdin submission reliability.

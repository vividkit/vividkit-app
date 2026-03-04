---
title: "Subagent Nested Tool Rendering Parity >90%"
description: "Close remaining subagent rendering deltas vs claude-devtools with live resolution, race safety, and contract alignment."
status: pending
priority: P1
effort: 14h
branch: mvp-agy
tags: [subagent, parity, ccs-stream, rendering, tauri]
created: 2026-03-03
---

# Goal
Raise subagent nested tool-call rendering parity to **>90%** vs `/Users/thieunv/projects/oss/claude-devtools` while keeping scope tight (YAGNI/KISS/DRY).

# Scope
Required fixes in this plan:
1. Streaming subagent resolution while run is active
2. Multi subagents per parent task ID
3. `parentUuid` continuation chain + team color enrichment + structured task linking
4. Remove Task/subagent duplicate rendering
5. Correct thinking parsing/rendering in execution trace
6. Race guards in async subagent resolution
7. Cross-platform path handling
8. Subagent data-contract alignment (Rust ↔ TS ↔ renderer)

Out of scope:
- New backend service layer
- Full architecture rewrite of stream UI
- Non-subagent chat rendering refactor

# Parity Baseline + Target
- Baseline: current stream output in `src/components/ccs-stream/*` + `src/lib/subagent-resolver.ts`
- Reference: `claude-devtools` `SubagentResolver.ts`, `displayItemBuilder.ts`, `ExecutionTrace.tsx`
- Target score: **>= 90/100** on fixture-based parity checks:
  - Linking correctness (30)
  - Duplicate suppression (15)
  - Thinking fidelity (15)
  - Team continuation + colors (15)
  - Live streaming behavior + race safety (15)
  - Path normalization/cross-platform behavior (10)

# Parallel Worker Ownership (No Overlap)
| Worker | Owned Files (exclusive edit boundary) | Main Deliverable |
|---|---|---|
| A: Contracts | `src/types/subagent.ts`, `src/lib/tauri.ts`, `src-tauri/src/models/subagent.rs` | Unified subagent DTO + field naming + optional metadata |
| B: Resolver Core | `src/lib/subagent-resolver.ts`, `src/lib/teammate-message-parser.ts` | 3-phase linking parity + continuation-chain propagation + team color enrichment hooks |
| C: Live Resolution | `src/components/ccs-stream/stream-view.tsx` (+ optional new `src/hooks/use-live-subagent-resolution.ts`) | While-running subagent refresh + race guards + multi-subagent insertion |
| D: Rendering | `src/components/ccs-stream/execution-trace.tsx`, `src/components/ccs-stream/ai-message.tsx`, `src/lib/display-item-builder.ts` | Thinking rendering parity + Task/subagent dedupe |
| E: Cross-Platform Paths | `src/lib/session-path-utils.ts` (new), `src/components/ccs-stream/stream-status-bar.tsx`, `src/pages/new-project.tsx`, `src-tauri/src/commands/fs.rs`, `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock` | Path-safe parsing/formatting on Windows/macOS/Linux |
| Lead Integrator | `src/components/ccs-stream/index.ts` + merge conflict resolution only | Ordered integration + parity validation |

# Integration Order (Critical)
1. **Phase 1 (A + E in parallel)**: contracts and path utilities first; no stream behavior changes yet.
2. **Phase 2 (B)**: resolver update on top of aligned contracts.
3. **Phase 3 (C)**: live streaming resolution + race guards, consuming Phase 2 output.
4. **Phase 4 (D)**: rendering parity + duplicate suppression with final resolver behavior.
5. **Phase 5 (Lead)**: integration, compile/lint, parity scoring, regression pass.

# Phases

## Phase 1 — Contract and Path Foundations
Tasks:
1. Normalize `RawSubagentData` shape across Rust + TS and remove duplicate/conflicting type definitions.
2. Add explicit fields needed by renderer (`parent_uuid`/`parentUuid` path, team color payload support, ongoing flag strategy).
3. Replace slash-based path splitting with shared utility (`session-path-utils`) and use `dirs` crate in `resolve_home_path`.

Acceptance criteria:
- `invoke` payloads deserialize without field alias ambiguity.
- Windows-style paths (`C:\...`) and POSIX paths both produce correct session IDs/dirs.
- `npm run build` passes.

## Phase 2 — Resolver Parity Core
Tasks:
1. Port missing `SubagentResolver` behaviors from reference:
   - continuation propagation via `parentUuid` chain
   - team color enrichment from tool results
   - stable structured linking for Task call -> subagent(s)
2. Preserve 3-phase linking (result, team summary, positional fallback) but make it deterministic under ties.
3. Keep resolver pure/idempotent for repeated calls during active streaming.

Acceptance criteria:
- Continuation files inherit team metadata + parent task linkage.
- Team color appears on all continuation files for same teammate chain.
- Same input entries always yields same link output order.

## Phase 3 — Live Resolution + Race Guards
Tasks:
1. Resolve subagents while run is active (throttled polling or event-driven refresh) instead of post-run only.
2. Add request-version/abort guard so stale async resolve results cannot overwrite newer state.
3. Support **multiple subagents per `parentTaskId`** and render all in deterministic order.

Acceptance criteria:
- New subagent cards appear during active run (no wait for termination).
- No flicker/reorder from stale resolve promises.
- Parent Task with N subagents renders N subagent items.

## Phase 4 — Rendering Fidelity
Tasks:
1. Remove duplicate display: hide Task tool calls that already have linked subagents.
2. Fix execution-trace thinking rendering:
   - parse `thinking` blocks from message content
   - stop relying on fake `toolCalls.name === 'thinking'`
3. Keep orphan Task calls visible when no subagent is linked.

Acceptance criteria:
- No Task/subagent double row when linked.
- Thinking blocks render when present and are absent when missing.
- Tool results remain linked to proper tool call in trace.

## Phase 5 — Integration + Parity Signoff
Tasks:
1. Add parity fixtures (real JSONL samples covering all 8 focus fixes) and scoring script.
2. Run compile/lint and manual smoke checks from CCS Test Console.
3. Publish parity report in `plans/reports/` with before/after score and unresolved gaps.

Acceptance criteria:
- Parity score >= 90/100.
- `npm run build` and `npm run lint` pass.
- No regression in resume/manual input flow.

# Risks + Mitigations
- Risk: resolver churn causes unstable UI ordering.
  - Mitigation: stable sort key `(startTime, id)` after every resolve.
- Risk: high-frequency resolve harms performance.
  - Mitigation: throttle refresh (250-500ms) + skip when no new entries/subagent file mtime change.
- Risk: contract mismatch between snake_case and camelCase.
  - Mitigation: explicit serde rename/alias + TS runtime guards.

# Security Considerations
- Parse tool-result payloads defensively; never execute payload content.
- Keep path parsing display-only in frontend; path resolution remains in Rust IPC.
- No unsafe filesystem traversal from user-provided session path.

# Unresolved Questions
1. Should parity fixtures include very large (>10MB) subagent logs in this cycle, or keep MVP fixture size small and add load-testing later?
2. For live resolution cadence, do we prefer fixed interval polling or change-triggered refresh from Rust watcher metadata events?

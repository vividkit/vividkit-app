# Subagent Rendering Architecture Port - Plan Summary

**Date:** 2026-03-03
**Plan:** `plans/260303-0048-subagent-rendering-port/`
**Total Effort:** 16h

## Overview

Port subagent rendering from claude-devtools to VividKit CCS Test Console. Enables detection, linking, and rendering of subagent executions spawned by Task tool calls.

## Phases

| # | Phase | Files | Effort | Parallel |
|---|-------|-------|--------|----------|
| 1 | Types + Constants | `src/types/subagent.ts`, `src/lib/team-colors.ts` | 2h | A |
| 2 | Rust Backend | `src-tauri/src/commands/subagent.rs`, `src-tauri/src/models/subagent.rs` | 3h | B (after A) |
| 3 | Subagent Resolver | `src/lib/subagent-resolver.ts`, `src/lib/teammate-message-parser.ts` | 4h | C (after B) |
| 4 | Filtering Logic | `src/lib/display-item-builder.ts` | 2h | A |
| 5 | UI Components | `src/components/ccs-stream/subagent-*.tsx` | 4h | D (after C) |
| 6 | Integration | `src/components/ccs-stream/stream-view.tsx` | 1h | E (after D) |

## Key Files to Create

### TypeScript
- `src/types/subagent.ts` - Process, SessionMetrics, TeamInfo interfaces
- `src/lib/team-colors.ts` - TeamColorSet, color getters
- `src/lib/subagent-resolver.ts` - Three-phase linking algorithm
- `src/lib/teammate-message-parser.ts` - XML parser for `<teammate-message>`
- `src/lib/display-item-builder.ts` - Filter Task calls with subagents
- `src/components/ccs-stream/subagent-item.tsx` - Collapsible card
- `src/components/ccs-stream/subagent-execution-trace.tsx` - Nested trace view
- `src/components/ccs-stream/subagent-metrics-pill.tsx` - Token display

### Rust
- `src-tauri/src/commands/subagent.rs` - Tauri commands
- `src-tauri/src/models/subagent.rs` - Serde structs

## Key Files to Modify

- `src/lib/jsonl-session-parser.ts` - Add extraction helpers
- `src/lib/tauri.ts` - Add wrapper functions
- `src/components/ccs-stream/ai-message.tsx` - Render subagent items
- `src/components/ccs-stream/stream-view.tsx` - Resolve and pass subagents
- `src-tauri/src/commands/mod.rs` - Add subagent module
- `src-tauri/src/lib.rs` - Register commands

## Three-Phase Linking Algorithm

1. **Result-based** - Extract agentId from tool_result, match by ID
2. **Description-based** - Team members match by `<teammate-message summary="">`
3. **Positional** - Fallback for unmatched subagents (no wrap-around)

## Component Hierarchy

```
StreamView
├── AIMessage
│   ├── ToolCallItem (filtered - skip Tasks with subagents)
│   └── SubagentItem
│       ├── Header (collapsible)
│       │   ├── Color dot
│       │   ├── Type badge
│       │   ├── Description
│       │   ├── Status indicator
│       │   └── MetricsPill
│       └── ExecutionTrace
│           ├── ThinkingItem
│           ├── TextItem
│           └── ToolCallItem
```

## Unresolved Questions

1. **Teammate messages in MVP?** - May defer to post-MVP
2. **CCS subagent file format?** - Verify matches claude-devtools
3. **Performance limits?** - Max subagent file size/count?

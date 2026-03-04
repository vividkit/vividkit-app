---
title: "Phase 3: Subagent Resolver"
description: "Implement TypeScript logic to link Task calls to subagent files"
status: completed
priority: P1
effort: 4h
branch: mvp-agy
tags: [resolver, linking, subagent]
created: 2026-03-03
completed: 2026-03-03
---

# Phase 3: Subagent Resolver

Implement TypeScript logic to link Task calls to subagent files.

## Context Links

- Source: `claude-devtools/src/main/services/discovery/SubagentResolver.ts`
- Types: `src/types/subagent.ts` (Phase 1)
- Backend: `src/lib/tauri.ts` (Phase 2)
- Target: `src/lib/subagent-resolver.ts`

## Overview

- Priority: P1
- Status: completed
- Three-phase matching algorithm to link Task calls to subagent files

## Key Insights

1. **Phase 1: Result-based** - Extract agentId from tool_result, match by ID
2. **Phase 2: Description-based** - Team members match by `<teammate-message summary="">`
3. **Phase 3: Positional** - Fallback for unmatched subagents (no wrap-around)
4. Parallel detection: subagents within 100ms start time

## Requirements

### Functional
- Resolve subagents for a session directory
- Link subagents to Task tool calls via three-phase matching
- Detect parallel execution (100ms overlap)
- Propagate team metadata via parentUuid chain
- Enrich subagents with description, subagentType, team info

### Non-Functional
- Handle missing/incomplete subagent files gracefully
- Cache resolved subagents to avoid re-parsing
- Keep functions pure where possible

## Architecture

```
src/lib/
├── subagent-resolver.ts     # Main resolver logic
└── teammate-message-parser.ts  # Parse <teammate-message> XML
```

## Related Code Files

### Create
- `src/lib/subagent-resolver.ts` - Main resolver
- `src/lib/teammate-message-parser.ts` - XML parser

### Modify
- `src/lib/jsonl-session-parser.ts` - Add tool result extraction helpers

## Implementation Steps

1. **Create `src/lib/teammate-message-parser.ts`**
   - Define ParsedTeammateContent interface
   - Implement TEAMMATE_BLOCK_RE regex
   - Implement `parseAllTeammateMessages(rawContent: string)`
   - Extract teammateId, color, summary, content

2. **Create `src/lib/subagent-resolver.ts`**

   **Core functions:**
   - `resolveSubagents(sessionDir: string, taskCalls: ToolCall[], messages: ParsedMessage[]): Promise<Process[]>`
     - Call Rust backend to get raw subagents
     - Link to Task calls
     - Propagate team metadata
     - Detect parallel execution
     - Sort by start time

   - `linkToTaskCalls(subagents: Process[], taskCalls: ToolCall[], messages: ParsedMessage[]): void`
     - Phase 1: Build agentId → taskId map from tool_results
     - Phase 2: Match team members by description/summary
     - Phase 3: Positional fallback (no wrap-around)

   - `propagateTeamMetadata(subagents: Process[]): void`
     - Build map: last message uuid → subagent
     - Follow parentUuid chain to find ancestor with team info
     - Copy team metadata to continuation files

   - `detectParallelExecution(subagents: Process[]): void`
     - Sort by start time
     - Group by 100ms window
     - Mark agents in multi-member groups as parallel

   - `extractTeamMessageSummary(messages: ParsedMessage[]): string | undefined`
     - Find first user message
     - Extract summary attribute from `<teammate-message>`

3. **Add extraction helpers to `src/lib/jsonl-session-parser.ts`**
   - `extractAgentIdFromResults(messages: ParsedMessage[]): Map<string, string>`
     - Scan tool_result messages for agentId field
     - Return map of agentId → toolUseId

## Todo List

- [x] Create `src/lib/teammate-message-parser.ts`
- [x] Create `src/lib/subagent-resolver.ts` with core functions
- [x] Implement three-phase linking algorithm
- [x] Implement team metadata propagation
- [x] Implement parallel detection
- [x] Add extraction helpers to jsonl-session-parser.ts
- [x] Unit test resolver logic

## Success Criteria

- [x] Subagents linked to Task calls correctly
- [x] Team member metadata propagated to continuation files
- [x] Parallel execution detected within 100ms window
- [x] Warmup and compact files excluded
- [x] All files under 200 lines
- [x] TypeScript compiles without errors

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Missing agentId in results | Fallback to positional matching |
| Circular parentUuid chains | Max depth limit (10) |
| Large number of subagents | Batch processing |

## Security Considerations

- No external network calls
- File paths validated by Rust backend
- No code execution from parsed content

## Next Steps

- Phase 4 uses resolver output for filtering Task calls
- Phase 5 uses Process data in SubagentItem component

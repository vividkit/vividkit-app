---
title: "Phase 4: Filtering Logic"
description: "Implement display item builder to filter Task calls with subagents"
status: completed
priority: P1
effort: 2h
branch: mvp-agy
tags: [filtering, display, subagent]
created: 2026-03-03
completed: 2026-03-03
---

# Phase 4: Filtering Logic

Implement display item builder to filter Task calls with subagents.

## Context Links

- Source: `claude-devtools/src/renderer/utils/displayItemBuilder.ts`
- Target: `src/lib/display-item-builder.ts`
- Types: `src/types/subagent.ts` (Phase 1)

## Overview

- Priority: P1
- Status: completed
- Filter Task tool calls that have matching subagents to avoid duplicate display

## Key Insights

1. Build Set of Task IDs with associated subagents
2. Skip Task tool calls in that Set when building display items
3. Orphaned Task calls (no matching subagent) still displayed for visibility
4. Filter applies in both `ai-message.tsx` and `stream-view.tsx`

## Requirements

### Functional
- Build set of parentTaskIds from resolved subagents
- Filter Task calls that match the set
- Preserve orphaned Task calls (no subagent file)
- Support AIGroupDisplayItem union type

### Non-Functional
- O(1) lookup via Set
- No mutation of input arrays
- Pure functions where possible

## Architecture

```
src/lib/
└── display-item-builder.ts   # Filter logic + display item types
```

## Related Code Files

### Create
- `src/lib/display-item-builder.ts` - Display item types and filtering

### Modify
- `src/components/ccs-stream/ai-message.tsx` - Apply filtering
- `src/components/ccs-stream/stream-view.tsx` - Pass subagents to builder

## Implementation Steps

1. **Create `src/lib/display-item-builder.ts`**

   **Types:**
   ```typescript
   export type AIGroupDisplayItem =
     | { type: 'thinking'; content: string; timestamp: string; tokenCount?: number }
     | { type: 'output'; content: string; timestamp: string; tokenCount?: number }
     | { type: 'tool'; tool: ToolCall }
     | { type: 'subagent'; subagent: Process }
     | { type: 'teammate_message'; ... }  // MVP: skip
   ```

   **Functions:**
   - `getTaskIdsWithSubagents(subagents: Process[]): Set<string>`
     - Map subagents to parentTaskId
     - Filter undefined values
     - Return Set for O(1) lookup

   - `filterToolCalls(toolCalls: ToolCall[], subagents: Process[]): ToolCall[]`
     - Get taskIdsWithSubagents set
     - Filter out Task calls in the set
     - Return remaining tool calls

   - `buildDisplayItems(toolCalls: ToolCall[], subagents: Process[]): AIGroupDisplayItem[]`
     - Filter tool calls
     - Map to display items
     - Insert subagent items at correct positions
     - Sort by timestamp

2. **Modify `src/components/ccs-stream/ai-message.tsx`**
   - Add `subagents?: Process[]` prop
   - Use `filterToolCalls()` before rendering tool calls
   - Pass subagents to listedTools filter

3. **Modify `src/components/ccs-stream/stream-view.tsx`**
   - Resolve subagents when session log path changes
   - Store subagents in state
   - Pass subagents to AIMessage component

## Todo List

- [x] Create `src/lib/display-item-builder.ts` with types and functions
- [x] Implement `getTaskIdsWithSubagents()` helper
- [x] Implement `filterToolCalls()` function
- [x] Implement `buildDisplayItems()` function
- [x] Modify `ai-message.tsx` to apply filtering
- [x] Modify `stream-view.tsx` to resolve and pass subagents
- [x] Test filtering with sample data

## Success Criteria

- [x] Task calls with subagents filtered from display
- [x] Orphaned Task calls still visible
- [x] Subagent items inserted at correct positions
- [x] All files under 200 lines
- [x] TypeScript compiles without errors

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Incorrect ordering | Sort by timestamp after building |
| Missing subagent items | Insert subagent items separately |

## Security Considerations

- No external data sources
- Pure functions, no side effects

## Next Steps

- Phase 5 uses display items in SubagentItem and ExecutionTrace components

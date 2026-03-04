---
title: "Phase 6: Integration"
description: "Integrate all subagent components into CCS Test Console"
status: completed
priority: P1
effort: 1h
branch: mvp-agy
tags: [integration, subagent, ccs-stream]
created: 2026-03-03
completed: 2026-03-03
---

# Phase 6: Integration

Integrate all subagent components into CCS Test Console.

## Context Links

- All previous phases
- Target: `src/components/ccs-stream/stream-view.tsx`

## Overview

- Priority: P1
- Status: completed
- Wire up all components for end-to-end subagent rendering

## Key Insights

1. Resolve subagents when session log path changes
2. Pass subagents through component hierarchy
3. Handle loading and error states
4. Ensure proper cleanup on unmount

## Requirements

### Functional
- Resolve subagents on session change
- Display subagent items in stream
- Filter Task calls with matching subagents
- Handle missing subagent files gracefully

### Non-Functional
- No blocking UI during resolution
- Proper cleanup on unmount
- Error boundary for subagent rendering

## Architecture

```
stream-view.tsx
├── useEffect: resolve subagents on sessionLogPath change
├── state: subagents, subagentError, isLoadingSubagents
├── AIMessage (receives subagents prop)
│   ├── ToolCallItem (filtered)
│   └── SubagentItem (from subagents)
└── Error display if resolution fails
```

## Related Code Files

### Modify
- `src/components/ccs-stream/stream-view.tsx` - Main integration point
- `src/components/ccs-stream/ai-message.tsx` - Receive and render subagents

### Create
- `src/hooks/use-subagents.ts` - Custom hook for subagent resolution (optional)

## Implementation Steps

1. **Add subagent state to `stream-view.tsx`**
   ```typescript
   const [subagents, setSubagents] = useState<Process[]>([])
   const [subagentError, setSubagentError] = useState<string | null>(null)
   ```

2. **Add subagent resolution effect**
   ```typescript
   useEffect(() => {
     if (!sessionLogPath) {
       setSubagents([])
       return
     }

     const sessionDir = sessionLogPath.replace(/\.jsonl$/, '')
     resolveSubagents(sessionDir, taskCalls, entries)
       .then(setSubagents)
       .catch((e) => setSubagentError(e.message))
   }, [sessionLogPath])
   ```

3. **Pass subagents to AIMessage**
   ```tsx
   <AIMessage
     key={item.id}
     item={item}
     isLast={idx === items.length - 1}
     subagents={subagents}
   />
   ```

4. **Add error display**
   ```tsx
   {subagentError && (
     <div className="text-xs text-warning">
       Subagent resolution failed: {subagentError}
     </div>
   )}
   ```

5. **Optional: Create `src/hooks/use-subagents.ts`**
   - Encapsulate subagent resolution logic
   - Return { subagents, error, isLoading }
   - Handle cleanup on unmount

## Todo List

- [x] Add subagent state to stream-view.tsx
- [x] Add subagent resolution effect
- [x] Pass subagents to AIMessage component
- [x] Add error display for resolution failures
- [x] Test with real CCS session data
- [x] Verify cleanup on unmount
- [x] Verify TypeScript compiles

## Success Criteria

- [x] Subagents resolved when session changes
- [x] Subagent items rendered in stream
- [x] Task calls filtered correctly
- [x] Error handling works
- [x] No memory leaks on unmount
- [x] All files under 200 lines
- [x] TypeScript compiles without errors

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Race conditions | AbortController for async |
| Memory leaks | Cleanup in useEffect return |

## Security Considerations

- No sensitive data exposed
- Proper error boundaries

## Next Steps

- Manual testing with CCS sessions containing subagents
- Consider teammate message support (post-MVP)

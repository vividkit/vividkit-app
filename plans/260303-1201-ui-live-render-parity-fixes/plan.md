---
title: "UI Live-Render Parity for Streaming Subagent Nested Tools"
description: "Tight scope fixes for live subagent rendering parity, duplicate suppression, trace fidelity, and deterministic insertion order."
status: pending
priority: P1
effort: 4h
branch: mvp-agy
tags: [ccs-stream, subagent, parity, rendering]
created: 2026-03-03
---

# Scope
- Only edit:
  - `src/components/ccs-stream/stream-view.tsx`
  - `src/components/ccs-stream/execution-trace.tsx`
  - `src/components/ccs-stream/ai-message.tsx`
  - `src/lib/display-item-builder.ts`
- No redesign. Keep current UI and data flow shape.

# TODO
1. `stream-view.tsx`: run subagent resolution while run is active (not only after completion); trigger resolves on entry growth with a light debounce and also once on run end.
2. `stream-view.tsx`: add async stale/race guard (`resolveVersionRef` + mounted flag) so older `resolveSubagents()` results never overwrite newer state.
3. `stream-view.tsx` + `display-item-builder.ts`: support multiple subagents per `parentTaskId` (map to arrays, not single item), insert all matches after parent AI item.
4. `display-item-builder.ts` + `ai-message.tsx`: suppress duplicate `Task` tool rows only when task id exists in resolved linked subagents; leave orphan `Task` calls visible.
5. `execution-trace.tsx`: detect thinking from assistant `content` blocks with `type === 'thinking'`; stop using `toolCalls.name === 'thinking'` heuristic.
6. `execution-trace.tsx`: preserve nested tool-call/result rendering exactly as now (keep merged tool result binding), only change thinking extraction path.
7. `stream-view.tsx` + `display-item-builder.ts`: enforce deterministic inserted subagent order by `(startTime asc, id asc)` before rendering.
8. Verify with a streaming session fixture covering: active-run live subagent appearance, multi-subagent same task, orphan task visibility, thinking block rendering, and stable order across rerenders.

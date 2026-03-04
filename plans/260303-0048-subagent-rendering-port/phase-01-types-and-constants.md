---
title: "Phase 1: Types and Constants"
description: "Define TypeScript types for subagent data structures and team color constants"
status: completed
priority: P1
effort: 2h
branch: mvp-agy
tags: [types, constants, subagent]
created: 2026-03-03
completed: 2026-03-03
---

# Phase 1: Types and Constants

Define TypeScript types for subagent data structures and team color constants.

## Context Links

- Source: `claude-devtools/src/main/types/chunks.ts` (Process type)
- Source: `claude-devtools/src/renderer/constants/teamColors.ts`
- Target: `src/types/subagent.ts`, `src/lib/team-colors.ts`

## Overview

- Priority: P1
- Status: completed
- Create core types for subagent representation and color system

## Key Insights

1. Process type holds all subagent metadata (id, messages, timing, metrics, team info)
2. TeamColorSet provides border/badge/text colors for visual distinction
3. Types must be serializable for Tauri IPC (no Date objects - use ISO strings)

## Requirements

### Functional
- Define Process interface matching claude-devtools
- Define SessionMetrics for token counts
- Define TeamColorSet for color theming
- Define SubagentLink for Task-to-subagent mapping

### Non-Functional
- All types serializable for Tauri IPC
- Use ISO strings instead of Date objects
- Follow existing type patterns in `src/lib/jsonl-session-parser.ts`

## Architecture

```
src/types/
└── subagent.ts          # Process, SessionMetrics, SubagentLink

src/lib/
└── team-colors.ts       # TeamColorSet, getTeamColorSet, getSubagentTypeColorSet
```

## Related Code Files

### Create
- `src/types/subagent.ts` - Core subagent types
- `src/lib/team-colors.ts` - Color constants and utilities

### Extend
- `src/lib/jsonl-session-parser.ts` - Add SubagentMessage type if needed

## Implementation Steps

1. **Create `src/types/subagent.ts`**
   - Define SessionMetrics interface (inputTokens, outputTokens, durationMs, etc.)
   - Define Process interface with all fields from claude-devtools
   - Define SubagentLink interface for Task-to-subagent mapping
   - Export types for use in resolver and components

2. **Create `src/lib/team-colors.ts`**
   - Define TeamColorSet interface (border, badge, text)
   - Define TEAMMATE_COLORS constant (8 colors: blue, green, red, yellow, purple, cyan, orange, pink)
   - Implement getTeamColorSet(colorName: string) - lookup by name or hex
   - Implement getSubagentTypeColorSet(subagentType: string) - hash-based fallback

3. **Extend `src/lib/jsonl-session-parser.ts`**
   - Add TEAMMATE_MESSAGE_REGEX constant
   - Add isTeammateMessage() helper if needed for detection

## Todo List

- [x] Create `src/types/subagent.ts` with Process, SessionMetrics, SubagentLink
- [x] Create `src/lib/team-colors.ts` with color constants and getters
- [x] Verify types compile without errors
- [x] Verify types are serializable for Tauri IPC

## Success Criteria

- [x] Process interface matches claude-devtools structure
- [x] TeamColorSet provides consistent theming
- [x] All types export correctly from src/types/subagent.ts
- [x] TypeScript compiles without errors
- [x] File sizes under 200 lines

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Type mismatch with Rust | Use ISO strings, avoid Date objects |
| Missing fields | Compare with claude-devtools Process type |

## Security Considerations

- No sensitive data in types (paths are file system paths, not URLs)
- No credentials or API keys in subagent data

## Next Steps

- Phase 2 uses these types in Rust backend commands
- Phase 3 uses types in SubagentResolver
- Phase 5 uses TeamColorSet in UI components

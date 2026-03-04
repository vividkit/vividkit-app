---
title: "Phase 2: Rust Backend"
description: "Implement Tauri commands for subagent file discovery and parsing"
status: completed
priority: P1
effort: 3h
branch: mvp-agy
tags: [rust, tauri, subagent, ipc]
created: 2026-03-03
completed: 2026-03-03
---

# Phase 2: Rust Backend

Implement Tauri commands for subagent file discovery and parsing.

## Context Links

- Source: `claude-devtools/src/main/services/discovery/SubagentResolver.ts`
- Target: `src-tauri/src/commands/subagent.rs`
- Types: `src/types/subagent.ts` (Phase 1)

## Overview

- Priority: P1
- Status: completed
- Rust commands for filesystem operations on subagent JSONL files

## Key Insights

1. Subagent files located at `{session_dir}/subagents/agent-*.jsonl`
2. Need cross-platform path handling (PathBuf, not string concat)
3. Filter out warmup subagents (first message = "Warmup")
4. Filter out compact files (`acompact*` prefix)

## Requirements

### Functional
- List subagent files in `{session_dir}/subagents/`
- Parse subagent JSONL files into Process structs
- Extract agent ID from filename (`agent-{id}.jsonl`)
- Calculate timing (startTime, endTime, durationMs)
- Filter warmup and compact files

### Non-Functional
- Cross-platform (macOS, Windows, Linux)
- Use tokio for async I/O
- Return Result<T, String> for all commands

## Architecture

```
src-tauri/src/
├── commands/
│   ├── mod.rs              # Add subagent module
│   └── subagent.rs         # New file: subagent commands
└── models/
    └── subagent.rs         # New file: Serde structs for IPC
```

## Related Code Files

### Create
- `src-tauri/src/commands/subagent.rs` - Tauri commands
- `src-tauri/src/models/subagent.rs` - Serde structs

### Modify
- `src-tauri/src/commands/mod.rs` - Add subagent module
- `src-tauri/src/lib.rs` - Register commands in invoke_handler

## Implementation Steps

1. **Create `src-tauri/src/models/subagent.rs`**
   - Define SessionMetrics struct (Serde, Clone)
   - Define TeamInfo struct (teamName, memberName, memberColor)
   - Define MainSessionImpact struct
   - Define Process struct matching TypeScript Process interface
   - All fields use String for timestamps (ISO format)

2. **Create `src-tauri/src/commands/subagent.rs`**
   - `list_subagent_files(session_dir: String) -> Result<Vec<String>, String>`
     - Use PathBuf for cross-platform paths
     - Read directory entries matching `agent-*.jsonl`
     - Return sorted list of file paths
   - `parse_subagent_file(file_path: String) -> Result<Process, String>`
     - Parse JSONL lines
     - Extract first/last timestamps
     - Calculate duration
     - Filter warmup (first user message = "Warmup")
     - Filter compact files (id starts with `acompact`)
   - `resolve_subagents(session_dir: String) -> Result<Vec<Process>, String>`
     - List + parse all subagent files
     - Return Vec<Process>

3. **Modify `src-tauri/src/commands/mod.rs`**
   - Add `pub mod subagent;`

4. **Modify `src-tauri/src/lib.rs`**
   - Add commands to invoke_handler:
     - `subagent::list_subagent_files`
     - `subagent::parse_subagent_file`
     - `subagent::resolve_subagents`

5. **Create `src/lib/tauri.ts` wrappers**
   - `listSubagentFiles(sessionDir: string): Promise<string[]>`
   - `parseSubagentFile(filePath: string): Promise<Process>`
   - `resolveSubagents(sessionDir: string): Promise<Process[]>`

## Todo List

- [x] Create `src-tauri/src/models/subagent.rs` with Serde structs
- [x] Create `src-tauri/src/commands/subagent.rs` with Tauri commands
- [x] Modify `src-tauri/src/commands/mod.rs` to add subagent module
- [x] Modify `src-tauri/src/lib.rs` to register commands
- [x] Add wrappers to `src/lib/tauri.ts`
- [x] Test with `cargo build`

## Success Criteria

- [x] `list_subagent_files` returns agent-*.jsonl paths
- [x] `parse_subagent_file` returns Process struct
- [x] Warmup and compact files filtered out
- [x] Cross-platform path handling
- [x] All commands return Result<T, String>
- [x] cargo build succeeds
- [x] File sizes under 200 lines

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Path encoding issues | Use PathBuf, dirs crate |
| Large JSONL files | Add max file size limit |
| Malformed JSONL | Graceful error handling |

## Security Considerations

- Validate session_dir is within allowed paths
- No arbitrary file read outside session directory
- Sanitize file paths before reading

## Next Steps

- Phase 3 uses these commands in TypeScript SubagentResolver
- Phase 5 uses Process data in UI components

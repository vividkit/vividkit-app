# Plan: CCS Stream Screen (Claude Code Desktop-style UI)

**Status:** In Progress
**Branch:** mvp-agy
**Date:** 2026-02-27

## Objective

Transform CCS Test Console từ raw xterm.js terminal thành **dual-mode screen**:
1. **Terminal tab** – xterm.js raw (đã có, giữ nguyên)
2. **Stream tab** – conversation-style UI (giống Claude Code Desktop) đọc từ `~/.claude/projects/` JSONL session log

Khi user chạy CCS, session log được ghi vào `~/.claude/projects/{project_id}/{session_uuid}.jsonl`. Stream tab đọc + parse JSONL real-time để render conversation UI.

## Architecture

```
CCS Spawn (Rust) → PTY process → session log → ~/.claude/projects/{project_id}/{session_uuid}.jsonl
                                                          ↓
                                              Rust file watcher (fs::watch)
                                                          ↓
                                              Tauri event: "ccs_stream_update"
                                                          ↓
                                              React: JSONL parser → conversation items
                                                          ↓
                                              UI: Claude Code Desktop-style chat
```

## Phases

### Phase 1: Rust - File Watcher Command (Backend)
- [ ] Thêm command `watch_session_log(path)` vào `src-tauri/src/commands/ai.rs`
- [ ] Emit event `ccs_session_log_line` mỗi khi có dòng mới
- [ ] Command `stop_session_log_watch(session_id)` để cleanup
- [ ] Register commands trong `lib.rs`

### Phase 2: React - JSONL Parser + Conversation Model (Frontend Logic)
- [ ] Tạo `src/lib/jsonl-parser.ts` – parse raw JSONL line → ConversationItem
- [ ] Types: `SessionEntry`, `ConversationItem`, `AIGroup`, `UserMessage`, `ToolCall`
- [ ] Incremental: mỗi line mới append thêm item, không re-parse toàn bộ

### Phase 3: React - Stream View UI Components
- [ ] `src/components/ccs-stream/` folder:
  - `stream-view.tsx` – container, subscribe Tauri events, maintain items list
  - `user-message.tsx` – right-aligned bubble (giống Claude Code Desktop)
  - `ai-message.tsx` – left-bordered với collapsible tool calls
  - `tool-call-item.tsx` – expandable tool call (icon + label + content)
  - `thinking-item.tsx` – collapsible thinking block
  - `stream-status-bar.tsx` – running/stopped/exit code indicator

### Phase 4: Integrate vào CCS Test Page
- [ ] Thêm tab toggle: "Terminal" / "Stream" vào `ccs-test-console.tsx`
- [ ] Khi spawn CCS, detect session ID từ stdout, start watch
- [ ] Khi stop/terminate, stop watch + mark session done
- [ ] `src/pages/ccs-test.tsx` – update layout

## Key Technical Decisions

**Session ID detection**: CCS stdout contains session info OR ta watch project folder để detect new `.jsonl` file created gần nhất sau khi spawn.

**File watching strategy**:
- Rust: `notify` crate hoặc `fs::watch` trên `~/.claude/projects/`
- Filter by timestamp: chỉ watch file tạo sau khi spawn CCS

**JSONL parsing**: Chỉ parse những entry types cần thiết:
- `type: "user"` → UserMessage
- `type: "assistant"` → AIGroup (text + thinking + tool_use)
- `tool_result` trong user entries → kết quả tool call

## Files to Create/Modify

| File | Action |
|------|--------|
| `src-tauri/src/commands/ai.rs` | Modify – thêm file watcher commands |
| `src-tauri/src/lib.rs` | Modify – register new commands |
| `src/lib/jsonl-parser.ts` | Create |
| `src/components/ccs-stream/stream-view.tsx` | Create |
| `src/components/ccs-stream/user-message.tsx` | Create |
| `src/components/ccs-stream/ai-message.tsx` | Create |
| `src/components/ccs-stream/tool-call-item.tsx` | Create |
| `src/components/ccs-stream/thinking-item.tsx` | Create |
| `src/components/ccs-stream/stream-status-bar.tsx` | Create |
| `src/components/ccs-stream/index.ts` | Create |
| `src/components/settings/ccs-test-console.tsx` | Modify – add tab toggle + watcher integration |
| `src/pages/ccs-test.tsx` | Modify – update layout if needed |

## Success Criteria

- [ ] CCS spawn → session log detected → Stream tab shows live conversation
- [ ] User messages render right-aligned với bubble style
- [ ] AI messages render left-bordered, collapsible tool calls
- [ ] Thinking blocks collapsible
- [ ] Terminal tab unchanged (backward compat)
- [ ] `npm run tauri dev` compiles without errors

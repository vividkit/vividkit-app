# Stream Display Debug Report
**Date:** 2026-02-28
**Issue:** Output không hiển thị trong StreamView sau khi submit answers

---

## Executive Summary

Tìm thấy **3 bug nghiêm trọng** làm cho stream không hiển thị output sau submit:

1. **`finishRun()` gọi `setSessionLogPath(null)`** → StreamView reset về "Start a CCS run..." khi process terminate
2. **`sessionEntriesToConversation` lọc QuestionCard đã answered** (pre-pass `resolvedToolUseIds`) nhưng stream vẫn tiếp tục — đây là đúng, không phải bug
3. **Race condition**: `findNewSessionLog` dùng `spawnTimeMs = Date.now()` TRƯỚC khi `spawnCcs` chạy xong → có thể bỏ sót file log nếu CCS tạo file trước khi `findNewSessionLog` bắt đầu polling

**Root cause chính: Bug #1** — `finishRun()` gọi `setSessionLogPath(null)` khi process terminate, làm mất log path và StreamView không còn hiển thị gì nữa.

---

## Technical Analysis

### Bug 1: `finishRun()` xóa `sessionLogPath` khi terminate (CRITICAL)

**File:** `src/components/settings/ccs-test-console.tsx:38-46`

```typescript
function finishRun() {
  isStartingRef.current = false
  stopRequestedRef.current = false
  pendingEventsRef.current = []
  setIsRunning(false)
  setIsStopping(false)
  setActiveRun(null)
  setSessionLogPath(null)  // <-- BUG: xóa sessionLogPath khi terminate
}
```

Flow:
1. User submit answer → CCS nhận stdin → CCS tiếp tục chạy → CCS kết thúc → emit `ccs_run_event` kind=`terminated`
2. `handleRunEvent` nhận `terminated` → gọi `finishRun()` → `setSessionLogPath(null)`
3. `StreamView` nhận `sessionLogPath = null` → reset entries → hiển thị "Start a CCS run..."

**Kết quả:** Tất cả history của session bị xóa ngay khi CCS terminate.

Ngoài ra: kể cả trong lúc CCS đang chạy, nếu `findNewSessionLog` chưa return kết quả (timeout hoặc chưa tìm được file), `sessionLogPath` vẫn là `null` và StreamView hiển thị "Start a CCS run..." thay vì "Waiting for session output..."

### Bug 2: Race condition trong `findNewSessionLog` (MEDIUM)

**File:** `src/components/settings/ccs-test-console.tsx:100-105`

```typescript
const spawnTimeMs = Date.now()  // capture time TRƯỚC khi await findNewSessionLog
resolveHomePath('.claude/projects').then((projectsDir) =>
  findNewSessionLog(projectsDir, cwd || undefined, spawnTimeMs)...
```

Thực ra `spawnTimeMs` được capture SAU `spawnCcs` resolve (line 100 nằm sau `setActiveRun` line 95), nên timing này khá ổn. Tuy nhiên `resolveHomePath` là async call trước khi `findNewSessionLog` bắt đầu polling → thêm delay.

**Thực sự vô hại** nếu CCS mất >100ms để tạo log file (thường đúng). Không phải root cause.

### Bug 3: `handleRunEvent` bỏ qua `stdout`/`stderr` (OBSERVATION)

**File:** `src/components/settings/ccs-test-console.tsx:47-51`

```typescript
function handleRunEvent(payload: CcsRunEventPayload) {
  if (payload.kind === 'stdout' || payload.kind === 'stderr') return  // bỏ qua
  if (payload.kind === 'terminated') { setExitCode(payload.code ?? -1); finishRun(); return }
  finishRun()
}
```

Raw PTY stdout/stderr bị bỏ qua hoàn toàn ở frontend — đây là **design decision đúng** vì StreamView render từ JSONL file, không phải raw PTY output. Không phải bug.

### Flow Analysis: sessionLogPath → StreamView

```
handleRun()
  → spawnCcs() → run_id
  → setActiveRun(run_id)
  → findNewSessionLog(projectsDir, cwd, spawnTimeMs)
      → Poll ~/.claude/projects/<encoded-cwd>/*.jsonl mới hơn spawn_time
      → Trả về path hoặc null (timeout 10s)
  → setSessionLogPath(logPath)  ← CÓ hoặc KHÔNG CÓ

StreamView effect [sessionLogPath]:
  → sessionIdFromPath(path) = last 2 segments
  → listen('ccs_session_log_line', ...)
  → watchSessionLog(sessionId, path)  ← Rust bắt đầu đọc file từ đầu

Rust watch_session_log:
  → Đọc file từ đầu (BufReader)
  → Mỗi dòng → emit 'ccs_session_log_line' với session_id + line
  → Loop 100ms poll nếu EOF (file đang grow)

User submit answer:
  → sendCcsInput(runId, answer + '\n')
  → Rust: write to PTY stdin
  → CCS nhận stdin → tiếp tục chạy
  → CCS ghi thêm vào JSONL file
  → Rust watcher đọc dòng mới → emit events

CCS terminate:
  → PTY close → emit 'ccs_run_event' kind=terminated
  → handleRunEvent → finishRun() → setSessionLogPath(null)  ← BUG
  → StreamView reset entries[]
  → StreamView hiển thị "Start a CCS run..."
```

### `find_new_session_log` Logic (Rust)

**File:** `src-tauri/src/commands/fs.rs:47-109`

Logic:
- Scan `~/.claude/projects/` directories
- Filter theo `cwd` → `encode_cwd_to_project_dir()` → e.g. `/Users/foo/bar` → `Users-foo-bar`
- Tìm `.jsonl` file có `mtime > spawn_time`
- Skip `agent_*` prefixed files
- Poll 100ms × 100 attempts (10s timeout)

**Potential issue:** `dir_name.contains(prefix)` — nếu encoded prefix trùng một phần với nhiều projects, có thể lấy nhầm project. Nhưng không phải root cause.

---

## Root Cause

**Primary:** `finishRun()` gọi `setSessionLogPath(null)` → StreamView mất log path → reset toàn bộ conversation history ngay khi CCS terminate.

**Consequence:** Sau khi submit answer, CCS tiếp tục chạy, ghi thêm vào JSONL. Watcher vẫn đang đọc. Nhưng khi CCS terminate, `sessionLogPath` bị xóa → StreamView unmount watcher → mất tất cả.

---

## Fix

### Fix 1: Không xóa `sessionLogPath` trong `finishRun()`

**File:** `src/components/settings/ccs-test-console.tsx`

Xóa dòng `setSessionLogPath(null)` khỏi `finishRun()`. Chỉ xóa khi user bấm Run mới (trong `handleRun()`).

```typescript
function finishRun() {
  isStartingRef.current = false
  stopRequestedRef.current = false
  pendingEventsRef.current = []
  setIsRunning(false)
  setIsStopping(false)
  setActiveRun(null)
  // REMOVED: setSessionLogPath(null)  ← không xóa ở đây
}
```

`handleRun()` đã có `setSessionLogPath(null)` ở đầu (line 90), nên session log sẽ reset khi user bấm Run mới. Session log path chỉ clear khi bắt đầu run mới, không phải khi terminate.

### Fix 2: Giữ session log watcher chạy sau terminate

Sau khi CCS terminate, Rust watcher tiếp tục chạy (poll EOF). StreamView cleanup gọi `stopSessionLogWatch` khi `sessionLogPath` thay đổi hoặc component unmount. Với Fix 1, watcher vẫn sẽ active sau terminate — **đây là behavior đúng**, vì CCS có thể ghi thêm dòng cuối sau terminate signal.

---

## Implementation

Chỉ cần thay đổi 1 dòng trong `finishRun()`.

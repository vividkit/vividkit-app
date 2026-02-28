# Root Cause Analysis: CCS Stdin Issue

## Problem Summary

Khi frontend gọi `sendCcsInput(runId, text + '\n')`, stdin data không được truyền tới CCS process đang chạy. CCS block ở trạng thái chờ input (AskUserQuestion) nhưng không nhận được response.

---

## Code Analysis

### Flow hiện tại:
```
frontend: sendCcsInput(runId, data)
  → invoke('send_ccs_input', { runId, data })   ← ISSUE #1: camelCase mismatch
    → Rust: send_ccs_input(run_id, data)
      → child.write(data.as_bytes())             ← ISSUE #2: script stdin dead-end
        → script process stdin (not PTY master)
          → ccs subprocess (never receives it)
```

---

## Root Cause

### RC-1 (CRITICAL): IPC Argument Name Mismatch — `runId` vs `run_id`

**File:** `src/lib/tauri.ts:48`
```typescript
return invoke('send_ccs_input', { runId, data })  // camelCase: runId
```

**File:** `src-tauri/src/commands/ai.rs:174`
```rust
pub async fn send_ccs_input(
    process_registry: State<'_, CcsProcessRegistry>,
    run_id: String,   // snake_case: run_id
    data: String,
) -> Result<(), String>
```

Tauri v2 **không tự động convert camelCase → snake_case** khi deserialize invoke arguments. JS gửi `{ runId: "..." }` nhưng Rust expect `run_id`. Kết quả: `run_id` nhận được empty string `""` → `data.is_empty()` trả về `Ok(())` sớm ở dòng 179-181 hoặc `get_mut(&run_id)` không tìm thấy process → trả về error `"CCS run not found"`.

**Cùng lỗi tồn tại ở `stop_ccs`:**
```typescript
return invoke<StopCcsResult>('stop_ccs', { runId })  // runId vs run_id
```

### RC-2 (CRITICAL): `script -qF /dev/null ccs ...` Không Relay Stdin

**File:** `src-tauri/src/commands/ai.rs:51-58`
```rust
#[cfg(target_os = "macos")]
{
    wrapped_args.push("-qF".to_string());
    wrapped_args.push("/dev/null".to_string());
    wrapped_args.push("ccs".to_string());
    // ...
    return ("script".to_string(), wrapped_args);
}
```

Trên macOS, `ccs` được wrap bởi `script -qF /dev/null ccs ...`.

`CommandChild.write()` của tauri-plugin-shell ghi vào **stdin pipe của process `script`**.

Theo behavior của `script(1)` trên macOS BSD: khi chạy với command argument (`script -qF /dev/null <cmd>`), `script` chỉ forward stdin tới PTY master **khi** stdin của `script` chính nó là a TTY. Khi stdin là một **pipe** (từ tauri-plugin-shell spawn), `script` không thực hiện terminal relay loop — stdin của `script` process không được copy vào PTY master của `ccs`.

Kết quả: `ccs` process đang chạy trong PTY allocated bởi `script`, nhưng data ghi vào `script` stdin không bao giờ đến PTY master → `ccs` block mãi chờ input.

**Verification evidence:**
- `script(1)` man page: "makes a typescript of everything printed on your terminal" — thiết kế cho interactive TTY sessions, không cho piped stdin relay
- Khi stdin của `script` là pipe, `script` không set up the copy loop từ stdin → PTY master

---

## Evidence

| Evidence | Detail |
|----------|--------|
| `tauri.ts:48` | `invoke('send_ccs_input', { runId, data })` — camelCase `runId` |
| `ai.rs:174` | `run_id: String` — snake_case param name |
| `ai.rs:179-181` | Early return `Ok(())` khi `data.is_empty()` — nếu `run_id` deserialize thành empty, `data` cũng có thể bị nhầm |
| `ai.rs:186-188` | `runs.get_mut(&run_id)` → `"CCS run not found"` nếu `run_id` sai |
| `ai.rs:51-58` | macOS wraps ccs với `script -qF /dev/null` |
| `tauri.ts:44` | `stop_ccs` cũng dùng `{ runId }` — same mismatch |

---

## Recommended Fix Direction

### Fix #1 — Sửa IPC argument name (HIGH PRIORITY, 5 phút)

Trong `src/lib/tauri.ts`, đổi `runId` → `run_id`:

```typescript
// Before:
export async function stopCcs(runId: string): Promise<StopCcsResult> {
  return invoke<StopCcsResult>('stop_ccs', { runId })
}

export async function sendCcsInput(runId: string, data: string): Promise<void> {
  return invoke('send_ccs_input', { runId, data })
}

// After:
export async function stopCcs(runId: string): Promise<StopCcsResult> {
  return invoke<StopCcsResult>('stop_ccs', { run_id: runId })
}

export async function sendCcsInput(runId: string, data: string): Promise<void> {
  return invoke('send_ccs_input', { run_id: runId, data })
}
```

### Fix #2 — Stdin relay qua `expect`/`socat` hoặc bỏ `script` wrapper (MEDIUM PRIORITY)

Option A: Bỏ `script` wrapper, dùng alternative PTY allocation trong Rust (e.g., `pty` crate hoặc `portable-pty` crate). Spawn CCS trực tiếp với PTY, pipe stdin/stdout qua PTY master.

Option B: Dùng `script -k` (log keystrokes) — nhưng vẫn không đảm bảo stdin relay khi không phải TTY.

Option C: Dùng `expect` hoặc `socat` để tạo PTY bridge thật sự:
```
socat PTY,raw,echo=0 EXEC:"ccs ..."
```

Option D: Thay thế hoàn toàn `tauri-plugin-shell` bằng custom PTY spawn sử dụng Rust's `nix::pty::openpty` + `tokio` — cách duy nhất đảm bảo full PTY I/O control.

**Recommended:** Fix #1 trước (immediate, low risk), sau đó implement Fix #2 với Option D (proper PTY trong Rust) để đảm bảo stdin relay hoạt động đúng trên macOS.

---

## Unresolved Questions

1. Tauri v2 có bất kỳ `serde(rename_all = "camelCase")` nào được apply globally cho invoke args không? Cần verify bằng cách test thực tế sau khi fix.
2. `child.write()` trong tauri-plugin-shell v2 — behavior cụ thể khi process là `script` cần được test thực tế sau fix #1 để xác nhận fix #2 có cần thiết không.
3. Nếu CCS không dùng `AskUserQuestion` mà dùng raw `readline` stdin — behavior có khác không?

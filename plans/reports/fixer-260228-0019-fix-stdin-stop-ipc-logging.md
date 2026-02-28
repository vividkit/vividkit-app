# Fixer Report: Fix stdin submit và stop IPC silent errors

**Date:** 2026-02-28
**Status:** completed

## Findings

### lib.rs invoke_handler — OK
- `stop_ccs` và `send_ccs_input` đã được register đúng trong `invoke_handler![]`
- Không thiếu command nào

### capabilities/default.json — OK
- Tauri v2 custom commands không cần khai báo trong capabilities
- Chỉ plugins (shell, fs, dialog) mới cần permissions entry

### Root cause: Silent error swallowing
- `question-card.tsx` line 144: `.catch(() => {})` nuốt error hoàn toàn khi `sendCcsInput` fail
- `tauri.ts`: không có error logging cho `stopCcs` và `sendCcsInput` → không thể debug

## Files Modified

### `src/lib/tauri.ts`
- Thêm `.catch()` với `console.error` vào `stopCcs` và `sendCcsInput`
- Errors sẽ hiển thị trong DevTools console thay vì im lặng

### `src-tauri/src/commands/ai.rs`
- Thêm `eprintln!("[CCS stdin] run_id={run_id} data_len={}", data.len())` trong `send_ccs_input`
- Log xuất hiện trong Tauri stderr khi stdin được gửi

## Build Status
- `cargo build` → `Finished dev profile` — no errors

## Next Steps
- Test lại trong app: bấm Stop và Submit answers
- Check DevTools console (`Ctrl+Shift+I`) xem có `[stopCcs] error` hoặc `[sendCcsInput] error` không
- Check Tauri stderr terminal xem có `[CCS stdin]` log không khi submit
- Nếu vẫn không thấy log → vấn đề ở UI layer (button click không trigger handler)

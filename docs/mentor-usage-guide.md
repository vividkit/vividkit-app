# Mentor Usage Guide

## Overview

Cross-project async review system. Không tự động — mọi bước đều manual.

```
vividkit-app/          vividkit-supervisor/
  (code ở đây)           inbox/
       │                   ├── pending/
       │ /submit-to-mentor ├── reviewing/
       └────────────────>  └── completed/
```

## Flow chuẩn

```
1. /ck:plan         → tạo plan với các phase
2. /cook            → implement từng phase
3. /submit-to-mentor [phase-path]   → submit sau mỗi phase
4. [supervisor] /mentor-review      → trigger review
5. Đọc questions → viết response
6. [supervisor] /mentor-respond {session}
7. Nhận verdict → approved → /cook phase tiếp
```

## Các lệnh

| Lệnh | Project | Mục đích |
|------|---------|----------|
| `/submit-to-mentor [phase-path]` | vividkit-app | Submit report sau khi xong phase |
| `/mentor-review [filename]` | vividkit-supervisor | Trigger mentor đọc + viết questions |
| `/mentor-respond {session}` | vividkit-supervisor | Tiếp tục Q&A round tiếp |
| `/mentor-verdict {session}` | vividkit-supervisor | Force verdict ngay |

## Submit report

```bash
/submit-to-mentor plans/260223-xxxx-my-plan/phase-01-something.md
```

Report được ghi vào: `../vividkit-supervisor/inbox/pending/{timestamp}-{phase-slug}.md`

## Đọc questions & trả lời

Questions: `../vividkit-supervisor/inbox/reviewing/{session}/questions-r1.md`

Viết response vào: `../vividkit-supervisor/inbox/reviewing/{session}/response-r1.md`

## Verdict

- `approved` → tiếp tục phase tiếp
- `approved_with_notes` → tiếp tục, xem ghi chú
- `needs_work` → sửa, submit lại
- `rejected` → implement lại từ đầu

Tối đa 3 rounds Q&A trước khi forced verdict.

## Mentor focus vào

1. IPC type safety — `invoke()` args khớp `#[tauri::command]` params
2. No `.unwrap()` trong Rust commands
3. Worktree lifecycle — create → use → cleanup
4. AI HTTP: Rust only — không dùng `fetch()` từ React/TS
5. xterm.js — dispose on unmount, lazy mount, buffer streaming

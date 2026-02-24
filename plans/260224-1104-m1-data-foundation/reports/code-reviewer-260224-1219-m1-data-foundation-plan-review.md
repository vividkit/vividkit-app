# Plan Review — M1 Data Foundation
**Reviewer:** code-reviewer (Scope & Complexity Critic — YAGNI enforcer)
**Date:** 2026-02-24
**Plan:** `/plans/260224-1104-m1-data-foundation/`

---

## Finding 1: Mutex<Connection> Sẽ Tạo Bottleneck Ngay Từ Đầu

- **Severity:** High
- **Location:** Phase 1, section "Implementation Steps — DbState struct"
- **Flaw:** Plan dùng `Mutex<Connection>` (single connection, serialized access). Mọi Tauri command phải acquire lock trước khi query. Với 35 commands được đăng ký, bất kỳ command nào đang chạy sẽ block tất cả command khác.
- **Failure scenario:** User mở app, `useAppInit` gọi `loadSettings()` và `loadProjects()` tuần tự (Phase 6, step 1). `loadProjects` lại cần JOIN với `ccs_accounts`. Trong khi đó nếu có thêm một async store nào trigger thêm `invoke()`, toàn bộ sẽ queue sau Mutex. WAL mode giúp được với đọc đồng thời từ nhiều process, không giúp được single-connection Mutex trong cùng process.
- **Evidence:** Phase 1: "DbState struct wrapping `Mutex<Connection>`". Phase 6 init gọi loadSettings + loadProjects tuần tự nhưng không đề cập connection pooling.
- **Suggested fix:** Dùng `r2d2` + `r2d2_sqlite` (connection pool) hoặc chấp nhận single connection nhưng phải ghi rõ trong plan rằng mọi command là serialized và đây là design decision có chủ ý — không phải lỗi ngầm.

---

## Finding 2: 35 Commands Cho MVP Là Quá Nhiều — Không Áp Dụng YAGNI

- **Severity:** High
- **Location:** Phase 2 + Phase 3, section "Commands"
- **Flaw:** Plan tạo full CRUD cho 9 entities (35 commands). MVP scope theo CLAUDE.md là "5 modules". Nhiều commands này serve data mà UI prototype chưa có: `get_plan(id)`, `get_task(id)`, `update_brainstorm_session`, `create_key_insight`, `list_key_insights`, `delete_key_insight`, `delete_phase` — không có UI flow nào trong MVP dùng các lệnh này.
- **Failure scenario:** Implementer dành 2-3 ngày viết, test, đăng ký 35 commands. Sau đó Phase 5 chỉ cần wire `list_*` và `create_*` cho các màn hình hiện tại. `get_task(id)`, `update_phase_status`, v.v. nằm im không dùng — dead code ngay từ M1.
- **Evidence:** Phase 3: "Total command count after P2+P3: 35 commands". Phase 3 list `delete_key_insight`, `update_brainstorm_session(id, status?, report_path?)` — không có UI component nào trong plans/260224-1104 yêu cầu các command này.
- **Suggested fix:** Chỉ implement commands mà UI component hiện tại đang gọi. Audit từng command: nếu không có store action nào gọi nó trong Phase 5 → defer. Có thể cắt xuống ~20 commands mà không mất tính năng MVP.

---

## Finding 3: Schema Có Circular Dependency Tiềm Ẩn — key_insights FK Chưa Đúng

- **Severity:** High
- **Location:** Phase 1, section "V1 migration SQL — key_insights table"
- **Flaw:** `key_insights` có `deck_id REFERENCES decks(id) ON DELETE CASCADE`. `decks` có `based_on_insight_id TEXT` (không có FK constraint). Nếu sau này thêm FK `decks.based_on_insight_id REFERENCES key_insights(id)`, sẽ có circular reference không thể resolve bằng CASCADE. Hiện tại chưa có FK nhưng plan không ghi rõ đây là intentional omission.
- **Failure scenario:** Developer sau thấy `based_on_insight_id` không có FK, thêm vào như "fix". SQLite không enforce circular FK lúc schema creation nhưng DELETE operations sẽ fail hoặc hành xử không nhất quán. Nếu delete một deck có insight mà insight đó là `based_on` của deck khác — undefined behavior.
- **Evidence:** Phase 1 schema: `decks.based_on_insight_id TEXT` (no FK), `key_insights.deck_id REFERENCES decks(id) ON DELETE CASCADE`. Plan không giải thích tại sao `based_on_insight_id` không có FK constraint.
- **Suggested fix:** Ghi rõ trong plan: `based_on_insight_id` là soft reference (no FK) vì circular dependency. Hoặc tách `key_insights` khỏi `decks` cascade — insight thuộc `project`, không phải `deck`.

---

## Finding 4: Phase 6 Dùng localStorage Cho activeProjectId — Vi Phạm "Local-First DB" Principle

- **Severity:** Medium
- **Location:** Phase 6, section "Implementation Steps — step 4"
- **Flaw:** Plan viết: "save `activeProjectId` to settings or localStorage". `localStorage` trong Tauri là WebView storage — volatile, không đồng bộ với SQLite DB. Đây là hai source-of-truth cho cùng một piece of state.
- **Failure scenario:** User tắt app khi `activeProjectId` đã lưu vào SQLite settings nhưng localStorage chưa sync (hoặc ngược lại sau một bug). App restart đọc từ localStorage (nhanh hơn) nhưng project đó đã bị delete khỏi SQLite. App render với `activeProjectId` trỏ đến null project → crash hoặc blank UI.
- **Evidence:** Phase 6, step 4: "save `activeProjectId` to settings or localStorage, restore on boot" — "or" là ambiguous, implementation sẽ pick một trong hai không nhất quán.
- **Suggested fix:** Bỏ hoàn toàn localStorage option. Lưu `active_project_id` vào `app_settings` table (thêm column) hoặc dùng Zustand persist với Tauri store plugin. Một source of truth.

---

## Finding 5: "Optimistic Update" Pattern Được Describe Sai — Thực Ra Là Pessimistic

- **Severity:** Medium
- **Location:** Phase 5, section "Key Insights"
- **Flaw:** Plan ghi: "Optimistic updates: update store first, rollback on IPC error (KISS: just reload on error)". Sau đó code example lại implement ngược lại: `addProject` await IPC trước, rồi mới update store. Đây là pessimistic update (wait for server), không phải optimistic.
- **Failure scenario:** Không phải failure per se, nhưng khi implementer đọc "optimistic updates" và sau đó thấy code example await trước, họ sẽ bị confused về pattern thực sự. Một implementer khác có thể implement đúng optimistic (update store trước, gọi IPC sau) — dẫn đến inconsistent patterns across 7 stores.
- **Evidence:** Phase 5, Key Insights: "Optimistic updates: update store first...". Code example ngay bên dưới: `const project = await createProject(args); set(...)` — IPC được await trước.
- **Suggested fix:** Bỏ mention "optimistic updates" nếu không implement. Hoặc implement đúng: update store trước, gọi IPC sau, rollback nếu fail. Chọn một, document rõ.

---

## Finding 6: `command_providers TEXT DEFAULT '{}'` Trong app_settings — Gold Plating

- **Severity:** Medium
- **Location:** Phase 1, section "app_settings schema"
- **Flaw:** `command_providers TEXT NOT NULL DEFAULT '{}'` — lưu JSON blob trong SQLite TEXT column. MVP theo CLAUDE.md chỉ cần chọn CCS profile (claude, gemini, etc.) từ UI. "command_providers" không có trong bất kỳ phase nào khác của plan. Không có TS type nào define structure của JSON này.
- **Failure scenario:** Implementer tạo column nhưng không có code nào đọc hay ghi vào nó trong toàn bộ M1. Column tồn tại trong schema nhưng là dead weight. Khi cần dùng thực sự ở milestone sau, structure của JSON đã bị lock bởi migration V1 — không thể thay đổi mà không tạo V2 migration.
- **Evidence:** Phase 1 schema có `command_providers TEXT NOT NULL DEFAULT '{}'`. Không có mention nào trong Phase 2-6 về việc đọc/ghi column này.
- **Suggested fix:** Bỏ column này khỏi V1 schema. Add ở migration V2 khi có feature thực sự cần nó.

---

## Finding 7: `files_changed INTEGER` Trong worktrees — DB Sẽ Stale Ngay Lập Tức

- **Severity:** Medium
- **Location:** Phase 1, section "worktrees schema" + Phase 3, section "worktree_cmd.rs commands"
- **Flaw:** `files_changed INTEGER NOT NULL DEFAULT 0` được lưu trong DB và cập nhật qua `update_worktree_record(id, status?, files_changed?, merged_at?)`. Số lượng files changed là live git state — nó thay đổi liên tục khi developer commit. DB value sẽ stale ngay sau lần commit đầu tiên.
- **Failure scenario:** User tạo worktree, DB lưu `files_changed = 0`. User commit 5 files. UI hiển thị `files_changed = 0` (stale) vì không có mechanism nào update DB khi git state thay đổi. Update thủ công qua `update_worktree_record` cũng không help vì ai sẽ trigger nó?
- **Evidence:** Phase 1 schema: `files_changed INTEGER NOT NULL DEFAULT 0`. Phase 3: `update_worktree_record(id, status?, files_changed?, merged_at?)` — caller-driven update, không có event trigger.
- **Suggested fix:** Bỏ `files_changed` khỏi DB schema. Tính real-time từ git khi cần display (đã có git2 dependency). Chỉ persist fields có giá trị lâu dài: `branch`, `status`, `merged_at`.

---

## Unresolved Questions

1. `app_settings.font_size` và `auto_save` — UI nào trong MVP dùng các settings này? Nếu không có UI component, đây là thêm gold plating trong schema.
2. Phase 3 có `create_brainstorm_session(deck_id, prompt)` nhưng Brainstorm module trong CLAUDE.md là "AI-assisted ideation" — brainstorm session liệu có chạy qua CCS PTY hay qua DB command? Nếu qua PTY thì DB record chỉ là metadata, cần clarify trigger point.
3. Effort estimate 16h cho 35 Rust commands + 7 stores refactor + DB setup có vẻ thấp. Phase 2+3 một mình = 6h để viết, compile-check và test 35 commands. Realistic không?

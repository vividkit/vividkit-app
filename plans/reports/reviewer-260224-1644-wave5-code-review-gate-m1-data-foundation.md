## Code Review Summary

### Scope
- Files: M1 Data Foundation changes (Rust DB/commands/models, TS IPC wrappers/stores, startup init) + relevant consumers (`src/components/settings/ccs-test-console.tsx`)
- LOC: `git diff --stat` ~1335 insertions / 252 deletions (21 tracked files modified + many new files)
- Focus: Wave 5 review gate after test gate PASS (#12)
- Scout findings: xác nhận 1 integration gap (`list_ccs_profiles`), 1 persistence edge case (`merged_at` clear), 1 nhóm resilience edge cases (dirty DB enum/JSON values)

### Overall Assessment
- **Tổng thể tốt, kiến trúc phù hợp M1**: DB foundation + migration + CRUD commands + IPC + Zustand + startup flow đã khớp nhau và bám sát plan.
- **Data contract TS↔Rust (status literals, lastActiveProjectId, snake_case/camelCase serialization)** nhìn chung **nhất quán**.
- **Security/safety cơ bản tốt**: SQL dùng params, `git_path` có canonicalize + git repo validation.
- **Kết luận gate:** **no release blocker** cho M1 Data Foundation.
- Có **1 issue High** cần ưu tiên xử lý sớm vì có thể gây **silent lost update** trong settings persistence khi có concurrent writes.

### Critical Issues
- Không phát hiện critical blocker.

### High Priority

#### 1) Race condition / lost update trong `settings` persistence (full-row overwrite + concurrent patch writes)
- **Evidence**
  - `src/stores/settings-store.ts:55-60` (`saveSettings` gửi toàn bộ `AppSettings`)
  - `src/stores/settings-store.ts:68-70` (`updateSettings` merge patch trên snapshot local rồi save full object)
  - `src-tauri/src/commands/settings.rs:61-83` (`UPDATE app_settings SET ...` ghi đè toàn bộ cột)
  - `src/hooks/use-app-init.ts:107-108` (fire-and-forget `updateSettings({ lastActiveProjectId })` khi đổi project)
  - `src/components/settings/command-provider-row.tsx:18-22` (UI settings cũng gọi `updateSettings` patch)
- **Impact**
  - Hai cập nhật settings chạy gần nhau (ví dụ đổi `activeProjectId` + đổi `commandProviders/theme`) có thể cùng merge từ **snapshot cũ** rồi ghi đè nhau theo kiểu **last write wins**.
  - Có thể gây **mất dữ liệu settings âm thầm** (e.g. `commandProviders` bị revert hoặc `lastActiveProjectId` bị rollback).
- **Recommendation**
  - Ưu tiên 1 trong các hướng (KISS):
    1. **Serialize settings writes** trong `settings-store` (queue/lock theo store), luôn chờ write trước xong mới write tiếp.
    2. Tách command backend **partial update** (ví dụ `update_last_active_project_id`) để tránh full-row overwrite cho auto-persist.
    3. (Nếu giữ full-row) re-read latest settings trước mỗi write và chống overlap bằng in-flight promise chain.

### Medium Priority

#### 2) `list_ccs_profiles` đã register ở backend nhưng chưa được wire end-to-end (UI vẫn hardcoded profiles)
- **Evidence**
  - `src-tauri/src/commands/ccs_profile.rs:99-146` (đã implement dynamic scan `~/.ccs/`)
  - `src-tauri/src/lib.rs:29` (đã register command)
  - `src/components/settings/ccs-test-console.tsx:13` (hardcoded `PROFILES = ['default', 'glm', 'gemini', 'kimi', 'codex']`)
  - `src/components/settings/ccs-test-console.tsx:127-130` (Select render từ hardcoded list)
  - `src/lib/tauri-ccs.ts:1-41` (chưa có wrapper `listCcsProfiles`)
- **Impact**
  - Quyết định plan/validation về **dynamic CCS profile discovery** mới hoàn thành ở backend, chưa đến UI consumer.
  - User có custom profile trong `~/.ccs/` sẽ **không thấy** trong test console/profile picker hiện tại.
- **Recommendation**
  - Thêm wrapper `listCcsProfiles()` ở `src/lib/tauri-ccs.ts`, load vào `ccs-test-console` (và onboarding nếu scope cho phép).
  - Có thể giữ hardcoded list làm fallback khi command lỗi/empty, nhưng source canonical nên là backend scan.

#### 3) Resilience edge case: dữ liệu DB “bẩn/legacy” có thể làm fail cả read flow (enum/JSON parse fail-hard)
- **Evidence**
  - Settings JSON parse fail-hard: `src-tauri/src/commands/settings.rs:8-11`, `src-tauri/src/commands/settings.rs:40`
  - Enum parse fail-hard ví dụ:
    - `src-tauri/src/models/project.rs:11-20` (`CcsAccountStatus::from_db`)
    - `src-tauri/src/models/task.rs:35-44`, `63-70`, `88-95` (task status/priority/type)
    - `src-tauri/src/models/plan.rs:20-27` (phase status)
    - `src-tauri/src/models/brainstorm.rs:20-27` (brainstorm status)
    - `src-tauri/src/models/worktree.rs:20-27` (worktree status)
- **Impact**
  - Một row có giá trị ngoài tập cho phép (do DB cũ/manual edit/corruption) có thể làm **toàn bộ API đọc danh sách** trả lỗi.
  - `get_settings` fail sẽ kéo theo startup error screen (`src/hooks/use-app-init.ts:45-49`, `src/App.tsx:38-46`).
- **Recommendation**
  - Xác định policy rõ ràng:
    - **Fail-closed** (current behavior, an toàn) nếu muốn strict schema.
    - Hoặc **degrade gracefully** cho local app UX: fallback `command_providers={}` và/hoặc skip row invalid + log warning.
  - Nếu giữ strict, nên log rõ hơn + có migration/repair path sau này.

### Low Priority

#### 4) `merged_at` không thể clear về `NULL` trong `update_worktree_record`
- **Evidence**
  - `src-tauri/src/commands/worktree_cmd.rs:109-115` (`merged_at.or(current.merged_at)`)
  - `src/stores/worktree-store.ts:81-87` (status update giữ `mergedAt` cũ khi không phải `merged`)
- **Impact**
  - Nếu sau này có flow rollback/unmerge, metadata `mergedAt` có thể bị kẹt/stale.
- **Recommendation**
  - Làm rõ semantics: `mergedAt` là immutable audit timestamp hay nullable state field.
  - Nếu cần clear, dùng patch API phân biệt `omit` vs `explicit null`.

#### 5) Duplicate model `AppSettings` (DRY/canonical-source confusion)
- **Evidence**
  - `src-tauri/src/models/config.rs:1-16`
  - `src-tauri/src/models/settings.rs:1-16`
  - `src-tauri/src/models/mod.rs:3`, `src-tauri/src/models/mod.rs:8`
- **Impact**
  - Dễ drift contract về sau, khó xác định source canonical cho settings model.
- **Recommendation**
  - Giữ một model canonical (`models/settings.rs`), xoá/retire alias không dùng.

#### 6) `ccs_profile` home-dir resolution chưa theo project convention `dirs` crate
- **Evidence**
  - `src-tauri/src/commands/ccs_profile.rs:12-18`
- **Impact**
  - Không phải bug ngay, nhưng giảm độ nhất quán cross-platform so với rule trong `CLAUDE.md`.
- **Recommendation**
  - Chuyển sang `dirs` (hoặc Tauri path API nếu muốn inject app handle) để thống nhất convention.

#### 7) Plan progress docs chưa phản ánh trạng thái triển khai (process conformance)
- **Evidence**
  - `plans/260224-1104-m1-data-foundation/plan.md:4` (`status: pending`)
  - `plans/260224-1104-m1-data-foundation/plan.md:33-38` (phase table vẫn Pending)
- **Impact**
  - Ảnh hưởng tracking/traceability, không ảnh hưởng runtime.
- **Recommendation**
  - Để task docs impact (#14) cập nhật phase/status + checklist completion.

### Edge Cases Found by Scout
- `list_ccs_profiles` integration gap (backend có, UI chưa dùng) — **confirmed**.
- Dirty/legacy enum values gây fail hard khi đọc DB — **confirmed**.
- `worktree.merged_at` không clear được — **confirmed**.
- `runId` camelCase invoke arg mismatch — **không xác nhận là lỗi blocker** (pattern Tauri hiện dùng rộng trong codebase; không có bằng chứng runtime fail từ scope review này).

### Positive Observations
- **DB init/migration chắc tay**:
  - Pool `r2d2` + per-connection PRAGMA FK/WAL (`src-tauri/src/db/mod.rs:33-41`, `50-58`)
  - Versioned migration + EXCLUSIVE transaction + rollback (`src-tauri/src/db/migrations.rs:121-147`)
- **Security/safety cơ bản tốt**:
  - SQL đều dùng parameterized queries (nhiều command files)
  - `git_path` có canonicalize + `git2::Repository::open()` validation trước DB write (`src-tauri/src/commands/project.rs:20-28`, `103-109`)
- **Data contract TS↔Rust nhìn chung khớp**:
  - Project/task/plan/brainstorm/worktree status literals align giữa TS unions và Rust enums (`src/types/*.ts`, `src-tauri/src/models/*.rs`)
  - `lastActiveProjectId` persist path align TS↔Rust↔DB (`src/types/settings.ts:1-10`, `src-tauri/src/models/settings.rs:5-16`, `src-tauri/src/commands/settings.rs:13-43`)
- **Startup flow có error screen rõ ràng**, không để blank app (`src/hooks/use-app-init.ts:36-93`, `src/App.tsx:19-49`)
- **`list_ccs_profiles` command registration canonical** ở backend là đúng (module export + invoke registration): `src-tauri/src/commands/mod.rs:1-12`, `src-tauri/src/lib.rs:22-30`

### Recommended Actions
1. **Fix high-priority settings write race** (serialize writes hoặc tách partial command cho `lastActiveProjectId`).
2. Wire `list_ccs_profiles` end-to-end (TS wrapper + `ccs-test-console` consumer; onboarding follow-up nếu trong scope).
3. Chốt policy cho dirty DB resilience (strict fail vs graceful fallback) và implement nhất quán.
4. Làm rõ/chuẩn hóa semantics `worktree.mergedAt` (immutable vs nullable state).
5. Cleanup canonical models (`config.rs` vs `settings.rs`) + cập nhật plan/docs status trong task #14.

### Metrics
- Type Coverage: N/A (không đo trong review gate)
- Test Coverage: N/A (không có coverage run trong scope)
- Linting Issues: N/A (không chạy lint trong review gate)
- Build/Test gate reference: **Task #12 PASS** (`cargo check` + `npm run build` theo context team lead)

### Unresolved Questions
- `worktree.mergedAt` có chủ đích là timestamp lịch sử (không clear) hay là state-derived field phải null khi status != `merged`?
- `list_ccs_profiles` có được xem là yêu cầu runtime của M1 UI (settings console/onboarding) hay chỉ backend capability cho phase sau?
- Với local-first app, team muốn policy strict hay graceful khi gặp DB enum/JSON values không hợp lệ?

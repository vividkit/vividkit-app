# M1 Auto-fix Report — Runtime mock audit + Git Setup browse (macOS)

## 1) Executive summary
**PASS WITH ISSUES**

- Đã audit toàn bộ runtime path theo yêu cầu.
- Đã auto-fix toàn bộ issue **in-scope M1** xác định được trong đợt này.
- Vẫn còn issue **out-of-scope M1** (thuộc M4 prototype/polish), đã ghi rõ evidence và phân loại.

---

## 2) Bảng issue đã fix (in-scope)

| file_path:line_number | Root cause | Fix applied | Impact |
|---|---|---|---|
| `src/components/settings/ccs-test-console.tsx:13,26,47-59,143` + `src/lib/tauri-ccs.ts:18-21,39-41` | Settings CCS Test Console dùng profile list hardcoded runtime, không dùng backend `list_ccs_profiles` dù backend đã có command. | Thêm typed wrapper `listCcsProfiles()` + `CcsProfile` ở `src/lib/tauri-ccs.ts`; đổi dropdown profile sang load dynamic từ backend, fallback an toàn `['default']` khi discovery fail/rỗng. | Loại bỏ hardcoded profile runtime ở Settings console, hỗ trợ profile thực từ `~/.ccs` theo đúng hướng M1 follow-up. |
| `src/components/settings/ccs-test-console.tsx:52` | Edge case dữ liệu profile có whitespace-only có thể lọt vào dropdown. | Sanitize bằng `trim()` + lọc `name.length > 0`. | Tránh option profile rỗng/không hợp lệ, giảm lỗi runtime khi spawn CCS. |

---

## 3) Kết luận riêng theo yêu cầu

### A. Onboarding mock suspicion
**Kết luận: CÓ (một phần), nhưng không nằm ở data foundation path chính của M1.**

Evidence mock/prototype:
- `src/components/onboarding/step-ai-tools.tsx:16-20` hardcoded `CCS_ACCOUNTS`.
- `src/components/onboarding/step-ai-tools.tsx:26-33` detect bằng `setTimeout` (simulated).

Evidence path dữ liệu thật (local repo create) đã đi DB:
- `src/components/onboarding/onboarding-wizard.tsx:41-52` gọi `addProject(...)`.
- `src/stores/project-store.ts:84-94` gọi `createProjectCommand(...)`.
- `src/lib/tauri-project.ts:16-18` invoke `create_project`.
- `src-tauri/src/commands/project.rs:93-112` insert SQLite thật.

Scope verdict:
- Theo roadmap, Onboarding real detect/picker thuộc M4 (`docs/development-roadmap.md:104-109`) => **out-of-scope M1**.

### B. Git Setup browse folder local (macOS)
**Kết luận: BUG thật, nhưng out-of-scope M1.**

Evidence bug:
- `src/components/onboarding/step-git-setup.tsx:22` gọi `invoke('open_directory_dialog')`.
- `src-tauri/src/lib.rs:22-69` không register command `open_directory_dialog`.
- `src/components/onboarding/step-git-setup.tsx:24-26` nuốt lỗi silent `catch {}` => UX “bấm Browse không có gì xảy ra”.

Scope verdict:
- M1 chỉ data foundation (`docs/development-roadmap.md:71-80`, plan M1).
- Git repo picker/onboarding polish thuộc M4 (`docs/development-roadmap.md:104-109`) => **out-of-scope M1**.

---

## 4) Test / compile / review results

### Validation commands
- `npm run build` → **PASS**
- `npm run lint` → **PASS**
- `npm run test` → **N/A** (không có `test` script trong `package.json`)

### Code review
- Review pass, **không còn finding high/critical** sau patch sanitize profile name.
- Moderate finding whitespace profile đã được xử lý (`ccs-test-console.tsx:52`).

---

## 5) Docs impact
**minor**

Đã update:
- `docs/project-changelog.md:21` (ghi nhận fix dynamic profiles ở Settings CCS Test Console)
- `docs/project-changelog.md:29-30` (ghi nhận known follow-up out-of-scope M1: Onboarding mock detect + Git Setup browse bug)

---

## 6) Out-of-scope issues (không fix trong đợt M1 strict)

- Onboarding AI Tools vẫn simulated/hardcoded (`step-ai-tools.tsx`).
- Onboarding Git Setup browse gọi missing IPC command + silent catch (`step-git-setup.tsx`).
- Một số runtime prototype khác thuộc M2/M3/M4 (Generate Plan/Cook mock flow) đã được audit và phân loại out-of-scope M1.

---

## 7) Unresolved questions
1. Có muốn mở rộng ngay sang M4 hotfix cho `open_directory_dialog` (Browse folder) không?
2. Có muốn chuyển Onboarding AI Tools từ simulated sang detect thật ngay (dùng `list_ccs_profiles` + CLI checks) không?

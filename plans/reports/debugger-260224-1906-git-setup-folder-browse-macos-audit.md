# Debugger Audit — Git Setup local folder browse trên macOS

## Executive summary
- Kết luận: có bug thật trong code hiện tại.
- Root cause chính: UI gọi IPC command không tồn tại `open_directory_dialog`, lỗi bị nuốt trong `catch` nên user thấy nút Browse “không làm gì”.
- Scope verdict: bug này **không thuộc M1 Data Foundation**, thuộc onboarding/settings polish (M4).

## Trace bắt buộc (end-to-end)

### 1) UI event
- Browse button ở Git Setup:
  - `/Users/thieunv/projects/solo-builder/vividkit-workspace/vividkit-app/src/components/onboarding/step-git-setup.tsx:71`
  - `onClick={browse}`

### 2) hook/store path
- Hàm `browse()` gọi invoke:
  - `/Users/thieunv/projects/solo-builder/vividkit-workspace/vividkit-app/src/components/onboarding/step-git-setup.tsx:19-23`
- Nếu chọn được path thì patch state local wizard (`patch({ gitPath: selected })`):
  - `/Users/thieunv/projects/solo-builder/vividkit-workspace/vividkit-app/src/components/onboarding/step-git-setup.tsx:23`
- `patch` cập nhật `useState` trong wizard, chưa qua store tại bước browse:
  - `/Users/thieunv/projects/solo-builder/vividkit-workspace/vividkit-app/src/components/onboarding/onboarding-wizard.tsx:34-36`
- Store (`addProject`) chỉ gọi ở bước finish:
  - `/Users/thieunv/projects/solo-builder/vividkit-workspace/vividkit-app/src/components/onboarding/onboarding-wizard.tsx:41-52`

### 3) invoke wrapper
- Không có wrapper riêng cho folder picker.
- UI gọi trực tiếp `invoke('open_directory_dialog')`:
  - `/Users/thieunv/projects/solo-builder/vividkit-workspace/vividkit-app/src/components/onboarding/step-git-setup.tsx:22`
- Wrapper pattern có tồn tại cho project CRUD (để đối chiếu):
  - `/Users/thieunv/projects/solo-builder/vividkit-workspace/vividkit-app/src/lib/tauri-project.ts:16-34`

### 4) tauri command/dialog API
- Call hiện tại: `invoke<string | null>('open_directory_dialog')`:
  - `/Users/thieunv/projects/solo-builder/vividkit-workspace/vividkit-app/src/components/onboarding/step-git-setup.tsx:22`
- Backend command registry **không có** `open_directory_dialog` trong `generate_handler![]`:
  - `/Users/thieunv/projects/solo-builder/vividkit-workspace/vividkit-app/src-tauri/src/lib.rs:22-69`
- Dialog plugin đã init ở backend:
  - `/Users/thieunv/projects/solo-builder/vividkit-workspace/vividkit-app/src-tauri/src/lib.rs:12`
- Không tìm thấy Rust command/function tên `open_directory_dialog` trong `src-tauri/src/**` (grep only callsite ở TS).

### 5) capability/permission config
- Capability default đã cấp quyền dialog và fs:
  - `/Users/thieunv/projects/solo-builder/vividkit-workspace/vividkit-app/src-tauri/capabilities/default.json:12-13`
  - `dialog:default`, `fs:default`
- `tauri.conf.json` không chặn dialog; chỉ có shell plugin config:
  - `/Users/thieunv/projects/solo-builder/vividkit-workspace/vividkit-app/src-tauri/tauri.conf.json:35-39`

### 6) error handling -> user-visible behavior
- `catch` silent, không toast/log:
  - `/Users/thieunv/projects/solo-builder/vividkit-workspace/vividkit-app/src/components/onboarding/step-git-setup.tsx:24-26`
- Hành vi user thấy: click Browse, spinner có thể chạy ngắn rồi không có dialog, không báo lỗi.

## Code path liên quan browse/chọn folder local

### Có browse thực sự
1. Onboarding Git Setup (route `/onboarding`):
   - Component: `/Users/thieunv/projects/solo-builder/vividkit-workspace/vividkit-app/src/components/onboarding/step-git-setup.tsx`
2. New Project page dùng lại cùng component:
   - `/Users/thieunv/projects/solo-builder/vividkit-workspace/vividkit-app/src/pages/new-project.tsx:39`

### Không có browse (chỉ nhập text)
3. Settings Git path (`worktreesDir`) chỉ là Input + `onBlur updateSettings`, không mở dialog:
   - `/Users/thieunv/projects/solo-builder/vividkit-workspace/vividkit-app/src/components/settings/settings-git.tsx:37-43`
4. Settings store + IPC chỉ lưu settings:
   - `/Users/thieunv/projects/solo-builder/vividkit-workspace/vividkit-app/src/stores/settings-store.ts:89-106`
   - `/Users/thieunv/projects/solo-builder/vividkit-workspace/vividkit-app/src/lib/tauri-settings.ts:4-9`

## Root cause verdict
- Root cause chính (high confidence): **IPC contract mismatch**.
  - Frontend gọi command không tồn tại: `open_directory_dialog`.
  - Backend không expose command này.
  - Lỗi bị nuốt -> UX im lặng.

## M1 scope đối chiếu
- M1 theo roadmap: Data foundation (SQLite + CRUD + IPC wiring), đã complete:
  - `/Users/thieunv/projects/solo-builder/vividkit-workspace/vividkit-app/docs/development-roadmap.md:71-80`
- Onboarding real git repo picker thuộc M4, chưa started:
  - `/Users/thieunv/projects/solo-builder/vividkit-workspace/vividkit-app/docs/development-roadmap.md:104-109`
- Plan M1 cũng chỉ mô tả DB/CRUD/store integration, không có onboarding folder dialog:
  - `/Users/thieunv/projects/solo-builder/vividkit-workspace/vividkit-app/plans/260224-1104-m1-data-foundation/plan.md:16-17,31-39`

## Final classification
- **Bug status:** YES (defect trong code path hiện hữu).
- **M1 scope:** OUT-OF-SCOPE (không phải blocker của M1).
- **Ưu tiên xử lý:** nên xử lý sớm vì tác động UX onboarding/new-project.

## Actionable next step (không sửa code ở audit này)
1. Chọn 1 trong 2 hướng triển khai:
   - Hướng A (khuyên dùng): dùng trực tiếp Tauri dialog plugin API ở frontend.
   - Hướng B: thêm Rust command `open_directory_dialog` rồi register vào `generate_handler!`.
2. Bắt buộc bổ sung hiển thị lỗi user-facing (toast/i18n key), không silent catch.
3. Giữ cancel dialog là non-error path.

## Unresolved questions
1. Team muốn chuẩn hóa picker qua frontend plugin API hay luôn đi qua Rust command để centralize policy?
2. Với branch `mvp`, onboarding/new-project hiện được coi production-ready hay vẫn prototype-only?
3. Có yêu cầu đồng bộ behavior browse path giữa onboarding và settings (worktreesDir) trong cùng milestone không?
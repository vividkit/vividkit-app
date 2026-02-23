# VividKit Desktop — AGENT.md

Tài liệu này đồng bộ với `CLAUDE.md` để mọi agent/subagent triển khai UI theo cùng một design guideline.

## Scope

Áp dụng cho mọi thay đổi UI trong:
- `src/components/**`
- `src/pages/**`
- `src/App.css`

## UI Design Guidelines (MANDATORY)

### 1) Design tokens + colors
- Semantic tokens trong `src/App.css` (`:root`, `.dark`, `@theme inline`) là source-of-truth.
- Không hardcode raw colors trong component (`#...`, `rgb(...)`, `hsl(...)`, `bg-[#...]`) trừ ANSI stream text trong terminal output.
- Luôn dùng semantic classes/tokens:
  - `bg-background`, `text-foreground`
  - `bg-card`, `text-card-foreground`
  - `border-border`, `text-muted-foreground`
  - `text-success`, `text-warning`, `text-info`
- Sidebar luôn dùng token riêng: `bg-sidebar`, `text-sidebar-foreground`, `border-sidebar-border`, `ring-sidebar-ring`.

### 2) Typography scale
- H1 (page title): `text-xl font-semibold text-foreground`
- H2 (section heading): `text-lg font-semibold text-foreground`
- H3 (card title): `font-semibold text-foreground` hoặc `font-medium text-foreground`
- Body: `text-sm text-foreground`
- Caption/meta: `text-xs text-muted-foreground`
- Code/terminal: `font-mono text-sm`

### 3) Layout + spacing
- Border radius global: `--radius: 0.75rem`
- Page padding: `p-6`
- Card padding: `p-4` → `p-6`
- Section gap: `space-y-6` → `space-y-8`
- Grid gap: `gap-4`
- Sidebar width: expanded `w-64`, collapsed `w-[60px]`
- Header height: ưu tiên `h-16`

### 4) Components + interactions
- Ưu tiên shadcn/ui primitives: `Card`, `Button`, `Badge`, `Dialog`, `Sheet`, `Tabs`, `Select`, `Input`, `Textarea`, `Switch`, `Checkbox`, `RadioGroup`, `Progress`, `Skeleton`, `Tooltip`, `DropdownMenu`, `ScrollArea`.
- Card states:
  - Hover: `hover:border-primary/30 hover:shadow-md transition-all`
  - Active: `border-primary shadow-md`
- View toggle dùng segmented control:
  - Wrapper: `rounded-lg border bg-muted/50 p-0.5`
  - Active segment: `bg-background text-foreground shadow-sm`
- Status badge mapping bắt buộc:
  - Active / Done / Merged → `bg-success/10 text-success`
  - In Progress / Paused / Todo → `bg-warning/10 text-warning`
  - Backlog → `bg-muted text-muted-foreground`
  - High priority → `bg-destructive/10 text-destructive`
  - Medium priority → `bg-warning/10 text-warning`
  - Low priority → `bg-success/10 text-success`

### 5) Terminal UI (xterm.js)
- Terminal background target: `hsl(240 10% 4%)` (tokenized, tránh hardcode raw màu trong JSX wrappers).
- xterm theme colors ưu tiên lấy từ semantic tokens.
- Giữ bắt buộc: `terminal.dispose()` khi unmount, lazy mount khi hidden, stream output theo buffer.

### 6) Theme + icons
- Theme flow: `ThemeProvider` + `useTheme()` + persist `localStorage`.
- Icon system: `lucide-react`, size chuẩn `h-4 w-4` đến `h-5 w-5`.

## Current compliance snapshot (Feb 2026)

### Đạt guideline
- Design tokens đã định nghĩa đầy đủ light/dark + sidebar + semantic status trong `src/App.css`.
- Sidebar width/collapse, page padding, section gaps, shadcn components, lucide icons đang bám guideline khá tốt.

### Gaps cần ưu tiên fix trong codebase
- Hardcoded terminal color literals xuất hiện ở nhiều file:
  - `src/pages/generate-plan.tsx`
  - `src/components/plans/cook-sheet.tsx`
  - `src/components/cook/cook-terminal.tsx`
  - `src/components/settings/ccs-test-console.tsx`
  - `src/components/tasks/task-cook-sheet.tsx`
  - `src/components/brainstorm/brainstorm-terminal.tsx`
- Theme architecture chưa theo guideline yêu cầu (`ThemeProvider` + `useTheme()`), hiện đang toggle class trực tiếp trong `src/components/layout/app-header.tsx`.
- Một số status badges đang dùng style trung tính hoặc primary thay vì semantic mapping chuẩn.

## Agent execution rules for UI tasks

Khi implement hoặc review UI:
1. Đọc `CLAUDE.md` + file UI liên quan trước khi sửa.
2. Nếu thêm màu/spacing/typography mới, phải map về semantic tokens hiện có trước.
3. Không introduce hardcoded raw colors mới.
4. Nếu chỉnh status UI, dùng đúng semantic mapping ở trên.
5. Nếu task liên quan dark/light mode, ưu tiên migrate về `ThemeProvider/useTheme` pattern thay vì mở rộng toggle trực tiếp.
6. Sau khi sửa UI, tự-check nhanh theo checklist bên dưới.

## UI self-checklist (quick)

- [ ] Không có raw color literal mới trong file UI vừa sửa
- [ ] Typography class đúng scale (H1/H2/H3/body/caption)
- [ ] Spacing/radius theo hệ thống (`p-6`, `gap-4`, `--radius`)
- [ ] Status badges đúng semantic mapping
- [ ] Theme behavior chạy đúng ở cả light/dark
- [ ] Tuân thủ i18n rules (không hardcoded user-facing strings mới)

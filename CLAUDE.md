# VividKit Desktop — CLAUDE.md

## Project Overview

VividKit Desktop is a GUI companion that makes **Claude Code CLI + CCS** accessible to everyone — developers who avoid the terminal and non-developers alike.

Core mechanic: Rust backend spawns a PTY process running `ccs [profile] [args]`, streamed to the user via xterm.js. The UI abstracts away CLI complexity behind visual workflows.

MVP scope: 5 modules — Onboarding, Project Deck, Brainstorm, Tasks, Cook + Worktree.
Target: single-user, local-first. No cloud sync. API keys stay on device.

**External CLI dependencies (must be installed by user):**
- [CCS CLI](https://github.com/kaitranntt/ccs) — `npm install -g @kaitranntt/ccs`
- [Claude Code CLI](https://claude.ai/code)

## Stack

```
Frontend:  React 18, TypeScript, Tailwind v4, shadcn/ui, Zustand
Desktop:   Tauri v2, Rust
Libraries: xterm.js, Monaco Editor, dnd-kit, react-markdown, git2, rusqlite, tokio
```

## UI Design Guidelines (MANDATORY)

Áp dụng cho mọi thay đổi UI trong `src/components/**`, `src/pages/**`, `src/App.css`.

### Design tokens + colors
- Semantic color tokens là source-of-truth trong `src/App.css` (`:root`, `.dark`, `@theme inline`).
- Không hardcode màu raw trong component (`#...`, `rgb(...)`, `hsl(...)`, `bg-[#...]`) trừ ANSI output trong terminal stream text.
- Luôn dùng semantic classes: `bg-background`, `text-foreground`, `bg-card`, `border-border`, `text-muted-foreground`, `text-success`, `text-warning`, `text-info`.
- Sidebar dùng token riêng: `sidebar-*` (`bg-sidebar`, `text-sidebar-foreground`, `border-sidebar-border`, `ring-sidebar-ring`).

### Typography scale
- Page title (H1): `text-xl font-semibold text-foreground`
- Section heading (H2): `text-lg font-semibold text-foreground`
- Card title (H3): `font-semibold text-foreground` hoặc `font-medium text-foreground`
- Body text: `text-sm text-foreground`
- Caption/meta: `text-xs text-muted-foreground`
- Code/terminal: `font-mono text-sm`

### Layout + spacing
- Border radius global: `--radius: 0.75rem`
- Page padding: `p-6`
- Card padding: `p-4` đến `p-6`
- Section gap: `space-y-6` đến `space-y-8`
- Grid gap: `gap-4`
- Sidebar width: expanded `w-64`, collapsed `w-[60px]`
- Header height: ưu tiên `h-16`

### Component + interaction patterns
- Ưu tiên shadcn/ui primitives (`Card`, `Button`, `Badge`, `Dialog`, `Sheet`, `Tabs`, `Select`, `Input`, `Textarea`, `Switch`, `Checkbox`, `RadioGroup`, `Progress`, `Skeleton`, `Tooltip`, `DropdownMenu`, `ScrollArea`).
- Card hover/active:
  - Hover: `hover:border-primary/30 hover:shadow-md transition-all`
  - Active: `border-primary shadow-md`
- View toggle theo segmented control: `rounded-lg border bg-muted/50 p-0.5`; tab active `bg-background text-foreground shadow-sm`.
- Status badge mapping:
  - Active/Done/Merged: `bg-success/10 text-success`
  - In Progress/Paused/Todo: `bg-warning/10 text-warning`
  - Backlog: `bg-muted text-muted-foreground`
  - High priority: `bg-destructive/10 text-destructive`
  - Medium priority: `bg-warning/10 text-warning`
  - Low priority: `bg-success/10 text-success`

### Terminal UI (xterm.js)
- Terminal background target: `hsl(240 10% 4%)` (tokenized, không hardcode raw màu trong JSX wrapper).
- xterm theme ưu tiên lấy từ semantic tokens thay vì literals.
- Giữ rules hiện có: dispose terminal khi unmount, lazy mount khi tab ẩn, stream theo buffer.

### Dark/Light mode + icons
- Theme flow chuẩn: `ThemeProvider` + `useTheme()` + persist `localStorage`.
- Icon system thống nhất `lucide-react`, size phổ biến `h-4 w-4` đến `h-5 w-5`.

### Pre-merge UI checklist
- Không còn raw color trong TSX/CSS utility classes tại vùng code thay đổi.
- Typography/spacing đúng scale ở trên.
- Status badge đúng semantic mapping.
- UI text vẫn tuân thủ i18n rule (`t('key')`) theo section I18n bên dưới.

## Cross-Platform Compat (MANDATORY)

**Rust:**
- Always use `std::path::PathBuf` — never concat paths with `/` or `\`
- Use `dirs` crate for home/config dirs — never hardcode `~/`, `/home/`, `C:\Users\`
- `std::process::Command`: avoid bash-only syntax (pipes `|`, `&&`, `||`) — use Rust logic instead
- Platform-specific behavior: use `#[cfg(target_os = "windows")]` / `"macos"` / `"linux"` guards
- Use `std::env::var()` for env paths — never hardcode platform-specific env vars

**Frontend (React/TS):**
- No platform detection in frontend — let Rust handle platform logic and return normalized data
- Path display only — actual path resolution always done in Rust via IPC

## I18n — Structure-Ready (MANDATORY)

- NO hardcoded user-facing strings in JSX — all text via `t('key')` from `react-i18next`
- Locale files: `src/locales/{lang}.json` (en as default, vi as second)
- Date/time: store UTC internally, format at display layer via `Intl.DateTimeFormat`
- Numbers: use `Intl.NumberFormat` for locale-aware formatting
- CSS: prefer logical props (`margin-inline-start` over `margin-left`) for RTL readiness
- Error strings from Rust (returned as `String`): map to i18n key on frontend before displaying

## Critical Rules

**File size:** Max 200 lines per file. Split into focused modules if exceeded.

**No mocks:** Never use fake data, mocked implementations, or simulated responses in any context.

**AI via CCS — Rust PTY only:** All AI sessions are spawned as `ccs [profile]` PTY processes in Rust (`src-tauri/src/commands/ai.rs`). Never call AI provider APIs directly from React/TypeScript or via `fetch()`.

**CCS profile selection:** UI lets user pick profile (claude, gemini, glm, kimi, etc.) — Rust maps selection to `ccs <profile>` spawn args.

**React pattern:** `Component → Custom Hook → Zustand action → invoke()`
- State lives in Zustand stores (`src/stores/`)
- Tauri IPC wrapped in `src/lib/tauri.ts` helper functions
- Logic > 10 lines extracted into custom hooks (`src/hooks/`)

**xterm.js rules:**
- Always call `terminal.dispose()` on component unmount
- Lazy mount: do not initialize terminal when tab is hidden
- Stream output via buffer — never inject large strings at once

**Rust commands:**
- Every `#[tauri::command]` returns `Result<T, String>` — no exceptions
- Never use `.unwrap()` in command files — use `map_err(|e| e.to_string())`
- Use `tokio` for async I/O operations

**Tauri IPC:** `invoke()` argument names and types must exactly match `#[tauri::command]` parameter signatures.

## Module Map

| Module | Directory | Purpose |
|--------|-----------|---------|
| Onboarding | `src/components/onboarding/` | Welcome screen, CCS profile setup, project creation |
| Project Deck | `src/components/project/` | Project cards, selection, metadata |
| Brainstorm | `src/components/brainstorm/` | Idea generation, AI-assisted ideation |
| Tasks | `src/components/tasks/` | Kanban board, task CRUD |
| Cook + Worktree | `src/components/cook/` | Terminal (xterm.js), file explorer, git worktrees |

## React Patterns

```
src/
  components/{module}/   # UI components (functional, no class components)
  stores/                # Zustand stores — one file per domain
  hooks/                 # Custom hooks — one hook per concern
  lib/tauri.ts           # invoke() wrappers with typed args/returns
  types/                 # Shared TypeScript interfaces
```

## Rust Patterns

```
src-tauri/src/
  commands/{module}.rs   # #[tauri::command] functions
  models/{entity}.rs     # Serde structs for IPC and DB
  lib.rs                 # Plugin registration, invoke_handler
```

Error pattern: `fn foo(arg: String) -> Result<MyStruct, String>`
Async pattern: `async fn bar() -> Result<T, String>` with `tokio::spawn` for blocking I/O

## Skills to Activate

When working on this project, activate these skills:
- `tauri-v2-desktop` — Tauri IPC, plugins, capabilities, Rust commands
- `rusqlite-sqlite` — SQLite schema, queries, migrations in Rust
- `react-best-practices` — React 18 patterns, performance, Suspense
- `frontend-development` — React/TypeScript components, hooks, Zustand
- `tailwind-v4-styling` — Tailwind v4 utility classes, shadcn/ui components

## Supervisor Workflow

After completing each plan phase, submit for cross-review:

```
/submit-to-mentor
```

Report goes to `../vividkit-supervisor/inbox/pending/`.
Mentor reviews code against plan, asks questions, issues verdict.
See full protocol: `../vividkit-supervisor/docs/mentor-protocol.md`

**Automation:** Start the mentor daemon once per session before coding:
```bash
cd ../vividkit-supervisor && make mentor-start
```
After that, submit-to-mentor and mentor-review run automatically when a cook phase ends.
Manual steps remaining: write response to questions + accept verdict.

## File References

- Architecture: `docs/system-architecture.md`
- Code standards: `docs/code-standards.md`
- Plans: `plans/` — active implementation plans with phase files
- Supervisor: `../vividkit-supervisor/` — cross-review system

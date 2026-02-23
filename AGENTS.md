## Config

# VividKit Desktop — AGENTS.md

## Project Overview

VividKit Desktop is an AI-powered solo developer companion built as a Tauri v2 desktop app.
MVP scope: 5 modules — Onboarding, Project Deck, Brainstorm, Tasks, Cook + Worktree.
Target: single-user, local-first, AI-assisted coding workflow management.

## Stack

```
Frontend:  React 18, TypeScript, Tailwind v4, shadcn/ui, Zustand
Desktop:   Tauri v2, Rust
Libraries: xterm.js, Monaco Editor, dnd-kit, react-markdown, git2, rusqlite, tokio
```

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

**AI HTTP — Rust only:** All AI provider calls go through `src-tauri/src/commands/ai.rs`.
Never use `fetch()` or any HTTP client from React/TypeScript for AI calls.

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
| Onboarding | `src/components/onboarding/` | Welcome screen, API key entry, project creation |
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
- Supervisor: `..` — cross-review system


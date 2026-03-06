## Config

# VividKit Desktop — AGENTS.md

## Project Overview

VividKit Desktop is an AI-powered solo developer companion built as a Tauri v2 desktop app.
MVP scope: 5 modules — Onboarding, Project Deck, Brainstorm, Tasks, Cook + Worktree.
Target: single-user, local-first, AI-assisted coding workflow management.

**External CLI dependencies (must be installed by user):**
- [CCS CLI](https://github.com/kaitranntt/ccs) — `npm install -g @kaitranntt/ccs`
- [Claude Code CLI](https://claude.ai/code)

## Stack

```
Frontend:  React 18, TypeScript, Tailwind v4, shadcn/ui, Zustand
Desktop:   Tauri v2, Rust
Libraries: xterm.js, Monaco Editor, dnd-kit, react-markdown, git2, rusqlite, tokio
```

## UI Design System (MANDATORY)

All UI rules (tokens, typography, spacing, components, status mapping, terminal, theme, checklist) are centralized in:

- `docs/design-system.md`

When implementing/reviewing UI in `src/components/**`, `src/pages/**`, `src/App.css`:
- Always read and follow `docs/design-system.md`
- Do not duplicate or override UI rules in `CLAUDE.md`/`AGENTS.md`
- If a guideline needs updates, edit `docs/design-system.md` directly

## Cross-Platform Compat (MANDATORY — EVERY CODE CHANGE)

**REMINDER:** VividKit targets macOS, Linux, AND Windows. Every file path, shell command, and env var must work on ALL three platforms. Never assume a single OS. Review every path operation for platform bias before committing.

**Rust:**
- Always use `std::path::PathBuf` and `.join()` — never concat paths with `/` or `\`
- Use `dirs` crate for home/config dirs — never hardcode `~/`, `/home/`, `C:\Users\`
- Use `std::path::MAIN_SEPARATOR` or `PathBuf` methods when building display paths
- `std::process::Command`: avoid bash-only syntax (pipes `|`, `&&`, `||`) — use Rust logic instead
- Platform-specific behavior: use `#[cfg(target_os = "windows")]` / `"macos"` / `"linux"` guards
- Use `std::env::var()` for env paths — never hardcode platform-specific env vars
- Line endings: use `\n` internally; let OS handle display. Never hardcode `\r\n`
- Executable extensions: use `which`/`dirs` crate to locate binaries — never hardcode `.exe` or assume no extension

**Frontend (React/TS):**
- No platform detection in frontend — let Rust handle platform logic and return normalized data
- Path display only — actual path resolution always done in Rust via IPC
- Never construct file paths in TypeScript — always receive resolved paths from Rust

## I18n — Structure-Ready (MANDATORY)

- NO hardcoded user-facing strings in JSX — all text via `t('key')` from `react-i18next`
- Locale files: `src/locales/{lang}/*.json` (vi as default, en as secondary)
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
| Layout | `src/components/layout/` | App shell, sidebar, header, theme provider |
| Dashboard | `src/components/dashboard/` | Stats cards, quick actions, overview |
| Onboarding | `src/components/onboarding/` | Welcome wizard, CCS profile setup, project creation |
| Decks | `src/components/decks/` | Deck cards, deck list, create deck dialog |
| New Project | `src/components/new-project/` | Project creation flow |
| Brainstorm | `src/components/brainstorm/` | Idea generation, AI-assisted ideation, report preview |
| Plans | `src/components/plans/` | Plan cards, plan list, phase checklist, markdown preview |
| Generate Plan | `src/components/generate-plan/` | AI plan generation, phase indicator |
| Tasks | `src/components/tasks/` | Kanban board, list view, task CRUD |
| Cook | `src/components/cook/` | Cook terminal, controls, progress, steps |
| Worktrees | `src/components/worktrees/` | Git worktree cards (active/ready/merged), merge dialog |
| CCS Stream | `src/components/ccs-stream/` | JSONL stream view, AI/user messages, tool calls, thinking |
| Settings | `src/components/settings/` | General, editor, git, AI commands, CCS account |

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
- Design system: `docs/design-system.md`
- Plans: `plans/` — active implementation plans with phase files
- Supervisor: `..` — cross-review system


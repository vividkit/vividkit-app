# VividKit Desktop

GUI companion that makes **Claude Code CLI + CCS** accessible to everyone — developers who dislike the terminal and non-developers alike.

**Tagline:** *Full Claude Code power without the terminal.*

## What It Does

VividKit wraps [Claude Code](https://claude.ai/code) and [CCS (Claude Code Switcher)](https://github.com/kaitranntt/ccs) in a polished desktop UI. Users get full Claude Code power without typing a single CLI command.

- **Pick your AI provider** — CCS profiles (Claude, Gemini, GLM, Kimi, Codex, etc.) via dropdown
- **Manage projects** — visual project cards, no path wrangling
- **AI Brainstorm** — ideation sessions with AI, results saved locally
- **Task board** — Kanban for solo devs, synced with project context
- **Cook terminal** — PTY terminal running `ccs [profile]` under the hood, with git worktree support
- **JSONL Stream View** — structured rendering of AI sessions (thinking blocks, tool calls, responses)

Everything runs locally. No cloud sync. No telemetry. API keys stay on your machine.

## Architecture

```
User clicks UI
  -> Zustand action -> invoke() [Tauri IPC]
  -> Rust backend spawns PTY process: ccs [profile] [args]
  -> JSONL session log parsed + streamed to frontend
  -> StreamView renders structured output (or xterm.js for raw terminal)
```

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, TypeScript, Tailwind v4, shadcn/ui, Zustand |
| Desktop | Tauri v2, Rust |
| Terminal | xterm.js + PTY (via Tauri shell plugin) |
| Stream | JSONL session parser, StreamView components |
| Storage | SQLite via rusqlite |
| I18n | react-i18next (vi default, en secondary) |
| CLI | CCS v7+ (`ccs [profile]`), Claude Code |

## Prerequisites

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/) 20+
- [Rust](https://rustup.rs/) (stable)
- [Tauri v2 prerequisites](https://v2.tauri.app/start/prerequisites/)
- [CCS CLI](https://github.com/kaitranntt/ccs) — `npm install -g @kaitranntt/ccs`
- [Claude Code CLI](https://claude.ai/code) — for underlying AI sessions

## Development

```bash
npm install
npm run tauri dev
npm run tauri build
```

## Project Structure

```
src/
  components/{module}/   # UI components per module
  stores/                # Zustand stores (one per domain)
  hooks/                 # Custom hooks (one per concern)
  lib/tauri.ts           # invoke() wrappers with typed args/returns
  locales/{vi,en}/       # i18n JSON (vi default, en secondary)
  types/                 # Shared TypeScript interfaces

src-tauri/src/
  commands/{module}.rs   # Tauri command handlers
  models/{entity}.rs     # Serde structs for IPC and DB
  lib.rs                 # Plugin registration, invoke_handler
```

## MVP Modules

| Module | Directory | Purpose |
|--------|-----------|---------|
| Onboarding | `src/components/onboarding/` | 4-step wizard: Welcome, Git, AI Tools, Project |
| Project Deck | `src/components/decks/` | Project cards, deck management |
| Brainstorm | `src/components/brainstorm/` | AI ideation, insights, report generation |
| Tasks | `src/components/tasks/` | Kanban board (Backlog/Todo/In Progress/Done) |
| Cook + Worktree | `src/components/cook/` | Terminal, git worktree lifecycle |

## Docs

- [Product Overview (PDR)](docs/project-overview-pdr.md)
- [System Architecture](docs/system-architecture.md)
- [Code Standards](docs/code-standards.md)
- [Design System](docs/design-system.md)
- [Development Roadmap](docs/development-roadmap.md)
- [Codebase Summary](docs/codebase-summary.md)

## License

Private — not open source.

# VividKit Desktop

GUI companion that makes **Claude Code CLI + CCS** accessible to everyone — developers who dislike the terminal and non-developers alike.

## What It Does

VividKit wraps [Claude Code](https://claude.ai/code) and [CCS (Claude Code Switcher)](https://github.com/kaitranntt/ccs) in a polished desktop UI. Users get full Claude Code power without typing a single CLI command.

- **Pick your AI provider** — CCS profiles (Claude, Gemini, GLM, Kimi, Codex, etc.) via dropdown
- **Manage projects** — visual project cards, no path wrangling
- **AI Brainstorm** — ideation sessions with AI, results saved locally
- **Task board** — Kanban for solo devs, synced with project context
- **Cook terminal** — PTY xterm.js terminal running `ccs [profile]` under the hood, with git worktree support

Everything runs locally. No cloud sync. API keys stay on your machine.

## Architecture

```
User clicks UI
  → Zustand action → invoke() [Tauri IPC]
  → Rust backend spawns PTY process: ccs [profile] [args]
  → xterm.js streams output back to user
```

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, TypeScript, Tailwind v4, shadcn/ui, Zustand |
| Desktop | Tauri v2, Rust |
| Terminal | xterm.js + PTY (via Tauri shell plugin) |
| Storage | SQLite via rusqlite |
| CLI | CCS v7+ (`ccs [profile]`), Claude Code |

## Prerequisites

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
  locales/               # i18n (en, vi)
  types/                 # Shared TypeScript interfaces

src-tauri/src/
  commands/{module}.rs   # Tauri command handlers
  models/{entity}.rs     # Serde structs for IPC and DB
  lib.rs                 # Plugin registration, invoke_handler
```

## Docs

- [System Architecture](docs/system-architecture.md)
- [Code Standards](docs/code-standards.md)
- [Development Roadmap](docs/development-roadmap.md)

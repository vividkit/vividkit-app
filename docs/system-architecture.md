# System Architecture — VividKit Desktop

## Overview

VividKit Desktop is a GUI companion that wraps **Claude Code CLI + CCS** for users who want full AI coding power without touching a terminal. All AI sessions run as PTY processes (`ccs [profile]`) spawned by the Rust backend, streamed to the UI via xterm.js.

Local-first: all data on device, no cloud sync, API keys never leave the machine.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                  React Frontend                      │
│  Component → Custom Hook → Zustand Store → invoke() │
│  xterm.js renders PTY output stream                  │
└────────────────────┬────────────────────────────────┘
                     │ Tauri IPC (invoke / events)
┌────────────────────▼────────────────────────────────┐
│                  Rust Backend                        │
│  commands/ai.rs      → spawns PTY: ccs [profile]    │
│  commands/git.rs     → git2 → Local Git Repos       │
│  commands/fs.rs      → std::fs → Local Filesystem   │
│  commands/worktree.rs → git2 → Git Worktrees        │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│                Local Storage                         │
│  rusqlite (SQLite) — projects, tasks, config         │
│  Filesystem — source code, worktrees                 │
└─────────────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│            External CLI (user-installed)             │
│  ccs [profile]  — Claude Code Switcher               │
│  claude         — Claude Code CLI                    │
└─────────────────────────────────────────────────────┘
```

## Key Flow: AI Session

```
User selects CCS profile in UI (e.g. "Gemini")
  → Zustand action → invoke("ai_session_start", { profile, project_path })
  → commands/ai.rs spawns PTY: `ccs gemini` in project_path
  → PTY stdout streamed back via Tauri events
  → xterm.js renders output in real-time
  → on session end / component unmount: PTY killed, terminal disposed
```

## Key Flow: Git Worktree

```
CookView component
  → useWorktree hook
  → invoke("worktree_create", { project_path, branch })
  → commands/worktree.rs (git2)
  → returns worktree path
  → new xterm.js terminal spawned in worktree directory with `ccs [profile]`
  → on unmount: invoke("worktree_cleanup", { path })
```

## Module Boundaries

| Module | Owns | Reads |
|--------|------|-------|
| Onboarding | CCS profile config, project creation | — |
| Project Deck | Project list, selection state | projects DB table |
| Brainstorm | Ideas, AI sessions | project context |
| Tasks | Task CRUD, Kanban state | project context |
| Cook | PTY terminal sessions, file tree | project path, worktrees |

## Key Technology Choices

| Decision | Rationale |
|----------|-----------|
| CCS CLI as AI layer | Supports 10+ providers (Claude, Gemini, GLM, Kimi…) via one interface |
| PTY in Rust | Full terminal emulation — ccs works exactly as in a real terminal |
| Tauri v2 over Electron | Smaller bundle, native Rust backend, better security |
| rusqlite bundled | No external DB setup, local-first |
| Zustand over Redux | Minimal boilerplate for small-medium app |
| Tailwind v4 + shadcn/ui | Utility-first with accessible primitives |

## Security Model

- CCS profile configs read from `~/.ccs/*.settings.json` — managed by CCS, not VividKit
- No API keys stored in VividKit's own DB — delegated entirely to CCS
- Tauri capabilities restrict which APIs the renderer can access
- File system access limited to user-selected project directories
- No telemetry, no cloud sync, fully offline capable

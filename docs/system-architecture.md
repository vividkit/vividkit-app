# System Architecture — VividKit Desktop

## Overview

VividKit Desktop is a local-first Tauri v2 desktop application. All data stays on the user's machine. AI calls go through the Rust backend to keep API keys off the frontend.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                  React Frontend                      │
│  Component → Custom Hook → Zustand Store → invoke() │
└────────────────────┬────────────────────────────────┘
                     │ Tauri IPC (invoke / events)
┌────────────────────▼────────────────────────────────┐
│                  Rust Backend                        │
│  commands/ai.rs   → HTTP → AI Provider API          │
│  commands/git.rs  → git2 → Local Git Repos          │
│  commands/fs.rs   → std::fs → Local Filesystem      │
│  commands/worktree.rs → git2 → Git Worktrees        │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│                Local Storage                         │
│  rusqlite (SQLite) — projects, tasks, config         │
│  Filesystem — source code, worktrees                 │
└─────────────────────────────────────────────────────┘
```

## Data Flow

### AI Request Flow
```
React component
  → useAI hook (formats request)
  → invoke("ai_complete", { prompt, provider })
  → commands/ai.rs (validates, calls HTTP)
  → AI Provider API
  → streams response back via Tauri events
  → useAI hook updates Zustand store
  → component re-renders
```

### Git Worktree Flow
```
CookView component
  → useWorktree hook
  → invoke("worktree_create", { project_path, branch })
  → commands/worktree.rs (git2)
  → Local git repo
  → returns worktree path
  → xterm.js terminal spawned in worktree directory
  → on unmount: invoke("worktree_cleanup", { path })
```

## Module Boundaries

| Module | Owns | Reads |
|--------|------|-------|
| Onboarding | API config, project creation | — |
| Project Deck | Project list, selection state | projects DB table |
| Brainstorm | Ideas, AI sessions | project context |
| Tasks | Task CRUD, Kanban state | project context |
| Cook | Terminal sessions, file tree | project path, worktrees |

## Key Technology Choices

| Decision | Rationale |
|----------|-----------|
| Tauri v2 over Electron | Smaller bundle, native Rust backend, better security |
| Rust for AI HTTP | API keys never exposed to renderer process |
| rusqlite bundled | No external DB setup, local-first |
| Zustand over Redux | Minimal boilerplate for small-medium app |
| Tailwind v4 + shadcn/ui | Utility-first with accessible primitives |

## Security Model

- API keys stored in rusqlite (encrypted at rest — planned: OS keychain)
- Tauri capabilities restrict which APIs the renderer can access
- File system access limited to user-selected project directories
- No telemetry, no cloud sync, fully offline capable

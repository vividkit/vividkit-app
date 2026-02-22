---
title: "VividKit Desktop — Project Setup"
description: "Init Tauri+React project, supervisor cross-review system, CLAUDE.md progressive disclosure architecture"
status: pending
priority: P1
effort: 6h
branch: main
tags: [tauri, react, setup, devops, claude-md]
created: 2026-02-22
---

# VividKit Desktop — Project Setup

## Overview

Bootstrap VividKit Desktop app: Tauri v2 + React-TS + Tailwind v4 + shadcn/ui. Setup cross-project mentor review system. Write CLAUDE.md with progressive disclosure (Level 1).

## Architecture Constraints

- AI HTTP calls: Rust backend only (never fetch from React)
- React flow: Component -> Hook -> Zustand Store -> invoke()
- xterm.js: dispose on unmount, lazy mount, buffer streaming
- Rust commands: Result<T, String> pattern, no .unwrap()
- File size limit: 200 lines max

## Phases

| # | Phase | Effort | Status |
|---|-------|--------|--------|
| 1 | [Tauri+React Init](./phase-01-tauri-react-init.md) | 1.5h | pending |
| 2 | [Project Structure](./phase-02-project-structure.md) | 1h | pending |
| 3 | [Rust Backend Scaffold](./phase-03-rust-backend-scaffold.md) | 1h | pending |
| 4 | [Supervisor Setup](./phase-04-supervisor-setup.md) | 1.5h | pending |
| 5 | [CLAUDE.md & Skills](./phase-05-claude-md-and-skills.md) | 1h | pending |

## Dependencies

- Phase 1 must complete before 2, 3
- Phase 2, 3 can run in parallel
- Phase 4 independent (separate project)
- Phase 5 depends on 1-3 completion (needs final structure)

## Key Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind v4, shadcn/ui, Zustand
- **Desktop:** Tauri v2, Rust
- **Libs:** xterm.js, Monaco Editor, dnd-kit, react-markdown
- **Rust crates:** git2, rusqlite (bundled), tokio, notify, serde, tauri-plugin-{shell,dialog,fs}

## Success Criteria

- `npm run tauri dev` launches app without errors
- All folder structure matches MVP spec
- Supervisor project functional with mentor commands
- CLAUDE.md enables correct skill activation

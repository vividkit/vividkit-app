# Brainstorm: MVP Completion Strategy

## Problem Statement
VividKit Desktop has ~80% UI prototype with mock data. Need backend integration for production-ready MVP.
Only real backend: CCS PTY spawning (ai.rs). All other operations (DB, git, worktree, fs) are stubs.

## Current State
- **Working:** CCS PTY spawn/stream/stop, xterm.js integration, UI components for all modules
- **Missing:** SQLite persistence, git2 operations, worktree CRUD, real data flow through stores

## Evaluated Approaches

### A. Monolithic plan (all at once)
- Pros: Single context, holistic view
- Cons: Context overflow, hard to track, too many files touched simultaneously
- **Rejected**

### B. Sequential milestones (chosen)
- Pros: Clear dependencies, manageable scope, incremental value
- Cons: Slower overall, need to plan each milestone
- **Selected** — each milestone ~4-6 phases, fits context window

## MVP Milestones

### M1 — Data Foundation (Critical Path)
SQLite schema + migrations. Rust CRUD commands for all 8 models. Stores refactored to use IPC.
- **Why first:** Everything depends on persistence. No other feature works without DB.
- **Scope:** ~20 Rust files + 7 store refactors + schema

### M2 — Core Workflows (Brainstorm → Plan → Task)
Wire CCS PTY into brainstorm/cook terminals. Plan generation + phase tracking. Task auto-gen.
- **Depends on:** M1 (needs DB to persist sessions, plans, tasks)
- **Scope:** ~15 files

### M3 — Git & Worktree Integration
git2 crate: status, commit, diff, worktree create/list/merge/cleanup.
- **Depends on:** M1 (worktree records in DB), partially M2 (cook flow)
- **Scope:** ~10 files

### M4 — Onboarding + Settings + Polish
First-run wizard, CCS detect, settings persistence, error boundaries, empty states, toasts.
- **Depends on:** M1-M3 functional
- **Scope:** ~10 files + QA

## Decisions
- **Git strategy:** git2 crate (pure Rust, cross-platform)
- **DB:** rusqlite with versioned migrations
- **Plan approach:** One detailed plan per milestone, sequential execution

## Risks
| Risk | Mitigation |
|------|------------|
| git2 complexity | Start simple (status/commit), worktree later |
| Schema changes mid-dev | Version migrations from day 1 |
| Context overflow | Max 6 phases per milestone plan |

## Next Steps
1. Sync development-roadmap.md to milestone structure
2. Create detailed plan for Milestone 1 — Data Foundation
3. Execute M1, then plan M2

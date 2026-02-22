---
phase: 05
title: "CLAUDE.md & Skills"
status: pending
effort: 1h
depends_on: [phase-01, phase-02, phase-03]
---

# Phase 05: CLAUDE.md & Skills

## Context Links

- [Plan Overview](./plan.md)
- [Phase 02 - Structure](./phase-02-project-structure.md)
- [Phase 04 - Supervisor](./phase-04-supervisor-setup.md)

## Overview

- **Priority:** P1
- **Status:** pending
- Write CLAUDE.md (~120 lines) with progressive disclosure Level 1, verify skill activation

## Key Insights

- CLAUDE.md is the entry point for AI agents working on this project
- Progressive disclosure Level 1: overview + critical rules + module map
- Stack declaration triggers automatic skill activation
- Must reference supervisor workflow for cross-review

## Requirements

### Functional

- CLAUDE.md at project root (~120 lines)
- Project overview + MVP scope
- Stack declaration for skill auto-activation
- Critical rules section
- Module map (5 modules)
- Supervisor workflow reference

### Non-functional

- Concise, scannable by AI agents
- Under 120 lines
- No redundancy with global CLAUDE.md rules

## Architecture

CLAUDE.md structure:
1. Project Overview (10 lines)
2. Stack (5 lines)
3. Critical Rules (25 lines)
4. Module Map (20 lines)
5. React Patterns (15 lines)
6. Rust Patterns (15 lines)
7. Skills to Activate (10 lines)
8. Supervisor Workflow (10 lines)
9. File References (10 lines)

## Related Code Files

### Files to Create

- `/Users/thieunv/projects/solo-builder/vividkit-app/CLAUDE.md`

### Files to Reference

- `docs/system-architecture.md` (create if missing)
- `docs/code-standards.md` (create if missing)

## Implementation Steps

1. **Write CLAUDE.md** with these sections:

   **Project Overview:**
   - VividKit Desktop: AI-powered solo dev companion
   - Tauri v2 + React-TS + Tailwind v4 + shadcn/ui
   - MVP scope: 5 modules (onboarding, project-deck, brainstorm, tasks, cook+worktree)

   **Stack Declaration:**
   ```
   Stack: Tauri v2, React 18, TypeScript, Tailwind v4, shadcn/ui, Zustand, Rust
   Libraries: xterm.js, Monaco Editor, dnd-kit, react-markdown, git2, rusqlite
   ```

   **Critical Rules:**
   - File max 200 lines — split into smaller modules
   - No mock data/fake implementations in any context
   - AI HTTP calls: Rust ONLY via commands/ai.rs (never fetch from React)
   - React pattern: Component -> Custom Hook -> Zustand action -> invoke()
   - xterm.js rules: dispose terminal on unmount, lazy mount when tab hidden, buffer streaming output
   - git2 Rust: never .unwrap() in #[tauri::command], always Result<T, String>
   - Tauri IPC: invoke() args must type-match #[tauri::command] params exactly

   **Module Map:**
   | Module | Directory | Purpose |
   |--------|-----------|---------|
   | Onboarding | src/components/onboarding/ | Welcome, API key, project creation |
   | Project Deck | src/components/project/ | Project cards, selection |
   | Brainstorm | src/components/brainstorm/ | Idea generation, AI-assisted |
   | Tasks | src/components/tasks/ | Kanban board, task management |
   | Cook + Worktree | src/components/cook/ | Terminal, file explorer, git worktrees |

   **React Patterns:**
   - State: Zustand stores in src/stores/
   - Tauri calls: wrapper functions in src/lib/tauri.ts
   - Components: functional, no class components
   - Hooks: extract logic > 10 lines into custom hooks

   **Rust Patterns:**
   - Commands: src-tauri/src/commands/{module}.rs
   - Models: src-tauri/src/models/{entity}.rs
   - Error handling: map_err() to String for IPC
   - Async: use tokio for I/O operations

   **Skills to Activate:**
   - tauri-v2-desktop
   - rusqlite-sqlite
   - react-best-practices
   - frontend-development
   - tailwind-v4-styling

   **Supervisor Workflow:**
   - After completing a plan phase, run `/submit-to-mentor`
   - Report goes to ../vividkit-supervisor/inbox/pending/
   - Mentor reviews, asks questions, produces verdict
   - See ../vividkit-supervisor/docs/mentor-protocol.md

2. **Create stub docs if missing**
   - `docs/code-standards.md` — minimal, reference CLAUDE.md
   - `docs/system-architecture.md` — high-level Tauri architecture diagram

3. **Verify skill activation**
   - Ensure skill names match available skills in `~/.claude/skills/`
   - Test that CLAUDE.md is read on session start

## Todo List

- [ ] Write CLAUDE.md (~120 lines)
- [ ] Create docs/code-standards.md if missing
- [ ] Create docs/system-architecture.md if missing
- [ ] Verify skill names match available skills
- [ ] Review CLAUDE.md for redundancy with global rules

## Success Criteria

- CLAUDE.md exists at project root, under 120 lines
- All 5 modules listed in module map
- Critical rules cover: file size, no mocks, AI-in-Rust, React pattern, xterm.js, git2
- Skills section lists valid skill names
- Supervisor workflow reference present

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| CLAUDE.md too long | Strict 120-line budget, link to docs/ for details |
| Skills not found | Verify against ~/.claude/skills/ listing |
| Conflicting rules with global CLAUDE.md | Review global rules, avoid duplication |

## Security Considerations

- CLAUDE.md must NOT contain API keys or secrets
- Reference secure patterns (keychain, encrypted storage) for API key handling

## Next Steps

- Level 2 progressive disclosure: detailed per-module docs (future phases)
- Update CLAUDE.md as modules are implemented

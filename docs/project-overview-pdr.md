# VividKit Desktop — Product Development Requirements

## Product Vision

**VividKit Desktop** is a GUI companion that makes **Claude Code CLI + CCS (Claude Code Switcher)** accessible to everyone—developers who dislike the terminal and non-technical users alike.

VividKit wraps CCS in a polished desktop UI, enabling users to leverage 10+ AI providers (Claude, Gemini, GLM, Kimi, Codex, etc.) without touching a single CLI command. Core mechanic: Rust spawns CCS process, watches JSONL session logs, and streams structured output to the frontend via StreamView components.

**Tagline:** *Full Claude Code power without the terminal.*

---

## Target Users

1. **Non-technical team members** — Want to contribute code decisions/ideas but can't navigate CLI
2. **CLI-averse developers** — Prefer GUI for project organization and AI assistance
3. **Solo developers** — Need lightweight project management + AI brainstorming workflow
4. **AI-first workflows** — Developers treating AI (not just code) as primary collaboration tool

---

## Key Value Propositions

| Prop | Rationale |
|------|-----------|
| **Zero terminal required** | Click buttons, use dropdowns; CCS runs invisibly in background |
| **10+ AI providers** | One UI, any CCS profile — switch mid-session |
| **Project-centric** | Organize work by project, deck (organizational unit), task, worktree |
| **AI ideation built-in** | Brainstorm feature runs CCS, saves insights, generates plans |
| **Local-first** | No cloud, no sync, no telemetry; offline capable |
| **Cost transparent** | See which provider, which profile; CCS handles rate limits |

---

## MVP Feature Set (5 Modules)

### 1. Onboarding
- 4-step wizard: Welcome → Git Setup → AI Tools Detection → Project Creation
- Runs `ccs detect` to find installed profiles
- Creates first project in local git repo
- Saves CCS account list to local DB

### 2. Project Deck
- Visual project card list
- Quick project switcher (top-left sidebar)
- Create new project (local git + clone from URL)
- Deck concept: organizational unit linking project → sessions/plans/tasks

### 3. Brainstorm
- Text input → CCS session via JSONL streaming
- Captures AI response via StreamView, saves as insight/report
- Key insights dialog (list, continue session, delete)
- Plan generation from brainstorm output

### 4. Tasks
- Kanban board (Backlog → Todo → In Progress → Done)
- List view with search/filter
- Task CRUD (create, update status, priority, delete)
- Cook integration: spawn CCS session with StreamView for each task

### 5. Cook + Worktree
- CCS session with StreamView (structured JSONL rendering)
- Git worktree support (create, list, merge, cleanup)
- Changed files summary on completion
- Merge strategies: merge, squash, rebase

---

## Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Offline** | Works without internet (CCS must be installed locally) |
| **Local-first** | All data on device; no cloud dependencies |
| **Cross-platform** | macOS, Windows, Linux (via Tauri v2) |
| **Performance** | App launches in <2s; JSONL stream renders smoothly |
| **Storage** | SQLite (bundled, no setup required) |
| **I18n ready** | Structure for en + vi (expandable) |
| **Single-user** | No multi-user auth; no concurrent session management |

---

## External Dependencies

| Dependency | Role | Installer |
|------------|------|-----------|
| **CCS CLI v7+** | AI provider switcher, session spawning | `npm install -g @kaitranntt/ccs` |
| **Claude Code CLI** | Underlying AI sessions (managed by CCS) | `npm install -g claude` |
| **Git** | Repo operations, worktrees | System package manager |
| **Node.js 20+** | Frontend build & runtime | https://nodejs.org/ |
| **Rust stable** | Backend build | https://rustup.rs/ |

---

## Out of Scope (MVP)

- Multi-user collaboration / team features
- Cloud sync / account creation
- Advanced Git workflows (cherry-pick, rebase -i)
- Custom provider integration (CCS only)
- API key management UI (delegated to CCS)
- Marketplace for AI plugins
- Mobile support

---

## Architecture Summary

```
React 18 + TypeScript + Tailwind v4 + shadcn/ui
           ↓
     Zustand stores
           ↓
   Tauri IPC (invoke)
           ↓
    Rust backend (tokio)
           ↓
   spawn CCS: ccs [profile]
           ↓
    JSONL session log watched + streamed
           ↓
    StreamView renders structured output
```

---

## Success Metrics (MVP)

1. **Usability:** New user onboards and runs first CCS session in <5 min
2. **Reliability:** JSONL stream renders without lag; CCS process kills cleanly
3. **Coverage:** 13 routes implemented; all module features functioning
4. **Cross-platform:** App builds and runs on macOS, Windows, Linux

---

## Known Constraints

- Depends on external CCS CLI being installed and configured
- JSONL session log path varies by OS; Rust handles cross-platform resolution
- SQLite bundled with rusqlite (no external DB server)
- Zustand for state (not Redux) to keep bundle small

---

## Roadmap Phases

| Phase | Focus | Duration |
|-------|-------|----------|
| 1 | Foundation (routing, stores, CCS detection) | 1 sprint |
| 2 | Onboarding | 0.5 sprint |
| 3 | Dashboard & Decks | 0.5 sprint |
| 4 | Brainstorm | 1 sprint |
| 5 | Plans | 0.5 sprint |
| 6 | Tasks | 0.5 sprint |
| 7 | Worktrees | 0.5 sprint |
| 8 | Settings | 0.5 sprint |
| 9 | Polish & Release | 1 sprint |

---

## Technical Highlights

- **JSONL streaming:** Structured session rendering via StreamView (thinking, tool calls, responses)
- **Cross-platform paths:** `PathBuf` always, never `/` or `\`
- **i18n structure:** Ready for locales beyond en/vi
- **Error boundaries:** Graceful degradation when CCS unavailable
- **Stale process cleanup:** Process registry prevents zombie children

---

## Acceptance Criteria

✓ All 5 modules implemented with full feature sets
✓ Onboarding → Brainstorm → Cook workflow executes end-to-end
✓ No hardcoded paths; all cross-platform validated
✓ CCS JSONL output renders correctly in StreamView
✓ Process stop command kills child within 100ms
✓ App bundle <50MB (Tauri v2 typical)
✓ Build passes on macOS, Windows, Linux CI
✓ No console errors or warnings on production build

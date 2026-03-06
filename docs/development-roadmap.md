# Development Roadmap — VividKit Desktop

## Product Vision

GUI companion that makes **Claude Code CLI + CCS** accessible to everyone.
Core mechanic: Rust spawns PTY `ccs [profile]`, streamed via xterm.js. UI hides CLI complexity.

---

## MVP Scope

5 modules across 13 routes. Single-user, local-first, offline-capable.

### Routes

| Route | Module | Status |
|-------|--------|--------|
| `/onboarding` | Onboarding | ⬜ Planned |
| `/` | Dashboard | ⬜ Planned |
| `/decks` | Project Deck | ⬜ Planned |
| `/brainstorm` | Brainstorm | ⬜ Planned |
| `/brainstorm/:id` | Brainstorm Report | ⬜ Planned |
| `/generate-plan` | Generate Plan | ⬜ Planned |
| `/plans` | Plans | ⬜ Planned |
| `/plans/:id` | Plan Review | ⬜ Planned |
| `/tasks` | Tasks | ⬜ Planned |
| `/cook/:taskId` | Cook Standalone | ⬜ Planned |
| `/worktrees` | Worktrees | ⬜ Planned |
| `/settings` | Settings | ⬜ Planned |
| `/new-project` | New Project | ⬜ Planned |

---

## Data Models

| Model | Key Fields |
|-------|-----------|
| `Project` | id, name, gitPath, ccsConnected, ccsAccounts[] |
| `CcsAccount` | provider, email, status (active/paused/exhausted) |
| `Deck` | id, projectId, name, isActive |
| `KeyInsight` | id, projectId, deckId, title, reportPath |
| `Plan` | id, deckId, name, reportPath, planPath, phases[] |
| `Phase` | id, planId, name, description, filePath, order, done |
| `Task` | id, deckId, type, name, status, priority, planId?, phaseId?, worktreeName? |
| `Worktree` | id, projectId, taskId, branch, status, filesChanged, mergedAt? |
| `BrainstormSession` | id, deckId, prompt, reportPath, status |

**Enums:**
- Task status: `backlog → todo → in_progress → done`
- Task type: `generated` (from Plan phases) | `custom` (user-created)
- Task priority: `low | medium | high`
- Worktree status: `active → ready → merged`
- CCS account status: `active | paused | exhausted`

---

## Phase 1 — Foundation

**Goal:** App shell, routing, shared layout, SQLite schema, CCS detection.

- [ ] AppLayout: sidebar (collapsible) + header + outlet
- [ ] AppSidebar: project switcher, main nav, bottom nav, collapsed mode
- [ ] AppHeader: AI status indicator, theme toggle, notifications
- [ ] Routing: all 13 routes wired
- [ ] SQLite schema: all models migrated
- [ ] CCS detection: `ccs detect` → parse accounts, save to DB
- [x] i18n setup: `react-i18next` initialized with `vi` default + `en` secondary locale; resources split by domain under `src/locales/{vi,en}/*.json`
- [x] Zustand stores: project, deck, task, worktree, settings, brainstorm, plan, ui

---

## Phase 2 — Onboarding

**Goal:** First-run wizard. User exits with git repo + CCS detected + first project created.

- [ ] 4-step wizard UI (progress sidebar)
- [ ] Step 1: Welcome screen
- [ ] Step 2: Git setup — local repo picker (Browse) or clone from GitHub URL
- [ ] Step 3: AI Tools detection — `ccs detect` with spinner → accounts display
- [ ] Step 4: Project setup — name + description + summary
- [ ] Navigate to `/` on completion

---

## Phase 3 — Dashboard & Decks

**Goal:** Project overview + deck management.

- [ ] Dashboard: stats cards (tasks by status, worktree count)
- [ ] Dashboard: quick actions grid → all major routes
- [ ] Decks: deck list with active state toggle
- [ ] Decks: Create Deck dialog (name, description, based-on insight)
- [ ] New Project: `/new-project` form (git local/clone + name)

---

## Phase 4 — Brainstorm

**Goal:** AI ideation via CCS PTY terminal, save insights, generate plan.

- [ ] Brainstorm: deck context bar + key insights dialog
- [ ] Brainstorm: PTY terminal panel (idle → running → completed states)
- [ ] Brainstorm: input area (Enter triggers session)
- [ ] Brainstorm: post-completion actions (View Report, Create Plan, Save Insight)
- [ ] Report Preview Dialog: article layout, prose typography
- [ ] Brainstorm Report page (`/brainstorm/:id`): key insights grid + action items
- [ ] Key Insights Dialog: list, continue session, delete

---

## Phase 5 — Plans

**Goal:** Plan generation from brainstorm output, phase tracking, markdown preview.

- [ ] Generate Plan (`/generate-plan`): phase indicator + xterm.js terminal simulation
- [ ] Plans list (`/plans`): plan cards with phase progress bar
- [ ] Plan Review (`/plans/:id`): phases checklist + markdown preview toggle
- [ ] Plan Review: related tasks section (`?new=true` loading state)
- [ ] Cook Sheet (right panel): xterm.js terminal executing plan via `ccs [profile]`

---

## Phase 6 — Tasks

**Goal:** Task CRUD, list + kanban views, cook integration.

- [ ] Tasks: toolbar (view toggle, search, status filters, add task)
- [ ] Tasks: list view with status/priority badges + Cook button
- [ ] Tasks: kanban view (4 columns: Backlog, Todo, In Progress, Done)
- [ ] Add Task dialog: name, description, priority
- [ ] Cook Sheet (right panel): PTY terminal, changed files summary, Merge/Discard
- [ ] Cook standalone (`/cook/:taskId`): progress bar, status steps, preview changes dialog

---

## Phase 7 — Worktrees

**Goal:** Git worktree lifecycle management via UI.

- [ ] Worktrees: list grouped by status (Active, Ready to Merge, Merged)
- [ ] Worktrees: Active card actions (View Files, Pause, Stop)
- [ ] Merge Dialog: strategy selector (merge/squash/rebase) + options (run tests, delete after)
- [ ] Rust: `worktree_create`, `worktree_list`, `worktree_merge`, `worktree_cleanup` commands

---

## Phase 8 — Settings

**Goal:** App config — language, CCS provider mapping, git defaults, editor prefs.

- [ ] Settings: 4 tabs (General, AI & Commands, Git, Editor)
- [x] General: language selector (en/vi) wired to persisted settings and applied at runtime
- [ ] AI & Commands: CCS accounts list + command→provider mapping table
- [ ] Git: default branch + worktrees directory inputs
- [ ] Editor: theme, auto-save toggle, font size

---

## Phase 9 — Polish & Release

- [ ] Error boundaries on all routes
- [ ] Empty states for all list views
- [ ] Toast notifications system-wide
- [ ] Offline resilience (CCS not installed, git not configured)
- [ ] CCS not installed → install guide deep-link
- [ ] Cross-platform testing (macOS, Windows, Linux)
- [x] i18n parity sweep: stream fallback/status labels localized (`(empty command)`, `(empty output)`, `exit {code}`, `{n} matches`, waiting/result labels)
- [ ] App icon + metadata (Tauri `tauri.conf.json`)
- [ ] Build pipeline (GitHub Actions)

---

## Key User Journey

```
Onboarding → Dashboard → Decks (set active)
  → Brainstorm (AI session via ccs)
    → Generate Plan (ccs produces plan)
      → Plan Review (phases checklist)
        → Tasks (cook each phase via ccs)
          → Worktrees (merge when done)
```

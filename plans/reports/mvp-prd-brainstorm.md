# VividKit MVP — Comprehensive PRD (Brainstorm Report)

> **Date:** 2026-03-06  
> **Type:** Solution Brainstorm → PRD Proposal  
> **Status:** Awaiting Review

---

## 1. Problem Statement

**VividKit Desktop** is a GUI companion for **Claude Code CLI + CCS** (Claude Code Switcher) targeting non-technical users and CLI-averse developers. The app has undergone a critical architectural shift:

### Old Approach (xterm.js PTY Terminal)
- Raw terminal emulation via `xterm.js`
- Output streamed through PTY → Tauri events → `xterm.js` widget
- Users see raw CLI output — intimidating for non-tech users

### New Approach (JSONL Session Streaming)
- Claude Code CLI generates structured **JSONL session files**
- Rust backend watches these files via `watch_session_log` → emits `ccs_session_log_line` events
- Frontend parses JSONL entries via `jsonl-session-parser.ts` (600 LOC)
- Renders structured **StreamView**: thinking blocks, tool calls, text responses, usage stats
- Subagent files (`agent-*.jsonl`) parsed independently for multi-agent views

> [!IMPORTANT]
> **All screen specs referencing xterm.js / "Terminal Panel" must be redesigned** to use the `StreamView` component pattern. This is the single most impactful change to all original UI specs.

---

## 2. Target Users (Unchanged)

| Persona | Need |
|---------|------|
| **Non-technical team members** | Contribute ideas/decisions without touching CLI |
| **CLI-averse developers** | Prefer GUI for project organization + AI assistance |
| **Solo developers** | Lightweight AI-powered project management |
| **Multi-subscription holders** | Switch between CCS profiles (Claude, Gemini, GLM, etc.) easily |

---

## 3. Core Architecture (Current State)

```
┌─────────────────────────────────────────────────────┐
│                  React Frontend                      │
│  Component → Hook → Zustand Store → invoke()         │
│  StreamView + JSONL Parser render AI conversations   │
└────────────────────┬────────────────────────────────┘
                     │ Tauri IPC (invoke / events)
┌────────────────────▼────────────────────────────────┐
│                  Rust Backend                         │
│  ai.rs        → PTY spawn + JSONL file watcher       │
│  subagent.rs  → Subagent JSONL discovery + parsing   │
│  fs.rs        → File system operations               │
│  git.rs       → Git operations (git2)                │
│  worktree.rs  → Git worktree lifecycle               │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│  Local Storage: SQLite + Filesystem                  │
│  External CLI: ccs, claude (user-installed)          │
└─────────────────────────────────────────────────────┘
```

**Key technical assets already built:**
- ✅ PTY spawn/stop/stdin (707 LOC `ai.rs`)
- ✅ JSONL session parser (600 LOC `jsonl-session-parser.ts`)
- ✅ Session path utilities (`session-path-utils.ts`)
- ✅ Subagent resolver (`subagent.rs` — 188 LOC)
- ✅ StreamView components (`ccs-stream/`)
- ✅ CCS Test Console (working proof-of-concept)
- ✅ 65 UI component shells + 8 Zustand stores + 14 pages

---

## 4. MVP Scope — Revised Module Map

5 modules, 16 routes. Single-user, local-first, offline-capable.

### Route Table

| Route | Module | Priority | Notes |
|-------|--------|----------|-------|
| `/onboarding` | Onboarding | P0 | First-run wizard |
| `/` | Dashboard | P0 | Stats + quick actions |
| `/decks` | Project Deck | P0 | Project organization |
| `/brainstorm` | Brainstorm | P0 | **StreamView replaces Terminal Panel** |
| `/brainstorm/:id` | Brainstorm Report | P1 | Key insights + action items |
| `/generate-plan` | Generate Plan | P0 | **StreamView replaces xterm.js** |
| `/validate-plan/:id` | Validate Plan | P0 | **NEW — AI review + clarify questions** |
| `/red-team/:id` | Red-Team Scan | P1 | **NEW — Security vulnerability scan** |
| `/plans` | Plans | P1 | Plan cards with progress |
| `/plans/:id` | Plan Review | P1 | Phases + markdown preview |
| `/tasks` | Tasks | P0 | List + Kanban views |
| `/cook/:taskId` | Cook Standalone | P0 | **StreamView replaces Terminal** |
| `/worktrees` | Worktrees | P1 | Git worktree management |
| `/settings` | Settings | P0 | CCS profiles + config |
| `/new-project` | New Project | P1 | Project creation |

---

## 5. Screen-by-Screen Redesign (ASCII Mockups)

### 5.1 Onboarding (`/onboarding`)

> No terminal integration needed. Design unchanged.

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  ┌─────────┐  ┌──────────────────────────────────────┐   │
│  │ ● Step 1│  │                                      │   │
│  │ ○ Step 2│  │         🚀 Welcome to VividKit       │   │
│  │ ○ Step 3│  │                                      │   │
│  │ ○ Step 4│  │    Full Claude Code power without    │   │
│  │         │  │           the terminal.              │   │
│  │         │  │                                      │   │
│  │         │  │        [ Get Started →  ]            │   │
│  │         │  │                                      │   │
│  └─────────┘  └──────────────────────────────────────┘   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Step 2 — Git Setup:**
```
┌──────────────────────────────────────────────────────────┐
│  ┌─────────┐  ┌──────────────────────────────────────┐   │
│  │ ✓ Step 1│  │  Git Setup                           │   │
│  │ ● Step 2│  │                                      │   │
│  │ ○ Step 3│  │  ┌────────────────┐ ┌──────────────┐ │   │
│  │ ○ Step 4│  │  │ 📂 Open Local  │ │ 🔗 Clone URL │ │   │
│  │         │  │  │   Repository   │ │  from GitHub  │ │   │
│  │         │  │  └────────────────┘ └──────────────┘ │   │
│  │         │  │                                      │   │
│  │         │  │  Path: [/path/to/repo      ] [Browse]│   │
│  │         │  │                                      │   │
│  └─────────┘  │         [ ← Back ]  [ Continue → ]  │   │
│               └──────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

**Step 3 — AI Tools Detection:**
```
┌──────────────────────────────────────────────────────────┐
│  ┌─────────┐  ┌──────────────────────────────────────┐   │
│  │ ✓ Step 1│  │  AI Tools Detection                  │   │
│  │ ✓ Step 2│  │                                      │   │
│  │ ● Step 3│  │  Claude Code CLI                     │   │
│  │ ○ Step 4│  │  ┌──────────────────────────────────┐│   │
│  │         │  │  │ ✅ Detected — v1.2.3             ││   │
│  │         │  │  └──────────────────────────────────┘│   │
│  │         │  │                                      │   │
│  │         │  │  CCS Profiles                        │   │
│  │         │  │  ┌──────────────────────────────────┐│   │
│  │         │  │  │ 🟢 default  — claude@email.com  ││   │
│  │         │  │  │ 🟢 gemini   — user@gmail.com    ││   │
│  │         │  │  │ 🟡 glm      — (paused)          ││   │
│  │         │  │  │ 🔴 kimi     — (exhausted)       ││   │
│  │         │  │  └──────────────────────────────────┘│   │
│  └─────────┘  │                                      │   │
│               │         [ ← Back ]  [ Continue → ]   │   │
│               └──────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

---

### 5.2 Dashboard (`/`)

```
┌──────────────────────────────────────────────────────────────┐
│ ≡ VividKit                     CCS Ready  🌙  🔔  (U)         │
├────────┬─────────────────────────────────────────────────────┤
│        │  Dashboard                                          │
│ 📊 Home│  Active Deck: Feature-v2                            │
│        │                                                     │
│ 🧠 Idea│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐│
│        │  │ 🔥 Active │ │ 📋 Total │ │ ✅ Done  │ │🌳 Trees││
│ ✅ Task│  │     3     │ │    12    │ │     7    │ │    2   ││
│        │  └──────────┘ └──────────┘ └──────────┘ └────────┘│
│ 📝 Plan│                                                     │
│        │  Quick Actions                                      │
│ 📂 Deck│  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐ │
│        │  │ 🧠 Brainstorm│ │ ✅ Tasks    │ │ 🔥 Cook      │ │
│ 🌳 Tree│  │ Explore ideas│ │ Manage work │ │ Execute tasks│ │
│        │  │          →  │ │          →  │ │           →  │ │
│ ──────│  └─────────────┘ └─────────────┘ └──────────────┘ │
│ ⚙ Set │  ┌─────────────┐ ┌─────────────┐                   │
│ ? Help │  │ 📂 Decks    │ │ 🌳 Worktrees│                   │
│        │  │ Organize    │ │ Git branches│                   │
└────────┘  └─────────────┘ └─────────────┘                   │
           └───────────────────────────────────────────────────┘
```

---

### 5.3 Project & Deck Lifecycle — 🆕 NEW SECTION

> [!IMPORTANT]
> **Every feature in VividKit is scoped to an active Project + active Deck.** If no project exists on first launch, user MUST create one. All brainstorms, plans, tasks, and worktrees belong to the currently active deck within the active project.

#### 5.3.1 First Launch — No Project State

When the app launches for the first time (after onboarding) with no projects, user is redirected to create one.

```
┌──────────────────────────────────────────────────────────────┐
│ ≡ VividKit                     CCS Ready  🌙  🔔  (U)         │
├────────┬─────────────────────────────────────────────────────┤
│        │                                                     │
│ 📊 Home│                                                     │
│        │         ┌──────────────────────────────┐            │
│ (empty)│         │                              │            │
│        │         │    📂 No Projects Yet        │            │
│        │         │                              │            │
│        │         │    Create your first project │            │
│        │         │    to get started.           │            │
│        │         │                              │            │
│        │         │    [ + Create Project →  ]   │            │
│        │         │                              │            │
│        │         └──────────────────────────────┘            │
│        │                                                     │
│ ──────│                                                     │
│ ⚙ Set │                                                     │
│ ? Help │                                                     │
└────────┴─────────────────────────────────────────────────────┘
```

#### 5.3.2 Project Switcher (Sidebar — always visible)

The **Project Switcher** lives at the top of the sidebar. It shows the active project and allows switching or creating new ones. Clicking opens a dropdown.

```
┌────────────────────────────┐
│  ┌──────────────────────┐  │
│  │ 📂 Feature-v2      ▼ │  │  ← Active project
│  └──────────────────────┘  │
│                            │
│  ┌──────────────────────┐  │  ← Dropdown opens
│  │ ✓ Feature-v2         │  │     on click
│  │   Deck: Auth Flow    │  │     Shows active deck
│  │ ────────────────────  │  │
│  │   My Portfolio        │  │
│  │   Deck: Landing Page  │  │
│  │ ────────────────────  │  │
│  │   API Gateway         │  │
│  │   Deck: Rate Limiting │  │
│  │ ════════════════════  │  │
│  │ + New Project         │  │  ← Creates new project
│  └──────────────────────┘  │
│                            │
│  📊 Dashboard              │
│  🧠 Brainstorm             │
│  ✅ Tasks           (5)    │
│  📝 Plans                  │
│  📂 Decks                  │
│  🌳 Worktrees              │
│  ────────────────────────  │
│  ⚙ Settings               │
│  ? Help                    │
└────────────────────────────┘
```

**Switching behavior:**
- Click project → sets as active, loads its active deck
- All sidebar counts (tasks, etc.) refresh for new project context
- Dashboard, Brainstorm, Tasks all re-scope to new project/deck
- If switched project has no decks → redirect to `/decks` to create one

#### 5.3.3 Decks Page (`/decks`) — Manage & Switch Decks

```
┌──────────────────────────────────────────────────────────────┐
│ ≡ VividKit                     CCS Ready  🌙  🔔  (U)         │
├────────┬─────────────────────────────────────────────────────┤
│        │  Decks                                              │
│ Sidebar│  Project: Feature-v2              [ + Create Deck ] │
│        │                                                     │
│        │  ┌───────────────────────────────────────────────┐   │
│        │  │ 🟠 Auth Flow                    ✅ Active     │   │
│        │  │    Authentication and user management flow    │   │
│        │  │    📋 Tasks: 5  •  🧠 Sessions: 3             │   │
│        │  │    [ 🧠 Brainstorm ]  [ ✅ Tasks ]            │   │
│        │  └───────────────────────────────────────────────┘   │
│        │                                                     │
│        │  ┌───────────────────────────────────────────────┐   │
│        │  │ ⚪ Payment Integration           Inactive     │   │
│        │  │    Stripe integration + invoicing             │   │
│        │  │    📋 Tasks: 8  •  🧠 Sessions: 1             │   │
│        │  │    [ Set Active ]                             │   │
│        │  └───────────────────────────────────────────────┘   │
│        │                                                     │
│        │  ┌───────────────────────────────────────────────┐   │
│        │  │ ⚪ API Gateway                    Inactive     │   │
│        │  │    Rate limiting + API key management        │   │
│        │  │    📋 Tasks: 0  •  🧠 Sessions: 0             │   │
│        │  │    [ Set Active ]                             │   │
│        │  └───────────────────────────────────────────────┘   │
│        │                                                     │
└────────┴─────────────────────────────────────────────────────┘
```

**Interactions:**
- Click **[ Set Active ]** → sets deck as active, 🟠 dot moves
- Click **[ 🧠 Brainstorm ]** → navigates to `/brainstorm` with that deck active
- Click **[ ✅ Tasks ]** → navigates to `/tasks` filtered by that deck
- Only **one deck active** per project at a time
- Active deck shown in Dashboard header + Brainstorm context bar

#### 5.3.4 Create Deck Dialog

```
┌────────────────────────────────────────────┐
│  Create New Deck                        ✕  │
├────────────────────────────────────────────┤
│                                            │
│  Deck Name *                               │
│  ┌──────────────────────────────────────┐  │
│  │ Payment Integration                  │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  Description                               │
│  ┌──────────────────────────────────────┐  │
│  │ Stripe integration, invoicing,       │  │
│  │ and payment webhook handling         │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  Based on Key Insight (optional)           │
│  ┌──────────────────────────────────────┐  │
│  │ Select an insight...              ▼  │  │
│  └──────────────────────────────────────┘  │
│  Imports context from a brainstorm insight │
│                                            │
│  ☐ Set as active deck                      │
│                                            │
│  [ Cancel ]              [ Create Deck ]   │
│                                            │
└────────────────────────────────────────────┘
```

#### 5.3.5 New Project Page (`/new-project`)

```
┌──────────────────────────────────────────────────────────────┐
│ ← Back to Dashboard          New Project                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─ Project Info ────────────────────────────────────────┐   │
│  │                                                       │   │
│  │  Project Name *                                       │   │
│  │  ┌─────────────────────────────────────────────────┐  │   │
│  │  │ My Awesome Project                              │  │   │
│  │  └─────────────────────────────────────────────────┘  │   │
│  │                                                       │   │
│  │  Description                                          │   │
│  │  ┌─────────────────────────────────────────────────┐  │   │
│  │  │ A notification microservice with WebSocket      │  │   │
│  │  │ real-time push                                  │  │   │
│  │  └─────────────────────────────────────────────────┘  │   │
│  │                                                       │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─ Git Repository ─────────────────────────────────────┐   │
│  │                                                       │   │
│  │  ┌────────────────┐ ┌──────────────┐                  │   │
│  │  │ 📂 Open Local  │ │ 🔗 Clone URL │                  │   │
│  │  │   Repository   │ │  from GitHub  │                  │   │
│  │  └────────────────┘ └──────────────┘                  │   │
│  │                                                       │   │
│  │  Path: [/Users/me/projects/awesome  ] [Browse]        │   │
│  │                                                       │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
│  [ Cancel ]                      [ Create Project ]          │
│                     (disabled until name + path filled)      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**After creation:**
- Project is set as active
- Auto-creates a default deck (e.g., "Main")
- Redirects to `/decks` so user can customize or to `/` (Dashboard)

#### 5.3.6 Project/Deck Switching — Complete Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  App Launch                                                 │
│       │                                                     │
│       ▼                                                     │
│  Has projects? ──No──→ /new-project → Create → /decks      │
│       │                                                     │
│      Yes                                                    │
│       │                                                     │
│       ▼                                                     │
│  Load last active project + deck                            │
│       │                                                     │
│       ▼                                                     │
│  Dashboard (/)                                              │
│       │                                                     │
│  ┌────┴─────────────────────────────────────────────┐       │
│  │                                                   │       │
│  │  Sidebar Project Switcher                         │       │
│  │  ┌─────────────────────────────────────────┐      │       │
│  │  │ Switch Project                          │      │       │
│  │  │  → Loads project's active deck          │      │       │
│  │  │  → Refreshes all data contexts          │      │       │
│  │  │  → If no decks → redirect to /decks     │      │       │
│  │  │                                         │      │       │
│  │  │ + New Project                           │      │       │
│  │  │  → /new-project → create → switch       │      │       │
│  │  └─────────────────────────────────────────┘      │       │
│  │                                                   │       │
│  │  /decks Page                                      │       │
│  │  ┌─────────────────────────────────────────┐      │       │
│  │  │ Switch Deck (within same project)       │      │       │
│  │  │  → Click "Set Active" on another deck   │      │       │
│  │  │  → Dashboard/Brainstorm/Tasks re-scope  │      │       │
│  │  │                                         │      │       │
│  │  │ + Create Deck                           │      │       │
│  │  │  → Dialog → name + description          │      │       │
│  │  │  → Optionally set as active             │      │       │
│  │  └─────────────────────────────────────────┘      │       │
│  │                                                   │       │
│  └───────────────────────────────────────────────────┘       │
│                                                             │
│  All AI screens (Brainstorm, Cook, Generate Plan) operate   │
│  within the context of: Active Project → Active Deck        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Data invariants:**
- App always has ≥1 project after onboarding
- Each project always has ≥1 deck (auto-created "Main" on project creation)
- Exactly 1 project is active at a time (stored in app state)
- Exactly 1 deck is active per project (stored in DB per project)
- Switching project automatically loads that project's active deck

---

### 5.4 Brainstorm (`/brainstorm`) — ⚠️ MAJOR REDESIGN

**Old:** xterm.js terminal panel with raw CLI output  
**New:** StreamView with structured AI conversation

```
┌──────────────────────────────────────────────────────────────┐
│ ≡ VividKit                     CCS Ready  🌙  🔔  (U)         │
├────────┬─────────────────────────────────────────────────────┤
│        │  Brainstorm                                         │
│ Sidebar│  Deck: Feature-v2             [ 💡 Key Insights ]  │
│        │                                                     │
│        │  ┌─ AI Session ──────────────────────────────────┐  │
│        │  │                                               │  │
│        │  │  ┌─ 🔵 System ────────────────────────────┐   │  │
│        │  │  │ Initialized your session               │   │  │
│        │  │  └────────────────────────────────────────┘   │  │
│        │  │                                               │  │
│        │  │  ┌─ 🟣 You ──────────────────────────────┐   │  │
│        │  │  │ Brainstorm architecture for a          │   │  │
│        │  │  │ real-time notification system          │   │  │
│        │  │  └────────────────────────────────────────┘   │  │
│        │  │                                               │  │
│        │  │  ┌─ 🤖 AI ──────────────────────────────┐    │  │
│        │  │  │ 💭 Thinking...  (collapsed)          │    │  │
│        │  │  │                                       │    │  │
│        │  │  │ ## Architecture Options               │    │  │
│        │  │  │ Here are 3 approaches...              │    │  │
│        │  │  │                                       │    │  │
│        │  │  │ 🔧 Read: src/lib/api.ts               │    │  │
│        │  │  │ 🔧 Bash: npm list --depth=0           │    │  │
│        │  │  │                                       │    │  │
│        │  │  │ ⏱ 12.3s  │  📊 45K in / 2.1K out    │    │  │
│        │  │  └───────────────────────────────────────┘    │  │
│        │  │                                               │  │
│        │  │  [● Streaming...  ▊]                          │  │
│        │  └───────────────────────────────────────────────┘  │
│        │                                                     │
│        │  ┌──────────────────────────┐  [ 🧠 Brainstorm ]   │
│        │  │ Enter your idea...       │                       │
│        │  └──────────────────────────┘                       │
│        │                                                     │
│        │  ── Post-completion Actions ──                      │
│        │  [ 📄 View Report ]  [ 📝 Create Plan ]  [ 💾 Save]│
│        │                                                     │
└────────┴─────────────────────────────────────────────────────┘
```

**Key changes from old spec:**
1. ~~Terminal Panel (xterm.js)~~ → **StreamView** with structured conversation bubbles
2. Thinking blocks shown as collapsible sections
3. Tool calls shown as labeled items (file reads, bash commands, etc.)
4. Token usage stats displayed per AI response
5. Markdown rendered inline (not raw text)
6. Session status bar (streaming indicator, elapsed time)

---

### 5.5 Plan Pipeline — Generate → Validate → Red-Team → Tasks

> [!IMPORTANT]
> The plan creation is now a **multi-step pipeline**. After generating a plan, the user must validate it with AI review. Optionally, a red-team security scan can be run before proceeding to task creation.

```
 Generate Plan ──→ Validate Plan ──→ Red-Team (optional) ──→ Create Tasks
 /generate-plan    /validate-plan/:id   /red-team/:id          /tasks
```

#### 5.5.1 Generate Plan (`/generate-plan`) — ⚠️ MAJOR REDESIGN

**Old:** Full-height xterm.js terminal showing CLI simulation  
**New:** StreamView showing plan generation conversation. Completion action flows to **Validate Plan** (not directly to Tasks).

```
┌──────────────────────────────────────────────────────────────┐
│ ← Back to Brainstorm        Generate Plan                    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Pipeline Progress                                           │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  ◐ Generate    ○ Validate    ○ Red-Team    ○ Tasks   │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─ AI Session (StreamView) ─────────────────────────────┐   │
│  │                                                       │   │
│  │  🔵 Initialized your session                          │   │
│  │                                                       │   │
│  │  🤖 AI                                                │   │
│  │  ┌────────────────────────────────────────────────┐   │   │
│  │  │ 🔧 Read: docs/brainstorm-report.md             │   │   │
│  │  │ 🔧 Read: src/lib/api.ts                        │   │   │
│  │  │ 🔧 Write: plans/notification-system/plan.md    │   │   │
│  │  │                                                │   │   │
│  │  │ ✅ Created implementation plan with 4 phases   │   │   │
│  │  │ and 12 tasks.                                  │   │   │
│  │  └────────────────────────────────────────────────┘   │   │
│  │                                                       │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
│  ── Completion Actions ──                                    │
│  [ ✅ Validate Plan → ]                                      │
│    ↑ Primary CTA: proceeds to /validate-plan/:id             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

#### 5.5.2 Validate Plan (`/validate-plan/:id`) — 🆕 NEW SCREEN

Runs `/ck:plan validate <plan_path>` via CCS. AI reviews the plan and asks clarifying questions to the user through the `AskUserQuestion` tool (rendered as interactive QuestionCards in StreamView).

**Key interaction:** This is a **conversational** screen — the AI may ask multiple rounds of questions. User answers via QuestionCard selections or text input, and AI continues refining the plan.

```
┌──────────────────────────────────────────────────────────────┐
│ ← Back to Plan        Validate Plan                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Pipeline Progress                                           │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  ✅ Generate    ◐ Validate    ○ Red-Team    ○ Tasks   │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  Profile: [ default ▼ ]                    [ ⏹ Stop ]       │
│                                                              │
│  ┌─ AI Session (StreamView) ─────────────────────────────┐   │
│  │                                                       │   │
│  │  🤖 AI                                                │   │
│  │  ┌────────────────────────────────────────────────┐   │   │
│  │  │ 🔧 Read: plans/notification-system/plan.md     │   │   │
│  │  │                                                │   │   │
│  │  │ I've reviewed your plan. A few questions:      │   │   │
│  │  └────────────────────────────────────────────────┘   │   │
│  │                                                       │   │
│  │  ┌─ ❓ Question Card ────────────────────────────┐    │   │
│  │  │                                               │    │   │
│  │  │  Database Strategy                            │    │   │
│  │  │  Which database approach do you prefer?       │    │   │
│  │  │                                               │    │   │
│  │  │  ○ PostgreSQL (recommended for production)    │    │   │
│  │  │  ○ SQLite (simpler, local-first)              │    │   │
│  │  │  ○ MongoDB (flexible schema)                  │    │   │
│  │  │                                               │    │   │
│  │  │  [ Submit Answer ]                            │    │   │
│  │  └───────────────────────────────────────────────┘    │   │
│  │                                                       │   │
│  │  ┌─ ❓ Question Card ────────────────────────────┐    │   │
│  │  │                                               │    │   │
│  │  │  Auth Strategy                                │    │   │
│  │  │  Should the notification system require       │    │   │
│  │  │  authentication?                              │    │   │
│  │  │                                               │    │   │
│  │  │  ○ Yes — JWT-based auth                       │    │   │
│  │  │  ○ No — public endpoints (MVP)                │    │   │
│  │  │                                               │    │   │
│  │  │  [ Submit Answer ]                            │    │   │
│  │  └───────────────────────────────────────────────┘    │   │
│  │                                                       │   │
│  │  [● Waiting for your answers...  ▊]                   │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
│  ── After AI confirms plan is validated ──                   │
│  ┌───────────────────────────────────────────────────────┐   │
│  │  ✅ Plan validated successfully                       │   │
│  │                                                       │   │
│  │  🛡️ Run Red-Team Security Scan?                       │   │
│  │  AI will scan the plan for potential security          │   │
│  │  vulnerabilities and suggest mitigations.              │   │
│  │                                                       │   │
│  │  [ 🛡️ Yes, Run Red-Team ]   [ ⏭ Skip, Create Tasks ] │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**States:**
- **Streaming** — AI is reviewing the plan, show StreamView
- **Questions** — AI asked clarifying questions via QuestionCards, waiting for user input
- **Validated** — AI confirms plan is good, show Red-Team prompt
- **Error** — AI found critical issues, show re-generate suggestion

#### 5.5.3 Red-Team Scan (`/red-team/:id`) — 🆕 NEW SCREEN

Optional security audit. Runs `/plan red-team <plan_path>` via CCS. AI scans the plan for security vulnerabilities, attack vectors, and blind spots.

User reaches this screen **only if they explicitly chose "Yes"** from the Validate screen. Default is **No** (skip to Tasks).

```
┌──────────────────────────────────────────────────────────────┐
│ ← Back to Validate        Red-Team Security Scan             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Pipeline Progress                                           │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  ✅ Generate    ✅ Validate    ◐ Red-Team    ○ Tasks   │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  Profile: [ default ▼ ]                    [ ⏹ Stop ]       │
│                                                              │
│  ┌─ AI Session (StreamView) ─────────────────────────────┐   │
│  │                                                       │   │
│  │  🤖 AI                                                │   │
│  │  ┌────────────────────────────────────────────────┐   │   │
│  │  │ 🔧 Read: plans/notification-system/plan.md     │   │   │
│  │  │                                                │   │   │
│  │  │ ## 🛡️ Security Analysis                        │   │   │
│  │  │                                                │   │   │
│  │  │ ### Critical (1)                               │   │   │
│  │  │ ⛔ WebSocket connections lack rate limiting.   │   │   │
│  │  │    Risk: DDoS via connection flooding.         │   │   │
│  │  │    Fix: Add per-IP connection limit (100/min). │   │   │
│  │  │                                                │   │   │
│  │  │ ### Warning (2)                                │   │   │
│  │  │ ⚠️ No input validation on notification payload│   │   │
│  │  │ ⚠️ Missing CORS configuration for WS upgrade  │   │   │
│  │  │                                                │   │   │
│  │  │ ### Info (1)                                   │   │   │
│  │  │ ℹ️ Consider adding request signing for        │   │   │
│  │  │    internal service-to-service calls.          │   │   │
│  │  │                                                │   │   │
│  │  │ 🔧 Write: plans/notif/red-team-report.md      │   │   │
│  │  └────────────────────────────────────────────────┘   │   │
│  │                                                       │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
│  ── Completion Actions ──                                    │
│  ┌───────────────────────────────────────────────────────┐   │
│  │  🛡️ Red-Team scan complete                            │   │
│  │  Found: 1 critical, 2 warnings, 1 info               │   │
│  │  Report saved to: plans/notif/red-team-report.md      │   │
│  │                                                       │   │
│  │  [ 📄 View Report ]     [ ✅ Create Tasks → ]         │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

### 5.6 Plan Review (`/plans/:id`) — ⚠️ REDESIGN Cook Sheet + Archive

```
┌──────────────────────────────────────────────────────────────┐
│ ← Back to Plans    Phases │ Preview  [ 📦 Archive ] [ 🔥 Cook ]│
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─ Plan Header ─────────────────────────────────────────┐   │
│  │ Notification System         🟢 Active                 │   │
│  │ Created: Mar 5  •  4 phases  •  plans/notif/plan.md   │   │
│  │ ████████████░░░░░░░░  2/4 phases (50%)                │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
│  Phases                                                      │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ ✅ Phase 1 — Database Schema                          │   │
│  │    Create notification tables and migrations           │   │
│  │    📄 phases/01-database.md                            │   │
│  │                                                       │   │
│  │ ✅ Phase 2 — API Endpoints                            │   │
│  │    REST endpoints for notification CRUD                │   │
│  │    📄 phases/02-api.md                                 │   │
│  │                                                       │   │
│  │ ◐ Phase 3 — WebSocket Integration          [🔥 Cook]  │   │
│  │    Real-time push via WebSocket server                 │   │
│  │    📄 phases/03-websocket.md                           │   │
│  │                                                       │   │
│  │ ○ Phase 4 — Frontend Components                       │   │
│  │    Notification center + toast UI                      │   │
│  │    📄 phases/04-frontend.md                            │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
│  Related Tasks                                               │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ ✅ Create notification table      Done                │   │
│  │ ● Setup WebSocket server         In Progress → Cook   │   │
│  │ ○ Build notification center      Todo                 │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Cook Sheet (Slide-out Panel) — REDESIGNED:**
```
┌─────────────────────────────────────────────┐
│  🔥 Cooking: Phase 3 — WebSocket    ✓ 50%  │
├─────────────────────────────────────────────┤
│                                             │
│  Profile: [ gemini ▼ ]    [ ⏹ Stop ]       │
│                                             │
│  ┌─ StreamView ─────────────────────────┐   │
│  │                                      │   │
│  │  🤖 AI                               │   │
│  │  💭 Analyzing phase requirements...  │   │
│  │                                      │   │
│  │  🔧 Read: phases/03-websocket.md     │   │
│  │  🔧 Write: src/ws/server.ts          │   │
│  │  🔧 Bash: npm install ws             │   │
│  │                                      │   │
│  │  ✅ WebSocket server implemented     │   │
│  │                                      │   │
│  │  [● Streaming...  ▊]                 │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  ── Changed Files ──                        │
│  src/ws/server.ts         +124  -0          │
│  src/ws/handlers.ts       +87   -0          │
│  package.json             +2    -1          │
│                                             │
│  [ 🔀 Merge to Main ]  [ 🗑 Discard ]      │
│                                             │
└─────────────────────────────────────────────┘
```

**Plan Archive (Slide-out Panel):**

Triggered by clicking **[ 📦 Archive ]** button. Runs `/ck:plan --archive <plan_path>` via CCS.
Shows StreamView with the archive process output.

```
┌─────────────────────────────────────────────┐
│  📦 Archiving Plan                    ✕     │
├─────────────────────────────────────────────┤
│                                             │
│  Profile: [ default ▼ ]    [ ⏹ Stop ]      │
│                                             │
│  ┌─ StreamView ─────────────────────────┐   │
│  │                                      │   │
│  │  🤖 AI                               │   │
│  │  🔧 Read: plans/notif/plan.md        │   │
│  │  🔧 Read: plans/notif/phases/*.md    │   │
│  │                                      │   │
│  │  📦 Archiving plan...                │   │
│  │  ✅ Plan archived successfully       │   │
│  │  Saved to: plans/notif/archive/      │   │
│  │                                      │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  Plan status will change to "Archived"      │
│  Archived plans are read-only.              │
│                                             │
│  [ Close ]                                  │
│                                             │
└─────────────────────────────────────────────┘
```

---

### 5.7 Tasks (`/tasks`)

List view design unchanged (no terminal). Cook button triggers **StreamView-based Cook Sheet** (see 5.5).

```
┌──────────────────────────────────────────────────────────────┐
│  Tasks                                                       │
├──────────────────────────────────────────────────────────────┤
│  [List │ Kanban]   🔍 Search...   [All ▼]   [ + Add Task ]  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ ✅  Create notification table                         │   │
│  │     📁 Plan: Notification System  •  Phase 1          │   │
│  │     🟢 Done        🔵 Medium          ✓ Merged        │   │
│  ├───────────────────────────────────────────────────────┤   │
│  │ ●  Setup WebSocket server                   [🔥 Cook] │   │
│  │     📁 Plan: Notification System  •  Phase 3          │   │
│  │     🟡 In Progress  🔴 High   🌳 feat/ws-server      │   │
│  ├───────────────────────────────────────────────────────┤   │
│  │ ○  Build notification center                [🔥 Cook] │   │
│  │     📁 Plan: Notification System  •  Phase 4          │   │
│  │     ⚪ Todo         🔵 Medium                         │   │
│  ├───────────────────────────────────────────────────────┤   │
│  │ ○  Write unit tests                         [🔥 Cook] │   │
│  │     ✍ Custom task                                     │   │
│  │     ⚪ Backlog      🟢 Low                            │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Kanban View:**
```
┌──────────────────────────────────────────────────────────────┐
│  [List │ Kanban]   🔍 Search...                [ + Add Task ]│
│                                                              │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌───────────┐│
│  │ ⚪ Backlog  │ │ 📋 Todo    │ │ 🟡 In Prog │ │ ✅ Done   ││
│  │     1      │ │     1      │ │     1      │ │     1     ││
│  │            │ │            │ │            │ │           ││
│  │ ┌────────┐ │ │ ┌────────┐ │ │ ┌────────┐ │ │ ┌───────┐││
│  │ │Write   │ │ │ │Build   │ │ │ │Setup   │ │ │ │Create │││
│  │ │tests   │ │ │ │notif   │ │ │ │WS      │ │ │ │table  │││
│  │ │        │ │ │ │center  │ │ │ │server  │ │ │ │       │││
│  │ │🟢 Low  │ │ │ │🔵 Med  │ │ │ │🔴 High │ │ │ │✓ Done │││
│  │ │[Cook]  │ │ │ │[Cook]  │ │ │ │[Stop]  │ │ │ │       │││
│  │ └────────┘ │ │ └────────┘ │ │ └────────┘ │ │ └───────┘││
│  └────────────┘ └────────────┘ └────────────┘ └───────────┘│
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Kanban card actions (right panel — no navigation):**

> [!IMPORTANT]
> On Kanban, clicking **[Cook]** does **NOT** navigate away. It opens the **Cook Sheet** as a right slide-out panel (same component as Plan Review Cook Sheet in 5.6). User stays on the Kanban board and can see progress while managing other tasks.

| Button | When | Action |
|--------|------|--------|
| **[Cook]** | Backlog/Todo card | Opens **Cook Sheet** (right panel) with StreamView. Task auto-moves to "In Progress" column |
| **[Cook]** | In Progress card (paused) | Re-opens Cook Sheet, resumes viewing the session |
| **[Stop]** | In Progress card (cooking) | Stops the CCS/AI process. Worktree + changes preserved. Shows "Paused" badge |
| *(click card)* | Any | Opens **task detail** slide-out panel (name, description, plan/phase, worktree, status, priority) |

**Parallel cooking (multiple tasks simultaneously):**

> [!NOTE]
> **Each task = 1 separate worktree.** Tasks do NOT share worktrees. When you click [Cook] on a task, VividKit creates a dedicated git worktree for that task (e.g., `feat/ws-server`, `feat/notif-table`). This enables safe parallel development with full file isolation.

- ✅ **Multiple tasks can cook simultaneously** — each uses a different CCS profile (subscription)
- ✅ Opening Cook Sheet on task B while task A is cooking → task A keeps running in background
- ✅ Kanban header shows active cook count: `🔥 2 cooking`
- ⚠️ **Constraint:** One CCS profile can only run one session at a time. To cook 2 tasks in parallel, you need 2 different profiles (e.g., `default` + `gemini`)

```
┌──────────────────────────────────────────────────────────────┐
│  [List │ Kanban]  🔍 Search...   🔥 2 cooking   [ + Task ] │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ ┌─────┐│
│  │⚪ Backlog │ │📋 Todo   │ │🟡 In Prog│ │✅ Done  │ │Cook ││
│  │          │ │          │ │          │ │         │ │Sheet││
│  │┌────────┐│ │┌────────┐│ │┌────────┐│ │┌───────┐│ │     ││
│  ││Write   ││ ││Build   ││ ││Setup   ││ ││Create │││ │Pro- ││
│  ││tests   ││ ││notif   ││ ││WS 🔥   ││ ││table  │││ │file:││
│  ││        ││ ││center  ││ ││gemini  ││ ││       │││ │gemi ││
│  ││🟢 Low  ││ ││🔵 Med  ││ ││🔴 High ││ ││✓ Done │││ │     ││
│  ││[Cook]  ││ ││[Cook]  ││ ││[Stop]  ││ ││       │││ │Stre ││
│  │└────────┘│ │└────────┘│ │├────────┤│ │└───────┘│ │amVi ││
│  │          │ │          │ ││Notif   ││ │         │ │ew   ││
│  │          │ │          │ ││API 🔥  ││ │         │ │...  ││
│  │          │ │          │ ││default ││ │         │ │     ││
│  │          │ │          │ ││[Stop]  ││ │         │ │     ││
│  │          │ │          │ │└────────┘│ │         │ │     ││
│  └──────────┘ └──────────┘ └──────────┘ └─────────┘ └─────┘│
└──────────────────────────────────────────────────────────────┘
```

**Drag & drop: ❌ Disabled for MVP**
- Post-MVP feature. Status changes via task detail panel or button actions only.

**VividKit Task States (app-owned, independent):**

> [!IMPORTANT]
> VividKit manages its **own task state machine** in the local DB. These states are NOT synced from Claude Code's built-in task status or ClaudeKit's markdown phase files. The app is the single source of truth for task status.

```
  backlog → todo → cooking → review → done
                      ↓         ↑
                    paused ──────┘
                      ↓
                    failed
```

| State | Meaning | Triggered by |
|-------|---------|-------------|
| `backlog` | Not prioritized yet | Default on creation |
| `todo` | Ready to work on | User moves manually |
| `cooking` | CCS/AI session actively running | User clicks [Cook] |
| `paused` | AI stopped, worktree preserved | User clicks [Stop] |
| `review` | Cook complete, changes need review/merge | AI session completes successfully |
| `done` | Changes merged or task manually closed | User merges worktree or marks done |
| `failed` | AI session errored out | CCS session exits with error |

---

### 5.8 Cook Standalone (`/cook/:taskId`) — ⚠️ MAJOR REDESIGN

**Old:** Progress bar + terminal output  
**New:** Full-page StreamView with progress tracking

```
┌──────────────────────────────────────────────────────────────┐
│ ← Back to Tasks    Cook: Setup WebSocket Server              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Profile: [ gemini ▼ ]                                       │
│                                                              │
│  Progress                                                    │
│  ████████████████████░░░░░░░░░░  68%                         │
│                                                              │
│  Status Steps                                                │
│  ✅ Analyzing   ✅ Planning   ◐ Executing   ○ Reviewing      │
│                                    ← Current                 │
│                                                              │
│  ┌─ StreamView ──────────────────────────────────────────┐   │
│  │                                                       │   │
│  │  🤖 AI                                                │   │
│  │  💭 Planning implementation steps...  (collapsed)     │   │
│  │                                                       │   │
│  │  I'll implement the WebSocket server in 3 steps:      │   │
│  │  1. Create the server module                          │   │
│  │  2. Add event handlers                                │   │
│  │  3. Integrate with existing API                       │   │
│  │                                                       │   │
│  │  🔧 Write: src/ws/server.ts                           │   │
│  │     ┌────────────────────────────────────────┐        │   │
│  │     │ import { WebSocketServer } from 'ws'   │        │   │
│  │     │ ...                                    │        │   │
│  │     └────────────────────────────────────────┘        │   │
│  │                                                       │   │
│  │  🔧 Bash: npm test -- --grep "ws"                     │   │
│  │     ┌────────────────────────────────────────┐        │   │
│  │     │ ✓ 3 tests passed                       │        │   │
│  │     └────────────────────────────────────────┘        │   │
│  │                                                       │   │
│  │  [● Streaming...  ▊]                                  │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
│  Controls                                                    │
│  [ ⏸ Pause ]  [ ⏹ Stop ]  [ 👁 Preview Changes ]           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Preview Changes Dialog — Designed for many diffs:**

> [!NOTE]
> When a cook session touches 20+ files, showing all diffs inline is overwhelming. The design uses a **file tree sidebar + single active diff panel** pattern (like VS Code's SCM view or GitHub PR files tab).

**Layout: File tree (left) + Diff panel (right)**
```
┌──────────────────────────────────────────────────────────────┐
│  Preview Changes                                          ✕  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Worktree: feat/ws-server                                    │
│  Summary: 23 files changed  •  +847 additions  •  -132 del  │
│                                                              │
│  ┌────────────────────┬─────────────────────────────────┐    │
│  │  Files (23)        │  src/ws/server.ts    +124  -0   │    │
│  │  ────────────────  │  ───────────────────────────────│    │
│  │  ▼ src/            │   1  + import { WebSocketServer │    │
│  │    ▼ ws/           │   2  +   } from 'ws'            │    │
│  │      ● server.ts   │   3  +                          │    │
│  │      ● handlers.ts │   4  + export class WSServer {  │    │
│  │      ● types.ts    │   5  +   private wss: WSServer  │    │
│  │    ▼ api/          │   6  +                          │    │
│  │      ● routes.ts   │   7  +   constructor(port) {    │    │
│  │      ● middleware  │   8  +     this.wss = new WS..  │    │
│  │    ▼ db/           │      ...                        │    │
│  │      ● migrations  │  120 +   }                      │    │
│  │      ● schema.ts   │  121 + }                        │    │
│  │  ▼ tests/          │  122 +                          │    │
│  │    ● ws.test.ts    │  123 + export default WSServer  │    │
│  │    ● api.test.ts   │  124 +                          │    │
│  │  ● package.json    │                                 │    │
│  │  ● tsconfig.json   │                                 │    │
│  │                    │  ─── End of file ───            │    │
│  └────────────────────┴─────────────────────────────────┘    │
│                                                              │
│  [ 🖥 Open in IDE ▼ ]  [ 🗑 Discard ]  [ 🔀 Merge to Main] │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**"Open in IDE" dropdown:**
```
┌──────────────────────────┐
│ 🖥 Open in IDE ▼         │
│ ┌──────────────────────┐ │
│ │ ● VS Code            │ │
│ │   Cursor             │ │
│ │   Zed                │ │
│ │   IntelliJ IDEA      │ │
│ └──────────────────────┘ │
└──────────────────────────┘
```
- Auto-detects installed IDEs on user's machine (Rust backend)
- Opens the worktree directory in the selected IDE
- Remembers last-used IDE preference
- Falls back to system file manager if no IDE detected

**UX for many diffs:**

| # Changed Files | UI Behavior |
|-----------------|-------------|
| **1–5 files** | All diffs expanded inline (no sidebar needed) |
| **6–15 files** | File tree sidebar + click to view diff (single panel) |
| **16+ files** | File tree with folder grouping + summary stats + single diff panel |
| **50+ files** | Same as 16+ but with search/filter in file tree |

**File tree features:**
- Files grouped by directory, collapsible folders
- Each file shows `+additions -deletions` inline
- Color coding: 🟢 added, 🟡 modified, 🔴 deleted
- Click a file → right panel shows that file's diff
- Active file highlighted in file tree
- Search/filter input at top of file tree (for 50+ files)

---

### 5.9 Settings (`/settings`)

> [!NOTE]
> **Header "AI Connected ●"** — This indicator has been **removed** from the design. Instead, active cooking sessions are shown via `🔥 N cooking` in the Kanban header and task status badges. There is no persistent "AI Connected" concept since CCS runs on-demand, not as a persistent connection.

#### Tab: General

```
┌──────────────────────────────────────────────────────────────┐
│  Settings                                                    │
├──────────────────────────────────────────────────────────────┤
│  [▸General ] [ AI & Commands ] [ Git ] [ Editor ]            │
│                                                              │
│  Language                                                    │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ [ English ▼ ]                                         │   │
│  └───────────────────────────────────────────────────────┘   │
│  Supported: English, Tiếng Việt                              │
│                                                              │
│  Theme                                                       │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ ○ Light    ● Dark    ○ System                         │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
│  Default IDE                                                 │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ [ VS Code ▼ ]                                         │   │
│  └───────────────────────────────────────────────────────┘   │
│  Used for "Open in IDE" throughout the app                   │
│                                                              │
│  Updates                                                     │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ VividKit v0.1.0                                       │   │
│  │ ☑ Check for updates automatically                     │   │
│  │ [ 🔄 Check for Update Now ]                           │   │
│  │                                                       │   │
│  │ ✅ You're on the latest version                       │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
│  About                                                       │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ VividKit Desktop v0.1.0                               │   │
│  │ Built with Tauri v2 + React                           │   │
│  │ [ 📋 Copy Debug Info ]  [ 🌐 Website ]  [ 📝 Logs ]  │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

#### Tab: AI & Commands (hero tab)

```
┌──────────────────────────────────────────────────────────────┐
│  Settings                                                    │
├──────────────────────────────────────────────────────────────┤
│  [ General ] [▸AI & Commands ] [ Git ] [ Editor ]            │
│                                                              │
│  AI Providers (CCS Profiles)                                 │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ 🤖 default    Claude Sonnet          🟢 Active       │   │
│  │ 🤖 gemini     Gemini 2.5             🟢 Active       │   │
│  │ 🤖 glm        GLM-4                  🟡 Paused       │   │
│  │ 🤖 kimi       Moonshot               🔴 Exhausted    │   │
│  │ 🤖 copilot    GitHub Copilot         🟢 Active       │   │
│  └───────────────────────────────────────────────────────┘   │
│  Profiles detected via `ccs list` — names + providers only   │
│  [ 🔄 Refresh Profiles ]                                     │
│                                                              │
│  Command → Provider Mapping                                  │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ 📟 /ck:plan        Plan generation    [ default  ▼ ] │   │
│  │ 📟 /ck:brainstorm  AI ideation        [ gemini   ▼ ] │   │
│  │ 📟 /ck:cook        Task execution     [ default  ▼ ] │   │
│  │ 📟 /ck:review      Code review        [ gemini   ▼ ] │   │
│  │ 📟 /ck:test        Test generation    [ default  ▼ ] │   │
│  │ 📟 /ck:debug       Debugging          [ default  ▼ ] │   │
│  │                                                       │   │
│  │ [ + Add Command ▼ ]                                   │   │
│  │ ┌──────────────────────────────────┐                   │   │
│  │ │ Predefined ClaudeKit Commands:   │                   │   │
│  │ │  /ck:fix                         │                   │   │
│  │ │  /ck:docs                        │                   │   │
│  │ │  /ck:scout                       │                   │   │
│  │ │  /ck:research                    │                   │   │
│  │ │  /ck:git                         │                   │   │
│  │ │ ────────────────────────────────  │                   │   │
│  │ │  Custom command...               │                   │   │
│  │ └──────────────────────────────────┘                   │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

#### Tab: Git

```
┌──────────────────────────────────────────────────────────────┐
│  Settings                                                    │
├──────────────────────────────────────────────────────────────┤
│  [ General ] [ AI & Commands ] [▸Git ] [ Editor ]            │
│                                                              │
│  Default Branch                                              │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ [ main ▼ ]                                            │   │
│  └───────────────────────────────────────────────────────┘   │
│  Target branch for merging worktrees                         │
│                                                              │
│  Branch Naming Pattern                                       │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ [ feat/{task-slug}                                 ]   │   │
│  └───────────────────────────────────────────────────────┘   │
│  Variables: {task-slug}, {task-id}, {deck-name}              │
│                                                              │
│  Worktrees Directory                                         │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ [ .worktrees                           ] [ Browse ]   │   │
│  └───────────────────────────────────────────────────────┘   │
│  Relative to project root                                    │
│                                                              │
│  Auto-cleanup                                                │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ ☑ Delete worktree directory after merge               │   │
│  │ ☑ Delete local branch after merge                     │   │
│  │ ☐ Run tests before merge (if configured)              │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

#### Tab: Editor

```
┌──────────────────────────────────────────────────────────────┐
│  Settings                                                    │
├──────────────────────────────────────────────────────────────┤
│  [ General ] [ AI & Commands ] [ Git ] [▸Editor ]            │
│                                                              │
│  Code Diff Theme                                             │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ [ GitHub Dark ▼ ]                                     │   │
│  └───────────────────────────────────────────────────────┘   │
│  Used in Preview Changes dialog                              │
│                                                              │
│  Font Family                                                 │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ [ JetBrains Mono                                   ]  │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
│  Font Size                                                   │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ [ 14px        ]  ◄━━━━━━━━━━●━━━━━━━━━━►            │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
│  StreamView                                                  │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ ☑ Auto-scroll to latest message                       │   │
│  │ ☑ Collapse thinking blocks by default                 │   │
│  │ ☐ Show token usage per message                        │   │
│  │ ☑ Render markdown in AI responses                     │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

#### CCS Test Console — 🔧 Dev Mode Only

> [!WARNING]
> The CCS Test Console is **hidden by default**. It is only visible when Dev Mode is enabled (Settings → General → About → triple-click version number to toggle). This is a developer/debugging tool, not a user-facing feature.

```
┌──────────────────────────────────────────────────────────────┐
│  Settings                                                    │
├──────────────────────────────────────────────────────────────┤
│  [ General ] [ AI ] [ Git ] [ Editor ] [ 🔧 Dev Console ]   │
│                                                              │
│  CCS Test Console                                            │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ Profile: [default ▼]  Command: [/ck:brainstorm ...]   │   │
│  │ CWD: [/path/to/project                          ]     │   │
│  │ [ ▶ Run ]  [ ⏹ Stop ]  run-id: ccs-1709...           │   │
│  │                                                       │   │
│  │ ┌─ StreamView ────────────────────────────────────┐   │   │
│  │ │  (Structured JSONL conversation view)           │   │   │
│  │ └────────────────────────────────────────────────┘   │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

### 5.10 Worktrees (`/worktrees`) — Expanded with Action Details

```
┌──────────────────────────────────────────────────────────────┐
│  Worktrees                                                   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Active (Cooking in progress)                                │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ 🌳 feat/ws-server                    🟢 Active        │   │
│  │    Task: Setup WebSocket Server                       │   │
│  │    Files changed: 3  •  ⏱ Cooking in progress...     │   │
│  │    [ 📂 View Files ] [ 🖥 Open in IDE ] [ ⏹ Stop AI ]│   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
│  Ready to Merge                                              │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ 🌳 feat/notif-table                  🟡 Ready         │   │
│  │    Task: Create notification table                    │   │
│  │    Files changed: 5                                   │   │
│  │    [ 📂 View ] [ 🖥 IDE ] [ 🔀 Merge ] [ 🗑 Delete ] │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
│  Merged                                                      │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ 🌳 feat/auth-setup                   ✅ Merged        │   │
│  │    Task: Setup authentication                         │   │
│  │    Merged: Mar 4, 2026                                │   │
│  │    [ 🗑 Remove ]                                      │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Button actions explained:**

| Button | Context | Action |
|--------|---------|--------|
| **📂 View Files** | Active | Opens Preview Changes dialog (same component as Cook Preview — file tree + diff panel) |
| **📂 View** | Ready to Merge | Same Preview Changes dialog showing all changed files vs main branch |
| **🖥 Open in IDE / IDE** | All | Opens worktree directory in user's preferred IDE (VSCode, Zed, Cursor, etc.) |
| **⏹ Stop AI** | Active | Stops the running CCS/AI process but **keeps the worktree intact** with all changes. Task status → "Ready" |
| **🔀 Merge** | Ready to Merge | Opens Merge Dialog (see below) |
| **🗑 Delete** | Ready to Merge | Opens Delete Confirmation (see below) |
| **🗑 Remove** | Merged | Cleans up the merged worktree directory from disk. The git branch is already merged, this is just filesystem cleanup |

**Delete Worktree Confirmation:**
```
┌────────────────────────────────────────────┐
│  Delete Worktree                        ✕  │
├────────────────────────────────────────────┤
│                                            │
│  ⚠️ Are you sure you want to delete       │
│  worktree feat/notif-table?                │
│                                            │
│  This will discard all uncommitted         │
│  changes in this worktree.                 │
│                                            │
│  Files affected: 5 changed files           │
│                                            │
│  ☑ Also delete local branch               │
│    (feat/notif-table)                      │
│                                            │
│  [ Cancel ]           [ 🗑 Delete ]        │
│                                            │
└────────────────────────────────────────────┘
```

**Merge Dialog:**
```
┌────────────────────────────────────────────────────┐
│  Merge Worktree                                 ✕  │
├────────────────────────────────────────────────────┤
│                                                    │
│  Branch: feat/notif-table → main                   │
│  Files changed: 5  •  +234  -12                    │
│                                                    │
│  Merge Strategy                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │ ● Merge commit    (preserves branch history) │  │
│  │ ○ Squash merge    (single clean commit)      │  │
│  │ ○ Rebase          (linear history)           │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  Options                                           │
│  ☐ Run tests before merging                        │
│  ☑ Delete worktree after merge                     │
│  ☑ Delete branch after merge                       │
│                                                    │
│  [ Cancel ]              [ 🔀 Merge ]              │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Merge Conflict Flow:**
```
┌────────────────────────────────────────────────────┐
│  ⚠️ Merge Conflicts Detected                   ✕  │
├────────────────────────────────────────────────────┤
│                                                    │
│  Branch: feat/notif-table → main                   │
│                                                    │
│  3 files have conflicts:                           │
│  ┌──────────────────────────────────────────────┐  │
│  │ ⚠️ src/db/schema.ts           conflicts: 2   │  │
│  │ ⚠️ src/api/routes.ts          conflicts: 1   │  │
│  │ ⚠️ package.json               conflicts: 1   │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  Resolve conflicts in your preferred tool:         │
│                                                    │
│  [ 🖥 Open in VS Code ]                            │
│  [ 🖥 Open in Zed ]                                │
│  [ 🖥 Open in Cursor ]                             │
│                                                    │
│  After resolving, return here to complete merge.   │
│                                                    │
│  [ Cancel Merge ]    [ ✅ Conflicts Resolved ]     │
│                                                    │
└────────────────────────────────────────────────────┘
```

> [!NOTE]
> VividKit does **not** include a built-in merge conflict editor. Instead, it redirects users to their preferred IDE which has mature conflict resolution tools. After resolving, user clicks "Conflicts Resolved" to complete the merge.

---

## 6. Data Models (Revised)

| Model | Key Fields | Changes |
|-------|------------|---------|
| `Project` | id, name, gitPath, ccsConnected, ccsAccounts[] | No change |
| `CcsAccount` | provider, email, status (active/paused/exhausted) | No change |
| `Deck` | id, projectId, name, isActive | No change |
| `KeyInsight` | id, projectId, deckId, title, reportPath | No change |
| `Plan` | id, deckId, name, reportPath, planPath, phases[], **validationStatus**, **redTeamStatus**, **redTeamReportPath?** | **NEW: validationStatus** (pending/validated/failed), **redTeamStatus** (skipped/running/done), **redTeamReportPath** |
| `Phase` | id, planId, name, description, filePath, order, done | No change |
| `Task` | id, deckId, type, name, status, priority, planId?, phaseId?, worktreeName? | No change |
| `Worktree` | id, projectId, taskId, branch, status, filesChanged, mergedAt? | No change |
| `BrainstormSession` | id, deckId, prompt, **sessionLogPath**, status | **NEW: sessionLogPath** replaces concept of "terminal output" |
| `CookSession` | id, taskId, **sessionLogPath**, profile, status, startedAt, endedAt? | **NEW MODEL** — tracks cook execution sessions |
| `ValidationSession` | id, planId, **sessionLogPath**, profile, status, startedAt, endedAt? | **NEW MODEL** — tracks plan validation AI sessions |
| `RedTeamSession` | id, planId, **sessionLogPath**, profile, status, findings?, startedAt, endedAt? | **NEW MODEL** — tracks red-team scan sessions |

> [!NOTE]
> `CookSession` is a new model needed to persist the relationship between a task execution and its JSONL session log. When user clicks "Cook", a new CookSession is created with the sessionLogPath discovered by `findNewSessionLog`.

---

## 7. Key User Journey (Revised)

```
Onboarding → Dashboard → Decks (set active)
  → Brainstorm (StreamView AI session via ccs)
    → View Report / Save Insight
    → Generate Plan (StreamView shows plan creation)
      → Validate Plan (AI review + clarify questions)  ← NEW
        → Red-Team Scan (optional, default: No)        ← NEW
          → Create Tasks (auto-generated from plan)
            → Plan Review (phases checklist + markdown)
              → Tasks (list/kanban management)
                → Cook (StreamView execution via ccs profile)
                  → Preview Changes → Merge/Discard
                    → Worktrees (merge lifecycle)
```

**Profile switching at every AI interaction point:**

```
Every screen with StreamView has:
  ┌──────────────────────────────┐
  │ Profile: [ default  ▼ ]     │
  │  ├── default (Claude)       │
  │  ├── gemini (Gemini 2.5)    │  ← User picks which
  │  ├── glm (GLM-4)           │     subscription to use
  │  └── kimi (Moonshot)       │
  └──────────────────────────────┘
```

---

## 8. StreamView Component — Shared UI Foundation

The `StreamView` is the **single most important UI component** in the redesigned app. It replaces all xterm.js instances.

### Features Required

| Feature | Status | Notes |
|---------|--------|-------|
| JSONL file watching | ✅ Built | `watch_session_log` Rust command |
| Session line parsing | ✅ Built | `jsonl-session-parser.ts` |
| User message bubbles | ✅ Built | In StreamView |
| AI response blocks | ✅ Built | Thinking, text, tools |
| Tool call rendering | ✅ Built | Read, Write, Bash, etc. |
| Token usage display | ✅ Built | Input/output/cache tokens |
| Streaming indicator | ✅ Built | `stream-status-bar.tsx` |
| Subagent rendering | ✅ Built | Via `subagent.rs` |
| Question cards | ✅ Built | `AskUserQuestion` rendering |
| Profile selector | ⬜ TODO | Dropdown to pick CCS profile |
| Context injection | ⬜ TODO | Pass deck/plan/task context to CCS command |
| Session history | ⬜ TODO | Persist & reload past sessions |

---

## 9. Implementation Phases (Revised Timeline)

### Phase 1 — Foundation (1 sprint)
- [x] App shell, routing, shared layout (DONE)
- [x] Zustand stores (DONE)
- [ ] SQLite schema: all models migrated (including `CookSession`)
- [ ] CCS detection: `ccs detect` → parse accounts, save to DB
- [ ] i18n setup: base keys

### Phase 2 — Onboarding (0.5 sprint)
- [ ] 4-step wizard UI
- [ ] Git setup (local + clone)
- [ ] AI detection integration
- [ ] No terminal components needed ✅

### Phase 3 — Dashboard & Decks (0.5 sprint)
- [ ] Stats cards (tasks by status, worktree count)
- [ ] Quick actions grid
- [ ] Deck CRUD + active state toggle
- [ ] No terminal components needed ✅

### Phase 4 — Brainstorm + StreamView (1.5 sprints) ⭐ Critical
- [ ] **StreamView profile selector** (pick CCS profile before running)
- [ ] Brainstorm page: StreamView + input area + post-completion actions
- [ ] Session persistence: save `sessionLogPath` to `BrainstormSession`
- [ ] Report Preview Dialog (article layout from parsed session)
- [ ] Key Insights Dialog (past sessions)
- [ ] Brainstorm Report page (`/brainstorm/:id`)

### Phase 5 — Plans + Validation Pipeline (1.5 sprints) ⭐ Critical
- [ ] Generate Plan: pipeline progress indicator + **StreamView** (not xterm.js)
- [ ] **Validate Plan page** (`/validate-plan/:id`): StreamView + QuestionCard interaction
- [ ] **Red-Team Scan page** (`/red-team/:id`): StreamView + security report rendering
- [ ] Red-Team opt-in prompt UI (default: No)
- [ ] Auto-create tasks after validation/red-team completion
- [ ] Plan list page
- [ ] Plan Review: phases checklist + markdown preview

### Phase 6 — Tasks + Cook (1.5 sprints) ⭐ Critical
- [ ] Task CRUD, list + kanban views
- [ ] Cook Sheet: **StreamView** in slide-out panel
- [ ] `CookSession` model: create session, persist sessionLogPath
- [ ] Cook standalone: full-page **StreamView** + progress tracking
- [ ] Changed files summary (from worktree diff)
- [ ] Merge/Discard actions

### Phase 7 — Worktrees (0.5 sprint)
- [ ] Worktree list UI (grouped by status)
- [ ] Merge dialog with strategy options
- [ ] Rust: worktree commands (git2)

### Phase 8 — Settings (0.5 sprint)
- [ ] 4 tabs UI
- [ ] AI & Commands tab with profile management
- [ ] CCS Test Console (ALREADY WORKING ✅)

### Phase 9 — Polish & Release (1 sprint)
- [ ] Error boundaries, empty states, toast notifications
- [ ] Offline resilience
- [ ] Cross-platform testing
- [ ] App icon + build pipeline

---

## 10. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| JSONL file format changes in Claude Code CLI updates | High | Pin CLI version in docs; parser handles unknown fields gracefully |
| StreamView performance with large sessions (1000+ entries) | Medium | Virtualized scrolling (react-virtual); limit displayed entries |
| CCS not installed on user machine | Medium | Graceful degradation; install guide deep-link |
| Session log file discovery race condition | Low | Polling with `findNewSessionLog` already handles timing |
| Cross-platform PTY differences (Windows CMD vs Unix) | Medium | Already handled in `ai.rs` — test regularly |

---

## 11. Success Metrics (MVP)

1. **Usability:** New user onboards and runs first AI session in <5 min
2. **Reliability:** StreamView renders sessions without data loss
3. **Profile switching:** User can switch CCS profile and run different AI providers
4. **Coverage:** All 13 routes functional with StreamView replacing all terminal UIs
5. **Cross-platform:** App builds on macOS, Windows, Linux
6. **Performance:** StreamView scrolls smoothly with 500+ conversation entries

---

## 12. Evaluated Approaches — Terminal UI vs StreamView

### Option A: Keep xterm.js (Rejected ❌)
**Pros:** Raw terminal power, familiar to CLI users  
**Cons:** Intimidating for non-tech users, can't extract structured data, can't show thinking/tools, no token usage display, hard to build actions on top of raw text

### Option B: Hybrid (xterm.js + StreamView) (Considered ⚠️)
**Pros:** Power users get terminal, casual users get StreamView  
**Cons:** Double maintenance, confusing UX, increases complexity significantly

### Option C: StreamView only (Selected ✅)
**Pros:** Consistent UX, structured data display, actionable (tool calls, questions, insights), matches the product vision of "without the terminal", enables future features like session search, AI usage analytics
**Cons:** Loss of raw terminal power (mitigated by CCS Test Console in Settings for devs)

> [!TIP]
> The CCS Test Console in Settings can retain more developer-oriented features for power users, while all user-facing screens use StreamView.

---

## 13. Next Steps

1. **Review this PRD** — confirm scope, priorities, and screen mockups
2. **Create detailed implementation plan** — file-by-file changes needed
3. **Phase 1 execution** — SQLite schema + CCS detection
4. **Phase 4 first** (consider reordering) — since StreamView is already built, Brainstorm is the most impactful feature to complete

> [!IMPORTANT]
> **Recommended priority reorder:** Since StreamView components are already working in CCS Test Console, consider tackling Phase 4 (Brainstorm) right after Phase 1, as it will validate the core value proposition earliest.

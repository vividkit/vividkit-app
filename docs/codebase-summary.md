# VividKit Desktop — Codebase Summary

Developer-facing map of project structure, architecture, and key files.

---

## Directory Structure

```
vividkit-app/
├── src/                          # React frontend (118 TS/TSX files)
│   ├── components/               # 65 UI components organized by module
│   │   ├── brainstorm/          # AI ideation: terminal, insights, reports
│   │   ├── cook/                # Task execution: terminal, progress, preview
│   │   ├── dashboard/           # Homepage: stats cards, quick actions
│   │   ├── decks/               # Project organization: cards, lists
│   │   ├── generate-plan/       # Plan wizard with phase indicator
│   │   ├── layout/              # Sidebar, header, app shell
│   │   ├── new-project/         # Project creation form
│   │   ├── onboarding/          # 4-step wizard (welcome, git, AI, setup)
│   │   ├── plans/               # Plan review: checklist, preview, cook
│   │   ├── settings/            # App config: 4 tabs + CCS test console
│   │   ├── tasks/               # Task board: list + kanban views
│   │   ├── ui/                  # 15 shadcn/ui primitives
│   │   └── worktrees/           # Worktree management: list, merge
│   ├── hooks/                    # Custom hooks (extract logic >10 lines)
│   ├── lib/                      # Utilities
│   │   ├── tauri.ts             # Tauri IPC wrappers (spawn_ccs, stop_ccs, etc.)
│   │   └── utils.ts             # Format, parse, helpers
│   ├── locales/                  # i18n JSON (en.json, vi.json)
│   ├── pages/                    # 14 route pages (lazy-loaded)
│   ├── stores/                   # 8 Zustand stores (project, task, deck, etc.)
│   ├── types/                    # TypeScript interfaces (project, task, plan, etc.)
│   ├── App.tsx                   # Root component, routing
│   ├── router.tsx                # React Router v6 config
│   └── main.tsx                  # Entry point
│
├── src-tauri/src/                # Rust backend (11 files, ~306 LOC)
│   ├── commands/                 # Tauri command handlers
│   │   ├── ai.rs                # spawn_ccs, stop_ccs, CCS process management
│   │   ├── fs.rs                # File system operations (stubs)
│   │   ├── git.rs               # Git operations (stubs, git2 integration pending)
│   │   ├── worktree.rs          # Git worktree lifecycle (stubs)
│   │   └── mod.rs               # Command module exports
│   ├── models/                   # Serde structs for IPC & DB
│   │   ├── config.rs            # AppConfig (provider, theme)
│   │   ├── project.rs           # Project model
│   │   ├── task.rs              # Task model
│   │   └── mod.rs               # Model exports
│   ├── lib.rs                    # Plugin registration, state management
│   └── main.rs                   # Tauri app entry point
│
├── docs/                         # Developer documentation
│   ├── project-overview-pdr.md  # Product requirements & vision
│   ├── codebase-summary.md      # This file
│   ├── system-architecture.md   # Deep architecture docs
│   ├── code-standards.md        # Coding conventions
│   ├── development-roadmap.md   # 9-phase MVP timeline
│   └── *.md                     # Setup, usage guides
│
├── plans/                        # Implementation plans with phase files
│   ├── 260222-1340-vividkit-project-setup/
│   ├── 260222-2244-screen-implementation/
│   └── reports/                 # Scout, researcher, tester reports
│
├── public/                       # Static assets
├── Cargo.toml                    # Rust dependencies
├── package.json                  # Node dependencies
├── tsconfig.json                 # TypeScript config
├── vite.config.ts                # Vite build config
├── tauri.conf.json               # Tauri app metadata
├── CLAUDE.md                     # Critical rules for all developers
├── README.md                     # Project overview
└── repomix-output.xml            # Codebase compaction (generated)
```

---

## Frontend Architecture (src/)

### Pattern: Component → Hook → Store → IPC

```
React Component (UI only)
    ↓
Custom Hook (logic, state subscriptions)
    ↓
Zustand Store (state, actions)
    ↓
invoke() wrapper (src/lib/tauri.ts)
    ↓
Rust Command Handler
    ↓
PTY / Filesystem / Git
```

### Component Organization

Each module (brainstorm, cook, tasks, etc.) contains:
- UI components (`*.tsx` — presentational only)
- No async logic in components
- Props-driven rendering
- Side effects in custom hooks

**Max 200 lines per file** — split if exceeded.

### Key Hooks Pattern

```typescript
// src/hooks/useXxx.ts
export function useMyFeature() {
  const store = useMyStore()
  const [state, setState] = useState()

  useEffect(() => {
    invoke('command_name', args).then(...)
  }, [deps])

  return { state, actions }
}
```

### Store Pattern (Zustand)

```typescript
// src/stores/my-store.ts
interface MyStore {
  items: Item[]
  selectedId: string | null
  setSelected: (id: string) => void
}

export const useMyStore = create<MyStore>((set) => ({
  items: [],
  selectedId: null,
  setSelected: (id) => set({ selectedId: id }),
}))
```

One store per domain; actions defined inside `create()`.

### IPC Layer (src/lib/tauri.ts)

Typed wrappers around `invoke()`:

```typescript
export async function spawnCcs(args: SpawnCcsArgs): Promise<SpawnCcsResult> {
  return invoke<SpawnCcsResult>('spawn_ccs', args)
}

export async function stopCcs(runId: string): Promise<StopCcsResult> {
  return invoke<StopCcsResult>('stop_ccs', { run_id: runId })
}
```

Every wrapper has:
- Typed arguments
- Typed return
- Error handling (try/catch at call site)

---

## Backend Architecture (src-tauri/src/)

### Commands (ai.rs, fs.rs, git.rs, worktree.rs)

Each command is a Tauri `#[tauri::command]` function:

```rust
#[tauri::command]
pub async fn spawn_ccs(
    window: tauri::Window,
    run_id: String,
    profile: String,
    command: Option<String>,
    cwd: Option<String>,
) -> Result<SpawnCcsResult, String> {
    // Implementation
}
```

**Return pattern:** Always `Result<T, String>` — no exceptions.

**Error handling:** Use `.map_err(|e| e.to_string())` with `?` operator.

### Process Management (ai.rs)

**CcsProcessRegistry** — manages active PTY processes:
```rust
pub struct CcsProcessRegistry {
    runs: Mutex<HashMap<String, CommandChild>>,
}
```

**spawn_ccs flow:**
1. Generate `run_id`
2. Spawn PTY child process
3. Store child in registry
4. Return `{ run_id, pid }` to frontend
5. Stream output events with run_id envelope
6. On terminal: remove from registry, emit final event

**stop_ccs flow:**
1. Lookup `run_id` in registry
2. Remove entry first (idempotent)
3. Kill process
4. Return `{ run_id, stopped: bool }`

### Event Emission

Events sent via `emit_to` with run-scoped payload:

```rust
window.emit_to(
    window.label(),
    "ccs_run_event",
    CcsRunEvent {
        run_id: run_id.clone(),
        kind: "stdout".to_string(),
        chunk: Some(output),
        code: None,
        message: None,
    }
)
```

Frontend filters by `activeRunId` to avoid cross-run mixing.

### Models (models/)

Serde structs for IPC serialization:
- `Project` — id, name, gitPath, ccsConnected
- `Task` — id, title, status, priority, type
- `CcsAccount` — provider, email, status
- All have `#[derive(Serialize, Deserialize)]`

---

## Data Flow: AI Session (Example)

```
User clicks "Run" in CCS Test Console (Settings)
    ↓
handleRunCcs() invokes spawn_ccs({ profile, command, cwd })
    ↓
Rust: spawn_ccs generates run_id, spawns PTY, returns immediately
    ↓
Frontend: stores activeRunId, registers event listener
    ↓
Rust: streams ccs_run_event { run_id, kind: "stdout", chunk }
    ↓
Frontend: filters by activeRunId, writes chunk to xterm.js terminal
    ↓
Loop until: ccs_run_event { run_id, kind: "terminated"|"error", code }
    ↓
User clicks "Stop" (optional)
    ↓
Frontend: invokes stop_ccs(activeRunId)
    ↓
Rust: kills process, removes from registry, emits "terminated"
    ↓
Frontend: transitions to "done" state, terminal stays alive for review
```

---

## Key Files Quick Reference

| File | Purpose | Lines |
|------|---------|-------|
| `src/App.tsx` | Root component, routing | ~50 |
| `src/router.tsx` | React Router config, 14 routes | ~100 |
| `src/lib/tauri.ts` | Typed IPC wrappers | ~80 |
| `src/stores/project-store.ts` | Project state & actions | ~50 |
| `src/components/settings/ccs-test-console.tsx` | CCS runner + terminal (dev tool) | ~200 |
| `src/components/cook/cook-terminal.tsx` | Task execution terminal | ~150 |
| `src-tauri/src/commands/ai.rs` | spawn_ccs, stop_ccs, process mgmt | ~174 |
| `src-tauri/src/lib.rs` | State registration, command dispatch | ~26 |
| `src-tauri/Cargo.toml` | Rust deps (tauri, git2, tokio, etc.) | ~40 |
| `package.json` | Node deps (React, Tailwind, Zustand, etc.) | ~50 |

---

## Implementation Status

### Completed
- ✅ Tauri v2 setup + React 18 skeleton
- ✅ Routing (13 routes, 14 pages)
- ✅ AppLayout (sidebar, header, collapsible)
- ✅ All 65 UI components (mostly shells)
- ✅ Zustand stores (8 domains)
- ✅ IPC layer + typed wrappers
- ✅ spawn_ccs + stop_ccs with process registry
- ✅ CCS Test Console (run, stream, stop)
- ✅ xterm.js terminal integration
- ✅ Event envelope (run-scoped)

### In Progress
- 🔄 Brainstorm terminal streaming
- 🔄 Cook terminal with task context
- 🔄 Task Kanban board functionality

### Stubs (Ready for Implementation)
- ⬜ git.rs — git2 integration (init, status, commit, branch)
- ⬜ fs.rs — file operations
- ⬜ worktree.rs — git worktree (create, list, merge, cleanup)
- ⬜ SQLite schema + migrations
- ⬜ i18n keys (en.json, vi.json content)

---

## File Size Stats

| Category | Count | Total LOC |
|----------|-------|-----------|
| React components | 65 | ~5,500 |
| Pages | 14 | ~600 |
| Hooks | — | ~200 |
| Stores | 8 | ~400 |
| Types | 8 | ~300 |
| Rust commands | 4 | ~241 |
| Rust models | 4 | ~65 |
| **Total** | **~118 TS** + **11 Rust** | **~7,000+** |

---

## Critical Patterns & Rules

### 1. No `.unwrap()` in Rust commands
Always use `?` with `.map_err(|e| e.to_string())`.

### 2. Cross-platform paths
Never concatenate with `/` or `\`. Always use `PathBuf` and `std::path::Path`.

```rust
use std::path::PathBuf;
let path = home_dir.join("projects").join("my-project");
```

### 3. PTY spawning (Rust)
- macOS: wrap with `script -q /dev/null` for TTY mode
- Windows: use `taskkill /PID` for process termination
- Linux: native process spawning

### 4. xterm.js cleanup
Always call `terminal.dispose()` on component unmount.

```typescript
useEffect(() => {
  return () => {
    if (terminalRef.current) {
      terminalRef.current.dispose()
    }
  }
}, [])
```

### 5. Event filtering by run_id
Never assume events are for active run. Always check:

```typescript
const handleCcsEvent = (event: CcsRunEvent) => {
  if (event.run_id !== activeRunId) return // Ignore stale
  // Process event
}
```

### 6. i18n all user-facing text
No hardcoded strings in JSX. Use:

```typescript
const { t } = useTranslation()
return <div>{t('key.name')}</div>
```

### 7. State lives in Zustand, not React
Custom hooks subscribe to stores, not useState.

---

## Dependencies at a Glance

### Frontend (package.json)
- React 18, React Router v6
- TypeScript, Tailwind v4, shadcn/ui
- Zustand (state)
- xterm.js (terminal emulator)
- dnd-kit (drag & drop)
- react-markdown, axios
- @tauri-apps/api (IPC)

### Backend (Cargo.toml)
- tauri v2 (desktop framework)
- tauri-plugin-shell, dialog, fs, opener
- tokio v1 (async runtime)
- git2 v0.20 (git operations)
- rusqlite v0.32 (SQLite)
- serde / serde_json (serialization)

---

## Getting Started (Developer)

1. **Read** `docs/code-standards.md` for conventions
2. **Read** `CLAUDE.md` for critical rules (cross-platform, i18n, patterns)
3. **Reference** `system-architecture.md` for deep dives
4. **Follow** component → hook → store → IPC pattern
5. **Keep** files under 200 lines; split by concern
6. **Test** cross-platform before committing

---

## Troubleshooting

**Terminal output missing?**
→ Check `run_id` filter in event handler; listener may be registered after first event.

**CCS process won't stop?**
→ Verify `stop_ccs` is being called with correct `run_id` from spawn response.

**Path issues on Windows?**
→ Use `PathBuf`, never string concatenation.

**Component size bloated?**
→ Extract logic into custom hooks in `src/hooks/`.

**i18n key undefined?**
→ Add key to both `en.json` and `vi.json` in `src/locales/`.

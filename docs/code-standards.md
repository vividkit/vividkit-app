# Code Standards — VividKit Desktop

See `CLAUDE.md` for the authoritative critical rules. This document expands on conventions.

---

## File Organization

**Max 200 lines per file** — split by concern if exceeded.

- **Naming:** kebab-case for TS/JS files, snake_case for Rust files
- One component / one hook / one store per file
- Barrel exports via `index.ts` in each directory
- Prefer relative imports within same directory

---

## TypeScript / React

### Component Pattern

```ts
// Functional component only
export interface MyComponentProps {
  title: string
  onAction: (id: string) => void
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  return <div onClick={() => onAction('id')}>{title}</div>
}
```

**Rules:**
- No class components
- Props as typed interface `{ComponentName}Props`
- Side effects only in `useEffect` with cleanup
- Avoid `any` — use `unknown` and narrow via type guards
- `interface` for object shapes; `type` for unions/aliases

### Custom Hook Pattern

Extract logic >10 lines into hooks in `src/hooks/`:

```ts
export function useMyFeature() {
  const store = useMyStore()
  const [loading, setLoading] = useState(false)

  const handleAction = async (id: string) => {
    setLoading(true)
    try {
      const result = await invoke('command', { id })
      store.setResult(result)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return { loading, handleAction }
}
```

**Rules:**
- No async logic in stores — hooks own async + error handling
- Always catch and log errors (never silent failures)
- Memoize expensive deps with `useMemo` / `useCallback` if needed

### Tauri IPC Wrapper (src/lib/tauri.ts)

```ts
// Typed wrappers, not raw invoke()
export async function spawnCcs(args: {
  profile: string
  command?: string
  cwd?: string
}): Promise<{ run_id: string; pid: number }> {
  return invoke('spawn_ccs', args)
}
```

**Rules:**
- Every wrapper has typed args + return
- Always `Promise<T>` return type
- Error handling at call site (try/catch in component/hook)
- No `any` argument types

---

## Zustand Stores

```ts
interface ProjectStore {
  projects: Project[]
  selectedId: string | null
  setSelected: (id: string) => void
  clear: () => void
}

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],
  selectedId: null,
  setSelected: (id) => set({ selectedId: id }),
  clear: () => set({ projects: [], selectedId: null }),
}))
```

**Rules:**
- One store per domain (project, task, brainstorm, worktree, etc.)
- All actions defined inside `create()` callback
- No async logic — stores hold state only
- No circular dependencies between stores
- Custom hooks subscribe and invoke actions

---

## Rust / Tauri Commands

### Command Pattern

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

**Rules:**
- Every `#[tauri::command]` returns `Result<T, String>` — no exceptions
- Use `?` operator with `.map_err(|e| e.to_string())` for error propagation
- Never `.unwrap()` or `.expect()` — all errors become `Err(String)`
- Async commands use `pub async fn`, not `tokio::spawn`

### Process Management Pattern (CCS PTY)

When spawning `ccs [profile]` subprocesses:

```rust
let mut child = Command::new("ccs")
    .args([&profile, &command])
    .current_dir(&cwd)
    .stdout(Stdio::piped())
    .stderr(Stdio::piped())
    .spawn()
    .map_err(|e| e.to_string())?;

let pid = child.id().ok_or("Failed to get PID")?;
registry.insert(run_id.clone(), child);

// Stream output in separate task
// On terminal: remove from registry, emit final event
```

**Rules:**
- Store `CommandChild` in managed state (e.g., `CcsProcessRegistry`)
- Capture PID for reference in frontend
- Never drop child without draining output first
- Emit run-scoped events: `{ run_id, kind, chunk?, code?, message? }`
- Idempotent stop: remove from registry first, then kill

### Cross-Platform Path Handling

```rust
use std::path::PathBuf;

// ✅ Correct
let path = PathBuf::from("/home/user")
    .join("projects")
    .join("my-project");

// ❌ Wrong
let path = "/home/user".to_string() + "/projects";
```

**Rules:**
- Always use `PathBuf` — never string concat with `/` or `\`
- Use `home_dir` / `config_dir` crates for `~` expansion
- Never hardcode `/home/`, `C:\Users\`, `/Users/` — use `dirs` crate
- Use `#[cfg(target_os = "...")]` for OS-specific logic (macOS/Windows/Linux)
- Platform-specific PTY handling:
  - **macOS:** wrap `ccs` command with `script -q /dev/null` for TTY support
  - **Windows:** use `taskkill /PID` for killing processes
  - **Linux:** native process spawning works directly

### Serialization (IPC)

```rust
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct SpawnCcsResult {
    pub run_id: String,
    pub pid: u32,
}
```

**Rules:**
- All structs used in `invoke()` must derive `Serialize, Deserialize`
- Field names match TypeScript types exactly (camelCase on TS side)
- Use `#[serde(rename = "...")]` if mismatch needed
- No generic types in IPC structs

---

## xterm.js Terminal Integration

### Mount & Unmount

```typescript
useEffect(() => {
  const term = new Terminal({ rows: 30, cols: 120 })
  term.open(containerRef.current!)

  return () => {
    term.dispose() // Critical: prevents memory leak
  }
}, [])
```

**Rules:**
- Always call `terminal.dispose()` in cleanup
- Don't initialize terminal if tab is hidden (lazy mount)
- Fit to container on mount + on window resize

### Output Streaming

```typescript
const handleCcsEvent = (event: CcsRunEvent) => {
  if (event.run_id !== activeRunId) return // Ignore stale

  if (event.kind === 'stdout' || event.kind === 'stderr') {
    terminal.write(event.chunk || '')
  } else if (event.kind === 'terminated' || event.kind === 'error') {
    setStatus('done')
  }
}
```

**Rules:**
- Filter by `run_id` — never assume events are for active run
- Write chunks immediately; don't buffer large strings
- Emit terminal done event on process exit, not on UI unmount
- Handle rapid output: don't block terminal on large streams

### Process Control (Stop)

```typescript
const handleStop = async () => {
  try {
    await stopCcs(activeRunId)
    setStatus('stopping')
    // Terminal stays alive for review; don't dispose
  } catch (e) {
    setError(String(e))
  }
}
```

**Rules:**
- Stop button invokes `stopCcs(run_id)` on backend
- Stopping is async — UI should show spinner
- Terminal is not disposed after stop (user can review output)
- On remount: clear terminal, start fresh run with new `run_id`

---

## i18n (Internationalization)

### JSX Strings

```tsx
import { useTranslation } from 'react-i18next'

export function MyComponent() {
  const { t } = useTranslation()
  return <div>{t('brainstorm.start_session')}</div>
}
```

**Rules:**
- NO hardcoded user-facing strings in JSX
- All text via `t('key')` from `react-i18next`
- Keys: `module.feature.item` (e.g., `tasks.kanban.add_task`)
- Fallback: key itself displayed if translation missing
- Locale files: `src/locales/{lang}.json` (en, vi)

### Dates & Numbers

```typescript
// Dates: store UTC internally, format at display
const formatted = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
}).format(new Date(utcTimestamp))

// Numbers: locale-aware
const num = new Intl.NumberFormat('en-US').format(1234567)
```

**Rules:**
- Store all dates as UTC timestamps internally
- Format only at display layer with `Intl.DateTimeFormat`
- Use `Intl.NumberFormat` for locale-aware number formatting
- Prefer logical CSS props: `margin-inline-start` over `margin-left` (RTL ready)

---

## Error Handling

### Try/Catch Pattern

```typescript
const handleAction = async () => {
  setLoading(true)
  try {
    const result = await invoke('command', args)
    store.setData(result)
  } catch (error) {
    console.error('Action failed:', error)
    setError(error instanceof Error ? error.message : String(error))
  } finally {
    setLoading(false)
  }
}
```

**Rules:**
- Every async function wrapped in try/catch
- Log errors to console for debugging
- Show user-friendly message in UI
- Never silently ignore errors
- Rust commands return `Err(String)` — frontend maps to i18n key if needed

---

## Imports

Order: external → internal → relative

```ts
// External libraries
import { invoke } from '@tauri-apps/api/core'
import { useTranslation } from 'react-i18next'

// Internal (absolute)
import { useProjectStore } from '@/stores/project-store'
import { Button } from '@/components/ui/button'

// Relative (same directory)
import { ProjectCard } from './project-card'
```

---

## Comments

- Comment the *why*, not the *what*
- Mark TODOs clearly: `// TODO: implement with git2 when ready`
- No commented-out code in commits
- Use JSDoc for exported functions with complex args

```typescript
/**
 * Spawns a CCS PTY process and streams output to terminal.
 * @param profile — CCS profile name (claude, gemini, etc.)
 * @param command — CLI command to run in profile (optional)
 * @returns run_id for tracking this specific run
 */
export async function spawnCcs(profile: string, command?: string) {
  // Implementation
}
```

---

## Testing Strategy

- Unit tests for utility functions (`src/lib/utils.ts`)
- Integration tests for store actions
- E2E tests for critical user flows (onboarding, cook, brainstorm)
- No mocks for real external commands (CCS, git)
- Tests run before push; failing tests block merge

---

## Summary Checklist

- [ ] File under 200 lines
- [ ] No `any` types in TypeScript
- [ ] No `.unwrap()` in Rust
- [ ] Paths use `PathBuf`, never string concat
- [ ] xterm.js cleanup on unmount
- [ ] Error handling: try/catch + logging
- [ ] i18n: all user text via `t()`
- [ ] IPC: typed wrappers in `src/lib/tauri.ts`
- [ ] Comments explain *why*, not *what*
- [ ] One component/hook/store per file

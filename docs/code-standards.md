# Code Standards — VividKit Desktop

See `CLAUDE.md` for the authoritative critical rules. This document expands on conventions.

## File Organization

- **Max 200 lines** per file — split by concern if exceeded
- **Naming:** kebab-case for TS/JS files, snake_case for Rust files
- One component / one hook / one store per file
- Barrel exports via `index.ts` in each directory

## TypeScript

```ts
// Component pattern
export function MyComponent({ prop }: MyComponentProps) { ... }

// Hook pattern — extract logic > 10 lines
export function useMyFeature() {
  const store = useMyStore()
  // logic here
  return { ... }
}

// Tauri invoke wrapper (in src/lib/tauri.ts)
export async function gitStatus(path: string): Promise<GitStatus> {
  return invoke<GitStatus>('git_status', { path })
}
```

- No `any` types — use `unknown` and narrow
- Prefer `interface` for object shapes, `type` for unions/aliases
- All async functions must handle errors with try/catch

## React

- Functional components only — no class components
- Props interfaces named `{ComponentName}Props`
- Side effects in `useEffect` with proper cleanup
- Memoize expensive computations with `useMemo` / `useCallback` when needed

## Zustand Stores

```ts
// src/stores/project-store.ts
interface ProjectStore {
  projects: Project[]
  selectedId: string | null
  setSelected: (id: string) => void
}

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],
  selectedId: null,
  setSelected: (id) => set({ selectedId: id }),
}))
```

- One store per domain (project, task, brainstorm, cook)
- Actions defined inside `create()`, not as separate functions
- No async logic in stores — use hooks for async, stores for state

## Rust

```rust
// Command pattern
#[tauri::command]
pub async fn git_status(path: String) -> Result<GitStatus, String> {
    let repo = Repository::open(&path)
        .map_err(|e| e.to_string())?;
    // ...
    Ok(status)
}
```

- Every `#[tauri::command]` returns `Result<T, String>`
- Use `?` operator with `.map_err(|e| e.to_string())` for error propagation
- No `.unwrap()` or `.expect()` in command files
- Structs used in IPC must derive `Serialize, Deserialize`

## Imports

```ts
// Order: external → internal → relative
import { invoke } from '@tauri-apps/api/core'
import { useProjectStore } from '@/stores/project-store'
import { ProjectCard } from './project-card'
```

## Comments

- Comment the *why*, not the *what*
- Mark TODOs: `// TODO: implement with git2`
- No commented-out code in commits

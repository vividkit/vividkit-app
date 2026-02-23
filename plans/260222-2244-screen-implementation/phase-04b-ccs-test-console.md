---
phase: 04b
title: "CCS Test Console"
status: completed
effort: 2h
depends_on: [phase-01]
priority: CRITICAL — validate architecture before building production UX
---

# Phase 04b: CCS Test Console

## Overview

Developer screen to verify `ccs` subprocess spawning, stdout streaming to xterm.js, and exit code capture. **Must complete before Phase 05 (Brainstorm)** — all subsequent terminal screens depend on this working.

## Route

`/ccs-test` — AppLayout, accessible from Settings bottom nav (dev tool)

## What to Validate

1. `ccs <profile> "<command>"` spawns from Rust via `tauri-plugin-shell`
2. stdout streams realtime to xterm.js (PTY vs pipe behavior)
3. Exit code captured after process ends
4. Multiple profiles work: default, glm, gemini, kimi
5. CWD set correctly (commands run in project directory)
6. Process can be killed mid-run (Stop button)

## Rust Implementation (commands/ai.rs)

Replace placeholder with real implementation:

```rust
use tauri::{AppHandle, Emitter};
use tauri_plugin_shell::ShellExt;

#[tauri::command]
pub async fn spawn_ccs(
    app: AppHandle,
    profile: String,   // "" | "glm" | "gemini" | "kimi" | "codex"
    command: String,   // "/brainstorm write a todo app"
    cwd: String,
) -> Result<(), String> {
    let shell = app.shell();

    // Build args: ccs [profile] "[command]"
    let mut args: Vec<&str> = vec![];
    if !profile.is_empty() {
        args.push(&profile);
    }
    args.push(&command);

    let (mut rx, _child) = shell
        .command("ccs")
        .args(&args)
        .current_dir(&cwd)
        .spawn()
        .map_err(|e| e.to_string())?;

    // Stream stdout chunks to frontend
    while let Some(event) = rx.recv().await {
        match event {
            tauri_plugin_shell::process::CommandEvent::Stdout(chunk) => {
                let _ = app.emit("ccs_output", String::from_utf8_lossy(&chunk).to_string());
            }
            tauri_plugin_shell::process::CommandEvent::Stderr(chunk) => {
                let _ = app.emit("ccs_output", String::from_utf8_lossy(&chunk).to_string());
            }
            tauri_plugin_shell::process::CommandEvent::Terminated(payload) => {
                let _ = app.emit("ccs_done", payload.code.unwrap_or(-1));
                break;
            }
            _ => {}
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn list_ccs_profiles() -> Result<Vec<String>, String> {
    // Parse output of `ccs auth list` to get configured accounts
    // Returns: ["default", "glm", "gemini", "kimi", ...]
    Err("Not implemented".to_string())
}
```

Register in `lib.rs`:
```rust
commands::ai::spawn_ccs,
commands::ai::list_ccs_profiles,
```

Update capabilities to allow spawning `ccs` binary.

## Frontend Components

```
src/components/settings/
  ccs-test-console.tsx   # Full test UI

src/pages/ccs-test.tsx   # /ccs-test route
```

### ccs-test-console.tsx layout:
```
┌─ Controls ───────────────────────────────┐
│ Profile:  [Select: default/glm/gemini…]  │
│ Command:  [Input: "/brainstorm …"]        │
│ CWD:      [Input: /path/to/project]      │
│           [Run]  [Stop]                  │
└──────────────────────────────────────────┘
┌─ Output ─────────────────────────────────┐
│ xterm.js terminal                        │
│ $ ccs glm "/brainstorm …"               │
│ > streaming output…                      │
└──────────────────────────────────────────┘
┌─ Status ─────────────────────────────────┐
│ Exit code: 0  │  Duration: 12.3s        │
└──────────────────────────────────────────┘
```

### React event listeners:
```tsx
useEffect(() => {
  const unlisten1 = listen<string>('ccs_output', (e) => {
    terminal.write(e.payload)
  })
  const unlisten2 = listen<number>('ccs_done', (e) => {
    setExitCode(e.payload)
    setIsRunning(false)
  })
  return () => {
    unlisten1.then(f => f())
    unlisten2.then(f => f())
    terminal.dispose()
  }
}, [])
```

## Capabilities Update (tauri.conf.json or capabilities/default.json)

Add `ccs` to allowed shell commands:
```json
{
  "identifier": "shell:allow-spawn",
  "allow": [{ "name": "ccs", "cmd": "ccs", "args": true }]
}
```

## Todo List

- [ ] Implement `spawn_ccs` in commands/ai.rs using tauri-plugin-shell
- [ ] Implement `list_ccs_profiles` (parse `ccs auth list` output)
- [ ] Register commands in lib.rs invoke_handler
- [ ] Update capabilities to allow `ccs` spawn
- [ ] Create ccs-test-console.tsx component
- [ ] Create /ccs-test page + add to router
- [ ] Test with: `ccs default "echo hello"` (sanity check)
- [ ] Test with: `ccs glm "/brainstorm simple todo"` (real AI)
- [ ] Verify streaming works (not buffered)
- [ ] Verify terminal disposes on unmount
- [ ] `cargo check` passes

## Success Criteria

- `ccs echo hello` streams output to xterm.js in realtime
- Real `ccs glm "/brainstorm ..."` runs and output appears
- Exit code shows after process ends
- Stop button kills the process
- No memory leak (terminal disposes)
- Different profiles selectable and work

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| PTY vs pipe — output buffered, not streaming | Try `--no-buffer` flag or use `script -q` wrapper |
| `ccs` not in PATH when spawned from Tauri | Use full path: `which ccs` to find, store in config |
| Shell plugin doesn't support PTY | Fall back to `tauri-plugin-shell` sidecar with pty wrapper |

## Notes for Subsequent Phases

After this phase validates:
- Phase 05 Brainstorm: replace simulated terminal with real `spawn_ccs` call
- Phase 06 Generate Plan: use `spawn_ccs` with `/plan` command
- Phase 08 Tasks Cook: use `spawn_ccs` with `/cook` + task context
- All streaming = `listen('ccs_output', ...)` pattern

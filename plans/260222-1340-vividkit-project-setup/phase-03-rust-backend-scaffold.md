---
phase: 03
title: "Rust Backend Scaffold"
status: pending
effort: 1h
depends_on: [phase-01]
---

# Phase 03: Rust Backend Scaffold

## Context Links

- [Plan Overview](./plan.md)
- [Phase 01](./phase-01-tauri-react-init.md)

## Overview

- **Priority:** P1
- **Status:** pending
- Add Rust crate deps to Cargo.toml, create command module scaffold, models directory

## Key Insights

- All AI HTTP calls MUST go through Rust (never from frontend)
- Every `#[tauri::command]` returns `Result<T, String>` — no .unwrap()
- Tauri plugins (shell, dialog, fs) need both Cargo.toml + tauri.conf.json + capabilities config

## Requirements

### Functional

- Cargo.toml has all required deps
- Command module files created with placeholder functions
- Models directory with placeholder structs
- Tauri plugins registered in main.rs/lib.rs

### Non-functional

- `cargo check` passes in src-tauri/
- No .unwrap() in any command file

## Architecture

```
src-tauri/
  src/
    main.rs           # Entry point (generated)
    lib.rs            # Plugin registration, command handlers
    commands/
      mod.rs          # Re-exports
      git.rs          # Git operations via git2
      ai.rs           # AI provider HTTP calls
      fs.rs           # File system operations
      worktree.rs     # Git worktree lifecycle
    models/
      mod.rs          # Re-exports
      project.rs      # Project struct
      task.rs         # Task struct
      config.rs       # App config
```

## Related Code Files

### Files to Modify

- `src-tauri/Cargo.toml` — add deps
- `src-tauri/src/lib.rs` — register plugins + commands
- `src-tauri/tauri.conf.json` — add plugin permissions

### Files to Create

- `src-tauri/src/commands/mod.rs`
- `src-tauri/src/commands/git.rs`
- `src-tauri/src/commands/ai.rs`
- `src-tauri/src/commands/fs.rs`
- `src-tauri/src/commands/worktree.rs`
- `src-tauri/src/models/mod.rs`
- `src-tauri/src/models/project.rs`
- `src-tauri/src/models/task.rs`
- `src-tauri/src/models/config.rs`

## Implementation Steps

1. **Add Rust deps to Cargo.toml**
   ```toml
   [dependencies]
   git2 = "0.18"
   rusqlite = { version = "0.30", features = ["bundled"] }
   tokio = { version = "1.35", features = ["full"] }
   notify = "6.1"
   serde = { version = "1", features = ["derive"] }
   serde_json = "1"
   tauri-plugin-shell = "2"
   tauri-plugin-dialog = "2"
   tauri-plugin-fs = "2"
   ```

2. **Create commands/ directory and mod.rs**
   ```rust
   // commands/mod.rs
   pub mod ai;
   pub mod fs;
   pub mod git;
   pub mod worktree;
   ```

3. **Scaffold each command file** with pattern:
   ```rust
   // commands/git.rs
   use serde::Serialize;

   #[derive(Serialize)]
   pub struct GitStatus {
       pub branch: String,
       pub changed_files: Vec<String>,
   }

   #[tauri::command]
   pub async fn git_status(path: String) -> Result<GitStatus, String> {
       // TODO: implement with git2
       Err("Not implemented".to_string())
   }
   ```

4. **Create models/ with structs**
   - `project.rs`: Project { id, name, path, created_at }
   - `task.rs`: Task { id, title, status, project_id }
   - `config.rs`: AppConfig { ai_provider, api_key, theme }

5. **Register plugins in lib.rs**
   ```rust
   pub fn run() {
       tauri::Builder::default()
           .plugin(tauri_plugin_shell::init())
           .plugin(tauri_plugin_dialog::init())
           .plugin(tauri_plugin_fs::init())
           .invoke_handler(tauri::generate_handler![
               commands::git::git_status,
               // ... other commands
           ])
           .run(tauri::generate_context!())
           .expect("error while running tauri application");
   }
   ```

6. **Update tauri.conf.json** — add plugin permissions/capabilities

7. **Verify**: `cd src-tauri && cargo check`

## Todo List

- [ ] Add all Rust deps to Cargo.toml
- [ ] Create commands/ directory with mod.rs
- [ ] Scaffold git.rs with placeholder commands
- [ ] Scaffold ai.rs with placeholder commands
- [ ] Scaffold fs.rs with placeholder commands
- [ ] Scaffold worktree.rs with placeholder commands
- [ ] Create models/ directory with structs
- [ ] Register Tauri plugins in lib.rs
- [ ] Register commands in invoke_handler
- [ ] Update tauri.conf.json capabilities
- [ ] Verify `cargo check` passes

## Success Criteria

- `cargo check` passes without errors
- All command files have Result<T, String> return types
- No .unwrap() in any command
- Plugins registered and capabilities configured

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| git2 build fails (libgit2 deps) | Use bundled feature if available, or install system deps |
| rusqlite bundled compile slow | Expected on first build, subsequent builds fast |
| Tauri v2 plugin API changes | Pin exact versions, check docs |

## Security Considerations

- API keys stored in config — use rusqlite encrypted or OS keychain later
- AI commands must validate input before HTTP calls
- File system commands: restrict to project directories only

## Next Steps

- Phase 05: CLAUDE.md references Rust patterns
- Future: Implement actual command logic per module

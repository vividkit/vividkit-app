# Phase 2 — Core Entity Commands

## Context
- Phase 1: `phase-01-db-module-and-schema.md` (must complete first)
- Existing TS types: `src/types/` — source of truth for field names
- Existing Rust models: `src-tauri/src/models/` — need realignment

## Overview
- **Priority:** P1
- **Status:** Pending
- **Description:** Rust CRUD commands + updated models for Project, CcsAccount, Deck, AppSettings.

## Key Insights
- Existing `models/project.rs` and `models/config.rs` need rewrite to match TS types
- Each command file < 200 lines → split by entity
- Use `State<'_, DbState>` pattern from `spawn_ccs` as reference
- Return `Result<T, String>` consistently
<!-- Red Team: Rust enums for status/priority — 2026-02-24 -->
- Use Rust enums with `#[derive(Serialize, Deserialize)]` for all discriminated string fields (status, priority, provider) — never bare `String` for domain-constrained values
<!-- Red Team: Commands modifying multiple rows MUST use transactions — 2026-02-24 -->
- Commands modifying multiple rows MUST use explicit transactions

## Files to Create
- `src-tauri/src/commands/project.rs` — project + ccs_account CRUD
- `src-tauri/src/commands/deck.rs` — deck CRUD
- `src-tauri/src/commands/settings.rs` — get/update settings

## Files to Modify
- `src-tauri/src/models/project.rs` — Align with TS `Project` + `CcsAccount`
- `src-tauri/src/models/config.rs` → rename to `settings.rs` — Align with TS `AppSettings`
- `src-tauri/src/models/mod.rs` — Add new model exports
- `src-tauri/src/lib.rs` — Register new commands

## Files to Create (Models)
- `src-tauri/src/models/deck.rs` — Deck struct
- `src-tauri/src/models/ccs_account.rs` — CcsAccount struct

## Implementation Steps

### Models (align Rust ↔ TS)

<!-- Red Team: Rust enums for status/priority — 2026-02-24 -->
1. Define shared enums in `src-tauri/src/models/enums.rs`:
```rust
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
pub enum CcsAccountStatus { Active, Paused, Exhausted }

// NOTE: CcsProvider removed — provider field is String (dynamic profiles from ~/.ccs/)
// Updated: Validation Session 1 - CCS profiles are user-configured, not fixed enum
```

2. Rewrite `models/project.rs`:
```rust
#[derive(Debug, Serialize, Deserialize)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub git_path: String,
    pub ccs_connected: bool,
    pub ccs_accounts: Vec<CcsAccount>, // populated via join — see list_projects
    pub created_at: String,
}
```

3. Create `models/ccs_account.rs`:
```rust
pub struct CcsAccount {
    pub id: String,
    pub project_id: String,
    pub provider: String,  // dynamic profile name from ~/.ccs/ — not enum
    pub email: String,
    pub status: CcsAccountStatus,  // enum, not String
}
```

4. Create `models/deck.rs`, rename `config.rs` → `settings.rs`

### Commands

<!-- Red Team: git_path validation — 2026-02-24 -->
5. `commands/project.rs` — 5 commands:
   - `create_project(name, description, git_path) -> Project`
     - **`git_path` validation (MANDATORY):** canonicalize path via `std::fs::canonicalize()`, verify it is a git repo (check `.git` dir exists or use `git2::Repository::open()`), return `Err` if invalid before any DB write
   - `list_projects() -> Vec<Project>` — see N+1 rule below
   - `get_project(id) -> Project`
   - `update_project(id, name?, description?) -> Project`
   - `delete_project(id) -> ()`

<!-- Red Team: N+1 query list_projects — 2026-02-24 -->
   **`list_projects` query strategy — NO N+1:**
   - Query 1: `SELECT * FROM projects`
   - Query 2: `SELECT * FROM ccs_accounts` (all accounts, no per-project loop)
   - Group accounts by `project_id` in Rust using a `HashMap<String, Vec<CcsAccount>>`
   - Merge into `Vec<Project>` in memory
   - Never loop over projects and query accounts individually

<!-- Red Team: set_active_deck transaction — 2026-02-24 -->
6. `commands/deck.rs` — 5 commands:
   - `create_deck(project_id, name, description?, based_on_insight_id?) -> Deck`
   - `list_decks(project_id) -> Vec<Deck>`
   - `set_active_deck(id) -> Deck`
     - **MUST use `BEGIN IMMEDIATE TRANSACTION`:**
       1. `UPDATE decks SET is_active = 0 WHERE project_id = (SELECT project_id FROM decks WHERE id = ?)`
       2. `UPDATE decks SET is_active = 1 WHERE id = ?`
       3. `COMMIT`
     - Both UPDATEs inside single transaction — no partial state
   - `update_deck(id, name?, description?) -> Deck`
   - `delete_deck(id) -> ()`

7. `commands/settings.rs` — 2 commands:
   - `get_settings() -> AppSettings`
   - `update_settings(settings: AppSettings) -> AppSettings`

<!-- Updated: Validation Session 1 - list_ccs_profiles dynamic discovery -->
8. `commands/ccs_profile.rs` — 1 command:
   - `list_ccs_profiles() -> Vec<CcsProfile>` — scan `~/.ccs/` directory:
     - Read `config.yaml` for `profiles` section
     - Scan `*.settings.json` files for file-based profiles
     - Check `config.accounts` for OAuth profiles in `instances/`
     - Return merged list: `CcsProfile { name: String, profile_type: String }`
   - **NOTE:** UUID + timestamps generated in Rust backend (not frontend)

9. Update `lib.rs` — register all 13 new commands

## Todo
- [ ] Create `models/enums.rs` with typed enums for status (no CcsProvider enum — provider is String)
- [ ] Rewrite `models/project.rs` aligned with TS types
- [ ] Create `models/ccs_account.rs`, `models/deck.rs`
- [ ] Rename `models/config.rs` → `models/settings.rs`, rewrite
- [ ] Create `commands/project.rs` (5 CRUD commands, git_path validation, no N+1)
- [ ] Create `commands/deck.rs` (5 CRUD commands, set_active_deck with IMMEDIATE TRANSACTION)
- [ ] Create `commands/settings.rs` (2 commands)
- [ ] Create `commands/ccs_profile.rs` (1 command — scan ~/.ccs/)
- [ ] Register all 13 commands in `lib.rs`
- [ ] Compile check passes

## Success Criteria
- All 12 commands registered and callable via `invoke()`
- `git_path` rejected if path is not a valid git repo
- Project CRUD works: create, list (with accounts, no N+1), get, update, delete
- Deck CRUD works with active-state toggling inside transaction
- Settings get/update persists between app restarts
- Cascade delete: deleting project removes its accounts + decks
- Enum values serialize/deserialize correctly to/from JSON strings

# Phase 3 — Content Entity Commands

## Context
- Phase 2: `phase-02-core-entity-commands.md` (reuses same patterns)
- TS types: `src/types/` — field alignment source

## Overview
- **Priority:** P1
- **Status:** Pending
- **Description:** Rust CRUD commands for Task, Plan, Phase, BrainstormSession, KeyInsight, Worktree.

## Files to Create
- `src-tauri/src/commands/task.rs` — task CRUD + status transitions
- `src-tauri/src/commands/plan.rs` — plan + phase CRUD
- `src-tauri/src/commands/brainstorm.rs` — session + key insight CRUD
- `src-tauri/src/commands/worktree_cmd.rs` — worktree CRUD (not git ops, just DB records)

## Files to Create (Models)
- `src-tauri/src/models/task.rs` — Rewrite with full fields
- `src-tauri/src/models/plan.rs` — Plan + Phase structs
- `src-tauri/src/models/brainstorm.rs` — BrainstormSession + KeyInsight
- `src-tauri/src/models/worktree.rs` — Worktree struct

## Files to Modify
- `src-tauri/src/models/mod.rs` — Export new models
- `src-tauri/src/lib.rs` — Register commands

## Implementation Steps

### Models

<!-- Red Team: Rust enums for status/priority — 2026-02-24 -->
1. Add enums to `models/enums.rs` (extend from Phase 2):
```rust
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
pub enum TaskStatus { Backlog, Todo, InProgress, Done }

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
pub enum TaskPriority { Low, Medium, High }

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
pub enum TaskType { Generated, Custom }

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
pub enum PhaseStatus { Pending, InProgress, Completed, Blocked }

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
pub enum BrainstormStatus { Idle, Running, Done, Failed }

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
pub enum WorktreeStatus { Active, Merged, Abandoned }
```

2. Rewrite `models/task.rs`:
```rust
pub struct Task {
    pub id: String,
    pub deck_id: String,
    pub r#type: TaskType,       // enum
    pub name: String,
    pub description: Option<String>,
    pub status: TaskStatus,     // enum
    pub priority: TaskPriority, // enum
    pub plan_id: Option<String>,
    pub phase_id: Option<String>,
    pub worktree_name: Option<String>,
}
```

3. Create `models/plan.rs` (Plan + Phase), `models/brainstorm.rs` (Session + Insight), `models/worktree.rs`
   - `Worktree` struct: no `files_changed` field — computed at runtime via git2

### Commands — MVP Audit

<!-- Red Team: 35 commands YAGNI audit — 2026-02-24 -->
**MVP-required vs deferred:**

| Command | MVP? | Store Consumer |
|---------|------|----------------|
| `create_task` | YES | `task-store.ts` → `addTask` |
| `list_tasks` | YES | `task-store.ts` → `loadTasks` |
| `get_task` | YES | `task-store.ts` → detail view |
| `update_task` | YES | `task-store.ts` → `updateTask` |
| `update_task_status` | YES | `task-store.ts` → `updateTaskStatus` |
| `delete_task` | YES | `task-store.ts` → `removeTask` |
| `create_plan` | YES | `plan-store.ts` → `addPlan` |
| `list_plans` | YES | `plan-store.ts` → `loadPlans` |
| `get_plan` | YES | `plan-store.ts` → detail view |
| `delete_plan` | YES | `plan-store.ts` → `removePlan` |
| `create_phase` | YES | `plan-store.ts` → `addPhase` |
| `update_phase_status` | YES | `plan-store.ts` → `updatePhaseStatus` |
| `delete_phase` | YES | `plan-store.ts` → `removePhase` |
| `create_brainstorm_session` | YES | `brainstorm-store.ts` → `addSession` |
| `list_brainstorm_sessions` | YES | `brainstorm-store.ts` → `loadSessions` |
| `update_brainstorm_session` | YES | `brainstorm-store.ts` → `updateSession` |
| `create_key_insight` | YES | `brainstorm-store.ts` → `addInsight` |
| `list_key_insights` | YES | `brainstorm-store.ts` → `loadInsights` |
| `delete_key_insight` | YES | `brainstorm-store.ts` → `removeInsight` |
| `create_worktree_record` | YES | `worktree-store.ts` → `addWorktree` |
| `list_worktree_records` | YES | `worktree-store.ts` → `loadWorktrees` |
| `update_worktree_record` | YES | `worktree-store.ts` → `updateWorktree` |
| `delete_worktree_record` | YES | `worktree-store.ts` → `removeWorktree` |

**Deferred (not wired to any store in MVP):** none identified — all 23 are consumed.
`update_plan` (rename plan) — DEFERRED, no UI for it in MVP scope. Do not implement.

**Total MVP commands this phase: 23**

### Command Implementations

4. `commands/task.rs` — 6 commands:
   - `create_task(deck_id, name, description?, priority?, type?) -> Task`
   - `list_tasks(deck_id) -> Vec<Task>`
   - `get_task(id) -> Task`
   - `update_task(id, name?, description?, priority?, status?) -> Task`
   - `update_task_status(id, status: TaskStatus) -> Task` — dedicated status transition; validate enum at type level
   - `delete_task(id) -> ()`

5. `commands/plan.rs` — 7 commands:
   - `create_plan(deck_id, name, report_path?, plan_path?) -> Plan`
   - `list_plans(deck_id) -> Vec<Plan>` (with phases loaded — 2 queries, group in Rust)
   - `get_plan(id) -> Plan` (with phases)
   - `delete_plan(id) -> ()`
   - `create_phase(plan_id, name, description?, file_path?, order) -> Phase`
   - `update_phase_status(id, status: PhaseStatus) -> Phase`
   - `delete_phase(id) -> ()`

6. `commands/brainstorm.rs` — 6 commands:
   - `create_brainstorm_session(deck_id, prompt) -> BrainstormSession`
   - `list_brainstorm_sessions(deck_id) -> Vec<BrainstormSession>`
   - `update_brainstorm_session(id, status?: BrainstormStatus, report_path?) -> BrainstormSession`
   - `create_key_insight(project_id, deck_id, title, report_path) -> KeyInsight`
   - `list_key_insights(deck_id) -> Vec<KeyInsight>`
   - `delete_key_insight(id) -> ()`

7. `commands/worktree_cmd.rs` — 4 commands (DB records only, not git ops):
   - `create_worktree_record(project_id, task_id, branch) -> Worktree`
   - `list_worktree_records(project_id) -> Vec<Worktree>`
   - `update_worktree_record(id, status?: WorktreeStatus, merged_at?) -> Worktree`
     - No `files_changed` param — field dropped from schema (computed via git2 at display time)
   - `delete_worktree_record(id) -> ()`

8. Register all 23 commands in `lib.rs`

## Todo
- [ ] Extend `models/enums.rs` with task/phase/brainstorm/worktree enums
- [ ] Create all 4 model files (task, plan, brainstorm, worktree)
- [ ] Create `commands/task.rs` (6 commands)
- [ ] Create `commands/plan.rs` (7 commands)
- [ ] Create `commands/brainstorm.rs` (6 commands)
- [ ] Create `commands/worktree_cmd.rs` (4 commands, no files_changed)
- [ ] Register all commands in `lib.rs`
- [ ] Compile check passes

## Success Criteria
- All 23 MVP commands registered and callable
- Enum types enforce valid status/priority/type values at compile time
- Task status transitions validate via enum (no invalid strings)
- Plan queries include nested phases (2-query strategy, no N+1)
- Cascade deletes work (plan → phases, deck → tasks)
- No deferred commands implemented (YAGNI)
- Total command count after P2+P3: 35 (12 + 23)

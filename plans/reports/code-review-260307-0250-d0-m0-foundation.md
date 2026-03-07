# Code Review: D0 (Global Tech Spec) + M0 (Foundation)

## Scope
- Files: 30 (14 new, 16 modified)
- Focus: Rust models, TS interfaces, SQL schema, DB init, CCS discovery
- Build: Rust compiles (17 dead-code warnings), TS passes

## Overall Assessment
Solid foundation. Schema, models, and types are well-aligned. Error handling is consistent (no `.unwrap()` in commands). Cross-platform compliance is good (PathBuf, `dirs` crate). A few issues need attention before merging.

---

## Critical Issues

### C1. Fake UUID generator (ccs.rs:160-175)
`uuid_v4()` uses nanos XOR'd with PID — **not cryptographically random, likely to produce collisions** on fast sequential calls (same nanos) or PID reuse. UUIDs are used as primary keys.

**Fix:** Add `uuid = { version = "1", features = ["v4"] }` to Cargo.toml, replace with `uuid::Uuid::new_v4().to_string()`.

### C2. INSERT OR REPLACE destroys data (ccs.rs:133)
`INSERT OR REPLACE` deletes then re-inserts the row. If a user has modified `project_id` or `status` for an account, `discover_ccs_profiles` will overwrite those fields with defaults. The "upsert by name" comment is also misleading — it upserts by `id`, which is randomly generated each call.

**Fix:** Use `INSERT ... ON CONFLICT(name) DO UPDATE SET provider=excluded.provider, config_path=excluded.config_path, updated_at=excluded.updated_at` and add a UNIQUE constraint on `ccs_accounts(name)`.

---

## High Priority

### H1. Task TS type has `in_progress` status but Rust enum does not
TS `TaskStatus` includes `'in_progress'` but Rust `TaskStatus` only has `Cooking`. If frontend sends `in_progress`, Rust deserialization will fail.

**Fix:** Either add `InProgress` to Rust enum or remove `in_progress` from TS type. Pick one source of truth.

### H2. Plan TS type has `phases: Phase[]` but Rust `Plan` has no phases field
TS `Plan` interface includes an embedded `phases` array. Rust `Plan` struct does not. When Plan is fetched from DB and serialized, the frontend will never receive phases.

**Fix:** Either remove `phases` from TS `Plan` (fetch separately) or add `phases: Vec<Phase>` to Rust `Plan` with `#[serde(default)]`.

### H3. Phase field name mismatch: TS has `order` and `orderIndex`, Rust has `order_index`
TS `Phase` has both `order: number` and `orderIndex?: number`. Rust serializes as `orderIndex` (camelCase). Frontend code using `phase.order` will get `undefined`.

**Fix:** Remove `order` from TS `Phase`, make `orderIndex` required.

### H4. Task TS has both `type` and `taskType` fields
Redundant. Rust sends `taskType`. `type` field will always be undefined.

**Fix:** Remove `type` from TS Task interface.

### H5. Task TS has `worktreeName` field absent from Rust/SQL
Not persisted or serialized. Will always be undefined.

**Fix:** Remove or document as frontend-only computed field.

### H6. Migration not wrapped in transaction (db.rs:57-66)
If migration SQL partially executes before failing, DB is left in inconsistent state — some tables created, version not recorded. Re-run will re-execute the same migration and fail on existing tables (mitigated by `IF NOT EXISTS` but not safe for all future migrations).

**Fix:** Wrap each migration in `BEGIN; ... COMMIT;` or use `conn.execute_batch(&format!("BEGIN; {sql} INSERT INTO schema_version (version) VALUES ({version}); COMMIT;"))`.

---

## Medium Priority

### M1. `discover_ccs_profiles` takes `db: State` but is synchronous I/O
Reads filesystem and writes DB on main thread. For large instance dirs this could block UI. Not critical for MVP but note for later async refactor.

### M2. Deck TS `updatedAt` is optional but Rust/SQL makes it required (has DEFAULT)
Minor mismatch — Rust always sends it. TS should make it required for consistency.

### M3. Task TS `createdAt`/`updatedAt` are optional but Rust always provides them
Same issue. Should be required in TS.

### M4. AccountStatus serialization uses Debug format (ccs.rs:141)
`format!("{:?}", account.status).to_lowercase()` produces lowercase debug string. Works now but fragile — if enum variants change casing or add fields, output changes. Use a proper `Display` impl or match statement.

### M5. 17 dead-code warnings in Rust
Models defined but not yet used in commands. Expected for D0 but should be suppressed with `#[allow(dead_code)]` or used in subsequent phases.

---

## Low Priority

- L1. `config.rs` model not checked — verify it's still used
- L2. `import type { CcsAccount }` at line 98 of tauri.ts is mid-file; move to top with other imports
- L3. `ccs-account-store.ts` is minimal — consider adding `loading`/`error` state for async discovery

---

## Positive Observations
- Consistent `rename_all = "camelCase"` on all structs, `snake_case` on enums — clean IPC contract
- Proper use of `PathBuf::join()` and `dirs::home_dir()` for cross-platform paths
- WAL mode + foreign keys enabled at DB init
- Migration system is simple and extensible
- No `.unwrap()` in command files; all errors mapped to String
- Schema has proper FK constraints with CASCADE/SET NULL and indexes

---

## Recommended Actions (Priority Order)
1. Replace fake UUID with `uuid` crate (C1)
2. Fix upsert logic for CCS accounts — add UNIQUE(name) constraint (C2)
3. Align TaskStatus between Rust and TS (H1)
4. Remove `phases` from TS Plan or add to Rust (H2)
5. Fix Phase `order`/`orderIndex` duplication (H3)
6. Clean up Task TS redundant fields (H4, H5)
7. Wrap migrations in transactions (H6)
8. Make optional TS timestamp fields required where Rust always provides them (M2, M3)

## Metrics
- Type Coverage: Good (all models typed both sides)
- Test Coverage: 0% (no tests yet — expected for D0/M0)
- Linting: 17 Rust dead-code warnings, 0 TS errors
- Build: Passes on both Rust and TS

## Unresolved Questions
- Is `chrono` already a dependency or was it added? (`ccs.rs:28` uses `chrono::Utc::now()`)
- Should CCS account discovery be project-scoped or global? Current schema allows both (nullable project_id) but discovery always sets `project_id: None`
- Will the `phases` table status field use `in_progress` (snake_case) in SQL? Rust serializes `InProgress` as `in_progress` via serde — need to verify DB read/write roundtrip

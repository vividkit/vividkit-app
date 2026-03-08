# Code Review: M2 (Onboarding), M3 (Dashboard), M10 (Settings)

## Scope
- **Rust**: `commands/project.rs`, `commands/dashboard.rs`, `commands/settings.rs`, `lib.rs`
- **Frontend**: `use-onboarding.ts`, `use-dashboard.ts`, `tauri.ts`, `settings-store.ts`, `project-store.ts`, `router.tsx`, `App.tsx`, onboarding components, `stats-cards.tsx`, `settings.tsx`
- **TypeScript**: Clean build (0 errors)
- **Focus**: Cross-platform, error handling, no mocks, i18n, type safety, security

## Overall Assessment

Solid implementation. Clean separation (hook -> store -> IPC), proper error handling throughout, no mocks remaining. Settings dual-layer (localStorage + debounced DB) is well-designed. Minor issues found below.

## Critical Issues

None.

## High Priority

### H1. `create_project` not transactional
**File**: `src-tauri/src/commands/project.rs:18-32`
Project insert + deck insert are two separate `conn.execute()` calls. If deck insert fails, orphan project remains in DB.
**Fix**: Wrap in `conn.execute_batch("BEGIN; ... COMMIT;")` or use rusqlite transaction:
```rust
let tx = conn.unchecked_transaction().map_err(|e| format!("tx: {e}"))?;
// ... inserts ...
tx.commit().map_err(|e| format!("commit: {e}"))?;
```

### H2. `app_settings` table created outside migration system
**File**: `src-tauri/src/commands/settings.rs:37-43`
`CREATE TABLE IF NOT EXISTS` runs on every `get_settings` / `update_settings` call. This bypasses the migration system in `001_initial_schema.sql` and adds overhead per call.
**Fix**: Add `app_settings` table to migration schema. Remove inline `CREATE TABLE` from both functions.

### H3. `get_active_project` calls `list_projects` — fetches ALL projects just to get first
**File**: `src-tauri/src/commands/project.rs:77-81`
Inefficient for large project counts. Also, `list_projects` requires `State<'_, DbState>` passed through.
**Fix**: Direct SQL `SELECT ... FROM projects ORDER BY created_at DESC LIMIT 1`.

## Medium Priority

### M1. Clone flow has no actual `git clone` implementation
**File**: `use-onboarding.ts:54`
When `gitMethod === 'clone'`, the code passes `cloneUrl` as `gitPath` to `create_project`. No actual cloning happens. User sees clone option but it just stores a URL string as path.
**Fix**: Either implement a Rust `git_clone` command or remove clone option from onboarding for v0.1 scope.

### M2. `validate_git_repo` not called before project creation
**File**: `use-onboarding.ts:48-77`
User can skip validation and create project with invalid git path. `step-git-setup.tsx` validates on blur/browse but `finish()` doesn't re-validate.
**Fix**: Add validation check in `finish()` before `createProject()`.

### M3. Settings version string hardcoded, not i18n-compliant
**File**: `src/pages/settings.tsx:35`
`'v0.1.0 (Dev Mode)'` — hardcoded English string.
**Fix**: Use `t('pages.settings.version', { version: '0.1.0' })` and similar for dev mode suffix.

### M4. `RootRedirect` calls `loadProjects()` again
**File**: `src/router.tsx:27-29`
`App.tsx` already calls `loadProjects()` on mount. `RootRedirect` calls it again. The `loaded` guard prevents double-fetch, but if `App.tsx` hasn't finished loading yet, `RootRedirect` may trigger a second concurrent call before `loaded` flips.
**Fix**: Remove `loadProjects()` from `RootRedirect` since `App.tsx` handles it. Just check `loaded` state.

### M5. Dashboard stats: `brainstormCount` not shown in UI
**File**: `stats-cards.tsx`
`brainstorm_count` is fetched from DB but not rendered in `StatsCards`. Unnecessary DB query.
**Fix**: Either add brainstorm stat card or remove from `DashboardStats` query.

## Low Priority

### L1. `list_projects` / `list_decks` — repetitive row mapping
Could extract a helper macro or function for the query_map + collect pattern used identically in both functions.

### L2. Settings `saveTimer` is module-level mutable state
**File**: `settings-store.ts:82`
Works fine but if store is ever used in SSR context, this would break. Low risk for Tauri desktop.

## Edge Cases Found by Scout

1. **Race condition**: If user clicks "Launch" rapidly, `creating` guard exists but `canFinish` is computed outside the callback (stale closure risk on `formData`). The `useCallback` deps include `formData` so this is mitigated, but worth noting.
2. **Empty project name with whitespace**: `projectName: "   "` — trimmed check exists in button disable and `finish()`, good.
3. **DB lock contention**: All Rust commands lock `Mutex<Connection>`. If dashboard stats query is slow, it blocks project creation. Acceptable for v0.1 single-user but note for future.
4. **Settings merge on app load**: If localStorage has newer settings than DB (e.g., DB was wiped), `loadFromDb` overwrites localStorage settings. The `dbLoaded` flag prevents re-load but first load always prefers DB. This is correct behavior.

## Positive Observations

- All user-facing strings use `t()` — i18n compliance is strong
- `serde(rename_all = "camelCase")` on all Rust models — TS/Rust type alignment verified
- Proper `Result<T, String>` on every command, no `.unwrap()` found
- Settings normalization/validation is thorough with fallbacks
- `PathBuf::from()` used in `validate_git_repo` — cross-platform OK
- No sensitive data exposed (no API keys, passwords in IPC)
- Zustand stores are clean, single-responsibility
- Lazy loading with `React.lazy()` for all pages

## Recommended Actions (Priority Order)

1. **H1** — Wrap `create_project` in transaction (data integrity)
2. **H2** — Move `app_settings` to migration schema (consistency)
3. **M1** — Remove or stub clone option for v0.1 (user confusion)
4. **M2** — Re-validate git path in `finish()` (robustness)
5. **H3** — Optimize `get_active_project` query (minor perf)
6. **M3** — i18n the version string

## Metrics

- Type Coverage: 100% (TS strict, no `any` found)
- Test Coverage: Not assessed (no tests in scope)
- Linting Issues: 0 (TypeScript compiles clean)
- Rust: Not compiled in this review (no `cargo check` run)

## Unresolved Questions

1. Is git clone actually planned for v0.1? If not, should the clone option be hidden in onboarding?
2. Should `app_settings` support per-project settings in future? Current single-row design may need rethinking.

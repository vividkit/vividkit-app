# Phase 6 — App Initialization + Integration

## Context
- Phases 1-5 complete: DB, commands, IPC, stores all wired
- Need: app boot sequence, first-launch detection, smoke testing

## Overview
- **Priority:** P2
- **Status:** Pending
- **Description:** Wire app initialization flow — DB setup, load settings + active project on boot. Handle first-launch → redirect to onboarding.

## Files to Modify
- `src/App.tsx` (or root component) — Add init hook
- `src/stores/project-store.ts` — Add `initialized` flag

## Files to Create
- `src/hooks/use-app-init.ts` — Orchestrates boot sequence

## Implementation Steps

<!-- Red Team: useAppInit error handling — 2026-02-24 -->
1. Create `use-app-init.ts` hook with error state and error screen support:
```typescript
export function useAppInit() {
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const loadProjects = useProjectStore((s) => s.loadProjects);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        await loadSettings();
        await loadProjects();
        setReady(true);
      } catch (e) {
        setError(String(e));
        // Do NOT set ready=true — keep app in error state
      }
    }
    init();
  }, []);

  return { ready, error };
}
```

2. In root component: check `error` first → render error screen; else check `ready` → show splash; else render router:
```typescript
const { ready, error } = useAppInit();

if (error) return <ErrorScreen message={error} />;  // NOT a blank/broken app
if (!ready) return <SplashScreen />;
return <RouterOutlet />;
```

3. First-launch detection: if `projects.length === 0` after load → redirect to `/onboarding`

<!-- Red Team: activeProjectId in DB only — 2026-02-24 -->
4. Active project restore — **use `app_settings.last_active_project_id` only. No localStorage.**
   - On boot: read `last_active_project_id` from settings (already loaded in step 1)
   - Validate the project still exists: `projects.find(p => p.id === last_active_project_id)`
   - If found → `setActiveProject(last_active_project_id)`
   - If not found (project deleted) → fall back to first project or null; clear stale value
   - On project switch: call `updateSettings({ last_active_project_id: id })` to persist

5. Integration smoke test checklist:
   - App launches → DB created ✓
   - Settings loaded (default theme/language) ✓
   - Empty project list → onboarding redirect ✓
   - Create project via UI → persists in DB ✓
   - Create deck → persists ✓
   - Restart app → data still there ✓
   - DB init failure → error screen shown (not blank app) ✓
   - `last_active_project_id` restored on restart ✓
   - Stale `last_active_project_id` (project deleted) → graceful fallback ✓

## Todo
- [ ] Create `use-app-init.ts` hook with `error` state
- [ ] Wire init hook into root component (error screen + splash + router)
- [ ] Implement first-launch → onboarding redirect
- [ ] Active project restore from `app_settings.last_active_project_id` (validate exists)
- [ ] Persist active project on switch via `updateSettings`
- [ ] Remove any localStorage usage for active project
- [ ] Manual smoke test: full create→restart→verify cycle
- [ ] Verify all routes render (may show empty states, that's OK)

## Success Criteria
- App boots cleanly: DB init → settings load → projects load → render
- First launch (no DB) → creates DB → redirects to onboarding
- Subsequent launches → loads existing data → goes to dashboard
- **DB init failure → renders error screen, not blank/broken app**
- Active project ID persisted in DB (not localStorage), validated on restore
- No console errors related to DB/IPC on startup
- CCS PTY features still work (no regression)

## Risk Assessment
- **Boot time:** DB init should be <100ms (SQLite is fast)
- **Error handling:** If DB init fails → show error screen, not blank app (enforced via `error` state)
- **Migration:** Future schema changes need V2 migration (not in scope, but design supports it)

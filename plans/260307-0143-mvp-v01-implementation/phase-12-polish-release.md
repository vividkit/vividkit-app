# Phase 12 — Polish + Release (M11)

## Overview
- **Priority:** P1
- **Status:** pending
- **Goal:** Error boundaries, empty states, toast, offline resilience, cross-platform, app icon, build pipeline.

## Key Insights
- All 13 routes must be functional before this phase
- Empty states needed for: tasks, plans, brainstorm sessions, worktrees, decks
- Error boundaries on every route prevent full-app crashes
- Offline = CCS not installed → show install guide
- i18n parity: all keys in both vi + en

## Requirements
- Error boundary wrapper on all route pages
- Empty state components for all list views
- Toast notification system (success/error/info)
- Offline resilience: detect CCS not installed, show install guide link
- Cross-platform testing: macOS primary, Windows + Linux secondary
- App icon design + Tauri metadata (name, version, identifier)
- Build pipeline: GitHub Actions for macOS/Windows/Linux builds
- i18n sweep: verify all keys exist in both locales

## Related Code Files

**CREATE:**
- `src/components/ui/error-boundary.tsx`
- `src/components/ui/empty-state.tsx` — reusable empty state with icon + message + action
- `src/components/ui/toast-provider.tsx` — if not using shadcn toast
- `src/components/layout/offline-banner.tsx` — CCS not installed warning
- `.github/workflows/build.yml` — release build pipeline

**MODIFY:**
- `src/router.tsx` — wrap routes in error boundaries
- `src/pages/*.tsx` — add empty states to all list pages
- `src/App.tsx` — add toast provider + offline check
- `src-tauri/tauri.conf.json` — app metadata, icon paths, bundle config
- `src/locales/vi/*.json` + `src/locales/en/*.json` — i18n parity sweep
- `src-tauri/src/commands/ccs.rs` — add check_ccs_installed command

## Implementation Steps

1. Create `error-boundary.tsx`: React error boundary with fallback UI + retry button
2. Create `empty-state.tsx`: icon, title, description, optional action button — reusable
3. Add empty states to: tasks, plans, brainstorm, worktrees, decks, dashboard pages
4. Setup toast: use shadcn/ui Toast or sonner — wrap App in provider
5. Add toast calls to all CRUD operations (success/error feedback)
6. Create offline-banner: invoke `check_ccs_installed` on startup, show banner if missing
7. Wrap all route pages in error boundary
8. i18n sweep: script to compare en/*.json vs vi/*.json keys, fill missing
9. App icon: add icon files to `src-tauri/icons/`
10. Update tauri.conf.json: app name "VividKit", identifier, version "0.1.0"
11. Create GitHub Actions workflow: build on push to main for macOS/Windows/Linux
12. Cross-platform testing checklist: sidebar, dialogs, file paths, CCS detection

## Todo List
- [ ] Error boundary component + route wrapping
- [ ] Empty state component + all list pages
- [ ] Toast notification system
- [ ] Offline/CCS detection banner
- [ ] i18n parity sweep
- [ ] App icon + Tauri metadata
- [ ] GitHub Actions build pipeline
- [ ] Cross-platform smoke test

## Success Criteria
- No unhandled errors crash the app
- All list views show meaningful empty states
- Toast feedback on all user actions
- CCS not installed → helpful install guide shown
- App builds on macOS, Windows, Linux
- All i18n keys present in both locales

## Risk Assessment
- Cross-platform differences in file paths, CCS location, git behavior
- Windows: PTY handling differences already addressed in ai.rs
- Linux: may need additional Tauri dependencies (webkit2gtk)

## Next Steps
- Release v0.1.0

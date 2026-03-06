# Project Changelog

## 2026-03-06

### Added
- Frontend internationalization with `react-i18next`.
- Vietnamese (`vi`) and English (`en`) locale bundles under `src/locales/` with domain-split JSON files.
- i18n bootstrap layer in `src/i18n/` and language synchronization from settings store.

### Changed
- Default app language changed to Vietnamese (`vi`) for first run.
- Language selection in Settings (General) now persists and applies at runtime.
- User-facing UI text migrated to translation keys across core modules (layout, onboarding, dashboard, settings, decks, tasks, plans, worktrees, brainstorm, cook, ccs-stream).
- Settings rehydration now sanitizes persisted values (language/theme/font size/default branch/worktrees dir/command providers) to prevent invalid localStorage state.
- i18n bootstrap now resolves persisted language before first paint and supports both persisted shapes (`state.settings` and `settings`) to avoid locale flicker.
- `generate-plan` simulation now prevents duplicate plan/task creation from effect re-runs and localizes generated phase names.
- Shared `Dialog`/`Sheet` close labels now update on language changes without relying on provider-only hooks.
- Remaining `ccs-stream` fallback/status strings were localized (waiting states, counts, exit code, metadata labels, and edit indexes).

### Notes
- Current i18n config uses `fallbackLng` chain `vi -> en` and `en -> vi`.

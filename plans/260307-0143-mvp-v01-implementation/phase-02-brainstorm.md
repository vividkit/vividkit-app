# Phase 02 — Brainstorm (M1)

## Overview
- **Priority:** P0 — CORE VALUE milestone
- **Status:** pending
- **Goal:** AI ideation via StreamView. Profile selector, input area, session persistence, Key Insights, Report page.

## Key Insights
- StreamView + JSONL parser already built in `src/components/ccs-stream/`
- `watch_session_log` + `spawn_ccs` already working
- BrainstormSession.sessionLogPath = source of truth; markdown report = derived
- Post-completion: View Report, Create Plan, Save as Key Insight
- This milestone validates the entire CCS + StreamView E2E flow

## Requirements
- Brainstorm page shows StreamView with profile selector + text input
- User picks CCS profile, types idea, CCS runs `/ck:brainstorm` command
- Session log persisted to BrainstormSession in DB
- Post-completion actions: View Report, Create Plan, Save Insight
- Key Insights dialog shows saved insights per deck
- `/brainstorm/:id` report page renders session as article

## Architecture

```
BrainstormPage
  ├── DeckContextBar (active deck display)
  ├── ProfileSelector (CCS profile dropdown)
  ├── StreamView (from ccs-stream/)
  ├── BrainstormInput (text input + submit)
  └── BrainstormActions (post-completion buttons)
```

## Related Code Files

**CREATE:**
- `src-tauri/src/commands/brainstorm.rs` — CRUD: create/list/get BrainstormSession, create/list KeyInsight
- `src/hooks/use-brainstorm.ts` — session lifecycle, spawn CCS, persist session
- `src/hooks/use-key-insights.ts` — CRUD for insights
- `src/components/brainstorm/profile-selector.tsx` — CCS profile dropdown (reusable)

**MODIFY:**
- `src/pages/brainstorm.tsx` — wire to real StreamView + hooks
- `src/pages/brainstorm-report.tsx` — render session log as report
- `src/components/brainstorm/brainstorm-input.tsx` — connect to hook
- `src/components/brainstorm/brainstorm-actions.tsx` — post-completion logic
- `src/components/brainstorm/brainstorm-terminal.tsx` — replace with StreamView usage
- `src/components/brainstorm/key-insights-dialog.tsx` — wire to DB
- `src/components/brainstorm/report-preview-dialog.tsx` — parse JSONL to article
- `src/components/brainstorm/deck-context-bar.tsx` — show active deck
- `src/stores/brainstorm-store.ts` — sessions + insights from DB
- `src/lib/tauri.ts` — add brainstorm command wrappers
- `src-tauri/src/commands/mod.rs` — export brainstorm module
- `src-tauri/src/lib.rs` — register brainstorm commands

## Implementation Steps

1. Create `commands/brainstorm.rs`:
   - `create_brainstorm_session(deck_id, prompt) -> BrainstormSession`
   - `list_brainstorm_sessions(deck_id) -> Vec<BrainstormSession>`
   - `get_brainstorm_session(id) -> BrainstormSession`
   - `update_brainstorm_session(id, status, session_log_path)`
   - `create_key_insight(deck_id, title, content, session_id?) -> KeyInsight`
   - `list_key_insights(deck_id) -> Vec<KeyInsight>`
2. Register commands in lib.rs
3. Add typed wrappers in tauri.ts
4. Create `profile-selector.tsx` — fetches CCS accounts, renders dropdown (reusable across Cook, Generate Plan)
5. Create `use-brainstorm.ts` hook:
   - startSession(): create DB record → spawn_ccs with `/ck:brainstorm` → find session log → update DB with path → start watching
   - stopSession(): stop_ccs
   - State: session, isStreaming, entries
6. Update `brainstorm.tsx` page to compose: DeckContextBar + ProfileSelector + StreamView + Input + Actions
7. Wire BrainstormActions to navigate to /generate-plan, save insight dialog
8. Update brainstorm-store to fetch from DB
9. Wire key-insights-dialog to use-key-insights hook
10. Implement brainstorm-report page: load session by ID, parse JSONL, render as article

## Todo List
- [ ] commands/brainstorm.rs — CRUD
- [ ] use-brainstorm.ts hook
- [ ] profile-selector.tsx (reusable)
- [ ] Brainstorm page wired to StreamView
- [ ] Session persistence to DB
- [ ] Key Insights CRUD
- [ ] Brainstorm Report page
- [ ] brainstorm-store wired to DB

## Success Criteria
- User selects profile, types idea, sees StreamView output
- Session persisted in DB with sessionLogPath
- Can save key insight from completed session
- Report page renders readable article from JSONL
- StreamView smooth with 500+ entries

## Risk Assessment
- Session log path discovery timing — `findNewSessionLog` polling already handles this
- Large sessions may slow report rendering — consider virtualization

## Next Steps
- M5 (Generate Plan) uses brainstorm output as context

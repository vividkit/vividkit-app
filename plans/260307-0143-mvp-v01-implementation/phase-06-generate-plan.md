# Phase 06 — Generate Plan (M5)

## Overview
- **Priority:** P0
- **Status:** pending
- **Goal:** Plan generation via StreamView, pipeline progress indicator, Plan + Phases creation in DB.

## Key Insights
- Runs `/ck:plan` via CCS with brainstorm context
- Pipeline indicator shows: Generate (active) → Tasks (v0.1 skips Validate/RedTeam)
- After completion: CCS writes plan.md + phase files on disk
- VividKit parses plan output to create Plan + Phase records in DB
- Reuses ProfileSelector from Phase 02

## Requirements
- Generate Plan page with pipeline progress bar (Generate → Tasks, simplified for v0.1)
- StreamView shows plan generation conversation
- After CCS completes: parse plan.md to extract phases
- Create Plan + Phase records in DB
- Completion action: "Review Plan" → navigate to `/plans/:id`

## Architecture

```
GeneratePlanPage
  ├── PipelineProgress (step indicator)
  ├── ProfileSelector (reused)
  ├── StreamView (from ccs-stream/)
  └── CompletionActions ("Review Plan" button)
```

## Related Code Files

**CREATE:**
- `src-tauri/src/commands/plan.rs` — create_plan, create_phases, list_plans, get_plan
- `src/hooks/use-generate-plan.ts` — orchestrate plan generation flow
- `src/components/generate-plan/pipeline-progress.tsx`

**MODIFY:**
- `src/pages/generate-plan.tsx` — wire to StreamView + hooks
- `src/components/generate-plan/` — existing shells
- `src/stores/plan-store.ts` — wire to DB
- `src/lib/tauri.ts` — add plan command wrappers
- `src-tauri/src/commands/mod.rs` — export plan module
- `src-tauri/src/lib.rs` — register commands

## Implementation Steps

1. Create `commands/plan.rs`:
   - `create_plan(deck_id, name, plan_path, report_path?) -> Plan`
   - `create_phases(plan_id, phases: Vec<PhaseInput>) -> Vec<Phase>`
   - `list_plans(deck_id) -> Vec<Plan>` (with phase counts + progress)
   - `get_plan(id) -> Plan` (with phases)
   - `update_phase_status(phase_id, done: bool)`
2. Register commands, add tauri.ts wrappers
3. Create `pipeline-progress.tsx`: step indicator (Generate → Tasks for v0.1)
4. Create `use-generate-plan.ts`:
   - startGeneration(): spawn_ccs with `/ck:plan` + brainstorm context
   - After completion: read plan.md from disk, extract phase info
   - Create Plan + Phase records in DB
   - State: isGenerating, plan, phases
5. Wire generate-plan page: ProfileSelector + StreamView + PipelineProgress + completion actions
6. Completion: navigate to `/plans/:id`

## Todo List
- [ ] commands/plan.rs — CRUD
- [ ] use-generate-plan.ts hook
- [ ] Pipeline progress component
- [ ] Generate Plan page functional
- [ ] Plan + Phase records created in DB after generation
- [ ] plan-store wired to DB

## Success Criteria
- User generates plan via StreamView
- Plan + phases saved to DB with file paths
- Pipeline indicator shows current step
- Navigation to Plan Review works

## Risk Assessment
- **Plan parsing**: How to extract phases from AI-generated plan.md? Options: regex on markdown headers, structured output from CCS, or manual phase creation. Start with regex on `## Phase N` headers.

## Next Steps
- M6 (Plans List + Review) displays plans created here

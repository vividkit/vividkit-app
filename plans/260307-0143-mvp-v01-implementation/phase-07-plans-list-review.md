# Phase 07 — Plans List + Review (M6)

## Overview
- **Priority:** P1
- **Status:** pending
- **Goal:** Plan cards list with progress bar, Plan Review page with phases checklist + markdown preview.

## Key Insights
- Plans list shows cards with phase completion percentage
- Plan Review has two views: Phases (checklist) and Preview (markdown)
- Cook button on individual phases opens Cook Sheet (implemented in M8)
- Related Tasks section shows tasks linked to this plan

## Requirements
- `/plans` page: list plan cards with name, date, phase progress bar
- `/plans/:id` page: plan header + phases checklist + markdown preview toggle
- Phase checklist: toggle done status, show file path
- Markdown preview: render plan.md content
- Related Tasks section (read-only links to tasks)

## Related Code Files

**CREATE:**
- `src/hooks/use-plan-review.ts` — fetch plan + phases, toggle phase done
- `src/components/plans/plan-card.tsx`
- `src/components/plans/phase-checklist.tsx`
- `src/components/plans/plan-markdown-preview.tsx`

**MODIFY:**
- `src/pages/plans.tsx` — wire to plan list
- `src/pages/plan-review.tsx` — wire to plan detail
- `src/components/plans/` — existing shells
- `src/stores/plan-store.ts` — list + detail state
- `src/lib/tauri.ts` — ensure plan wrappers exist (from M5)

## Implementation Steps

1. Create `use-plan-review.ts`:
   - Fetch plan + phases by ID
   - togglePhase(phaseId): update_phase_status
   - Load plan.md content for preview (invoke read_file or similar)
2. Wire `/plans` page:
   - Fetch list_plans for active deck
   - Render plan cards with progress bars (done phases / total phases)
   - Click card → navigate to `/plans/:id`
3. Wire `/plans/:id` page:
   - Plan header: name, date, progress bar, status
   - Tabs or toggle: Phases | Preview
   - Phases: checklist with done toggle + file path display
   - Preview: react-markdown rendering of plan.md
4. Related Tasks section: query tasks by planId, show as linked list

## Todo List
- [ ] use-plan-review.ts hook
- [ ] Plan cards on /plans page
- [ ] Plan Review page with phases + preview
- [ ] Phase done toggle functional
- [ ] Markdown preview rendering
- [ ] Related tasks display

## Success Criteria
- Plans list shows all plans for active deck with progress
- Plan Review toggles phase completion
- Markdown preview renders plan.md correctly
- Navigation between plans list and detail works

## Risk Assessment
- Reading plan.md from disk requires file read command — may need `commands/fs.rs` expansion
- Large markdown files could be slow to render — unlikely for plan files

## Next Steps
- Cook Sheet integration (from M8) will add Cook button to phase items

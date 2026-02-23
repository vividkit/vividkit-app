---
phase: 05
title: "Brainstorm + Report"
status: completed
effort: 3h
depends_on: [phase-04]
---

# Phase 05: Brainstorm + Report

## Overview

Terminal-style AI interaction panel with streaming output simulation. Report preview dialog. Key insights management.

## Components

```
src/components/brainstorm/
  brainstorm-terminal.tsx       # xterm.js panel (streaming output)
  brainstorm-input.tsx          # Mono input + button
  brainstorm-actions.tsx        # Post-completion: View Report, Create Plan, Save Insight
  report-preview-dialog.tsx     # Full report in scrollable dialog
  key-insights-dialog.tsx       # Saved insights list
  deck-context-bar.tsx          # Active deck name + Key Insights button
  index.ts

src/pages/brainstorm.tsx
src/pages/brainstorm-report.tsx  # /brainstorm/:id full-page report
```

## Terminal Panel (brainstorm-terminal.tsx)

xterm.js rules:
```tsx
useEffect(() => {
  // Only mount when tab visible
  const term = new Terminal({ ... })
  term.loadAddon(new FitAddon())
  term.open(containerRef.current)
  return () => term.dispose() // ALWAYS dispose on unmount
}, [])
```

States:
- **idle:** "Ready to brainstorm. Enter your idea below."
- **running:** stream lines every 400ms via `term.write()`. Command lines in primary color, success green, paths blue. Blinking cursor.
- **completed:** all lines shown, cursor off

## Streaming Simulation

Use `setInterval` (400ms) to write lines one by one. Clear interval on component unmount. Store session in `brainstormStore`.

## Post-Completion Actions (brainstorm-actions.tsx)

Shown only when status === 'completed':
- **View Report** (outline) → opens ReportPreviewDialog
- **Create Implementation Plan** → navigate to `/generate-plan`
- **Save as Key Insight** (ghost) → `addInsight()` → toast

## Report Preview Dialog

- Max width `2xl`, 85vh max height, overflow-y-auto body
- Sticky header: "Brainstorm Report" + "5 min read"
- Prose content: title → overview → phases (numbered circles) → tech stack
- Typography: `text-[15px] leading-relaxed`, orange bullet dots

## Key Insights Dialog

- Lists `brainstormStore.insights` filtered by active deck
- Each: title, deck name, date
- Actions per item: Continue Session (navigate to brainstorm), View, Delete

## Brainstorm Report Page (/brainstorm/:id)

```
src/pages/brainstorm-report.tsx:
  - Back button → /brainstorm
  - Export + Share buttons (UI only)
  - Key Insights: 3-col card grid (icon + title + description)
  - Action Items: numbered list with orange circles
```

## Todo List

- [ ] Create deck-context-bar.tsx
- [ ] Create brainstorm-terminal.tsx (xterm.js, dispose on unmount)
- [ ] Create brainstorm-input.tsx
- [ ] Create brainstorm-actions.tsx (conditional on status)
- [ ] Create report-preview-dialog.tsx
- [ ] Create key-insights-dialog.tsx
- [ ] Wire brainstorm-store (add session, update status)
- [ ] Create brainstorm-report.tsx page
- [ ] Verify terminal disposes on unmount

## Success Criteria

- Terminal streams output in running state
- terminal.dispose() called on unmount (no memory leaks)
- "Save as Key Insight" adds to store + shows toast
- "Create Implementation Plan" navigates to /generate-plan
- Report dialog scrolls correctly at 85vh

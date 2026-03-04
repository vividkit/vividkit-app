# Phase 03 — Fix Stream Output Height and Scroll Behavior

## Context Links

- `src/components/settings/ccs-test-console.tsx`
- `src/components/ccs-stream/stream-view.tsx`
- `docs/design-system.md`

## Overview

- Priority: P2
- Status: pending
- Goal: stream output stays fixed-height and scrolls internally; no auto-expand with long content.

## Key Insights

- Current stream container relies on flex growth and may expand in unconstrained parent contexts.
- Scroll logic exists but depends on container height constraint.

## Requirements

- Functional:
  - Stream panel has fixed height (or tightly bounded min/max height) in CCS Test Console.
  - Long output remains inside internal scroll area.
- Non-functional:
  - Preserve current status bar and message rendering.
  - Keep responsive behavior on smaller viewports.

## Architecture

- Height constraint at console panel wrapper (single source of layout truth).
- Scroll remains owned by `StreamView` message container (`overflow-y-auto`).

## Related Code Files

- Modify:
  - `src/components/settings/ccs-test-console.tsx`
  - `src/components/ccs-stream/stream-view.tsx`
- Create: none
- Delete: none

## Implementation Steps

1. Set explicit stream panel height class in `CcsTestConsole` (proposal: `h-[420px]` with responsive fallback).
2. Keep `min-h-0` and `overflow-hidden` on wrapper.
3. Ensure `StreamView` scroll container remains `overflow-y-auto` with full panel height.
4. Manual check for long AI output + many question cards.

## Todo List

- [ ] Apply fixed-height panel class in console wrapper
- [ ] Verify internal scroll remains smooth and auto-scroll near bottom still works
- [ ] Confirm no layout break on narrow windows

## Success Criteria

- Panel height no longer grows with content.
- Scrollbar appears inside panel after overflow.
- Header/controls stay fixed above panel.

## Risk Assessment

- Risk: fixed height too small on low-res screens.
- Mitigation: use responsive class (`h-[380px] sm:h-[420px] lg:h-[520px]`) if needed.

## Security Considerations

- No security impact.

## Next Steps

- Run full validation checklist in Phase 04.

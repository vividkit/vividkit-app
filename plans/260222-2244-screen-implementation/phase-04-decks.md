---
phase: 04
title: "Decks"
status: completed
effort: 2h
depends_on: [phase-01]
---

# Phase 04: Decks

## Overview

Deck list with active deck selection, create deck dialog. Project selector bar at top.

## Components

```
src/components/decks/
  deck-list.tsx           # Grid of deck cards
  deck-card.tsx           # Individual deck: status dot, name, actions
  create-deck-dialog.tsx  # Dialog with name/desc/insight fields
  project-selector.tsx    # Bordered chip + Settings link
  index.ts

src/pages/decks.tsx
```

## Deck Card

```tsx
// Active: border-primary shadow-md
// Status dot: orange (active) | gray (inactive)
// Actions: Brainstorm → /brainstorm, Tasks (count badge) → /tasks
```

Only one deck active at a time. Clicking a deck calls `setActiveDeck(id)`.

## Create Deck Dialog

Fields:
- Deck Name (required, Input)
- Description (optional, Textarea)
- Based on Key Insight (optional, Select from brainstormStore.insights)

On submit: `addDeck()` → close dialog.

## Todo List

- [ ] Create project-selector.tsx
- [ ] Create deck-card.tsx (active state styling)
- [ ] Create deck-list.tsx
- [ ] Create create-deck-dialog.tsx (shadcn Dialog)
- [ ] Wire setActiveDeck in store
- [ ] Verify only one active deck at a time
- [ ] No TS errors

## Success Criteria

- Clicking deck sets it as active (orange dot + border-primary)
- Create dialog opens, validates name, adds to store
- Brainstorm/Tasks buttons navigate correctly

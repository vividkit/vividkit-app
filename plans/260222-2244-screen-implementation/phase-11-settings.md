---
phase: 11
title: "Settings"
status: completed
effort: 2h
depends_on: [phase-01]
---

# Phase 11: Settings

## Overview

4-tab settings screen. Reads/writes settingsStore. AI & Commands tab shows CCS accounts from projectStore.

## Components

```
src/components/settings/
  settings-general.tsx        # Language Select
  settings-ai-commands.tsx    # AI providers list + command mapping
  settings-git.tsx            # Branch + worktrees dir inputs
  settings-editor.tsx         # Theme, auto-save, font size
  ccs-account-card.tsx        # Provider + email + status badge
  command-provider-row.tsx    # /command + description + provider Select
  index.ts

src/pages/settings.tsx
```

## Tab Structure

```tsx
// shadcn Tabs component
const TABS = ['general', 'ai-commands', 'git', 'editor']
```

## General Tab (settings-general.tsx)

- Card with Globe icon
- Language: Select with options English | Vietnamese
- `updateSettings({ language: value })`

## AI & Commands Tab (settings-ai-commands.tsx)

### AI Providers Section

```tsx
// Read from projectStore.activeProject.ccsAccounts
// Empty state: "No CCS accounts connected" + `ccs detect` hint
```

CcsAccountCard:
- Bot icon (primary bg) + provider label + model name + email
- Status badge: Active (green) | Paused (warning) | Exhausted (destructive)

### Command → Provider Mapping

```tsx
const COMMANDS = ['/plan', '/brainstorm', '/cook', '/review', '/test']
```

CommandProviderRow:
- Terminal icon + `/command` (mono font) + description
- Select with only active CCS accounts as options
- `updateSettings({ commandProviders: { ...current, [cmd]: value } })`

## Git Tab (settings-git.tsx)

Two fields, each in a card row with icon + label + description:
- Default Branch: Input, placeholder "main"
- Worktrees Directory: Input, placeholder ".worktrees"

`updateSettings()` on blur (not on every keystroke).

## Editor Tab (settings-editor.tsx)

- Theme: Select — Light | Dark → also calls `document.documentElement.classList.toggle('dark')`
- Auto-save: Switch (shadcn Switch component)
- Font Size: Select — 12px | 14px | 16px | 18px

## Todo List

- [ ] Create settings-general.tsx
- [ ] Create ccs-account-card.tsx
- [ ] Create command-provider-row.tsx
- [ ] Create settings-ai-commands.tsx
- [ ] Create settings-git.tsx (blur-on-save pattern)
- [ ] Create settings-editor.tsx (theme toggle wires to DOM)
- [ ] Create settings page with 4 tabs
- [ ] Wire all fields to settingsStore.updateSettings()

## Success Criteria

- All 4 tabs render and switch correctly
- Language Select updates store
- CCS accounts from projectStore appear in AI tab
- Only active accounts appear in command provider dropdowns
- Theme toggle adds/removes 'dark' class on html element
- Git fields save on blur
- Font size Select updates store

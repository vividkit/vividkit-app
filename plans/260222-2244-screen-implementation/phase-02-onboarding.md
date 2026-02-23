---
phase: 02
title: "Onboarding + New Project"
status: completed
effort: 3h
depends_on: [phase-01]
---

# Phase 02: Onboarding + New Project

## Overview

4-step onboarding wizard (standalone, no sidebar). New Project screen reuses Git setup from step 1.

## Components to Create

```
src/components/onboarding/
  onboarding-wizard.tsx      # Main wizard container, step state
  step-welcome.tsx           # Step 0: logo + CTA
  step-git-setup.tsx         # Step 1: local/clone git cards
  step-ai-tools.tsx          # Step 2: detect Claude Code + CCS
  step-project-setup.tsx     # Step 3: name + summary + launch
  progress-indicator.tsx     # Left sidebar numbered circles
  index.ts

src/components/new-project/
  new-project-form.tsx       # Reuses git-setup pattern
  index.ts

src/pages/onboarding.tsx     # Renders OnboardingWizard
src/pages/new-project.tsx    # Renders NewProjectForm
```

## Key Interactions

### Step 1 — Git Setup
Two cards toggle on click:
```tsx
// border-primary shadow-md when selected
const [gitMethod, setGitMethod] = useState<'local' | 'clone'>('local')
```
- Local: path input + Browse button (invoke Tauri dialog)
- Clone: URL input + destination path

### Step 2 — AI Detection
```tsx
// simulate detection: button → isDetecting (spinner 1.2s) → success
const [claudeStatus, setClaudeStatus] = useState<'idle' | 'detecting' | 'found'>('idle')
```
- Claude Code: shows version + "Authenticated"
- CCS: shows connected accounts (Claude, Gemini, Copilot) with status badges

### Step 3 — Summary
Shows chosen git path + detected providers before "Launch VividKit".
On submit: create project in store → navigate to `/`

### Progress Indicator
Left sidebar: numbered circles
- completed: green check icon
- current: orange filled circle
- pending: gray outlined circle

## Todo List

- [ ] Create onboarding-wizard.tsx (step state, back/continue nav)
- [ ] Create progress-indicator.tsx
- [ ] Create step-welcome.tsx
- [ ] Create step-git-setup.tsx (with Tauri dialog invoke for Browse)
- [ ] Create step-ai-tools.tsx (simulated detection states)
- [ ] Create step-project-setup.tsx (form + summary)
- [ ] Create new-project-form.tsx (reuse git-setup pattern)
- [ ] Wire up store: addProject on wizard completion
- [ ] Verify no TS errors

## Success Criteria

- 4 steps navigate correctly (back/continue)
- Git method card toggle works
- Detection spinner shows then resolves
- "Launch VividKit" creates project and navigates to `/`
- New Project form matches onboarding Git step pattern

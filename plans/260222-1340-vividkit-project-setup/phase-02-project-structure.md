---
phase: 02
title: "Project Structure"
status: pending
effort: 1h
depends_on: [phase-01]
---

# Phase 02: Project Structure

## Context Links

- [Plan Overview](./plan.md)
- [Phase 01](./phase-01-tauri-react-init.md)

## Overview

- **Priority:** P1
- **Status:** pending
- Create MVP folder structure, placeholder files, ESLint + Prettier config

## Key Insights

- Each module maps to a component directory
- Placeholder files (index.ts barrels) enable clean imports from start
- ESLint + Prettier should be minimal config, not over-engineered

## Requirements

### Functional

- All component directories created per MVP spec
- Store, hook, lib, types directories with barrel files
- ESLint + Prettier configured
- tsconfig path aliases verified

### Non-functional

- Folder structure supports 200-line file limit
- Clear module boundaries

## Architecture

```
src/
  components/
    ui/           # shadcn/ui components (auto-generated)
    layout/       # Shell, Sidebar, TopBar
    onboarding/   # Welcome, APIKeyForm, ProjectCreator
    project/      # ProjectDeck, ProjectCard
    brainstorm/   # BrainstormPanel, IdeaCard
    tasks/        # TaskBoard, TaskColumn, TaskCard
    cook/         # CookView, TerminalPanel, FileExplorer
  stores/         # Zustand stores (project, task, brainstorm, cook)
  hooks/          # Custom hooks (useProject, useTerminal, etc.)
  lib/            # Utilities, tauri invoke wrappers
  types/          # TypeScript interfaces/types
```

## Related Code Files

### Files to Create

- `src/components/{ui,layout,onboarding,project,brainstorm,tasks,cook}/index.ts`
- `src/stores/index.ts`
- `src/hooks/index.ts`
- `src/lib/index.ts`
- `src/types/index.ts`
- `.eslintrc.cjs` or `eslint.config.js`
- `.prettierrc`

## Implementation Steps

1. **Create frontend directories**
   ```bash
   mkdir -p src/components/{ui,layout,onboarding,project,brainstorm,tasks,cook}
   mkdir -p src/{stores,hooks,lib,types}
   ```

2. **Create barrel files** (empty index.ts in each directory)
   - Each exports nothing initially, acts as import anchor

3. **Create type stubs**
   - `src/types/project.ts` - Project, ProjectConfig interfaces
   - `src/types/task.ts` - Task, TaskStatus, TaskColumn
   - `src/types/brainstorm.ts` - Idea, BrainstormSession

4. **Install ESLint + Prettier**
   ```bash
   npm install -D eslint prettier eslint-config-prettier
   npm install -D @typescript-eslint/eslint-plugin @typescript-eslint/parser
   ```

5. **Configure ESLint** - minimal config extending recommended + TS
6. **Configure Prettier** - tabs vs spaces, semi, quotes
7. **Add npm scripts**
   ```json
   "lint": "eslint src --ext .ts,.tsx",
   "format": "prettier --write src"
   ```

8. **Verify**: `npm run lint` passes on scaffold

## Todo List

- [ ] Create all component directories
- [ ] Create stores, hooks, lib, types directories
- [ ] Add barrel index.ts files
- [ ] Create type stub files
- [ ] Install & configure ESLint
- [ ] Install & configure Prettier
- [ ] Add lint/format npm scripts
- [ ] Verify lint passes

## Success Criteria

- All directories exist per spec
- `npm run lint` passes
- `npm run format` runs without errors
- Path alias `@/` works in imports

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| ESLint v9 flat config vs legacy | Check Tauri template default, match |
| Over-linting slows dev | Keep rules minimal, disable stylistic rules handled by Prettier |

## Security Considerations

- No security concerns at this stage

## Next Steps

- Phase 03: Rust backend scaffold (parallel)
- Phase 05: CLAUDE.md references this structure

---
phase: 01
title: "Tauri + React Init"
status: pending
effort: 1.5h
---

# Phase 01: Tauri + React Init

## Context Links

- [Plan Overview](./plan.md)

## Overview

- **Priority:** P1 (blocking)
- **Status:** pending
- Initialize Tauri v2 app with React-TS template, install all frontend and Tailwind/shadcn deps

## Key Insights

- Use `npm create tauri-app@latest` with react-ts template in existing directory
- Tailwind v4 uses `@tailwindcss/vite` plugin (no config file needed)
- shadcn/ui requires specific init with path aliases

## Requirements

### Functional

- Working Tauri v2 + React-TS project
- Tailwind v4 configured and rendering
- shadcn/ui initialized with @/ path alias
- All frontend deps installed

### Non-functional

- Dev server starts in < 10s
- No TypeScript compilation errors

## Architecture

Standard Tauri v2 architecture:
- Vite dev server for frontend
- Rust backend via `src-tauri/`
- IPC via `@tauri-apps/api/core` invoke()

## Related Code Files

### Files to Create

- `package.json` (via create tauri-app)
- `vite.config.ts`
- `tsconfig.json`
- `src/main.tsx`
- `src/App.tsx`
- `src-tauri/Cargo.toml`
- `src-tauri/tauri.conf.json`
- `src-tauri/src/main.rs`
- `src-tauri/src/lib.rs`
- `tailwind.config.ts` (if needed for v4)
- `components.json` (shadcn)

## Implementation Steps

1. **Init Tauri project**
   ```bash
   cd /Users/thieunv/projects/solo-builder/vividkit-app
   npm create tauri-app@latest . -- --template react-ts
   ```
   - If directory not empty, may need to handle existing files (plans/, docs/)
   - Alternative: init in temp dir, copy over

2. **Install frontend deps**
   ```bash
   npm install @xterm/xterm @xterm/addon-fit @xterm/addon-web-links
   npm install @monaco-editor/react
   npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
   npm install zustand
   npm install react-markdown remark-gfm
   ```

3. **Setup Tailwind v4**
   ```bash
   npm install -D tailwindcss @tailwindcss/vite
   ```
   - Add `@tailwindcss/vite` plugin to `vite.config.ts`
   - Add `@import "tailwindcss"` to main CSS file

4. **Setup shadcn/ui**
   ```bash
   npx shadcn@latest init
   ```
   - Select: New York style, Zinc color, CSS variables
   - Ensure path alias `@/` -> `src/` in tsconfig

5. **Configure tsconfig path aliases**
   ```json
   {
     "compilerOptions": {
       "baseUrl": ".",
       "paths": { "@/*": ["src/*"] }
     }
   }
   ```
   - Also configure Vite resolve alias in vite.config.ts

6. **Verify build**
   ```bash
   npm run tauri dev
   ```
   - Confirm window opens with React default content
   - Confirm Tailwind classes render correctly

## Todo List

- [ ] Init Tauri project with react-ts template
- [ ] Install all frontend npm deps
- [ ] Setup Tailwind v4 with Vite plugin
- [ ] Init shadcn/ui
- [ ] Configure tsconfig + vite path aliases
- [ ] Verify `npm run tauri dev` works

## Success Criteria

- `npm run tauri dev` opens a window
- Tailwind utility classes work in components
- shadcn/ui Button component renders
- No TS compilation errors
- All npm deps in package.json

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| create tauri-app fails in non-empty dir | Init in temp dir, move files over |
| Tailwind v4 breaking changes | Use stable release, check docs |
| shadcn/ui + Tailwind v4 compat | Verify shadcn supports TW v4 before init |

## Security Considerations

- No secrets at this stage
- Ensure `.gitignore` covers `node_modules/`, `target/`, `.env`

## Next Steps

- Phase 02: Create folder structure
- Phase 03: Rust backend deps

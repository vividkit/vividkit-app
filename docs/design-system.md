# Design System — VividKit Desktop

Canonical source for all UI rules in this project. Do not duplicate these rules in `CLAUDE.md` or `AGENTS.md`.

## Scope

Applies to all UI changes in:
- `src/components/**`
- `src/pages/**`
- `src/App.css`

## 1) Design tokens + colors

- Semantic color tokens in `src/App.css` (`:root`, `.dark`, `@theme inline`) are the source of truth.
- Do not hardcode raw colors in components (`#...`, `rgb(...)`, `hsl(...)`, `bg-[#...]`) except ANSI stream text in terminal output.
- Always use semantic classes/tokens:
  - `bg-background`, `text-foreground`
  - `bg-card`, `text-card-foreground`
  - `border-border`, `text-muted-foreground`
  - `text-success`, `text-warning`, `text-info`
- Sidebar must use dedicated tokens:
  - `bg-sidebar`, `text-sidebar-foreground`, `border-sidebar-border`, `ring-sidebar-ring`

## 2) Typography scale

- H1 (page title): `text-xl font-semibold text-foreground`
- H2 (section heading): `text-lg font-semibold text-foreground`
- H3 (card title): `font-semibold text-foreground` or `font-medium text-foreground`
- Body: `text-sm text-foreground`
- Caption/meta: `text-xs text-muted-foreground`
- Code/terminal: `font-mono text-sm`

## 3) Layout + spacing

- Global border radius: `--radius: 0.75rem`
- Page padding: `p-6`
- Card padding: `p-4` → `p-6`
- Section gap: `space-y-6` → `space-y-8`
- Grid gap: `gap-4`
- Sidebar width: expanded `w-64`, collapsed `w-[60px]`
- Header height: prefer `h-16`

## 4) Components + interactions

- Prefer shadcn/ui primitives:
  - `Card`, `Button`, `Badge`, `Dialog`, `Sheet`, `Tabs`, `Select`, `Input`, `Textarea`, `Switch`, `Checkbox`, `RadioGroup`, `Progress`, `Skeleton`, `Tooltip`, `DropdownMenu`, `ScrollArea`
- Card states:
  - Hover: `hover:border-primary/30 hover:shadow-md transition-all`
  - Active: `border-primary shadow-md`
- View toggle should use segmented control:
  - Wrapper: `rounded-lg border bg-muted/50 p-0.5`
  - Active segment: `bg-background text-foreground shadow-sm`

## 5) Semantic status mapping (mandatory)

- Active / Done / Merged → `bg-success/10 text-success`
- In Progress / Paused / Todo → `bg-warning/10 text-warning`
- Backlog → `bg-muted text-muted-foreground`
- High priority → `bg-destructive/10 text-destructive`
- Medium priority → `bg-warning/10 text-warning`
- Low priority → `bg-success/10 text-success`

## 6) Terminal UI (xterm.js)

- Terminal background target: `hsl(240 10% 4%)` (tokenized; avoid raw color hardcoding in JSX wrappers).
- xterm theme colors should come from semantic tokens.
- Mandatory:
  - `terminal.dispose()` on unmount
  - lazy mount when tab is hidden
  - buffered output streaming

## 7) Theme + icons

- Theme flow: `ThemeProvider` + `useTheme()` + `localStorage` persistence.
- Icon system: `lucide-react`, standard size `h-4 w-4` to `h-5 w-5`.

## 8) UI self-checklist (quick)

- [ ] No new raw color literals in changed UI files
- [ ] Typography classes follow the scale (H1/H2/H3/body/caption)
- [ ] Spacing/radius follow the system (`p-6`, `gap-4`, `--radius`)
- [ ] Status badges follow semantic mapping
- [ ] Theme behavior works in both light and dark modes
- [ ] No new hardcoded user-facing strings (follow i18n rules)

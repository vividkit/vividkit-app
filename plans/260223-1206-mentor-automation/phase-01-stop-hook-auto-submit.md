# Phase 01 — Stop Hook: Auto Submit to Mentor

**Plan:** [plan.md](./plan.md)
**Status:** complete | **Effort:** 45m

## Overview

Add a `Stop` hook in vividkit-app that detects when a cook/implementation phase completes and auto-submits the report to mentor — eliminating the manual `/submit-to-mentor` step.

## Key Insights

- Stop hook fires at end of every Claude session response
- Hook receives JSON stdin: `{ session_id, project_path, ... }`
- Can't run Claude commands directly from hook — must spawn `claude --print` subprocess
- Need flag file pattern to avoid submitting on every Stop event
- Cook skill (or user) sets flag → hook detects → submits → clears flag

## Architecture

```
User runs /cook {phase}
    └─→ Cook skill completes
         └─→ Cook skill writes: .claude/.mentor-submit-needed
              (contains: phase path)

Stop event fires
    └─→ mentor-auto-submit.cjs reads flag
         └─→ if flag exists:
              ├─→ spawn: claude --print "/submit-to-mentor {phase}" (background)
              └─→ delete flag file
```

## Requirements

- Flag file: `{project-root}/.claude/.mentor-submit-needed` (gitignored)
- Flag content: JSON `{ "phase_path": "plans/..." }`
- Hook must be non-blocking (exit 0 always)
- Only trigger if project = vividkit-app (check `project_path` in stdin)
- Handle edge case: flag exists but submit-to-mentor was already done manually

## Related Files

**Create:**
- `~/.claude/hooks/mentor-auto-submit.cjs` — Stop hook script
- `vividkit-app/.claude/.gitignore` — ignore `.mentor-submit-needed`

**Modify:**
- `~/.claude/settings.json` — register Stop hook
- `~/.claude/skills/submit-to-mentor/SKILL.md` (or command) — write flag file at end of skill

## Implementation Steps

1. Create `mentor-auto-submit.cjs`:
   - Read stdin JSON (session_id, project_path)
   - Check if cwd/project is vividkit-app (match by path)
   - Look for `.claude/.mentor-submit-needed` flag file
   - If found: read phase_path from flag, spawn `claude --print "/submit-to-mentor {phase_path}"` detached
   - Delete flag file
   - Exit 0

2. Register in `~/.claude/settings.json`:
   ```json
   "Stop": [{ "hooks": [{ "type": "command", "command": "node ~/.claude/hooks/mentor-auto-submit.cjs" }] }]
   ```

3. Modify submit-to-mentor skill/command to write flag file at session START (before generating report), so if user runs it manually, flag gets set then cleared → no double submit.

4. Add `.claude/.mentor-submit-needed` to `.gitignore`.

## Todo

- [ ] Create `mentor-auto-submit.cjs`
- [ ] Register Stop hook in settings.json
- [ ] Update submit-to-mentor skill to write flag file
- [ ] Add to .gitignore

## Success Criteria

- After cook phase ends, report auto-appears in `vividkit-supervisor/inbox/pending/` within 30s
- No double submission if user also ran submit-to-mentor manually
- Hook exits cleanly (no errors in hook output)

## Risks

- `claude --print` may be slow or fail silently — add timeout + log errors to `/tmp/mentor-submit.log`
- Stop hook fires on every response — flag file check must be fast (< 50ms)

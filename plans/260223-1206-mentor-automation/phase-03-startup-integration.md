# Phase 03 — Startup Script + Integration Testing

**Plan:** [plan.md](./plan.md)
**Status:** complete | **Effort:** 45m

## Overview

Wire everything together: document how to start daemon, test end-to-end flow, add README section in supervisor project.

## Key Insights

- Daemon needs to start automatically or be easy to start (Makefile target)
- Cook skill needs minimal modification — just write the flag file at phase completion
- Integration test: manually trigger each step and verify automation fires
- No launchd/systemd needed (manual start per session is acceptable)

## Architecture

```
Developer session start:
  cd vividkit-supervisor && make mentor-start

Cook flow:
  vividkit-app: /cook phase-XX
      └─→ cook skill writes .claude/.mentor-submit-needed
           └─→ [Stop hook] spawns submit-to-mentor
                └─→ report lands in inbox/pending/
                     └─→ [daemon] auto /mentor-review
                          └─→ 🔔 notify questions ready
                               └─→ [human writes response]
                                    └─→ [daemon] auto /mentor-respond
                                         └─→ 🔔 notify verdict
```

## Related Files

**Modify:**
- `~/.claude/skills/submit-to-mentor/SKILL.md` — add flag file write step
- `vividkit-supervisor/docs/mentor-protocol.md` — add automation section
- `vividkit-app/CLAUDE.md` — update Supervisor Workflow section

**Verify:**
- `~/.claude/settings.json` — Stop hook registered
- `vividkit-supervisor/scripts/mentor-daemon.sh` — executable (`chmod +x`)

## Implementation Steps

1. **Update submit-to-mentor skill:**
   - At the end of skill, add step: "Write flag file `.claude/.mentor-submit-needed` with `{ phase_path }`"
   - If flag already cleared (manual run), skip

2. **Integration test checklist:**
   - [ ] Start daemon: `make mentor-start`
   - [ ] Create dummy pending report → verify `/mentor-review` auto-runs
   - [ ] Create dummy questions file → verify macOS notification
   - [ ] Create dummy response file → verify `/mentor-respond` auto-runs
   - [ ] Create dummy verdict.md with `status: approved` → verify notification
   - [ ] Restart daemon → verify no double-processing (marker files respected)

3. **Update docs:**
   - Add "Automation Setup" section to `vividkit-supervisor/docs/mentor-protocol.md`
   - Update `vividkit-app/CLAUDE.md` Supervisor Workflow: note daemon must be running

4. **Makefile `help` target:**
   ```makefile
   help:
       @echo "mentor-start  — Start background review daemon"
       @echo "mentor-stop   — Stop daemon"
       @echo "mentor-status — Check if daemon is running"
   ```

## Todo

- [ ] Update submit-to-mentor skill (flag file step)
- [ ] Integration test all 4 daemon handlers
- [ ] Update mentor-protocol.md with automation section
- [ ] Update CLAUDE.md supervisor workflow note
- [ ] Verify executable permissions on all scripts

## Success Criteria

- Full end-to-end: cook phase → auto submit → auto review → notify questions → human responds → auto respond → notify verdict
- Zero manual steps except: writing response + accepting verdict
- Daemon restart safe (idempotent)
- Docs updated to reflect new flow

## Risks

- submit-to-mentor skill might already write flag in some contexts — check for idempotency
- `claude --print` needs correct CWD (supervisor dir) when spawned from daemon

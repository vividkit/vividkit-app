# Phase 02 — Mentor Daemon: fswatch + Auto Commands

**Plan:** [plan.md](./plan.md)
**Status:** complete | **Effort:** 1.5h

## Overview

Bash polling daemon in vividkit-supervisor that watches `inbox/` for changes and auto-triggers mentor commands + macOS notifications. No external dependencies (fswatch not installed).

## Key Insights

- `fswatch` not installed → use bash `while` loop with polling (sleep 2s, simple + reliable)
- `claude --print` runs Claude non-interactively — suitable for spawning mentor-review/respond
- Must track processed files to avoid re-triggering (use `.processed` marker files)
- macOS notify via `osascript -e 'display notification...'`
- Response files created by human → auto-trigger mentor-respond
- Verdict detection: read YAML `status:` field to include in notification

## Architecture

```
mentor-daemon.sh (background loop, sleep 2s)
    │
    ├─ inbox/pending/*.md (no .processed sibling)
    │   └─→ touch pending/{file}.processed
    │       run: claude --print "/mentor-review {file}" &
    │
    ├─ inbox/reviewing/*/questions-r*.md (no .notified sibling)
    │   └─→ touch reviewing/{session}/questions-r{n}.notified
    │       osascript notify: "📋 Mentor has questions — {session}"
    │
    ├─ inbox/reviewing/*/response-r*.md (no .processed sibling)
    │   └─→ touch reviewing/{session}/response-r{n}.processed
    │       run: claude --print "/mentor-respond {session}" &
    │
    └─ inbox/reviewing/*/verdict.md (no .notified sibling)
        └─→ touch reviewing/{session}/verdict.notified
            extract status from verdict.md YAML
            osascript notify: "✅/⚠️ Verdict: {status} — {session}"
```

## Requirements

- No external deps (pure bash + node built-in)
- PID file at `/tmp/mentor-daemon.pid` — prevent multiple instances
- Log to `logs/mentor-daemon.log` (rotate at 1MB)
- Graceful shutdown on SIGTERM/SIGINT
- `claude` binary must be in PATH (check on startup)
- Supervisor project path hardcoded or from env var `SUPERVISOR_DIR`

## Related Files

**Create (in vividkit-supervisor):**
- `scripts/mentor-daemon.sh` — main polling daemon
- `scripts/mentor-notify.sh` — macOS notification helper
- `Makefile` — `make mentor-start`, `make mentor-stop`, `make mentor-status`
- `logs/.gitkeep` — logs directory
- `.gitignore` — ignore `logs/*.log`, `*.processed`, `*.notified`, `*.pid`

## Implementation Steps

1. Create `scripts/mentor-daemon.sh`:
   ```bash
   #!/bin/bash
   SUPERVISOR_DIR="$(cd "$(dirname "$0")/.." && pwd)"
   PID_FILE="/tmp/mentor-daemon.pid"
   LOG_FILE="$SUPERVISOR_DIR/logs/mentor-daemon.log"

   # Startup checks
   # Write PID file, trap SIGTERM/SIGINT for cleanup
   # Main loop: check each inbox/ category every 2s
   ```

2. Implement 4 watch handlers:
   - `check_pending()` — glob pending/*.md, skip *.processed, run claude + touch marker
   - `check_questions()` — glob reviewing/*/questions-r*.md, skip *.notified, notify
   - `check_responses()` — glob reviewing/*/response-r*.md, skip *.processed, run claude
   - `check_verdicts()` — glob reviewing/*/verdict.md, skip *.notified, notify with status

3. Create `scripts/mentor-notify.sh`:
   - Takes: title, message args
   - Uses `osascript` on macOS, fallback echo if not macOS

4. Create `Makefile`:
   ```makefile
   mentor-start:
       @scripts/mentor-daemon.sh start
   mentor-stop:
       @kill $(cat /tmp/mentor-daemon.pid) && rm /tmp/mentor-daemon.pid
   mentor-status:
       @ps aux | grep mentor-daemon | grep -v grep
   ```

5. Add `.gitignore` entries for logs and marker files.

## Todo

- [ ] Create `logs/` directory with `.gitkeep`
- [ ] Create `scripts/mentor-daemon.sh`
- [ ] Create `scripts/mentor-notify.sh`
- [ ] Create `Makefile`
- [ ] Update `.gitignore`

## Success Criteria

- Daemon starts/stops cleanly via Makefile
- New pending report → mentor-review auto-triggered within 4s
- Questions file created → macOS notification appears
- Response file saved → mentor-respond auto-triggered within 4s
- Verdict file created → macOS notification with status string
- No duplicate processing on restart

## Risks

- `claude --print` execution time (30-60s per run) — daemon must not block, always spawn async (`&`)
- Multiple pending files queued → process one at a time (lockfile `inbox/.reviewing-lock`)
- Log file growth — add simple rotation check (> 1MB → truncate)

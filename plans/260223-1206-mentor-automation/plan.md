---
title: "Mentor Review Automation"
description: "Auto-trigger mentor process after cook phase via hooks + fswatch daemon"
status: complete
priority: P2
effort: 3h
branch: main
tags: [automation, mentor, hooks, fswatch, workflow]
created: 2026-02-23
---

# Mentor Review Automation

Auto-reduce manual steps in mentor review workflow from 80% → ~20% (only human Q&A + verdict acceptance remain manual).

## Phases

| # | Phase | Status | Effort |
|---|-------|--------|--------|
| 1 | [Stop Hook — Auto Submit](./phase-01-stop-hook-auto-submit.md) | complete | 45m |
| 2 | [Mentor Daemon — fswatch + Auto Commands](./phase-02-mentor-daemon.md) | complete | 1.5h |
| 3 | [Startup Script + Integration](./phase-03-startup-integration.md) | complete | 45m |

## Flow After Implementation

```
Cook phase done
    └─→ [Stop hook] auto submit-to-mentor
         └─→ [fswatch] auto /mentor-review
              └─→ 🔔 Notify: "Mentor has questions"
                   └─→ [Human writes response-r*.md]
                        └─→ [fswatch] auto /mentor-respond
                             └─→ 🔔 Notify: "Verdict: APPROVED / NEEDS_WORK"
                                  └─→ [Human accepts → proceed]
```

## Key Files

- `vividkit-app/.claude/hooks/mentor-auto-submit.cjs` — Stop hook
- `vividkit-supervisor/scripts/mentor-daemon.sh` — fswatch watcher
- `vividkit-supervisor/scripts/handle-mentor-event.sh` — event handler
- `vividkit-supervisor/Makefile` — `make mentor-start`

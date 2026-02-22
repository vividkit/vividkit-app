---
phase: 04
title: "Supervisor Setup"
status: pending
effort: 1.5h
depends_on: []
---

# Phase 04: Supervisor Setup

## Context Links

- [Plan Overview](./plan.md)
- [Reference: Original Supervisor](file:///Users/thieunv/projects/personal/vividkit-supervisor/)
- [Mentor Protocol](file:///Users/thieunv/projects/personal/vividkit-supervisor/docs/mentor-protocol.md)

## Overview

- **Priority:** P1
- **Status:** pending
- Create `/Users/thieunv/projects/solo-builder/vividkit-supervisor/` adapted from personal vividkit-supervisor

## Key Insights

- Original supervisor targets `vividkit-desktop` — adapt all paths to `vividkit-app`
- Mentor agent prompt should be model-agnostic (no hardcoded LLM)
- Add Tauri-specific checklist items for cross-review
- File-based async communication: inbox/pending -> reviewing -> completed

## Requirements

### Functional

- Full supervisor project structure mirroring original
- Mentor agent with Tauri-specific review checklist
- 3 slash commands: /mentor-review, /mentor-respond, /mentor-verdict
- /submit-to-mentor command in vividkit-app project
- Templates for reports, questions, verdicts

### Non-functional

- Protocol works without real-time connectivity
- Token-efficient file-based communication

## Architecture

```
/Users/thieunv/projects/solo-builder/vividkit-supervisor/
  .claude/
    agents/
      mentor.md               # Mentor subagent (model-agnostic)
    agent-memory/
      mentor/                  # Persistent memory
    commands/
      mentor-review.md         # Trigger review
      mentor-respond.md        # Process response
      mentor-verdict.md        # Force/view verdict
  inbox/
    pending/                   # Reports awaiting review
    reviewing/                 # Active Q&A sessions
    completed/                 # Finished reviews
  templates/
    implementation-report.md
    agent-response.md
    mentor-questions.md
    mentor-verdict.md
  docs/
    mentor-protocol.md         # Adapted protocol doc
  plans/
```

## Related Code Files

### Files to Create (supervisor project)

- `.claude/agents/mentor.md` — adapted, model-agnostic, Tauri checklist
- `.claude/commands/mentor-review.md` — update paths to ../vividkit-app/
- `.claude/commands/mentor-respond.md` — same as original
- `.claude/commands/mentor-verdict.md` — same as original
- `templates/implementation-report.md`
- `templates/agent-response.md`
- `templates/mentor-questions.md`
- `templates/mentor-verdict.md`
- `docs/mentor-protocol.md`
- `inbox/{pending,reviewing,completed}/.gitkeep`

### Files to Create (vividkit-app project)

- `.claude/commands/submit-to-mentor.md` — generates report in supervisor inbox

## Implementation Steps

1. **Create supervisor project structure**
   ```bash
   mkdir -p /Users/thieunv/projects/solo-builder/vividkit-supervisor
   mkdir -p /Users/thieunv/projects/solo-builder/vividkit-supervisor/.claude/{agents,agent-memory/mentor,commands}
   mkdir -p /Users/thieunv/projects/solo-builder/vividkit-supervisor/inbox/{pending,reviewing,completed}
   mkdir -p /Users/thieunv/projects/solo-builder/vividkit-supervisor/{templates,docs,plans}
   ```

2. **Adapt mentor agent** from original `.claude/agents/mentor.md`
   - Remove hardcoded model references — use `model: opus` (generic)
   - Update all paths: `../vividkit-desktop/` -> `../vividkit-app/`
   - Add Tauri-specific checklist items:
     - IPC type safety: invoke() args match #[tauri::command] params
     - No .unwrap() in Rust commands
     - Worktree lifecycle: create -> use -> cleanup
     - AI calls: Rust-only, never from frontend JS
     - xterm.js: dispose on unmount, lazy mount

3. **Adapt slash commands**
   - Copy original 3 commands
   - Update all path references from `vividkit-desktop` to `vividkit-app`
   - Verify file operation instructions are correct

4. **Copy/adapt templates** from original project
   - `implementation-report.md` — update plan_path example
   - `agent-response.md` — keep as-is
   - `mentor-questions.md` — keep as-is
   - `mentor-verdict.md` — keep as-is

5. **Write mentor protocol doc**
   - Adapt from original, update all path references
   - Add Tauri-specific sections

6. **Create /submit-to-mentor in vividkit-app**
   - File: `/Users/thieunv/projects/solo-builder/vividkit-app/.claude/commands/submit-to-mentor.md`
   - Generates implementation report with YAML frontmatter
   - Saves to `../vividkit-supervisor/inbox/pending/{timestamp}-{phase}.md`
   - Includes: files_changed, files_created, plan_path, phase_path

7. **Add .gitkeep files** in empty inbox directories

8. **Init git** in supervisor project
   ```bash
   cd /Users/thieunv/projects/solo-builder/vividkit-supervisor
   git init
   ```

## Todo List

- [ ] Create supervisor directory structure
- [ ] Adapt mentor agent (model-agnostic + Tauri checklist)
- [ ] Adapt mentor-review command (update paths)
- [ ] Adapt mentor-respond command
- [ ] Adapt mentor-verdict command
- [ ] Copy and adapt templates (4 files)
- [ ] Write mentor protocol docs
- [ ] Create /submit-to-mentor command in vividkit-app
- [ ] Add .gitkeep files
- [ ] Init git repo

## Success Criteria

- Supervisor project has complete structure
- All paths reference `vividkit-app` (not `vividkit-desktop`)
- Mentor agent is model-agnostic
- Tauri-specific checklist items present in mentor
- /submit-to-mentor command exists in vividkit-app

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Path misalignment between projects | Test with relative path resolution |
| Mentor prompt too long | Keep under 200 lines, focus on checklist |
| submit-to-mentor generates invalid frontmatter | Include validation step in command |

## Security Considerations

- No secrets in supervisor project
- Reports should not include API keys or credentials
- Mentor has read-only access to source code

## Next Steps

- After initial setup, test full flow: submit -> review -> respond -> verdict
- Phase 05: CLAUDE.md references supervisor workflow

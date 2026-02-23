# Submit to Mentor: Generate Implementation Report for Review

Generate an implementation report for the last completed phase and submit it to the supervisor inbox.

## Arguments

`$ARGUMENTS` = optional phase name or path (e.g. `phase-01` or `plans/260222-1340-vividkit-project-setup/phase-01-tauri-react-init.md`). If empty, asks user to specify.

## Instructions

1. **Identify the phase:**
   - If `$ARGUMENTS` is a path to a phase file, use it directly.
   - If `$ARGUMENTS` is a phase name/slug, find the matching phase file in `plans/`.
   - If `$ARGUMENTS` is empty, list recent plan phases and ask user to select.

2. **Read context:**
   - Read the phase file to extract: title, phase number, status, related code files.
   - Find the parent `plan.md` in the same plan directory.
   - List recently modified files relevant to this phase (use git status or file timestamps).

3. **Generate timestamp:**
   - Format: `YYMMDD-HHMM` (e.g. `260222-1415`)

4. **Build report filename:**
   - Pattern: `{timestamp}-{phase-slug}.md`
   - Example: `260222-1415-phase-01-tauri-react-init.md`

5. **Write implementation report:**
   - Destination: `../vividkit-supervisor/inbox/pending/{filename}`
   - Use this YAML frontmatter:

   ```yaml
   ---
   type: implementation_report
   plan_path: "../vividkit-app/{relative-path-to-plan.md}"
   phase: "{phase title}"
   phase_path: "../vividkit-app/{relative-path-to-phase-file.md}"
   timestamp: "{ISO 8601 with +07:00}"
   agent: "{current agent type}"
   status: pending_review
   files_changed:
     - "{file path}"
   files_created:
     - "{file path}"
   ---
   ```

   - Fill in the Markdown body using `../vividkit-supervisor/templates/implementation-report.md` as guide:
     - **Summary**: 2-3 sentences on what was implemented
     - **Implementation Details**: list changes grouped by concern
     - **Technical Approach**: patterns and decisions made
     - **Architecture Decisions**: table of key decisions with rationale
     - **Self-Assessment**: check applicable boxes honestly
     - **Questions for Mentor**: list any uncertainties or deviations

6. **Write automation flag file** (for Stop hook auto-submit):
   - Write `.claude/.mentor-submit-needed` in project root with content:
     ```json
     { "phase_path": "{relative-path-to-phase-file}" }
     ```
   - This allows the Stop hook to auto-trigger submit if user didn't run this command manually.
   - If this command is being run manually (i.e. flag file already exists), delete it first to prevent double submission.

7. **Confirm submission:**
   - Print the report path.
   - Print a brief summary of what was submitted.
   - Instruct: "Switch to vividkit-supervisor project and run `/mentor-review` to start the review."

## Error Handling

- If `../vividkit-supervisor/inbox/pending/` does not exist: warn user that supervisor project is not set up and provide setup path.
- If phase file not found: list available phases in `plans/` and ask user.
- If no files were changed (empty git diff): warn but allow submission with empty lists.

## Security

- NEVER include API keys, passwords, tokens, or any secrets in the report.
- NEVER include contents of `.env` files.
- If unsure whether a value is sensitive, omit it and add a note.

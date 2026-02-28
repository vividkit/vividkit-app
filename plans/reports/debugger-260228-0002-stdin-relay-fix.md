# Stdin Relay Fix — PTY Slave Drop Bug

**Date:** 2026-02-28
**File:** `src-tauri/src/commands/ai.rs`

## Root Causes

### RC-1 (Critical): PTY slave dropped too early
- `pty_pair.slave` was used inline: `pty_pair.slave.spawn_command(cmd)` → slave dropped immediately after spawn
- On macOS `NativePtySystem`: slave dropping before child exits causes child stdin to receive HUP/EIO
- Result: any `write_all()` to master writer was discarded — child never received answers

### RC-2 (Minor): Missing `flush()` in `send_ccs_input`
- `write_all()` without `flush()` — PTY writer may buffer data
- On PTY, this is usually a no-op but needed for correctness

## Evidence
- `ccs` found at `/Users/thieunv/.bun/bin/ccs` — PATH resolution OK
- `portable-pty = "0.8"` in Cargo.toml
- `PtyRun` struct only stored `writer` + `child`, slave was dropped after scope exit

## Fix Applied

**`PtyRun` struct** — added `_slave` field:
```rust
struct PtyRun {
    writer: Box<dyn Write + Send>,
    child: Box<dyn portable_pty::Child + Send + Sync>,
    _slave: Box<dyn portable_pty::SlavePty + Send>,  // keeps slave alive
}
```

**`spawn_ccs`** — destructured pty_pair, stored slave in registry:
```rust
let (master, slave) = (pty_pair.master, pty_pair.slave);
let child = slave.spawn_command(cmd)...;
runs.insert(run_id.clone(), PtyRun { writer, child, _slave: slave });
```

**`send_ccs_input`** — added flush:
```rust
entry.writer.write_all(data.as_bytes()).map_err(|e| e.to_string())?;
entry.writer.flush().map_err(|e| e.to_string())
```

## Build Result
`Finished 'dev' profile` — no errors, 5 pre-existing warnings only.

## Unresolved Questions
- None. Both root causes identified and fixed.

# Native DevTools MCP — Setup Guide for VividKit Desktop

## Overview

**[native-devtools-mcp](https://github.com/sh3ll3x3c/native-devtools-mcp)** is an MCP server that gives AI agents "eyes" and "hands" for native desktop applications. It provides:

- **👀 Screenshots + OCR** — capture windows, read text on screen
- **🖱️ Click / Type / Scroll** — simulate user input at precise coordinates
- **🪟 Window Management** — list, focus, and manage app windows
- **🧩 Template Matching** — find UI elements by image matching (icons, shapes)
- **🔌 AppDebugKit** — deep DOM-like structural inspection (optional)

**Version:** `0.4.3` | **License:** MIT | **Platform:** macOS, Windows, Android

## Why This Matters for VividKit

VividKit Desktop is a Tauri v2 app — it has **no browser DevTools** in production builds. Traditional web testing tools (Playwright, Cypress) don't work with native windows. This MCP server fills that gap by:

1. **Visual Testing** — Screenshot the actual rendered Tauri window and OCR all text
2. **Interaction Testing** — Click buttons, type in inputs, navigate through the UI
3. **E2E Workflows** — Automate complete user flows (onboarding → project creation → brainstorm → tasks)
4. **No Instrumentation Required** — Works with any app via the "Visual" approach

## Installation Status

```
✅ Installed globally: npm install -g native-devtools-mcp
✅ Binary location: /Users/thieunv/.local/share/mise/installs/node/22.21.1/bin/native-devtools-mcp
✅ Version: 0.4.3
✅ MCP handshake: Verified working
```

## Configuration

### Gemini CLI (Antigravity)

Added to `~/.gemini/settings.json`:

```json
{
  "mcpServers": {
    "native-devtools": {
      "command": "npx",
      "args": ["-y", "native-devtools-mcp"]
    }
  }
}
```

### Claude Code (if needed)

Add to `.claude/settings.local.json`:

```json
{
  "mcpServers": {
    "native-devtools": {
      "command": "npx",
      "args": ["-y", "native-devtools-mcp"]
    }
  },
  "permissions": {
    "allow": ["mcp__native-devtools__*"]
  }
}
```

## macOS Permissions Required

⚠️ **You MUST grant these permissions manually** in System Settings:

### 1. Accessibility
`System Settings → Privacy & Security → Accessibility`
- Add the terminal app you run the MCP from (e.g., `ghostty`, `iTerm2`, `kitty`)
- This allows the MCP to simulate clicks, types, and scroll events

### 2. Screen Recording
`System Settings → Privacy & Security → Screen Recording`
- Add the same terminal app
- This allows the MCP to take screenshots of app windows

> **Tip:** After granting permissions, restart your terminal and the Gemini CLI session.

## Available Tools

### Core Desktop Tools (no prefix)

| Tool | Purpose | Usage |
|------|---------|-------|
| `take_screenshot` | Capture screen/window/region with OCR | `take_screenshot(app_name="tauri-app")` |
| `find_text` | Find text on screen via Accessibility API + OCR fallback | `find_text(text="Submit")` |
| `click` | Click at coordinates | `click(x=500, y=300)` |
| `type_text` | Type text naturally | `type_text(text="Hello World")` |
| `focus_window` | Bring a window to front | `focus_window(app_name="tauri-app")` |
| `load_image` | Load a template image for matching | `load_image(path="/path/to/icon.png")` |
| `find_image` | Find UI element by image matching | `find_image(screenshot_id="...", template_id="...")` |

### AppDebugKit Tools (optional, for instrumented apps)

| Tool | Purpose |
|------|---------|
| `app_connect` | Connect to debug port via WebSocket |
| `app_query` | Query the UI tree (DOM-like) |
| `app_click` | Click by element ID |

## Testing VividKit Desktop — Workflow

### Prerequisite: Run VividKit

```bash
cd /Users/thieunv/projects/solo-builder/vividkit-app
npm run tauri dev
```

### Test Flow (via AI Agent)

```
1. focus_window(app_name="tauri-app")           → Bring VividKit to front
2. take_screenshot(app_name="tauri-app")        → See current UI state
3. find_text(text="New Project")                → Locate a button
4. click(x=<returned_x>, y=<returned_y>)       → Click it
5. type_text(text="My Test Project")            → Type project name
6. take_screenshot(app_name="tauri-app")        → Verify UI changed
```

### Two Interaction Approaches

#### 1. Visual Approach (Recommended for VividKit)
Works universally — no app modifications needed:
- Take screenshots → OCR → find_text → click at coordinates
- Use `load_image`/`find_image` for non-text UI elements (icons)
- Best for 99% of use cases

#### 2. Structural Approach (AppDebugKit)
Requires embedding the AppDebugKit library in the Tauri app:
- Provides DOM-like tree inspection
- Click by element ID instead of coordinates
- More precise but requires app instrumentation

## Important Notes

- **Hands Off**: When the AI agent is driving (clicking/typing), do NOT move your mouse
- **Focus Matters**: Ensure VividKit window is visible and not hidden behind other windows
- **Restart Required**: After adding MCP config, restart Gemini CLI to load the server
- **Coordinate Precision**: Screenshots include scale metadata for Retina displays — the MCP handles this automatically

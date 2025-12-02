# MicroFocus Zones

Task-scoped tab capsules, semantic gates, and micro-focus timers to reduce distraction in your browser.

[![License](https://img.shields.io/badge/License-Proprietary-red)](LICENSE)
[![Version](https://img.shields.io/github/v/release/jomardyan/MicroFocus-Zones)](https://github.com/jomardyan/MicroFocus-Zones/releases)

## Why MicroFocus Zones?

MicroFocus Zones helps you maintain focus by organizing browser tabs into isolated work zones with built-in timers and semantic gates that prevent distraction-driven context switching.

## Key Features

- **Task-scoped tab capsules** — group related tabs into isolated zones that preserve context
- **Semantic gates** — intelligent prompts that discourage switching between zones unnecessarily
- **Micro-focus timers** — built-in Pomodoro-style timers to structure work sessions
- **Zone-aware notifications** — alerts that respect your current focus zone
- **Tab group integration** — leverages Chrome's native tab groups for visual organization
- **Side panel control** — manage all zones from a persistent side panel interface

## Installation

### From Source

```bash
git clone https://github.com/jomardyan/MicroFocus-Zones.git
cd MicroFocus-Zones
```

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the repository folder
4. The extension icon will appear in your toolbar

### Generate Assets

If icons are missing, generate them using the included scripts:

**Windows:**
```bash
generate-assets.bat
```

**macOS/Linux:**
```bash
chmod +x generate-assets.sh
./generate-assets.sh
```

Or use Node.js directly:
```bash
node generate-assets.js
```

## Quick Start

1. Click the MicroFocus extension icon in your toolbar
2. Open the side panel to see zone management options
3. Create your first zone by clicking "New Zone"
4. Add tabs to the zone by dragging them or using the context menu
5. Start a focus timer to begin a structured work session
6. Switch zones only when the timer completes or you explicitly pause

## Usage

### Creating Zones

Zones organize tabs around specific tasks or projects. Each zone maintains its own tab group and can have an active timer.

```javascript
// Zones are created through the side panel UI
// or via the extension popup
```

### Managing Timers

Micro-focus timers help structure work sessions:

- Click "Start Timer" in the side panel
- Default duration is 25 minutes (configurable)
- Notifications alert you when time is up
- Semantic gates prompt before switching zones mid-session

### Semantic Gates

When a timer is active, attempting to switch zones triggers a confirmation dialog that encourages completing the current focus block.

## Configuration

Settings are accessible through the side panel:

- **Default timer duration** — customize focus session length (default: 25 minutes)
- **Notification preferences** — enable/disable alerts for timer completion
- **Gate sensitivity** — adjust how strict zone-switching prompts are
- **Tab group colors** — customize visual appearance of zones

## Permissions

- `tabs` — manage and organize browser tabs into zones
- `storage` — persist zone configurations and preferences
- `sidePanel` — display the persistent zone management interface
- `scripting` — inject content scripts for gate prompts
- `alarms` — trigger timer notifications
- `tabGroups` — integrate with Chrome's native tab grouping
- `notifications` — alert when timers complete
- `<all_urls>` — enable semantic gates across all websites

## Development

### Setup

```bash
npm install
```

### Verify Installation

```bash
node verify-setup.js
```

This checks that all required assets and permissions are correctly configured.

### File Structure

- `background.js` — service worker managing zones and timers
- `content.js` — content script for semantic gate prompts
- `sidepanel.html/js/css` — side panel interface
- `manifest.json` — extension configuration
- `generate-assets.js` — icon generation utility

## Privacy

MicroFocus Zones operates entirely locally. No data is collected, transmitted, or stored on external servers. All zone configurations and preferences remain on your device. See [PRIVACY.md](PRIVACY.md) for full details.

## Contributing

This is a proprietary project. The source code is provided for transparency and personal use only. Modifications, redistribution, and commercial use are prohibited. See [LICENSE](LICENSE) for details.

## License

Proprietary License with Usage Rights — Free to use, prohibited from modification and redistribution. See [LICENSE](LICENSE) file.

## Author

© 2025 Hayk Jomardyan. All rights reserved.

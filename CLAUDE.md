# Kreeder - Speed Reader for Kindle

## Project Overview

Chrome extension that adds RSVP (Rapid Serial Visual Presentation) speed reading to Kindle Cloud Reader (https://read.amazon.com/). Opens a popup modal that displays book text word-by-word at configurable speeds, similar to https://speed-reader.com/. Tracks reading progress and auto-advances Kindle pages.

## Tech Stack

- **Vanilla JavaScript** — no TypeScript, no build tools, no bundler
- **jQuery 2.1.4** — DOM manipulation
- **Bootstrap 3** — UI framework + slider component
- **Chrome Extension Manifest v2** (persistent: false event page)
- **Chrome APIs**: `chrome.runtime`, `chrome.tabs`, `chrome.windows`, `chrome.storage.sync`, `chrome.commands`, `chrome.extension`
- All dependencies are vendored in-tree (no package.json, no npm)

## Architecture

```
Extension Icon Click → kreedExtMenu.html (popup)
    → sends 'open_kreeder' to background.js
    → background.js creates popup window with kreedPopup.html
    → kreedPopup.js connects to background.js via port
    → sends "ext" message to extract content
    → background.js relays to contentExtractor.js (content script)
    → contentExtractor.js extracts text from Kindle iframe DOM
    → text returned → kreedPopup.js displays words via RSVP
```

### Key Components

| File | Role |
|------|------|
| `manifest.json` | Extension config, permissions, commands, content script registration |
| `js/background.js` | Message router, popup window lifecycle, keyboard shortcut handler |
| `js/contentscript.js` | Minimal injector — loads contentExtractor.js into page context |
| `js/contentExtractor.js` | Extracts text from Kindle Cloud Reader iframes (`.k4w` elements), handles page navigation |
| `js/kreedPopup.js` | Main RSVP reader engine — playback, speed control, word display, state, settings persistence |
| `js/kreedExtMenu.js` | Extension icon popup menu logic |
| `menus/kreedPopup.html` | Reader window markup |
| `menus/kreedExtMenu.html` | Extension icon popup markup |
| `menus/options.html` | About/options page |

### Directory Layout

```
SpreedKindle/
├── manifest.json
├── css/                  # Stylesheets (bootstrap, kreedMain, kreedPopup, slider)
├── icons/                # Extension icons and UI assets
├── js/                   # All JavaScript (vendor libs + extension code)
├── menus/                # HTML pages (popup menu, reader window, options)
└── screenshots/          # Chrome Web Store screenshots
```

## Code Conventions

- **`$` prefix** on globals for jQuery/state vars: `$port`, `$words`, `$loc`, `$playing`
- **`kreederVars`** object holds all persisted settings (speed, fontsize, wCount, autoAdvance, etc.)
- **UPPER_CASE** for constants: `SPEED_INC`, `MAX_LIMIT`, `PUNCT_PATTERN`
- **camelCase** for functions: `getNextWords()`, `speedUp()`, `displayWord()`
- **Hyphenated** CSS classes: `footer-kreeder`, `slider-horizontal`
- Port-based message passing between content script, background, and popup
- Settings persisted via `chrome.storage.sync` with fallback defaults

## RSVP Display Technique

Words are split into left/center/right segments. The center character is highlighted in gold (#FFC926) for eye fixation. Punctuation adds extra display delay. WPM formula: `60 * 1500 / speed`.

## Keyboard Shortcuts

- `Ctrl+Shift+Up` — Speed up
- `Ctrl+Shift+Down` — Speed down
- `Ctrl+Shift+Space` — Start reading current page

## Known Issues (from options.html)

- Pressing shortcut repeatedly can open multiple reader windows
- Books with heavy formatting/images may display text out of order
- Works best with plain text-heavy books

## No Build Step

Load the extension directly via `chrome://extensions` → "Load unpacked" → select this directory. No compilation or bundling required.

## No Tests

No test framework or test files exist. Testing is manual across platforms.

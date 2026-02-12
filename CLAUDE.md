# Kreeder - Speed Reader for Kindle

## Project Overview

Chrome extension that adds RSVP (Rapid Serial Visual Presentation) speed reading to Kindle Cloud Reader (https://read.amazon.com/). Opens a popup modal that displays book text word-by-word at configurable speeds, similar to https://speed-reader.com/. Tracks reading progress and auto-advances Kindle pages.

## Tech Stack

- **Vanilla JavaScript** — no TypeScript, no build tools, no bundler
- **jQuery 2.1.4** — DOM manipulation (popup UI only)
- **Tesseract.js v5** — OCR engine for extracting text from rendered page images
- **Bootstrap 3** — UI framework + slider component
- **Chrome Extension Manifest V3** (service worker background)
- **Chrome APIs**: `chrome.runtime`, `chrome.tabs`, `chrome.windows`, `chrome.storage.sync`, `chrome.commands`
- All dependencies are vendored in-tree (no package.json, no npm)

## Architecture

Kindle Cloud Reader renders book pages as blob images (`div.kg-full-page-img > img`), not DOM text. The extension captures these images and uses Tesseract.js OCR to extract text.

```
Extension Icon Click → kreedExtMenu.html (popup)
    → sends 'open_kreeder' to background.js
    → background.js creates popup window with kreedPopup.html
    → kreedPopup.js connects to background.js via port
    → sends "ext" message to extract content
    → background.js relays to contentExtractor.js (content script)
    → contentExtractor.js captures page image as base64 data URL
    → image returned → kreedPopup.js runs Tesseract.js OCR
    → extracted text processed → RSVP word display
```

### Key Components

| File | Role |
|------|------|
| `manifest.json` | Extension config, permissions, commands, CSP for WebAssembly |
| `js/background.js` | Service worker — message router, popup window lifecycle, keyboard shortcut handler |
| `js/contentExtractor.js` | Content script — captures page blob images, handles page navigation (`#kr-chevron-left`/`#kr-chevron-right`) |
| `js/kreedPopup.js` | Main RSVP reader engine — OCR processing, playback, speed control, word display, settings persistence |
| `js/kreedExtMenu.js` | Extension icon popup menu logic |
| `js/tesseract/` | Vendored Tesseract.js v5 — OCR engine, WASM core, worker, English language data |
| `menus/kreedPopup.html` | Reader window markup (loads Tesseract.js + jQuery + kreedPopup.js) |
| `menus/kreedExtMenu.html` | Extension icon popup markup |
| `menus/options.html` | About/options page |

### Directory Layout

```
SpreedKindle/
├── manifest.json
├── css/                  # Stylesheets (bootstrap, kreedMain, kreedPopup, slider)
├── icons/                # Extension icons and UI assets
├── js/                   # Extension JavaScript
│   ├── tesseract/        # Vendored Tesseract.js v5 OCR engine
│   │   ├── tesseract.min.js
│   │   ├── worker.min.js
│   │   ├── tesseract-core.wasm.js
│   │   ├── tesseract-core-simd.wasm.js
│   │   └── lang/eng.traineddata.gz
│   ├── background.js
│   ├── contentExtractor.js
│   ├── kreedPopup.js
│   └── kreedExtMenu.js
├── menus/                # HTML pages (popup menu, reader window, options)
└── screenshots/          # Chrome Web Store screenshots
```

## Kindle Page Selectors

- **Page image**: `div.kg-full-page-img > img[src^="blob:"]`
- **Next page**: `#kr-chevron-right`
- **Previous page**: `#kr-chevron-left`

## OCR Pipeline

1. Content script captures blob image → draws to canvas → `toDataURL('image/png')`
2. Base64 data URL sent via port message to popup
3. Popup runs Tesseract.js OCR (legacy mode, `oem: 0`) with persistent worker
4. OCR text fed into `processExtractedText()` → existing word cleanup/splitting pipeline
5. RSVP playback begins automatically

OCR worker is initialized once on popup load and reused for all pages.

## Code Conventions

- **`$` prefix** on globals for jQuery/state vars: `$port`, `$words`, `$loc`, `$playing`
- **`kreederVars`** object holds all persisted settings (speed, fontsize, wCount, autoAdvance, etc.)
- **UPPER_CASE** for constants: `SPEED_INC`, `MAX_LIMIT`, `PUNCT_PATTERN`
- **camelCase** for functions: `getNextWords()`, `speedUp()`, `displayWord()`
- **Hyphenated** CSS classes: `footer-kreeder`, `slider-horizontal`
- Named port-based message passing: content script connects as `"content"`, popup as `"popup"`
- Settings persisted via `chrome.storage.sync` with fallback defaults

## RSVP Display Technique

Words are split into left/center/right segments. The center character is highlighted in gold (#FFC926) for eye fixation. Punctuation adds extra display delay. WPM formula: `60 * 1500 / speed`.

## Keyboard Shortcuts

- `Ctrl+Shift+Up` — Speed up
- `Ctrl+Shift+Down` — Speed down
- `Ctrl+Shift+Space` — Start reading current page

## Known Issues

- Pressing shortcut repeatedly can open multiple reader windows
- OCR accuracy depends on page rendering quality and font clarity
- OCR processing takes 3-8 seconds per page
- Works best with plain text-heavy books

## No Build Step

Load the extension directly via `chrome://extensions` → "Load unpacked" → select this directory. No compilation or bundling required.

## No Tests

No test framework or test files exist. Testing is manual across platforms.

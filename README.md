# Kreeder - Speed Reader for Kindle Cloud Reader

A Chrome extension that adds [RSVP (Rapid Serial Visual Presentation)](https://en.wikipedia.org/wiki/Rapid_serial_visual_presentation) speed reading to the [Kindle Cloud Reader](https://read.amazon.com/). It opens a popup window that displays book text word-by-word at configurable speeds, tracks your reading progress, and auto-advances Kindle pages as you go.

Inspired by [SwiftRead](https://chromewebstore.google.com/detail/swiftread-read-faster-lea/ipikiaejjblmdopojhpejjmbedhlibno).

## How It Works

Kindle Cloud Reader renders book pages as images, not selectable text. Kreeder captures those page images and uses [Tesseract.js](https://github.com/naptha/tesseract.js) (an in-browser OCR engine) to extract the text. The extracted text is then fed into the RSVP reader for speed-reading playback.

## Installation (Local Development)

This is a Chrome extension loaded directly from the source folder — no build tools or compilation required.

1. Clone or download this repository:
   ```
   git clone https://github.com/ApolloIntellact/SpreedKindle.git
   ```
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** and select the `SpreedKindle` folder.
5. The Kreeder icon should now appear in your Chrome toolbar.

> **Tip:** After making code changes, go back to `chrome://extensions` and click the reload button (circular arrow) on the Kreeder card to pick up your changes. Content script changes also require refreshing the Kindle tab.

## Usage

1. Go to [read.amazon.com](https://read.amazon.com/) and open a book.
2. Click the **Kreeder icon** in the toolbar and select **Open Kreeder**, or press `Ctrl+Shift+Space`.
3. The reader popup will open, OCR the current page, and begin speed-reading playback.

### Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+Space` | Open Kreeder / start reading current page |
| `Ctrl+Shift+Up` | Increase reading speed |
| `Ctrl+Shift+Down` | Decrease reading speed |

These shortcuts can be customized in Chrome at `chrome://extensions/shortcuts`.

## Project Structure

```
SpreedKindle/
├── manifest.json              # Extension config (Manifest V3)
├── css/                       # Stylesheets
│   ├── bootstrap.min.css      #   Bootstrap 3.3.5
│   ├── slider.css             #   Bootstrap Slider styles
│   ├── kreedMain.css          #   About/menu page styles
│   └── kreedPopup.css         #   Reader popup styles
├── icons/                     # Extension icons and UI assets
├── js/
│   ├── background.js          # Service worker — message router, popup lifecycle
│   ├── contentExtractor.js    # Content script — captures page images from Kindle
│   ├── kreedPopup.js          # Main RSVP reader engine (OCR, playback, settings)
│   ├── kreedExtMenu.js        # Toolbar popup menu logic
│   ├── options.js             # About/options page logic
│   ├── jquery-2.1.4.min.js    # Vendored jQuery
│   ├── bootstrap.min.js       # Vendored Bootstrap JS
│   ├── bootstrap-slider.js    # Vendored Bootstrap Slider
│   └── tesseract/             # Vendored Tesseract.js v5 OCR engine
│       ├── tesseract.min.js
│       ├── worker.min.js
│       ├── tesseract-core.wasm.js
│       ├── tesseract-core-simd.wasm.js
│       ├── tesseract-core-lstm.wasm.js
│       ├── tesseract-core-simd-lstm.wasm.js
│       └── lang/
│           └── eng.traineddata.gz   # English language data
├── menus/                     # HTML pages
│   ├── kreedPopup.html        #   Reader popup window
│   ├── kreedExtMenu.html      #   Toolbar popup menu
│   └── options.html           #   About/options page
└── screenshots/               # Chrome Web Store screenshots
```

## Updating Vendored Libraries

All third-party libraries are vendored directly in the repository (no `package.json` or `npm`). To update them, download the new files and replace the existing ones.

### Tesseract.js

Tesseract.js is the OCR engine that extracts text from Kindle page images. To update it:

1. Check the latest release at [github.com/naptha/tesseract.js/releases](https://github.com/naptha/tesseract.js/releases).
2. Download the following files from the release's CDN or `dist` folder:
   - `tesseract.min.js`
   - `worker.min.js`
   - `tesseract-core.wasm.js`
   - `tesseract-core-simd.wasm.js`
   - `tesseract-core-lstm.wasm.js`
   - `tesseract-core-simd-lstm.wasm.js`
3. Replace the corresponding files in `js/tesseract/`.
4. If the English language data has been updated, download the new `eng.traineddata.gz` from [tessdata](https://github.com/naptha/tessdata/tree/gh-pages/4.0.0) and replace `js/tesseract/lang/eng.traineddata.gz`.
5. Test the extension to verify OCR still works — check the browser console for errors.

> **Note:** Major version upgrades (e.g. v5 to v6) may require API changes in `js/kreedPopup.js` where the Tesseract worker is initialized and called. Review the [Tesseract.js migration guide](https://github.com/naptha/tesseract.js#readme) if upgrading across major versions.

### jQuery

1. Download the latest 2.x release from [jquery.com/download](https://jquery.com/download/) (or a newer major version if you're ready to test compatibility).
2. Replace `js/jquery-2.1.4.min.js` with the new file.
3. Update the `<script>` tag in `menus/kreedPopup.html`, `menus/kreedExtMenu.html`, and `menus/options.html` to reference the new filename.

### Bootstrap

1. Download Bootstrap 3 from [getbootstrap.com/docs/3.3/getting-started/#download](https://getbootstrap.com/docs/3.3/getting-started/#download).
2. Replace `js/bootstrap.min.js` and `css/bootstrap.min.css` with the new files.

### Bootstrap Slider

1. Check the original project at [github.com/seiyria/bootstrap-slider](https://github.com/seiyria/bootstrap-slider).
2. Replace `js/bootstrap-slider.js` and `css/slider.css` with the updated files.

## Known Issues

- Pressing `Ctrl+Shift+Space` (or clicking Open Kreeder) repeatedly can open multiple reader windows.
- OCR accuracy depends on the page rendering quality and font clarity. Processing takes 3-8 seconds per page.
- Books with lots of images or complex layouts (e.g. callout boxes, sidebars) may produce text in non-sequential order. Kreeder works best with plain text-heavy books.
- Manually changing the page in Kindle Cloud Reader does not automatically trigger Kreeder to refresh.

## TODO

- Improve OCR accuracy and speed.

## Open Source Licenses

Kreeder is made possible by the following open source projects:

| Library | Version | License | Links |
|---|---|---|---|
| [Tesseract.js](https://github.com/naptha/tesseract.js) | 5.x | [Apache 2.0](https://github.com/naptha/tesseract.js/blob/main/LICENSE) | [Project page](https://tesseract.projectnaptha.com/) · [GitHub](https://github.com/naptha/tesseract.js) |
| [Tesseract OCR Engine](https://github.com/tesseract-ocr/tesseract) | (upstream C++ engine) | [Apache 2.0](https://github.com/tesseract-ocr/tesseract/blob/main/LICENSE) | [GitHub](https://github.com/tesseract-ocr/tesseract) |
| [jQuery](https://jquery.com/) | 2.1.4 | [MIT](https://github.com/jquery/jquery/blob/main/LICENSE.txt) | [Project page](https://jquery.com/) · [GitHub](https://github.com/jquery/jquery) |
| [Bootstrap](https://getbootstrap.com/) | 3.3.5 | [MIT](https://github.com/twbs/bootstrap/blob/main/LICENSE) | [Project page](https://getbootstrap.com/) · [GitHub](https://github.com/twbs/bootstrap) |
| [Bootstrap Slider](https://github.com/seiyria/bootstrap-slider) | 2.0.0 | [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0) | [GitHub](https://github.com/seiyria/bootstrap-slider) |



## Publishing to the Chrome Web Store

To package and upload a new version of the extension:

### 1. Bump the version number

Update the `"version"` field in `manifest.json`. Chrome Web Store requires each upload to have a higher version than the last published one. Follow the `major.minor.patch.build` format (e.g. `0.0.0.8` → `0.0.0.9`).

### 2. Pack the extension into a .zip

Create a zip of the extension folder **without** any extra files (e.g. `.git`, `README.md`, `screenshots/`). From the parent directory of `SpreedKindle`:

**Windows (PowerShell):**
```powershell
Compress-Archive -Path SpreedKindle\manifest.json, SpreedKindle\css, SpreedKindle\icons, SpreedKindle\js, SpreedKindle\menus -DestinationPath Kreeder.zip
```

**Mac/Linux:**
```bash
cd SpreedKindle
zip -r ../Kreeder.zip manifest.json css/ icons/ js/ menus/ -x ".*"
```

> **What to include:** `manifest.json`, `css/`, `icons/`, `js/`, `menus/`. **What to exclude:** `.git/`, `screenshots/`, `README.md`, `CLAUDE.md`, and any other development-only files. The Chrome Web Store rejects packages containing unnecessary files.

### 3. Upload to the Chrome Web Store

1. Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
2. Sign in with the developer account that owns the Kreeder listing.
3. Find the existing **Kreeder** listing (or click **New Item** if publishing for the first time).
4. Click **Package** in the left sidebar, then **Upload new package**.
5. Select the `Kreeder.zip` file you created.
6. Review the **Store listing** tab — update the description, screenshots (from `screenshots/`), and promotional images if needed.
7. Review **Privacy practices** — Kreeder requires `activeTab`, `storage`, and `tabs` permissions. Justify each as prompted.
8. Click **Submit for review**. Google typically reviews extensions within 1-3 business days.

### 4. After publishing

Once approved, the new version rolls out automatically to existing users. Verify the listing is live at your [Chrome Web Store page](https://chromewebstore.google.com/).

> **First-time setup:** If you've never published to the Chrome Web Store, you'll need to [register as a developer](https://developer.chrome.com/docs/webstore/register) (one-time $5 fee) and verify your identity before you can upload.
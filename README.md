# LightMD

A quiet Markdown editor built with Vite and Tauri 2. Write, read rendered Markdown, or keep both side by side. Includes focus mode, light/dark themes, word counts, local draft recovery, and file opening/saving.

## Develop

Requires Node.js 22+ and npm. From this checkout:

```sh
npm ci
npm run dev
```

The web interface runs on port 1420. Browser mode opens files through a picker and saves through downloads. Desktop mode uses native dialogs and saves directly to the selected file. The interface uses bundled assets and requires no account or backend.

## Desktop

Install the [Tauri platform prerequisites](https://v2.tauri.app/start/prerequisites/), including stable Rust/Cargo. Linux additionally needs a C/C++ toolchain, pkg-config, WebKitGTK 4.1 and librsvg development packages. Windows needs Microsoft C++ Build Tools and WebView2; macOS needs Xcode command line tools.

```sh
npm ci
npm run tauri dev
```

To build a desktop executable:

```sh
npm run tauri build
```

Installer bundling is currently disabled; this builds the executable under `src-tauri/target/release`. Native compilation and file-dialog behavior have not yet been validated in the cloud machine, which lacks Rust and GTK/WebKitGTK. Browser-mode tests do not establish native readiness.

## Checks

```sh
npm run build
npx playwright install chromium
npm test
```

Tests use system Chromium when available, otherwise Playwright's downloaded Chromium. Set `CHROMIUM_PATH` to select another executable. Tests cover rendering/sanitization, view modes, draft recovery, focus and theme controls, file open/download round trips, and unsaved-draft protection.

## Using LightMD

- Switch between **Write**, **Split**, and **Read** in the toolbar.
- **New** starts a blank document; **Open** selects a Markdown or text file.
- **Save** writes the selected desktop file; **Save as** chooses another destination.
- Press Ctrl+S (Cmd+S on macOS) to save; add Shift for Save as.
- **Focus** hides the toolbar and status bar. Escape brings them back.

The last active draft is stored locally as you type. Recovered drafts require an explicit Save to choose their destination again. Recovery is best effort and is separate from saving a permanent file. This version keeps one draft, has no file browser or external-change detection, and renders raw HTML only after sanitization.

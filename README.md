# LightMD

A quiet Markdown editor built with Vite and Tauri 2. Write, read rendered Markdown, or keep both side by side. Includes focus mode, light/dark themes, word counts, local draft recovery, and file opening/saving.

## Install on a Mac

The [Build Mac app workflow](https://github.com/crvanslyke/LightMD/actions/workflows/macos.yml) produces a universal app for Apple Silicon and Intel Macs (macOS 11+).

1. Open the latest successful run and download its **LightMD-Mac** artifact (GitHub sign-in required).
2. Unzip the artifact, open the `.dmg`, and drag **LightMD** into **Applications**.
3. Launch LightMD from Applications. No Node.js, npm, Rust, or running development server is needed.

This initial build is ad-hoc signed, without Apple notarization. macOS may block the first launch; after attempting to open it, use **System Settings → Privacy & Security → Open Anyway** if offered. Distribution with a verified developer identity and notarization requires Apple Developer credentials, which are not configured. Do not disable Gatekeeper globally.

Use Open to choose a Markdown file. The first Save opens a name/location dialog; later saves update that same file. Save as chooses another file. Drafts recovered after quitting must be saved to a chosen location again.

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

Installer bundling is enabled. On macOS this produces an application and disk image under `src-tauri/target/release/bundle`. The GitHub workflow builds a universal binary and checks its architecture and signature. Native file-dialog behavior still requires a manual check on a Mac: save a new document to a chosen folder, edit and save again, quit, reopen the file, and confirm the edits. Tests with simulated Tauri IPC verify frontend file-operation logic but do not establish native dialog or permission readiness.

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

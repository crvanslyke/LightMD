// Exercise the desktop JS branch with a simulated Tauri IPC bridge.
// These tests verify requests/state, not OS dialogs or filesystem permissions.
import { test, expect } from '@playwright/test';
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.isTauri = true;
    window.desktop = { files: { '/Documents/opened.md': '# Opened\n\nOriginal text.' }, savePath: '/Documents/draft.md', saves: 0, fail: false, writes: [] };
    window.__TAURI_INTERNALS__ = {
      metadata: { currentWindow: { label: 'main' }, currentWebview: { label: 'main' } },
      transformCallback: () => 1,
      invoke: async (command, args, options) => {
        const state = window.desktop;
        if (command === 'plugin:event|listen') return 1;
        if (command === 'plugin:dialog|save') { state.saves++; return state.savePath; }
        if (command === 'plugin:dialog|message') return 'Yes';
        if (command === 'plugin:dialog|open') return '/Documents/opened.md';
        if (command === 'plugin:fs|read_text_file') return new TextEncoder().encode(state.files[args.path]);
        if (command === 'plugin:fs|write_text_file') {
          if (state.fail) throw new Error('Permission denied');
          const path = decodeURIComponent(options.headers.path);
          const text = new TextDecoder().decode(args);
          state.files[path] = text; state.writes.push({ path, text }); return;
        }
        throw new Error(`Unexpected IPC command: ${command}`);
      }
    };
  });
  await page.goto('/');
});
test('first Save chooses a path; repeat Save overwrites it; Save as changes it', async ({ page }) => {
  await page.getByRole('textbox').fill('# A draft\n\nSome words.');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('File saved');
  await page.getByRole('textbox').fill('# Revised');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('File saved');
  expect(await page.evaluate(() => window.desktop.saves)).toBe(1);
  expect(await page.evaluate(() => window.desktop.files['/Documents/draft.md'])).toBe('# Revised');
  await page.evaluate(() => { window.desktop.savePath = '/Documents/copy.md'; });
  await page.getByRole('button', { name: 'Save as…', exact: true }).click();
  await expect(page.locator('#file-label')).toHaveText('copy.md');
  expect(await page.evaluate(() => window.desktop.files['/Documents/copy.md'])).toBe('# Revised');
});
test('open, edit, save and reopen preserves Unicode content', async ({ page }) => {
  await page.getByRole('button', { name: 'Open…', exact: true }).click();
  await expect(page.getByRole('textbox')).toHaveValue('# Opened\n\nOriginal text.');
  const content = '# Café ☕\n\nA thought — with **emphasis**.\n';
  await page.getByRole('textbox').fill(content);
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('File saved');
  expect(await page.evaluate(() => window.desktop.saves)).toBe(0);
  await page.getByRole('button', { name: 'New', exact: true }).click();
  await page.getByRole('button', { name: 'Open…', exact: true }).click();
  await expect(page.getByRole('textbox')).toHaveValue(content);
});
test('cancelled or failed Save preserves the unsaved draft', async ({ page }) => {
  await page.getByRole('textbox').fill('Do not lose me');
  await page.evaluate(() => { window.desktop.savePath = null; });
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.locator('#file-label')).toContainText('Unsaved');
  expect(await page.evaluate(() => window.desktop.writes)).toHaveLength(0);
  await page.evaluate(() => { window.desktop.savePath = '/Documents/draft.md'; window.desktop.fail = true; });
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Permission denied');
  await expect(page.locator('#file-label')).toContainText('Unsaved');
  await expect(page.getByRole('textbox')).toHaveValue('Do not lose me');
});

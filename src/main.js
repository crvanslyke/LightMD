import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { isTauri } from '@tauri-apps/api/core';
import { welcome, wordCount, filename } from './document.js';
import './style.css';

const native = isTauri();
const key = 'lightmd-draft-v1';
let recovered;
try { recovered = JSON.parse(localStorage.getItem(key)); } catch {}
let text = typeof recovered?.text === 'string' ? recovered.text : welcome;
let name = typeof recovered?.name === 'string' ? recovered.name : 'Untitled.md';
let path = null; // Recovered drafts must be saved explicitly to a chosen file.
let savedText = recovered ? null : text;
let mode = 'write';
let busy = false;
let theme;
try { theme = localStorage.getItem('lightmd-theme'); } catch {}
document.documentElement.dataset.theme = theme === 'dark' ? 'dark' : 'light';

document.querySelector('#app').innerHTML = `
<header><div class="brand"><span class="mark">L<span>·</span></span> LightMD</div><div class="file-label" id="file-label"></div><div class="header-actions"><button id="theme" title="Toggle theme" aria-label="Toggle theme">◐</button><button id="focus" title="Focus mode (Escape to exit)">Focus <span>↗</span></button></div></header>
<nav aria-label="Document tools"><div class="file-actions"><button id="new">New</button><button id="open">Open…</button><button id="save" class="save">Save</button><button id="save-as">Save as…</button></div><div class="modes" aria-label="View mode"><button data-mode="write" aria-pressed="true">Write</button><button data-mode="split" aria-pressed="false">Split</button><button data-mode="read" aria-pressed="false">Read</button></div><div class="quiet-label">A little space for your words.</div></nav>
<main data-mode="write"><section class="writing"><div class="page-label">YOUR WORDS, AT YOUR PACE</div><textarea aria-label="Markdown editor" spellcheck="true" placeholder="Begin here…"></textarea></section><section class="reading"><div class="page-label">THE READING ROOM</div><article aria-label="Rendered Markdown"></article></section></main>
<footer><div><span class="status-dot"></span><span id="status" role="status"></span></div><div id="counts"></div><span class="shortcut">⌘ / Ctrl + S to save</span></footer><button id="exit-focus">Exit focus · Esc</button><input id="file-input" type="file" accept=".md,.markdown,.txt,text/plain,text/markdown" hidden>`;
const editor = document.querySelector('textarea');
const article = document.querySelector('article');
const status = document.querySelector('#status');
editor.value = text;
function render() {
  article.innerHTML = DOMPurify.sanitize(marked.parse(text));
  article.querySelectorAll('a').forEach(a => { a.target = '_blank'; a.rel = 'noopener noreferrer'; });
  document.querySelector('#counts').textContent = `${wordCount(text).toLocaleString()} words  ·  ${text.length.toLocaleString()} characters`;
  document.querySelector('#file-label').textContent = `${name}${text !== savedText ? ' · Unsaved' : ''}`;
  document.title = `${name} — LightMD`;
}
function recover() {
  try { localStorage.setItem(key, JSON.stringify({ text, name })); status.textContent = 'Draft recovered on this device'; }
  catch { status.textContent = 'Draft recovery unavailable — save your file'; }
}
function changeMode(value) {
  mode = value;
  document.querySelector('main').dataset.mode = mode;
  document.querySelectorAll('[data-mode]').forEach(el => { if(el.tagName === 'BUTTON') el.setAttribute('aria-pressed', String(el.dataset.mode === mode)); });
}
editor.addEventListener('input', () => { text = editor.value; render(); recover(); });
document.querySelectorAll('button[data-mode]').forEach(b => b.onclick = () => changeMode(b.dataset.mode));
async function canReplace(message = 'Replace this draft? Save it first if you want to keep it.') {
  if (text === savedText) return true;
  if (native) { const { ask } = await import('@tauri-apps/plugin-dialog'); return ask(message, { title: 'Unsaved changes', kind: 'warning' }); }
  return confirm(message);
}
function load(content, label, location) { text = content; name = label; path = location; savedText = text; editor.value = text; render(); recover(); status.textContent = 'File opened'; }
async function run(action) {
  if (busy) return;
  busy = true;
  document.querySelectorAll('.file-actions button').forEach(button => { button.disabled = true; });
  try { await action(); } catch (error) { status.textContent = `Could not complete action: ${error.message || error}`; } finally { busy = false; document.querySelectorAll('.file-actions button').forEach(button => { button.disabled = false; }); }
}
document.querySelector('#new').onclick = () => run(async () => { if (!await canReplace()) return; text = ''; name = 'Untitled.md'; path = null; savedText = null; editor.value = text; render(); recover(); changeMode('write'); editor.focus(); });
document.querySelector('#open').onclick = () => run(async () => {
  if (!await canReplace()) return;
  if (native) {
    const { open } = await import('@tauri-apps/plugin-dialog');
    const selected = await open({ multiple: false, filters: [{ name: 'Markdown', extensions: ['md','markdown','txt'] }] });
    if (selected) { const { readTextFile } = await import('@tauri-apps/plugin-fs'); load(await readTextFile(selected), filename(selected), selected); }
  } else document.querySelector('#file-input').click();
});
document.querySelector('#file-input').onchange = event => run(async () => { const file = event.target.files[0]; if (file) load(await file.text(), file.name, null); event.target.value = ''; });
async function save(as = false) {
  const snapshot = text;
  if (native) {
    let destination = path;
    if (as || !destination) { const { save } = await import('@tauri-apps/plugin-dialog'); destination = await save({ defaultPath: name, filters: [{ name: 'Markdown', extensions: ['md'] }] }); }
    if (!destination) return;
    const { writeTextFile } = await import('@tauri-apps/plugin-fs');
    await writeTextFile(destination, snapshot);
    path = destination; name = filename(destination);
  } else {
    const requested = as ? prompt('Save file as', name) : name;
    if (!requested) return;
    name = requested.endsWith('.md') ? requested : `${requested}.md`;
    const url = URL.createObjectURL(new Blob([snapshot], { type: 'text/markdown;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  savedText = snapshot; render(); recover(); status.textContent = native ? 'File saved' : 'Download prepared';
}
document.querySelector('#save').onclick = () => run(() => save());
document.querySelector('#save-as').onclick = () => run(() => save(true));
document.querySelector('#theme').onclick = () => { const value = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = value; try { localStorage.setItem('lightmd-theme', value); } catch {} };
function focus(value) { document.body.classList.toggle('focused', value); }
document.querySelector('#focus').onclick = () => focus(true);
document.querySelector('#exit-focus').onclick = () => focus(false);
document.addEventListener('keydown', event => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') { event.preventDefault(); run(() => save(event.shiftKey)); } if(event.key === 'Escape') focus(false); });
window.addEventListener('beforeunload', event => { if(!native && text !== savedText) { event.preventDefault(); event.returnValue = ''; } });
if (native) import('@tauri-apps/api/window').then(({ getCurrentWindow }) => getCurrentWindow().onCloseRequested(async event => { if (busy || !await canReplace('Close this document? Unsaved changes will remain in draft recovery, but will not be saved to your file.')) event.preventDefault(); })).catch(error => { status.textContent = `Close protection unavailable: ${error.message || error}`; });
render(); status.textContent = recovered ? 'Recovered draft — save to a file to keep it' : 'Ready when you are';

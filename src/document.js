export const welcome = `# A little room to think.

Welcome to **LightMD**. A quiet place for your words, from the first thought to the final draft.

Write in Markdown. Switch to **Read** to see your words take shape, or use **Split** to keep both in view.

## Start with a thought

You don’t need a perfect opening. Just a place to begin.

- Open a Markdown file, or start something new.
- Save your writing wherever you like.
- Turn on focus mode when you want the page to yourself.

> The secret of getting ahead is getting started.

---

Your draft recovers automatically on this device. Save a file to keep a permanent copy.
`;
export function wordCount(text) { return (text.trim().match(/\S+/gu) || []).length; }
export function filename(path) { return path?.split(/[\\/]/).pop() || 'Untitled.md'; }

# Crunchyroll Enhancer

An unofficial browser extension for Edge (and other Chromium browsers) that
adds quality-of-life features to crunchyroll.com. It labels every series card
by dub availability:

- green `EN DUB`: the series has English audio
- red `no-en`: dubbed, but not in English
- black `no-dub`: subtitled only

On browse pages, three toggles next to the site's own Filter control hide or
show cards by label. The choice is remembered in the browser.

A card with no label is one the extension has no data for yet; the toggles
never hide those. The label
describes the whole series, so it can differ from the site's own "Sub | Dub"
text, which on some cards describes a single episode.

Not affiliated with or endorsed by Crunchyroll. It relies on the site's
undocumented internal API, so it can break whenever the site changes.

## Install (unpacked)

1. Open `edge://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and pick this folder.
3. Open crunchyroll.com. Series cards on browse, search, and your watchlist
   get a label in the top right of the poster. The home page is patchier:
   some rows stay unlabelled.

After changing code, hit **Reload** on the extension card and refresh the tab.

## How it works

- `src/page-hook.js` runs in the page's own JS world and wraps `fetch` and
  `XMLHttpRequest` to copy the catalog API responses the site is already
  making. The extension makes no requests of its own.
- `src/audio-index.js` is the pure logic: it pulls each series' audio
  languages out of those responses and reads series ids out of card links.
- `src/filter-state.js` is the pure logic for which labels are hidden.
- `src/content.js` runs in the extension's isolated world, keeps an in-memory
  index of series, labels cards as they appear, and runs the filter toggles.
- `src/content.css` styles whatever the extension injects.

Plain JavaScript, no build step. Run the unit tests with `npm test`
(Node 22+).

## Development process

This repo carries the [ai-tools](https://github.com/jonupchurch/ai-tools)
toolkit (`AGENTS.md`, `CLAUDE.md`, `MANIFEST.md`, `.claude/`, `.specify/`,
`stacks/`). Features are planned with Spec-Kit (`speckit-specify` →
`speckit-plan` → `speckit-tasks` → `speckit-implement`) before they're built.
See `STATUS.md` for where things stand.

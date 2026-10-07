# Crunchyroll Enhancer

An unofficial browser extension for Edge (and other Chromium browsers) that
adds quality-of-life features to crunchyroll.com. First planned feature:
badges on series cards showing which audio languages are available.

Not affiliated with or endorsed by Crunchyroll. It relies on the site's
undocumented internal API, so it can break whenever the site changes.

## Install (unpacked)

1. Open `edge://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and pick this folder.
3. Open crunchyroll.com. With DevTools open and the "Verbose" log level on,
   you should see `[cr-enhancer] captured ...` lines in the console.

After changing code, hit **Reload** on the extension card and refresh the tab.

## How it works

- `src/page-hook.js` runs in the page's own JS world and wraps `fetch` to
  copy the catalog API responses the site is already making.
- `src/content.js` runs in the extension's isolated world, receives those
  responses, and will decorate the page.
- `src/content.css` styles whatever the extension injects.

Plain JavaScript, no build step.

## Development process

This repo carries the [ai-tools](https://github.com/jonupchurch/ai-tools)
toolkit (`AGENTS.md`, `CLAUDE.md`, `MANIFEST.md`, `.claude/`, `.specify/`,
`stacks/`). Features are planned with Spec-Kit (`speckit-specify` →
`speckit-plan` → `speckit-tasks` → `speckit-implement`) before they're built.
See `STATUS.md` for where things stand.

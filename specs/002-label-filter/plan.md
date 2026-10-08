# Implementation Plan: Filter Browse Cards by Dub Label

**Branch**: `002-label-filter` | **Date**: 2026-10-07 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-label-filter/spec.md`

## Summary

Three toggles next to the site's Filter control hide browse cards by label.
The content script already knows each card's label; it now also writes that
label onto the card's grid cell and lists the hidden labels on `<html>`. A
stylesheet rule hides matching cells, so the site's grid closes up by itself.
The choice is kept in `chrome.storage.local`.

## Technical Context

**Language/Version**: Plain JavaScript (ES2022), no build step

**Primary Dependencies**: None. `chrome.storage` (permission already in the manifest)

**Storage**: `chrome.storage.local`, one key: `hiddenLabels` (array of label names)

**Testing**: `node --test` for the pure filter state; manual check on the live site for the DOM

**Target Platform**: Microsoft Edge desktop (Chromium), MV3

**Project Type**: Browser extension

**Performance Goals**: Grid updates within half a second of a click (SC-002); no added scroll cost (SC-005)

**Constraints**: No requests of our own (FR-009); nothing hidden where the toggles aren't shown (FR-008); a filter failure must not break badges or the site (FR-010)

**Scale/Scope**: One new source file, one new test file, additions to `content.js` and `content.css`

## Constitution Check

| Principle | Status | Note |
|-----------|--------|------|
| I. Clarify before building | Pass | Control type and page scope recorded in the spec's Clarifications |
| II. Validated trust boundaries | Pass | The stored setting is sanitised on every read: only known label names survive |
| III. Match existing conventions | Pass | Same IIFE-per-file shape, `cr-enhancer-` prefix, pure logic split out for Node tests as in feature 001 |
| IV. Scope discipline | Pass | Browse grids only; no counters, no reordering, no fetching |
| V. Verify before done | Pass | Unit tests plus a live walk-through; the DOM part can only be checked in the browser |
| VIII. Test at the right level | Pass, with a deliberate skip | Filter state is unit tested. No automated DOM test: it would need a logged-in session on a live third-party site |
| IX. Branch + atomic commits | Pass | On `002-label-filter`, cut from the badge branch it depends on |

No violations.

## Design

### Markup this relies on (confirmed on `/videos/popular`, 2026-10-07)

```text
div.erc-browse-cards-collection          display: grid
└── div.browse-card                      the grid cell (what gets hidden)
    └── div.browse-card--{hash}          data-t="series-card "
        └── div.browse-card-hover--…     data-t="hover-component"

li.dropdown-item                         one per control in the page header
└── … div.erc-browse-filtering           the site's Filter control
```

`erc-browse-cards-collection`, `browse-card`, and `erc-browse-filtering` carry
no generated suffix, so they're used as selectors directly.

### Hiding

- Each pass of the existing badge loop also sets `data-cr-enhancer-label` on
  the grid cell of every labelled card, and clears it from cells that no
  longer have one (cells are reused as the list changes).
- `<html>` gets `data-cr-enhancer-hide="no-en no-dub"` listing hidden labels.
- One CSS rule per label hides `cell[label]` when `<html>` lists that label.
- Unlabelled cells have no attribute, so they can't match (FR-004).
- The `<html>` attribute is only set while the toggles are in the page, and
  removed otherwise (FR-008). The selector is also scoped to the browse grid.

Chosen over toggling `display` from script: the browser applies it to new
cards the moment they're labelled, there's no per-card work on a click, and
nothing is left behind if the script stops.

### Toggles

- A `<li class="cr-enhancer-filter">` holding three `<button>`s, inserted at
  the front of the list that holds the site's Filter control.
- Each button carries `aria-pressed` (true = shown) and a title; keyboard and
  screen-reader support come from using real buttons (FR-007).
- Re-inserted by the same loop if the site re-renders the header.

### State

- `src/filter-state.js`: `LABEL_KINDS`, `sanitizeHiddenLabels(value)`,
  `toggleLabel(hidden, kind)`. Pure, unit tested.
- Loaded from `chrome.storage.local` at start; saved on each click;
  `storage.onChanged` keeps other tabs in step.
- Storage failures are swallowed: the filter then works for the current page
  but isn't remembered.

## Risks

- **Infinite scroll on a short page.** With most cards hidden the page may be
  shorter than the window. Whether the site then loads more by itself, or
  needs a scroll, is unknown until tried.
- **Foreign node in a site-managed list.** The site's framework owns that
  `<ul>`. Adding a child is usually tolerated; if a re-render drops it, the
  loop puts it back.
- **Selector drift.** If the site renames these classes the toggles simply
  don't appear and nothing is hidden.

## Project Structure

```text
manifest.json              # adds src/filter-state.js
src/
├── filter-state.js        # new: pure filter state
├── content.js             # cell labelling, toggles, storage
└── content.css            # hide rule and toggle styles
tests/
└── filter-state.test.js   # new
```

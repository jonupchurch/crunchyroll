# Tasks: Filter Browse Cards by Dub Label

**Input**: Design documents from `/specs/002-label-filter/`

**Prerequisites**: plan.md, spec.md

**Tests**: Included for the pure filter state. DOM behaviour is checked by hand on the live site.

## Phase 1: Foundational

- [x] T001 [P] Unit tests in `tests/filter-state.test.js` for `sanitizeHiddenLabels` (unknown entries, duplicates, non-list values) and `toggleLabel` (hide, show, input untouched, unknown label, corrupt input)
- [x] T002 Implement `LABEL_KINDS`, `sanitizeHiddenLabels`, `toggleLabel` in `src/filter-state.js`, exposed on `globalThis.crEnhancer` and `module.exports`
- [x] T003 Add `src/filter-state.js` to the isolated-world content script in `manifest.json`, ahead of `src/content.js`

## Phase 2: User Story 1 - Hide the cards I don't care about (P1) 🎯 MVP

**Independent Test**: on a browse page with mixed labels, switch each toggle off and on; exactly the cards with that label disappear and return, and the grid closes up.

- [x] T004 [US1] In `src/content.js`, set `data-cr-enhancer-label` on the grid cell (`.erc-browse-cards-collection > .browse-card`) of each labelled card on every pass, and clear it from cells that no longer have a label
- [x] T005 [US1] In `src/content.js`, insert a `li.cr-enhancer-filter` with one `<button>` per label at the front of the list holding `.erc-browse-filtering`; keep `aria-pressed` and `title` in step with the state; re-insert if the site drops it
- [x] T006 [US1] In `src/content.js`, write the hidden labels to `data-cr-enhancer-hide` on `<html>` only while the toggles are in the page, and remove it otherwise
- [x] T007 [US1] In `src/content.css`, hide cells whose label is listed on `<html>`, and style the toggles (on: label colour; off: outlined, dimmed, struck through; visible focus ring)
- [ ] T008 [US1] On `/videos/popular`: toggle each label off and on; check the grid closes up, unlabelled cards stay, and the site's own Sort and Filter still work

## Phase 3: User Story 2 - The filter keeps applying (P2)

**Independent Test**: switch a toggle off, scroll until new cards load, go to another browse page, reload.

- [x] T009 [US2] In `src/content.js`, load the hidden labels from `chrome.storage.local` at start, save on each click, and follow `storage.onChanged`; swallow storage errors
- [ ] T010 [US2] On the live site: with a toggle off, scroll for new batches, move to another browse page, reload, and reopen the tab; the toggle stays off and new cards are hidden as they arrive
- [ ] T011 [US2] With only one label shown on a mostly-other listing, check what the site does when the page is shorter than the window (does it keep loading?) and record it in `plan.md` under Risks

## Phase 4: Polish

- [x] T012 [P] Update `README.md`, `STATUS.md`, and `CHANGELOG.md`
- [ ] T013 Check home, search, and watchlist: no toggles, nothing hidden even with a toggle off elsewhere; no extension errors in the console

## Dependencies

Phase 1 → US1 → US2 → Polish. Everything edits `src/content.js`, so tasks run in order. T008, T010, T011, and T013 need the live site.

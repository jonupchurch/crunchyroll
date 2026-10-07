# Tasks: English Dub Badge on Series Cards

**Input**: Design documents from `/specs/001-english-dub-badge/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/internal-interfaces.md, quickstart.md

**Tests**: Included. The repo's rules require unit tests for logic; DOM behaviour is checked by hand via quickstart.md.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story the task belongs to

## Phase 1: Setup

- [ ] T001 Create `package.json` with name, `"private": true`, and `"scripts": { "test": "node --test" }` only (no dependencies)
- [ ] T002 In `manifest.json`, add `src/audio-index.js` ahead of `src/content.js` in the isolated-world content script and change that script's `run_at` to `document_start`

---

## Phase 2: Foundational (blocks all user stories)

- [ ] T003 [P] Write unit tests in `tests/audio-index.test.js` for `collectAudioInfo`: browse-style series item, `/cms/objects` series item, series without `en-US`, `movie_listing_metadata` item, watchlist `{ panel: episode }` item (episode→series mapping; true from `versions[]`, never false), nested rows, and malformed input (null, strings, missing/non-array `audio_locales`, non-string ids, over-deep nesting) returning empty results without throwing
- [ ] T004 [P] Write unit tests in `tests/audio-index.test.js` for `linkTargetFromHref`: `/series/{id}/slug`, absolute URL, locale-prefixed path, `/watch/{id}/slug`, unrelated paths, empty and non-string input
- [ ] T005 Implement `collectAudioInfo`, `linkTargetFromHref`, and `ENGLISH_LOCALE` in `src/audio-index.js` per contracts/internal-interfaces.md, exposed on `globalThis.crEnhancer` and `module.exports`; `npm test` passes
- [ ] T006 In `src/content.js`, replace the scaffold log with an index: feed each captured body through `collectAudioInfo` into a `series id → hasEnglish` map (true wins) and an `episode id → series id` map, inside a try/catch so a bad body can't throw

**Checkpoint**: tests green; index fills as the site loads data (verify with a temporary console check, then remove it).

---

## Phase 3: User Story 1 - See which series have an English dub (Priority: P1) 🎯 MVP

**Goal**: Cards on the browse page show an `EN DUB` pill when the series has English audio.

**Independent Test**: quickstart.md section 2.

- [ ] T007 [US1] Get one whole browse card's outerHTML from the live site; record the card container, poster element, and link structure in `specs/001-english-dub-badge/research.md` and pick the poster corner
- [ ] T008 [US1] Add badge styles to `src/content.css`: `.cr-enhancer-dub-badge` pill (solid dark background, light text, absolute position in the chosen corner, `pointer-events: none`) and whatever positioning context `.cr-enhancer-badged` needs
- [ ] T009 [US1] In `src/content.js`, add `badgeCards(root)`: find card links, resolve each via `linkTargetFromHref` and the index, and add one badge element (per the DOM contract) to cards whose series has English; skip unknown series; never add a second badge
- [ ] T010 [US1] Run `badgeCards` once the body exists and again whenever the index gains entries; walk quickstart.md section 2 on the live site

**Checkpoint**: browse page badges correct on first load.

---

## Phase 4: User Story 2 - Badges on every page with series cards (Priority: P2)

**Goal**: Same behaviour on home, search, and watchlist.

**Independent Test**: quickstart.md section 4.

- [ ] T011 [US2] Get one whole watchlist card's outerHTML (the `watchlist-card` container around the empty overlay link) and record where the poster sits in `specs/001-english-dub-badge/research.md`
- [ ] T012 [US2] Extend card finding and badge placement in `src/content.js` and `src/content.css` for watchlist cards (`/watch/{episodeId}` links resolved through the episode map; badge attached to the card's poster, not the empty link)
- [ ] T013 [US2] Check home and search on the live site; if cards there go unbadged, capture one response item and one card's HTML for the failing page, add a failing case to `tests/audio-index.test.js`, and fix in `src/audio-index.js` / `src/content.js`
- [ ] T014 [US2] Walk quickstart.md section 4

---

## Phase 5: User Story 3 - Badges keep up as the page changes (Priority: P3)

**Goal**: New cards from scrolling and in-site navigation get badged; no duplicates.

**Independent Test**: quickstart.md section 3.

- [ ] T015 [US3] In `src/content.js`, add a `MutationObserver` on `document.body` (`childList`, `subtree`) that schedules one `badgeCards` pass per animation frame
- [ ] T016 [US3] Handle recycled card elements in `src/content.js`: when a badged card's link now points at a series without English (or unknown), remove the badge and the `cr-enhancer-badged` class
- [ ] T017 [US3] Walk quickstart.md section 3, including scrolling past 500 cards

---

## Phase 6: Polish

- [ ] T018 [P] Update `README.md`: what the badge does, `npm test`, and that the hook covers XHR as well as fetch
- [ ] T019 [P] Update `STATUS.md` and `CHANGELOG.md`
- [ ] T020 Walk quickstart.md section 5 (no console errors; site unchanged with the extension off), read back the full diff, and remove any leftover debug logging

---

## Dependencies & Execution Order

- Setup → Foundational → US1 → US2 → US3 → Polish.
- T003 and T004 are written before T005 and must fail first.
- US2 and US3 both build on `badgeCards` from US1 and edit `src/content.js`, so they run in sequence, not in parallel.
- T007 and T011 need the user (live-site HTML). Everything in Phases 1 and 2 can proceed without them.

## Implementation Strategy

MVP is Phases 1 to 3: badges on the browse page. Stop and validate there, then add the other pages (US2) and live updating (US3), validating each with its quickstart section.

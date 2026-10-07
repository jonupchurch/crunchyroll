# Implementation Plan: English Dub Badge on Series Cards

**Branch**: `001-english-dub-badge` | **Date**: 2026-10-07 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-english-dub-badge/spec.md`

## Summary

Badge a series card when the series has `en-US` audio. The site already sends
the full audio list with the card data (`series_metadata.audio_locales` on
browse items, confirmed), and the existing page hook already captures those
responses. So: index every captured response into an in-memory
`series id → has English audio` map (plus `episode id → series id`, because
watchlist cards link to an episode), find cards in the DOM by the id in their
link, and overlay a pill on the poster. No requests of our own.

## Technical Context

**Language/Version**: Plain JavaScript (ES2022), no transpile, no build step

**Primary Dependencies**: None. Chromium extension APIs (Manifest V3 content scripts) only

**Storage**: None. In-memory map per tab, rebuilt from captured responses

**Testing**: Node's built-in runner (`node --test`, Node 22) for the pure logic; manual quickstart on the live site for DOM behaviour

**Target Platform**: Microsoft Edge desktop (Chromium), MV3

**Project Type**: Browser extension

**Performance Goals**: Badge within 1 s of a card appearing (SC-003); no perceptible scroll cost at 500+ cards (SC-005)

**Constraints**: Never alter or delay the site's own requests (FR-008); fail to "no badge", never to a wrong badge (FR-007); no extra network calls

**Scale/Scope**: One feature, roughly 3 small source files and 1 test file

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Note |
|-----------|--------|------|
| I. Clarify before building | Pass | Spec has no open markers; placement decided 2026-10-07 |
| II. Validated trust boundaries | Pass | Captured response bodies are untrusted input: the indexer type-checks every field it reads and ignores anything malformed. `postMessage` listener keeps its existing source/origin checks |
| III. Match existing conventions | Pass | Stays plain JS, IIFE-per-file, `cr-enhancer` naming, same `src/` layout as the scaffold |
| IV. Scope discipline | Pass | English only, no settings, no filtering, no own requests |
| V. Verify before done | Pass | `node --test` plus the quickstart walk-through |
| VII. Plan the feature set first | Pass | The initial set is this one feature |
| VIII. Test at the right level | Pass, with a deliberate skip | Unit tests for indexing and href parsing. No automated e2e: it would need a logged-in session against a live third-party site. Manual quickstart instead |
| IX. Branch + atomic commits | Pass | On `001-english-dub-badge` |

Post-design re-check: no change. No violations, so Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/001-english-dub-badge/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── internal-interfaces.md
└── tasks.md             # created by /speckit-tasks
```

### Source Code (repository root)

```text
manifest.json            # content.js moves to document_start; audio-index.js added
package.json             # new: only "scripts": { "test": "node --test" }, no deps
src/
├── page-hook.js         # unchanged
├── audio-index.js       # new: pure logic (index responses, parse series id from href)
├── content.js           # receives responses, feeds the index, badges cards
└── content.css          # badge styles
tests/
└── audio-index.test.js  # new
```

**Structure Decision**: Keep the scaffold's flat `src/`. The one new idea is
splitting pure logic into `audio-index.js` so Node can test it without a
browser. It is loaded as an ordinary content script ahead of `content.js` and
also exports via `module.exports` when that exists.

## Open items carried into tasks

- **Card DOM is only partly known.** Watchlist cards use an empty overlay
  link to `/watch/{episodeId}`; the poster is elsewhere in the card. Needs a
  whole card's HTML (watchlist and browse) before the DOM code is written.
- **Watchlist data is confirmed**: episode panels carrying `series_id` and
  per-episode `versions[]`. The `/cms/objects` follow-up is expected to carry
  the series-level list but hasn't been captured.
- **Home and search shapes are unverified.** Assumed to match browse.
- **Which poster corner** is picked once the card DOM is known.

## Complexity Tracking

No violations.

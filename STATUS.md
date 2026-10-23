# Status

**Phase:** Badges and the browse label filter both working on the live site and merged to `main` (2026-10-07).

## What exists

- Manifest V3 skeleton that loads unpacked in Edge.
- `page-hook.js` → `content.js` pipeline that captures `/content/v2/` API
  responses and logs them. No user-visible features.
- ai-tools toolkit and Spec-Kit engine imported.
- Draft spec for the English dub badge at
  `specs/001-english-dub-badge/spec.md` (branch `001-english-dub-badge`).
  Passes its quality checklist; no open items.
- Plan, research, data model, contracts, quickstart, and tasks alongside it.
  Code tasks done; live-site checks open.
- `src/audio-index.js` (pure logic, 16 unit tests via `npm test`).
- `content.js` indexes captured responses and badges cards, re-checking on
  every DOM change; `content.css` styles the pill (top right of the image).
  Built against real watchlist markup; a generic rule covers other pages.
  Seen working on the watchlist (first screen, 2026-10-07). Browse, home,
  search, long scrolling, and accuracy against series pages are unchecked.

## Confirmed on the live site (2026-10-07)

- The site calls `/content/v2/` over XHR; the hook captures it.
- Season objects (`/content/v2/cms/series/{id}/seasons`) list every audio
  language in `versions[]` as `{ audio_locale, guid, original, variant }`.
  `original: true` marks the source-language track.
- A season's own `audio_locales` only holds the preferred language (the
  response is tailored by `preferred_audio_language`), so don't use it.
- `subtitle_locales` on the season is the complete list.
- Browse items (`/content/v2/discover/browse`, `data[]`) carry the complete
  audio list in `series_metadata.audio_locales`, keyed by series `id`
  (sample: Frieren, 13 locales incl. `en-US`). No per-series lookup needed
  there. `is_dubbed` is also present but isn't English-specific.
- Items have `slug_title` and `id`, which is what a card's link is built from.
- The watchlist page then calls `/cms/objects/{series ids}`, which returns
  the same series objects as browse (`series_metadata.audio_locales`).
- Watchlist items are `{ panel: <episode> }`: `panel.id` is the episode,
  `episode_metadata.series_id` the series, `episode_metadata.versions[]` that
  episode's audio tracks. Watchlist cards link to `/watch/{episodeId}/...`
  through an empty overlay `<a class="watchlist-card__content-link--{hash}">`.

## Requirements decided

- Green `EN DUB` badge when a series has an English audio version (`en-US`).
- Red `no-en` tag when the site marks the series dubbed (`is_dubbed`) but it
  has no `en-US` audio (added 2026-10-07; replaces "no badge otherwise").
- Black `no-dub` label on undubbed series (added 2026-10-07). Nothing only
  when the series is unknown. Other languages are never named.
- Badge is overlaid on a corner of the poster; which corner is a plan detail.

## Open decisions

- Home page: some cards stayed unlabelled. Cause found for the "Top Picks"
  row: it comes from `/personalization/v2/personalization`, which the hook
  ignored. The hook now captures that path too; user reports home is
  better (2026-10-07), not confirmed complete, and
  other rows may have other sources.
- The pill overlaps the site's orange top-right corner marker on some
  posters; move it or leave it? Unanswered.
- Filter feature (`specs/002-label-filter/`, branch `002-label-filter`):
  spec, plan, tasks, and code are in. Toggles go next to the site's Filter
  control; cells are hidden by a CSS rule keyed on attributes the content
  script sets. 9 unit tests for the filter state. User reports filtering
  works (2026-10-07); persistence and non-browse pages not separately checked. Unknown: what the site's infinite scroll does when the
  filtered page is shorter than the window.
- `main` is merged locally but not pushed to `origin`.

- Watchlist export (`specs/003-watchlist-export/`, branch
  `003-watchlist-export`): spec written 2026-10-23, no open markers.
  Unverified whether captured watchlist data carries genres and progress.

## Decided

- Stay plain JS with no build step; unit tests via `node --test`.

## Next action

Plan 003 (watchlist export), starting by capturing a real watchlist
response to see which columns are available. Push `main` when the user says. Leftover checks: 002 tasks T010, T011, T013;
001 task T020. Open question: move the pill off the site's orange corner
marker?

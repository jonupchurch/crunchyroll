# Status

**Phase:** English dub badge working on the watchlist; other pages unchecked (2026-10-07).

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

- Does the generic card rule (a `/series/` link wrapping an image) match the
  cards on browse, home, and search? No markup captured for those.
- Whether anything besides the badge belongs in the initial feature set.

## Decided

- Stay plain JS with no build step; unit tests via `node --test`.

## Next action

Reload and check the `no-en` and `no-dub` labels (T024, T028). Check one unbadged "Sub | Dub" watchlist card (Do It Yourself!!) against its
series page, then browse, home, search, and a long scroll (T010, T013, T014,
T017, T020).

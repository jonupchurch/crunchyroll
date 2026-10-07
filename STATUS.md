# Status

**Phase:** English dub badge specced and planned; tasks next (2026-10-07).

## What exists

- Manifest V3 skeleton that loads unpacked in Edge.
- `page-hook.js` → `content.js` pipeline that captures `/content/v2/` API
  responses and logs them. No user-visible features.
- ai-tools toolkit and Spec-Kit engine imported.
- Draft spec for the English dub badge at
  `specs/001-english-dub-badge/spec.md` (branch `001-english-dub-badge`).
  Passes its quality checklist; no open items.
- Plan, research, data model, contracts, and quickstart alongside it.

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

- Badge only when a series has an English audio version (`en-US`). No badge
  otherwise, and no listing of other languages.
- Badge is overlaid on a corner of the poster; which corner is a plan detail.

## Open decisions

- Card DOM is only partly known: need a whole card's HTML (watchlist and
  browse) to find the poster and pick the corner.
- Home and search item shapes are unconfirmed. Film listings likely use
  `movie_listing_metadata`.
- Whether anything besides the badge belongs in the initial feature set.

## Decided

- Stay plain JS with no build step; unit tests via `node --test`.

## Next action

`speckit-tasks`, then implement User Story 1 (browse) once the card HTML is in.

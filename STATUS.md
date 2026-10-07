# Status

**Phase:** speccing the first feature, English dub badge (2026-10-07).

## What exists

- Manifest V3 skeleton that loads unpacked in Edge.
- `page-hook.js` → `content.js` pipeline that captures `/content/v2/` API
  responses and logs them. No user-visible features.
- ai-tools toolkit and Spec-Kit engine imported.
- Draft spec for the English dub badge at
  `specs/001-english-dub-badge/spec.md` (branch `001-english-dub-badge`).
  Passes its quality checklist; no open items.

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

## Requirements decided

- Badge only when a series has an English audio version (`en-US`). No badge
  otherwise, and no listing of other languages.
- Badge is overlaid on a corner of the poster; which corner is a plan detail.

## Open decisions

- Home, search, and watchlist item shapes are unconfirmed; assumed to match
  browse until a capture says otherwise. Film listings likely use
  `movie_listing_metadata` instead of `series_metadata` (unconfirmed).
- Whether anything besides the badge belongs in the initial feature set.
- Whether to add a build step / test runner, or stay plain JS.

## Next action

`speckit-plan`. It needs the card-grid
endpoint answer above, which takes a console capture from the live site.

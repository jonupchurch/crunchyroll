# Status

**Phase:** scaffolded, nothing specced yet (2026-10-07).

## What exists

- Manifest V3 skeleton that loads unpacked in Edge.
- `page-hook.js` → `content.js` pipeline that captures `/content/v2/` API
  responses and logs them. No user-visible features.
- ai-tools toolkit and Spec-Kit engine imported.

## Confirmed on the live site (2026-10-07)

- The site calls `/content/v2/` over XHR; the hook captures it.
- Season objects (`/content/v2/cms/series/{id}/seasons`) list every audio
  language in `versions[]` as `{ audio_locale, guid, original, variant }`.
  `original: true` marks the source-language track.
- A season's own `audio_locales` only holds the preferred language (the
  response is tailored by `preferred_audio_language`), so don't use it.
- `subtitle_locales` on the season is the complete list.

## Requirements decided

- Badge only when a series has an English audio version (`en-US`). No badge
  otherwise, and no listing of other languages.

## Open decisions

- What the card-grid endpoints (home, browse, search, watchlist) return per
  item: is the full audio list there, or does each series need its own lookup?
- Badge placement: overlay on the poster vs. text beside the title.
- Whether to add a build step / test runner, or stay plain JS.

## Next action

Spec the initial feature set with `speckit-specify` (audio-language badges
first), then `speckit-plan` across the set before implementing anything.

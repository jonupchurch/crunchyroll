# Status

**Phase:** speccing the first feature, English dub badge (2026-10-07).

## What exists

- Manifest V3 skeleton that loads unpacked in Edge.
- `page-hook.js` → `content.js` pipeline that captures `/content/v2/` API
  responses and logs them. No user-visible features.
- ai-tools toolkit and Spec-Kit engine imported.
- Draft spec for the English dub badge at
  `specs/001-english-dub-badge/spec.md` (branch `001-english-dub-badge`).
  One open item: badge placement (FR-009).

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
- Badge placement: overlay on the poster vs. text beside the title. Blocks
  the spec (FR-009).
- Whether anything besides the badge belongs in the initial feature set.
- Whether to add a build step / test runner, or stay plain JS.

## Next action

Close badge placement, then `speckit-plan`. The plan needs the card-grid
endpoint answer above, which takes a console capture from the live site.

# Status

**Phase:** scaffolded, nothing specced yet (2026-10-07).

## What exists

- Manifest V3 skeleton that loads unpacked in Edge.
- `page-hook.js` → `content.js` pipeline that captures `/content/v2/` API
  responses and logs them. No user-visible features.
- ai-tools toolkit and Spec-Kit engine imported.

## Open decisions

- Confirm on the live site that series objects in `/content/v2/` responses
  carry `audio_locales` / `subtitle_locales`, and which endpoints feed which
  card types (home, browse, search, watchlist).
- Badge placement: overlay on the poster vs. text beside the title.
- Whether to add a build step / test runner, or stay plain JS.

## Next action

Spec the initial feature set with `speckit-specify` (audio-language badges
first), then `speckit-plan` across the set before implementing anything.

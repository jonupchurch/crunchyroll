# Data Model: English Dub Badge

Nothing is persisted. All state lives in the content script for the life of
the tab.

## Catalog item (input, untrusted)

An object found anywhere inside a captured `/content/v2/` response.

| Field | Type | Use |
|-------|------|-----|
| `id` | string | Series id, e.g. `GG5H5XQX4`. The key |
| `series_metadata.audio_locales` | string[] | Full audio list for a series |
| `movie_listing_metadata.audio_locales` | string[] | Same, for film listings (unconfirmed) |

Validation: indexed only if `id` is a non-empty string and `audio_locales` is
an array. Non-string entries in the array are ignored. Anything else is
skipped silently.

## Episode panel (input, untrusted)

Watchlist items wrap an episode: `{ panel: { id, type: 'episode', episode_metadata } }`.

| Field | Type | Use |
|-------|------|-----|
| `id` | string | Episode id, e.g. `GPWUKE2M5`. What the card links to |
| `episode_metadata.series_id` | string | Series the episode belongs to |
| `episode_metadata.versions[].audio_locale` | string | That episode's audio tracks. Can only prove English exists, never that it doesn't |

## Audio index (state)

`Map<seriesId: string, hasEnglish: boolean>` plus
`Map<episodeId: string, seriesId: string>` for cards that link to an episode.

- `hasEnglish` is true when `audio_locales` includes `en-US`.
- A series absent from the map is **unknown**, which renders the same as
  false: no badge.
- Merge rule when a series is seen again: true wins. A later response that
  omits English never removes a badge already earned in this tab, since some
  responses may be partial.

## Card (DOM)

A link whose path contains `/series/{id}`, or `/watch/{episodeId}` for an
episode whose series is known. The link may wrap the poster or be an empty
overlay beside it (watchlist).

| State | Meaning |
|-------|---------|
| unmarked | Not yet evaluated, or series still unknown |
| badged | Series has English audio; carries exactly one badge element |

Transitions: unmarked → badged when the index says true. There is no
badged → unmarked transition within a page view. If the site reuses a card
element for a different series (recycled list rows), the badge is re-evaluated
against the link's current id and removed if it no longer applies.

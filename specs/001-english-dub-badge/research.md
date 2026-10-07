# Research: English Dub Badge

## 1. Where the audio list comes from

- **Decision**: Read `series_metadata.audio_locales` from card-data responses
  the site already makes. Make no requests of our own.
- **Rationale**: Confirmed on a live browse item (`/content/v2/discover/browse`,
  Frieren, 2026-10-07): the array held 13 locales including `en-US`, so it is
  the full list, not the viewer's preferred language. Zero added load, no auth
  handling, nothing to rate-limit.
- **Alternatives considered**:
  - Per-series `/cms/series/{id}/seasons` lookup and reading `versions[]`:
    correct, but one request per card and needs the site's bearer token.
    Kept only as a fallback idea if some page turns out to lack the list.
  - `is_dubbed`: present, but means "has any dub", not English.
  - `language_presentation.audio_locale`: reflects the viewer's preference,
    not availability.
  - A season's own `audio_locales`: known to be tailored to the preferred
    language. Not used.

## 2. Recognising card data in a response

- **Decision**: Walk each captured body and index any object that has a string
  `id` and a `series_metadata` or `movie_listing_metadata` object containing an
  `audio_locales` array. Don't key on endpoint URLs.
- **Rationale**: Home, search, and watchlist nest items differently (rows,
  typed buckets, wrapped panels). A shape-based walk picks them all up if they
  carry the same item object, and keeps working when an endpoint is renamed.
- **Alternatives considered**: A per-endpoint parser table. More precise, but
  three of the four endpoints are unconfirmed and it breaks on any URL change.
- **Guard**: the walk is depth-limited and skips non-objects, so an odd
  response costs little and can't throw.

## 3. Matching a card to a series

- **Decision**: Take the series id from the card link's path:
  `/series/{id}/...`, allowing an optional locale prefix (`/de/series/...`).
- **Rationale**: Items carry `id` and `slug_title`, which is what the site
  builds series URLs from. The id is stable; class names on this site are
  generated and aren't.
- **Watchlist (confirmed 2026-10-07)**: cards link to the next episode,
  `/watch/{episodeId}/{slug}`, not the series. Each watchlist item is
  `{ panel: <episode>, ... }` where `panel.id` is the episode id and
  `panel.episode_metadata.series_id` is the series. So the index also keeps
  `episode id → series id`, and a `/watch/{id}` link resolves through it.
- **Why not just read the episode's `versions[]`**: it lists that one
  episode's audio tracks. A series dubbed for season 1 only, with the viewer
  up to season 2, would read as "no English" though the series has it. The
  episode's versions are used as evidence for true only; the series-level list
  decides otherwise. The watchlist page follows up with
  `/cms/objects/{series ids}`, which carries the same series object as
  browse, `series_metadata.audio_locales` included (confirmed 2026-10-07,
  Wise Man's Grandchild: ja-JP, es-419, pt-BR, en-US).
- **Watchlist card markup (confirmed 2026-10-07)**:
  - Card: `[data-t="watch-list-card"]`. The `data-t` attributes look stable;
    class names carry generated suffixes (`watchlist-card--YfKgo`).
  - First child is the empty overlay link to `/watch/{episodeId}`.
  - Image area: `div.watchlist-card-image--{hash}`, holding a tags group, a
    2:3 poster, a 16:9 thumbnail, and the hover/play layer. The badge goes
    here, top right: tags sit in their own group and duration/progress are
    along the bottom.
  - The title is a second link straight to `/series/{id}/{slug}`, so the
    series id is read from the card directly. The episode map stays as a
    fallback for cards that only have a `/watch/` link.
  - The list is virtualised (`role="listitem"` rows moved with `transform`),
    so card elements are reused for different series while scrolling.
- **Other pages**: no markup captured. A generic rule is used: any
  `/series/` link that contains an `<img>` is a card and hosts its own badge.
  Unverified.

## 4. Noticing new cards

- **Decision**: One `MutationObserver` on `document.body` (`childList`,
  `subtree`, plus `href` attribute changes, since recycled cards get a new
  link instead of a new element), with work batched to one pass per animation frame. A pass also
  runs whenever the index gains new series, since data and DOM can arrive in
  either order.
- **Rationale**: The site is a single-page app with infinite scroll; there is
  no navigation event to rely on. Batching keeps cost flat during fast scroll.
- **Alternatives considered**: Polling on a timer (wasteful, laggy);
  `IntersectionObserver` per card (more bookkeeping, no benefit at this size).
- **Idempotence**: every pass works out which cards should have a badge,
  removes badges from any that shouldn't, and adds only where one is missing,
  so re-renders and recycling can't leave duplicates or stale badges (FR-006).

## 5. Timing: not missing early responses

- **Decision**: Run `content.js` at `document_start` instead of
  `document_idle`. It registers its message listener immediately and defers
  DOM work until the body exists.
- **Rationale**: The page hook posts each response once. A listener that
  attaches at idle can miss the first page of card data.
- **Alternatives considered**: Buffering in the page hook and replaying on
  request. Works, but adds a handshake for something a manifest line fixes.

## 6. Badge rendering

- **Decision**: A `<span>` pill, absolutely positioned in a corner of the
  poster's link, styled in `content.css` with a solid dark background and
  light text, `pointer-events: none`, and an `aria-label` of "English dub
  available". Label text: `EN DUB`.
- **Rationale**: Solid background stays readable over any artwork (FR-010);
  no pointer events means clicks and hover pass through (FR-011); absolute
  positioning leaves layout alone (FR-009).
- **Corner**: top right.

## 7. Tests without a build step

- **Decision**: `node --test` against `src/audio-index.js`, which assigns its
  functions to a global for the browser and to `module.exports` under Node.
  A `package.json` with only a `test` script.
- **Rationale**: Node 22 is installed; no dependencies to add or maintain.
- **Alternatives considered**: Vitest/Jest (a dependency tree for two pure
  functions); ES modules in content scripts (needs dynamic import and
  `web_accessible_resources`, more moving parts than it saves).

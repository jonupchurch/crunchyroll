# Internal Interfaces

The extension exposes nothing to other systems. These are the seams between
its own files.

## Page hook → content script (existing, unchanged)

`window.postMessage`, same origin only.

```text
{ source: 'cr-enhancer', type: 'api-response', url: string, body: unknown }
```

The receiver must check `event.source === window`, `event.origin`, `source`,
and `type`, and must treat `body` as untrusted.

## `src/audio-index.js`

Pure functions, no DOM, no extension APIs.

```text
ENGLISH_LOCALE = 'en-US'

collectAudioInfo(body: unknown) -> {
  series:   Array<{ id: string, hasEnglish: boolean, hasDub: boolean }>,
  episodes: Array<{ id: string, seriesId: string }>
}
  Walks body (depth-limited). `series` has one entry per catalog item found,
  plus a `hasEnglish: true, hasDub: false` entry for the series of any episode
  whose versions include en-US (an episode never yields `hasEnglish: false`).
  `hasDub` is the item's `is_dubbed === true`.
  `episodes` maps each episode found to its series.
  Never throws. Returns empty arrays for anything that isn't an object or array.

linkTargetFromHref(href: string) -> { kind: 'series' | 'episode', id: string } | null
  '/series/GG5H5XQX4/frieren'                       -> { kind: 'series',  id: 'GG5H5XQX4' }
  'https://www.crunchyroll.com/de/series/GG5H5XQX4' -> { kind: 'series',  id: 'GG5H5XQX4' }
  '/watch/GPWUKE2M5/and-so-off-into-the-world'      -> { kind: 'episode', id: 'GPWUKE2M5' }
  '/videos/popular', '' , non-string                -> null
```

Exposed as `globalThis.crEnhancer` in the browser and `module.exports` in Node.

## DOM contract

- English badge: `<span class="cr-enhancer-dub-badge" data-kind="en" aria-label="English dub available">EN DUB</span>`
- No-English tag (red): `<span class="cr-enhancer-dub-badge" data-kind="no-en" aria-label="Dubbed, but not in English">no-en</span>`
- The badge's parent gets class `cr-enhancer-positioned` only if it had no
  positioning of its own.
- At most one badge per card.
- The extension adds only elements and classes prefixed `cr-enhancer-`, and
  removes only its own.

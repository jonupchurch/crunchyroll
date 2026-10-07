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

collectAudioInfo(body: unknown) -> Array<{ id: string, hasEnglish: boolean }>
  Walks body (depth-limited) and returns one entry per catalog item found.
  Never throws. Returns [] for anything that isn't an object or array.

seriesIdFromHref(href: string) -> string | null
  '/series/GG5H5XQX4/frieren'                       -> 'GG5H5XQX4'
  'https://www.crunchyroll.com/de/series/GG5H5XQX4' -> 'GG5H5XQX4'
  '/watch/G9DUE0QJ2/episode'                        -> null
  '' / non-string                                   -> null
```

Exposed as `globalThis.crEnhancer` in the browser and `module.exports` in Node.

## DOM contract

- Badge element: `<span class="cr-enhancer-dub-badge" aria-label="English dub available">EN DUB</span>`
- Host link gets class `cr-enhancer-badged`.
- At most one badge per host link.
- The extension adds only elements and classes prefixed `cr-enhancer-`, and
  removes only its own.

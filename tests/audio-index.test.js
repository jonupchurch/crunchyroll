const test = require('node:test');
const assert = require('node:assert/strict');

const { ENGLISH_LOCALE, collectAudioInfo, linkTargetFromHref } = require('../src/audio-index.js');

// Trimmed copies of real responses captured on the live site (2026-10-07).
const browseItem = {
  id: 'GG5H5XQX4',
  type: 'series',
  slug_title: 'frieren-beyond-journeys-end',
  images: { poster_wide: [[{ width: 320, height: 180, source: 'https://example.invalid/a.png' }]] },
  series_metadata: {
    is_dubbed: true,
    audio_locales: ['es-ES', 'en-US', 'pt-BR', 'ja-JP'],
  },
};

const watchlistItem = {
  panel: {
    id: 'GPWUKE2M5',
    type: 'episode',
    episode_metadata: {
      series_id: 'G63K95846',
      audio_locale: 'en-US',
      versions: [
        { audio_locale: 'ja-JP', guid: 'GRQWNX29R', original: true },
        { audio_locale: 'en-US', guid: 'GPWUKE2M5', original: false },
      ],
    },
  },
  fully_watched: true,
};

test('English locale is en-US', () => {
  assert.equal(ENGLISH_LOCALE, 'en-US');
});

test('collectAudioInfo: series with English audio', () => {
  const result = collectAudioInfo({ total: 1, data: [browseItem] });
  assert.deepEqual(result.series, [{ id: 'GG5H5XQX4', hasEnglish: true }]);
  assert.deepEqual(result.episodes, []);
});

test('collectAudioInfo: series without English audio', () => {
  const item = { id: 'GXXXXXXXX', series_metadata: { is_dubbed: true, audio_locales: ['ja-JP', 'de-DE'] } };
  assert.deepEqual(collectAudioInfo({ data: [item] }).series, [{ id: 'GXXXXXXXX', hasEnglish: false }]);
});

test('collectAudioInfo: other English-looking locales do not count', () => {
  const item = { id: 'GXXXXXXXX', series_metadata: { audio_locales: ['en-IN', 'EN-us', 'en'] } };
  assert.deepEqual(collectAudioInfo([item]).series, [{ id: 'GXXXXXXXX', hasEnglish: false }]);
});

test('collectAudioInfo: film listings', () => {
  const item = { id: 'GMOVIE001', movie_listing_metadata: { audio_locales: ['ja-JP', 'en-US'] } };
  assert.deepEqual(collectAudioInfo({ data: [item] }).series, [{ id: 'GMOVIE001', hasEnglish: true }]);
});

test('collectAudioInfo: items nested inside rows', () => {
  const body = { data: [{ title: 'Row', items: [{ panel: browseItem }] }] };
  assert.deepEqual(collectAudioInfo(body).series, [{ id: 'GG5H5XQX4', hasEnglish: true }]);
});

test('collectAudioInfo: watchlist episode maps to its series and proves English', () => {
  const result = collectAudioInfo({ data: [watchlistItem] });
  assert.deepEqual(result.episodes, [{ id: 'GPWUKE2M5', seriesId: 'G63K95846' }]);
  assert.deepEqual(result.series, [{ id: 'G63K95846', hasEnglish: true }]);
});

test('collectAudioInfo: an episode without English says nothing about its series', () => {
  const item = {
    panel: {
      id: 'GEPISODE1',
      episode_metadata: {
        series_id: 'GSERIES01',
        audio_locale: 'ja-JP',
        versions: [{ audio_locale: 'ja-JP' }, { audio_locale: 'de-DE' }],
      },
    },
  };
  const result = collectAudioInfo({ data: [item] });
  assert.deepEqual(result.episodes, [{ id: 'GEPISODE1', seriesId: 'GSERIES01' }]);
  assert.deepEqual(result.series, []);
});

test('collectAudioInfo: episode with no versions list still maps to its series', () => {
  const item = { id: 'GEPISODE1', episode_metadata: { series_id: 'GSERIES01', versions: null } };
  const result = collectAudioInfo(item);
  assert.deepEqual(result.episodes, [{ id: 'GEPISODE1', seriesId: 'GSERIES01' }]);
  assert.deepEqual(result.series, []);
});

test('collectAudioInfo: malformed items are skipped', () => {
  const body = {
    data: [
      { id: 42, series_metadata: { audio_locales: ['en-US'] } },
      { id: '', series_metadata: { audio_locales: ['en-US'] } },
      { id: 'GNOLIST01', series_metadata: {} },
      { id: 'GNOTARRAY', series_metadata: { audio_locales: 'en-US' } },
      { id: 'GNULLMETA', series_metadata: null },
      { id: 'GEPISODE1', episode_metadata: { series_id: 7 } },
      { id: 'GMIXED001', series_metadata: { audio_locales: [null, 5, { audio_locale: 'en-US' }] } },
    ],
  };
  const result = collectAudioInfo(body);
  assert.deepEqual(result.series, [{ id: 'GMIXED001', hasEnglish: false }]);
  assert.deepEqual(result.episodes, []);
});

test('collectAudioInfo: non-object input returns empty results', () => {
  for (const input of [null, undefined, 'text', 12, true]) {
    assert.deepEqual(collectAudioInfo(input), { series: [], episodes: [] });
  }
});

test('collectAudioInfo: gives up on very deep nesting instead of throwing', () => {
  let body = browseItem;
  for (let i = 0; i < 200; i += 1) body = { wrap: body };
  assert.deepEqual(collectAudioInfo(body), { series: [], episodes: [] });
});

test('linkTargetFromHref: series links', () => {
  const expected = { kind: 'series', id: 'GG5H5XQX4' };
  assert.deepEqual(linkTargetFromHref('/series/GG5H5XQX4/frieren-beyond-journeys-end'), expected);
  assert.deepEqual(linkTargetFromHref('/series/GG5H5XQX4'), expected);
  assert.deepEqual(linkTargetFromHref('https://www.crunchyroll.com/series/GG5H5XQX4/frieren?x=1#top'), expected);
});

test('linkTargetFromHref: locale-prefixed links', () => {
  const expected = { kind: 'series', id: 'GG5H5XQX4' };
  assert.deepEqual(linkTargetFromHref('/de/series/GG5H5XQX4/frieren'), expected);
  assert.deepEqual(linkTargetFromHref('https://www.crunchyroll.com/pt-br/series/GG5H5XQX4'), expected);
});

test('linkTargetFromHref: episode links', () => {
  assert.deepEqual(linkTargetFromHref('/watch/GPWUKE2M5/and-so-off-into-the-world'), {
    kind: 'episode',
    id: 'GPWUKE2M5',
  });
});

test('linkTargetFromHref: anything else is null', () => {
  for (const href of ['/videos/popular', '/', '', '/series/', '/watchlist', '/news/series/GG5H5XQX4', 'not a url', null, undefined, 5, {}]) {
    assert.equal(linkTargetFromHref(href), null, String(href));
  }
});

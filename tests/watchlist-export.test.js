const test = require('node:test');
const assert = require('node:assert/strict');

const {
  collectSeriesDetails,
  collectWatchlistEntries,
  escapeCell,
  buildMarkdown,
  fileName,
} = require('../src/watchlist-export.js');

const series = (id, title, extra = {}) => ({
  id,
  title,
  series_metadata: { audio_locales: ['ja-JP'], ...extra },
});

const watchlistItem = (episodeId, seriesId, progress = {}) => ({
  panel: { id: episodeId, episode_metadata: { series_id: seriesId, series_title: `Series ${seriesId}` } },
  ...progress,
});

test('collectSeriesDetails: title and string genres from a series object', () => {
  const body = { data: [series('S1', ' Frieren ', { tenant_categories: ['Fantasy', 'Drama', 'Fantasy'] })] };
  assert.deepEqual(collectSeriesDetails(body), [{ id: 'S1', title: 'Frieren', genres: ['Fantasy', 'Drama'] }]);
});

test('collectSeriesDetails: genres given as objects with a title', () => {
  const body = { data: [{ id: 'S1', title: 'X', categories: [{ title: 'Action' }, { nope: 1 }, 7] }] };
  body.data[0].series_metadata = {};
  assert.deepEqual(collectSeriesDetails(body)[0].genres, ['Action']);
});

test('collectSeriesDetails: missing genres and title stay empty', () => {
  assert.deepEqual(collectSeriesDetails({ data: [{ id: 'S1', series_metadata: {} }] }), [
    { id: 'S1', title: null, genres: [] },
  ]);
});

test('collectSeriesDetails: series title from an episode', () => {
  const body = { data: [watchlistItem('E1', 'S1')] };
  assert.deepEqual(collectSeriesDetails(body), [{ id: 'S1', title: 'Series S1', genres: [] }]);
});

test('collectSeriesDetails: ignores junk', () => {
  for (const body of [null, 'x', 3, [], { data: [null, { id: 5, series_metadata: {} }] }]) {
    assert.deepEqual(collectSeriesDetails(body), []);
  }
});

test('collectWatchlistEntries: progress from the watchlist flags', () => {
  const body = {
    data: [
      watchlistItem('E1', 'S1', { fully_watched: true, playhead: 1400 }),
      watchlistItem('E2', 'S2', { never_watched: true }),
      watchlistItem('E3', 'S3', { playhead: 300, fully_watched: false }),
      watchlistItem('E4', 'S4', { playhead: 0 }),
      watchlistItem('E5', 'S5'),
    ],
  };
  assert.deepEqual(
    collectWatchlistEntries(body).map((entry) => entry.progress),
    ['finished', 'not started', 'in progress', 'not started', null],
  );
  assert.deepEqual(collectWatchlistEntries(body)[0], { seriesId: 'S1', episodeId: 'E1', progress: 'finished' });
});

test('collectWatchlistEntries: skips items without a series and non-list bodies', () => {
  assert.deepEqual(collectWatchlistEntries({ data: [{ panel: {} }, { foo: 1 }, null] }), []);
  assert.deepEqual(collectWatchlistEntries({ data: 'x' }), []);
  assert.deepEqual(collectWatchlistEntries(null), []);
});

test('escapeCell: pipes, backslashes and newlines cannot break a row', () => {
  assert.equal(escapeCell('A | B\\C\nD'), 'A \\| B\\\\C D');
  assert.equal(escapeCell(null), '');
});

test('buildMarkdown: instruction, count, date and one row per series', () => {
  const date = new Date('2026-10-23T12:00:00Z');
  const markdown = buildMarkdown(
    [
      { title: 'Frieren', genres: ['Fantasy', 'Drama'], dub: 'en', progress: 'in progress' },
      { title: 'Odd | Title', genres: [], dub: null, progress: null },
    ],
    date,
  );
  const lines = markdown.trimEnd().split('\n');
  assert.match(markdown, /Recommend 10 anime series available on Crunchyroll/);
  assert.match(markdown, /leaving out any series already listed/);
  assert.ok(lines.includes('2 series, exported 2026-10-23.'));
  assert.equal(lines.at(-2), '| Frieren | Fantasy, Drama | EN DUB | in progress |');
  assert.equal(lines.at(-1), '| Odd \\| Title |  |  |  |');
});

test('buildMarkdown: no account details, only what the rows hold', () => {
  const markdown = buildMarkdown([{ title: 'T', genres: [], dub: 'no-dub', progress: null }], new Date());
  assert.doesNotMatch(markdown, /@|account|profile/i);
});

test('fileName: dated and identifiable', () => {
  assert.equal(fileName(new Date('2026-10-23T12:00:00Z')), 'crunchyroll-watchlist-2026-10-23.md');
});

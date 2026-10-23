const test = require('node:test');
const assert = require('node:assert/strict');

const { collectRatings, ratingBadge } = require('../src/ratings.js');

const series = (id, { average, maturity, seasons, episodes } = {}) => ({
  id,
  ...(average === undefined ? {} : { rating: { average, total: 120 } }),
  series_metadata: {
    audio_locales: ['ja-JP'],
    ...(maturity ? { maturity_ratings: maturity } : {}),
    ...(seasons === undefined ? {} : { season_count: seasons }),
    ...(episodes === undefined ? {} : { episode_count: episodes }),
  },
});

test('collectRatings: everything from a series object', () => {
  const body = { data: [series('S1', { average: '4.8', maturity: ['TV-14'], seasons: 2, episodes: 38 })] };
  assert.deepEqual(collectRatings(body), [{ id: 'S1', stars: 4.8, maturity: 'TV-14', seasons: 2, episodes: 38 }]);
});

test('collectRatings: zero or junk counts are unknown', () => {
  const [entry] = collectRatings({ data: [series('S1', { maturity: ['TV-PG'], seasons: 0, episodes: '12' })] });
  assert.equal(entry.seasons, null);
  assert.equal(entry.episodes, null);
});

test('collectRatings: numeric average', () => {
  assert.equal(collectRatings({ data: [series('S1', { average: 3.25 })] })[0].stars, 3.25);
});

test('collectRatings: out-of-range or junk averages are unknown', () => {
  for (const average of ['0', '6', 'abc', null, '']) {
    assert.deepEqual(collectRatings({ data: [series('S1', { average })] }), []);
  }
});

test('collectRatings: strictest of several maturity ratings', () => {
  const pick = (maturity) => collectRatings({ data: [series('S1', { maturity })] })[0].maturity;
  assert.equal(pick(['TV-PG', 'TV-MA', 'TV-14']), 'TV-MA');
  assert.equal(pick(['12', '16']), '16');
  assert.equal(pick(['', 7, 'TV-G']), 'TV-G');
});

test('collectRatings: one of the two is enough', () => {
  assert.deepEqual(collectRatings({ data: [series('S1', { maturity: ['TV-PG'] })] }), [
    { id: 'S1', stars: null, maturity: 'TV-PG', seasons: null, episodes: null },
  ]);
  assert.equal(collectRatings({ data: [series('S1', { episodes: 12 })] })[0].episodes, 12);
});

test('collectRatings: skips episodes and junk', () => {
  const episode = { id: 'E1', rating: { average: '4.0' }, episode_metadata: { series_id: 'S1' } };
  for (const body of [null, 'x', [], { data: [episode, null, { id: 3, series_metadata: {} }] }]) {
    assert.deepEqual(collectRatings(body), []);
  }
});

test('ratingBadge: everything known', () => {
  assert.deepEqual(ratingBadge({ stars: 4.84, maturity: 'TV-14', seasons: 2, episodes: 38 }), {
    rating: '★4.8 · TV-14',
    size: '2 seasons · 38 eps',
    label: 'Rated 4.8 out of 5, TV-14, 2 seasons, 38 episodes',
  });
});

test('ratingBadge: singular counts', () => {
  assert.equal(ratingBadge({ seasons: 1, episodes: 1 }).size, '1 season · 1 ep');
});

test('ratingBadge: only some values', () => {
  assert.equal(ratingBadge({ stars: 4 }).rating, '★4.0');
  assert.equal(ratingBadge({ maturity: 'TV-MA' }).rating, 'TV-MA');
  assert.deepEqual(ratingBadge({ episodes: 12 }), { rating: '', size: '12 eps', label: '12 episodes' });
});

test('ratingBadge: nothing known shows nothing', () => {
  assert.equal(ratingBadge({ stars: null, maturity: null }), null);
  assert.equal(ratingBadge(undefined), null);
});

const test = require('node:test');
const assert = require('node:assert/strict');

const { collectRatings, ratingBadge } = require('../src/ratings.js');

const series = (id, { average, maturity } = {}) => ({
  id,
  ...(average === undefined ? {} : { rating: { average, total: 120 } }),
  series_metadata: { audio_locales: ['ja-JP'], ...(maturity ? { maturity_ratings: maturity } : {}) },
});

test('collectRatings: star average and maturity from a series object', () => {
  assert.deepEqual(collectRatings({ data: [series('S1', { average: '4.8', maturity: ['TV-14'] })] }), [
    { id: 'S1', stars: 4.8, maturity: 'TV-14' },
  ]);
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
    { id: 'S1', stars: null, maturity: 'TV-PG' },
  ]);
});

test('collectRatings: skips episodes and junk', () => {
  const episode = { id: 'E1', rating: { average: '4.0' }, episode_metadata: { series_id: 'S1' } };
  for (const body of [null, 'x', [], { data: [episode, null, { id: 3, series_metadata: {} }] }]) {
    assert.deepEqual(collectRatings(body), []);
  }
});

test('ratingBadge: both values', () => {
  assert.deepEqual(ratingBadge({ stars: 4.84, maturity: 'TV-14' }), {
    text: '★4.8 · TV-14',
    label: 'Rated 4.8 out of 5, TV-14',
  });
});

test('ratingBadge: only one value', () => {
  assert.equal(ratingBadge({ stars: 4, maturity: null }).text, '★4.0');
  assert.equal(ratingBadge({ stars: null, maturity: 'TV-MA' }).text, 'TV-MA');
});

test('ratingBadge: nothing known shows nothing', () => {
  assert.equal(ratingBadge({ stars: null, maturity: null }), null);
  assert.equal(ratingBadge(undefined), null);
});

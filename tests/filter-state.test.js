const test = require('node:test');
const assert = require('node:assert/strict');

const { LABEL_KINDS, sanitizeHiddenLabels, toggleLabel } = require('../src/filter-state.js');

test('label kinds', () => {
  assert.deepEqual(LABEL_KINDS, ['en', 'no-en', 'no-dub']);
});

test('sanitizeHiddenLabels: keeps known labels in a fixed order', () => {
  assert.deepEqual(sanitizeHiddenLabels(['no-dub', 'en']), ['en', 'no-dub']);
});

test('sanitizeHiddenLabels: drops unknown entries and duplicates', () => {
  assert.deepEqual(sanitizeHiddenLabels(['no-en', 'bogus', 7, null, 'no-en']), ['no-en']);
});

test('sanitizeHiddenLabels: anything that is not a list hides nothing', () => {
  for (const value of [undefined, null, 'en', 3, { en: true }]) {
    assert.deepEqual(sanitizeHiddenLabels(value), []);
  }
});

test('toggleLabel: hides a shown label', () => {
  assert.deepEqual(toggleLabel([], 'no-dub'), ['no-dub']);
  assert.deepEqual(toggleLabel(['no-dub'], 'en'), ['en', 'no-dub']);
});

test('toggleLabel: shows a hidden label', () => {
  assert.deepEqual(toggleLabel(['en', 'no-dub'], 'en'), ['no-dub']);
});

test('toggleLabel: does not change its input', () => {
  const hidden = ['no-en'];
  toggleLabel(hidden, 'en');
  assert.deepEqual(hidden, ['no-en']);
});

test('toggleLabel: an unknown label changes nothing', () => {
  assert.deepEqual(toggleLabel(['no-en'], 'bogus'), ['no-en']);
});

test('toggleLabel: copes with a corrupt stored value', () => {
  assert.deepEqual(toggleLabel('garbage', 'en'), ['en']);
});

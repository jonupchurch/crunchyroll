// Pure logic for the watchlist export: pulling series details and watchlist
// progress out of captured responses, and writing the Markdown file. No DOM
// and no extension APIs, so it runs as a content script and under Node for
// tests.
(() => {
  const MAX_DEPTH = 16;
  const DUB_TEXT = { en: 'EN DUB', 'no-en': 'no-en', 'no-dub': 'no-dub' };
  const INSTRUCTION =
    'This is my Crunchyroll watchlist. Recommend 10 anime series available on Crunchyroll ' +
    'that are similar to these, leaving out any series already listed here. ' +
    'Give one short line for each on why it fits. ' +
    'The Dub column says whether a series has an English dub (EN DUB), ' +
    'is dubbed only in other languages (no-en), or has no dub (no-dub).';

  const isObject = (value) => typeof value === 'object' && value !== null;
  const isId = (value) => typeof value === 'string' && value !== '';
  const isText = (value) => typeof value === 'string' && value.trim() !== '';

  // Genres turn up as plain strings or as objects with a title; anything else
  // is skipped.
  const genresOf = (node) => {
    const metadata = node.series_metadata ?? node.movie_listing_metadata;
    const sources = [metadata?.tenant_categories, node.tenant_categories, node.categories, metadata?.genres];
    for (const source of sources) {
      if (!Array.isArray(source)) continue;
      const names = source
        .map((entry) => (isText(entry) ? entry : isObject(entry) && isText(entry.title) ? entry.title : null))
        .filter(Boolean)
        .map((name) => name.trim());
      if (names.length > 0) return [...new Set(names)];
    }
    return [];
  };

  // Series titles and genres from any catalog response. Response bodies come
  // from the site and are treated as untrusted.
  const collectSeriesDetails = (body) => {
    const details = [];

    const visit = (node, depth) => {
      if (!isObject(node) || depth > MAX_DEPTH) return;
      if (Array.isArray(node)) {
        for (const entry of node) visit(entry, depth + 1);
        return;
      }

      if (isId(node.id)) {
        if (isObject(node.series_metadata) || isObject(node.movie_listing_metadata)) {
          details.push({ id: node.id, title: isText(node.title) ? node.title.trim() : null, genres: genresOf(node) });
        }
        const episode = node.episode_metadata;
        if (isObject(episode) && isId(episode.series_id) && isText(episode.series_title)) {
          details.push({ id: episode.series_id, title: episode.series_title.trim(), genres: [] });
        }
      }

      for (const value of Object.values(node)) visit(value, depth + 1);
    };

    visit(body, 0);
    return details;
  };

  const progressOf = (item) => {
    if (item.fully_watched === true) return 'finished';
    if (item.never_watched === true) return 'not started';
    if (typeof item.playhead === 'number') return item.playhead > 0 ? 'in progress' : 'not started';
    return null;
  };

  // Entries from a watchlist response: { panel: <episode>, fully_watched, ... }.
  const collectWatchlistEntries = (body) => {
    const items = Array.isArray(body?.data) ? body.data : [];
    const entries = [];
    for (const item of items) {
      if (!isObject(item) || !isObject(item.panel)) continue;
      const episode = item.panel.episode_metadata;
      if (!isObject(episode) || !isId(episode.series_id)) continue;
      entries.push({
        seriesId: episode.series_id,
        episodeId: isId(item.panel.id) ? item.panel.id : null,
        progress: progressOf(item),
      });
    }
    return entries;
  };

  // Keeps a value on one table row and out of the table's syntax.
  const escapeCell = (value) =>
    String(value ?? '')
      .replace(/\\/g, '\\\\')
      .replace(/\|/g, '\\|')
      .replace(/\s+/g, ' ')
      .trim();

  // The viewer's own calendar date, not UTC.
  const isoDate = (date) =>
    [date.getFullYear(), date.getMonth() + 1, date.getDate()].map((part) => String(part).padStart(2, '0')).join('-');

  // rows: [{ title, genres, dub, progress }] in watchlist order.
  const buildMarkdown = (rows, date) => {
    const lines = [
      '# My Crunchyroll watchlist',
      '',
      INSTRUCTION,
      '',
      `${rows.length} series, exported ${isoDate(date)}.`,
      '',
      '| Title | Genres | Dub | Progress |',
      '| --- | --- | --- | --- |',
    ];
    for (const row of rows) {
      const cells = [row.title, (row.genres ?? []).join(', '), DUB_TEXT[row.dub] ?? '', row.progress ?? ''];
      lines.push(`| ${cells.map(escapeCell).join(' | ')} |`);
    }
    return lines.join('\n') + '\n';
  };

  const fileName = (date) => `crunchyroll-watchlist-${isoDate(date)}.md`;

  const api = { collectSeriesDetails, collectWatchlistEntries, escapeCell, buildMarkdown, fileName };
  globalThis.crEnhancer = Object.assign(globalThis.crEnhancer ?? {}, api);
  if (typeof module !== 'undefined') module.exports = api;
})();

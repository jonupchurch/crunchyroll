// Pure logic for working out which series have English audio. No DOM and no
// extension APIs, so it runs as a content script (ahead of content.js) and
// under Node for tests.
(() => {
  const ENGLISH_LOCALE = 'en-US';
  const MAX_DEPTH = 16;
  // Optional locale prefix (/de, /pt-br), then /series/{id} or /watch/{id}.
  const LINK_PATH = /^(?:\/[a-z]{2}(?:-[a-z0-9]{2,4})?)?\/(series|watch)\/([A-Za-z0-9]+)(?:\/|$)/;

  const isObject = (value) => typeof value === 'object' && value !== null;
  const isId = (value) => typeof value === 'string' && value !== '';

  const audioLocalesOf = (item) => {
    const metadata = item.series_metadata ?? item.movie_listing_metadata;
    return isObject(metadata) && Array.isArray(metadata.audio_locales) ? metadata.audio_locales : null;
  };

  // An episode only lists its own audio tracks, so it can show that its series
  // has English but never that it doesn't.
  const episodeHasEnglish = (metadata) =>
    metadata.audio_locale === ENGLISH_LOCALE ||
    (Array.isArray(metadata.versions) &&
      metadata.versions.some((version) => isObject(version) && version.audio_locale === ENGLISH_LOCALE));

  // Response bodies come from the site and are treated as untrusted: every
  // field is type-checked and anything unexpected is skipped.
  const collectAudioInfo = (body) => {
    const series = [];
    const episodes = [];

    const visit = (node, depth) => {
      if (!isObject(node) || depth > MAX_DEPTH) return;
      if (Array.isArray(node)) {
        for (const entry of node) visit(entry, depth + 1);
        return;
      }

      if (isId(node.id)) {
        const audioLocales = audioLocalesOf(node);
        if (audioLocales) {
          series.push({ id: node.id, hasEnglish: audioLocales.includes(ENGLISH_LOCALE) });
        }

        const episode = node.episode_metadata;
        if (isObject(episode) && isId(episode.series_id)) {
          episodes.push({ id: node.id, seriesId: episode.series_id });
          if (episodeHasEnglish(episode)) series.push({ id: episode.series_id, hasEnglish: true });
        }
      }

      for (const value of Object.values(node)) visit(value, depth + 1);
    };

    visit(body, 0);
    return { series, episodes };
  };

  const linkTargetFromHref = (href) => {
    if (typeof href !== 'string' || href === '') return null;
    let path;
    try {
      path = new URL(href, 'https://www.crunchyroll.com').pathname;
    } catch {
      return null;
    }
    const match = LINK_PATH.exec(path);
    if (!match) return null;
    return { kind: match[1] === 'series' ? 'series' : 'episode', id: match[2] };
  };

  const api = { ENGLISH_LOCALE, collectAudioInfo, linkTargetFromHref };
  globalThis.crEnhancer = api;
  if (typeof module !== 'undefined') module.exports = api;
})();

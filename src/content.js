// Isolated-world content script: receives API responses from page-hook.js,
// keeps track of which series have English audio, and (next) decorates series
// cards in the DOM. Runs at document_start so no early response is missed.
(() => {
  const SOURCE = 'cr-enhancer';
  const { collectAudioInfo } = globalThis.crEnhancer;

  // Series id -> has English audio. A series that isn't here is unknown.
  const englishBySeries = new Map();
  // Episode id -> series id, for cards that link to an episode.
  const seriesByEpisode = new Map();

  const indexResponse = (body) => {
    const { series, episodes } = collectAudioInfo(body);
    for (const { id, hasEnglish } of series) {
      // True wins: a partial response never takes away a known English track.
      englishBySeries.set(id, hasEnglish || englishBySeries.get(id) === true);
    }
    for (const { id, seriesId } of episodes) seriesByEpisode.set(id, seriesId);
  };

  window.addEventListener('message', (event) => {
    if (event.source !== window || event.origin !== location.origin) return;
    const message = event.data;
    if (message?.source !== SOURCE || message.type !== 'api-response') return;

    try {
      indexResponse(message.body);
    } catch {
      // A response we can't read just means no badges from it.
    }
  });
})();

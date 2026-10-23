// Isolated-world content script: receives API responses from page-hook.js,
// keeps track of each series' audio and ratings, and badges cards: English
// dub, dubbed but not in English, or no dub at all (upper right), and the
// star and maturity rating with season and episode counts (upper left). On browse pages it also adds toggles
// that hide cards by label, and on the watchlist an Export button that saves
// the list as Markdown for an LLM. Runs at document_start so no early
// response is missed.
(() => {
  const SOURCE = 'cr-enhancer';
  const BADGE_CLASS = 'cr-enhancer-dub-badge';
  const RATING_CLASS = 'cr-enhancer-rating-badge';
  const POSITIONED_CLASS = 'cr-enhancer-positioned';
  const FILTER_CLASS = 'cr-enhancer-filter';
  const EXPORT_CLASS = 'cr-enhancer-export';
  const WATCHLIST_CARD = '[data-t="watch-list-card"]';
  // Responses from this path are the viewer's watchlist itself.
  const WATCHLIST_PATH = /\/watchlist(?:[/?]|$)/;
  // On a grid cell: which label its card carries.
  const LABEL_ATTR = 'data-cr-enhancer-label';
  // On <html>: the labels currently hidden. content.css does the hiding.
  const HIDE_ATTR = 'data-cr-enhancer-hide';
  const STORAGE_KEY = 'hiddenLabels';
  // Posters narrower than this (search's series list) get a smaller badge.
  const COMPACT_BELOW_PX = 140;
  // Browse grids: the cell is what has to go for the grid to close up.
  const GRID_CELL = '.erc-browse-cards-collection > .browse-card';
  // The site's own Filter control; the toggles go in the same list.
  const SITE_FILTER = '.erc-browse-filtering';
  const {
    collectAudioInfo,
    linkTargetFromHref,
    LABEL_KINDS,
    sanitizeHiddenLabels,
    toggleLabel,
    collectSeriesDetails,
    collectWatchlistEntries,
    buildMarkdown,
    fileName,
    collectRatings,
    ratingBadge,
  } = globalThis.crEnhancer;

  const BADGES = {
    en: { text: 'EN DUB', label: 'English dub available' },
    'no-en': { text: 'no-en', label: 'Dubbed, but not in English' },
    'no-dub': { text: 'no-dub', label: 'Subtitled only, no dub' },
  };

  // Series id -> { hasEnglish, hasDub }. A series that isn't here is unknown.
  const audioBySeries = new Map();
  // Episode id -> series id, for cards that only link to an episode.
  const seriesByEpisode = new Map();
  // Series id -> { stars, maturity, seasons, episodes }. Any can be null.
  const ratingsBySeries = new Map();
  // Series id -> { title, genres }, for the export.
  const detailsBySeries = new Map();
  // Series id -> { progress }, in the order the watchlist listed them.
  const watchlistBySeries = new Map();
  let hiddenLabels = [];

  const indexDetails = (url, body) => {
    for (const { id, title, genres } of collectSeriesDetails(body)) {
      const known = detailsBySeries.get(id);
      detailsBySeries.set(id, {
        title: title ?? known?.title ?? null,
        genres: genres.length > 0 ? genres : (known?.genres ?? []),
      });
    }
    if (typeof url === 'string' && WATCHLIST_PATH.test(url)) {
      for (const { seriesId, progress } of collectWatchlistEntries(body)) {
        if (!watchlistBySeries.has(seriesId)) watchlistBySeries.set(seriesId, { progress });
      }
    }
  };

  const indexResponse = (body) => {
    const { series, episodes } = collectAudioInfo(body);
    for (const { id, hasEnglish, hasDub } of series) {
      // True wins: a partial response never takes away something already known.
      const known = audioBySeries.get(id);
      audioBySeries.set(id, {
        hasEnglish: hasEnglish || known?.hasEnglish === true,
        hasDub: hasDub || known?.hasDub === true,
      });
    }
    for (const { id, seriesId } of episodes) seriesByEpisode.set(id, seriesId);

    const ratings = collectRatings(body);
    for (const { id, ...values } of ratings) {
      // A response without a value never takes away one already known.
      const known = ratingsBySeries.get(id) ?? {};
      const merged = {};
      for (const [key, value] of Object.entries(values)) merged[key] = value ?? known[key] ?? null;
      ratingsBySeries.set(id, merged);
    }
    return series.length > 0 || episodes.length > 0 || ratings.length > 0;
  };

  const seriesIdFor = (href) => {
    const target = linkTargetFromHref(href);
    if (!target) return null;
    return target.kind === 'series' ? target.id : (seriesByEpisode.get(target.id) ?? null);
  };

  // Which badge a card linking to href should carry, or null if the series
  // isn't known yet.
  const badgeKindFor = (href) => {
    const audio = audioBySeries.get(seriesIdFor(href));
    if (!audio) return null;
    if (audio.hasEnglish) return 'en';
    return audio.hasDub ? 'no-en' : 'no-dub';
  };

  // Each card as { host, href }: the element the badge sits on and the link
  // that says which series it is. Class names on the site carry generated
  // suffixes, so only data-t attributes and class prefixes are relied on.
  const findCards = () => {
    const cards = [];

    // Watchlist: the poster link is an empty overlay, the title links to the series.
    for (const card of document.querySelectorAll(WATCHLIST_CARD)) {
      const host = card.querySelector('[class*="watchlist-card-image--"]');
      const link = card.querySelector('a[href*="/series/"]') ?? card.querySelector('a[href*="/watch/"]');
      if (host && link) cards.push({ host, href: link.getAttribute('href') });
    }

    // Everywhere else: a series link that wraps its poster image.
    for (const link of document.querySelectorAll('a[href*="/series/"]')) {
      if (link.querySelector('img') && !link.closest(WATCHLIST_CARD)) {
        cards.push({ host: link, href: link.getAttribute('href') });
      }
    }

    return cards;
  };

  const placeBadge = (host, badge) => {
    // Only give the host a positioning context if the site hasn't already.
    if (getComputedStyle(host).position === 'static') host.classList.add(POSITIONED_CLASS);
    if (host.offsetWidth < COMPACT_BELOW_PX) badge.dataset.size = 'compact';
    host.append(badge);
  };

  const addBadge = (host, kind) => {
    const badge = document.createElement('span');
    badge.className = BADGE_CLASS;
    badge.dataset.kind = kind;
    badge.textContent = BADGES[kind].text;
    badge.setAttribute('aria-label', BADGES[kind].label);
    placeBadge(host, badge);
  };

  const addRatingBadge = (host, { rating, size, label }) => {
    const badge = document.createElement('span');
    badge.className = RATING_CLASS;
    for (const line of [rating, size]) {
      if (!line) continue;
      const row = document.createElement('span');
      row.textContent = line;
      badge.append(row);
    }
    badge.dataset.label = label;
    badge.setAttribute('aria-label', label);
    placeBadge(host, badge);
  };

  const removeBadge = (badge) => {
    const host = badge.parentElement;
    badge.remove();
    // The host keeps its positioning while the other badge is still on it.
    if (host && !host.querySelector(`:scope > .${BADGE_CLASS}, :scope > .${RATING_CLASS}`)) {
      host.classList.remove(POSITIONED_CLASS);
    }
  };

  // Records each browse grid cell's label so the stylesheet can hide by it.
  // Cells whose series is unknown carry no label and are never hidden.
  const labelCells = (kindByHost) => {
    const wanted = new Map();
    for (const [host, kind] of kindByHost) {
      const cell = host.closest(GRID_CELL);
      if (cell) wanted.set(cell, kind);
    }

    for (const cell of document.querySelectorAll(`[${LABEL_ATTR}]`)) {
      if (!wanted.has(cell)) cell.removeAttribute(LABEL_ATTR);
    }
    for (const [cell, kind] of wanted) {
      if (cell.getAttribute(LABEL_ATTR) !== kind) cell.setAttribute(LABEL_ATTR, kind);
    }
  };

  const badgeCards = () => {
    const cards = findCards();
    const wanted = new Map();
    for (const { host, href } of cards) {
      const kind = badgeKindFor(href);
      if (kind) wanted.set(host, kind);
    }

    labelCells(wanted);

    // The site recycles card elements while scrolling, so a badge can end up
    // on a card that now shows a different series.
    for (const badge of document.querySelectorAll(`.${BADGE_CLASS}`)) {
      if (wanted.get(badge.parentElement) === badge.dataset.kind) wanted.delete(badge.parentElement);
      else removeBadge(badge);
    }

    for (const [host, kind] of wanted) addBadge(host, kind);

    badgeRatings(cards);
  };

  const badgeRatings = (cards) => {
    const wanted = new Map();
    for (const { host, href } of cards) {
      const badge = ratingBadge(ratingsBySeries.get(seriesIdFor(href)));
      if (badge) wanted.set(host, badge);
    }

    // Same recycling as the dub badge: keep a badge only if it still says
    // the right thing for the card it's on.
    for (const badge of document.querySelectorAll(`.${RATING_CLASS}`)) {
      if (wanted.get(badge.parentElement)?.label === badge.dataset.label) wanted.delete(badge.parentElement);
      else removeBadge(badge);
    }

    for (const [host, badge] of wanted) addRatingBadge(host, badge);
  };

  const saveHiddenLabels = () => {
    try {
      chrome.storage.local.set({ [STORAGE_KEY]: hiddenLabels }).catch(() => {});
    } catch {
      // Storage can go away (extension reloaded); the choice still holds for this page.
    }
  };

  const buildFilter = () => {
    const filter = document.createElement('li');
    filter.className = FILTER_CLASS;
    for (const kind of LABEL_KINDS) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.kind = kind;
      button.textContent = BADGES[kind].text;
      button.addEventListener('click', () => {
        hiddenLabels = toggleLabel(hiddenLabels, kind);
        saveHiddenLabels();
        scheduleUpdate();
      });
      filter.append(button);
    }
    return filter;
  };

  // Keeps the toggles next to the site's Filter control and applies the
  // hidden labels. Where that control doesn't exist, nothing is hidden.
  const renderFilter = () => {
    const list = document.querySelector(SITE_FILTER)?.closest('li')?.parentElement;
    let filter = document.querySelector(`.${FILTER_CLASS}`);

    if (!list) {
      filter?.remove();
      document.documentElement.removeAttribute(HIDE_ATTR);
      return;
    }

    if (filter?.parentElement !== list) {
      filter?.remove();
      filter = buildFilter();
      list.prepend(filter);
    }

    for (const button of filter.querySelectorAll('button')) {
      const kind = button.dataset.kind;
      const shown = !hiddenLabels.includes(kind);
      button.setAttribute('aria-pressed', String(shown));
      button.title = `${shown ? 'Hide' : 'Show'} ${BADGES[kind].text} titles`;
    }

    if (hiddenLabels.length > 0) document.documentElement.setAttribute(HIDE_ATTR, hiddenLabels.join(' '));
    else document.documentElement.removeAttribute(HIDE_ATTR);
  };

  // One row per series: the watchlist cards on screen first, then any series
  // the captured watchlist holds that the page hasn't rendered.
  const exportRows = () => {
    const rows = new Map();
    const addRow = (seriesId, href, fallbackTitle) => {
      const key = seriesId ?? href;
      const title = detailsBySeries.get(seriesId)?.title ?? fallbackTitle;
      if (rows.has(key) || !title) return;
      rows.set(key, {
        title,
        genres: detailsBySeries.get(seriesId)?.genres ?? [],
        dub: badgeKindFor(href),
        progress: watchlistBySeries.get(seriesId)?.progress ?? null,
      });
    };

    for (const card of document.querySelectorAll(WATCHLIST_CARD)) {
      const seriesLink = card.querySelector('a[href*="/series/"]');
      const link = seriesLink ?? card.querySelector('a[href*="/watch/"]');
      if (!link) continue;
      const href = link.getAttribute('href');
      const target = linkTargetFromHref(href);
      const seriesId = target?.kind === 'series' ? target.id : seriesByEpisode.get(target?.id);
      addRow(seriesId ?? null, href, seriesLink?.textContent.trim() || null);
    }
    for (const seriesId of watchlistBySeries.keys()) addRow(seriesId, `/series/${seriesId}`, null);

    return [...rows.values()];
  };

  const download = (text, name) => {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const exportWatchlist = (button) => {
    const rows = exportRows();
    if (rows.length === 0) {
      button.textContent = 'Nothing to export yet';
      setTimeout(() => (button.textContent = 'Export'), 2000);
      return;
    }
    const now = new Date();
    download(buildMarkdown(rows, now), fileName(now));
  };

  // Keeps an Export button just above the watchlist. Without watchlist cards
  // there's no list to sit above, so no button.
  const renderExport = () => {
    const cards = document.querySelectorAll(WATCHLIST_CARD);
    let button = document.querySelector(`.${EXPORT_CLASS}`);
    if (cards.length === 0) {
      button?.remove();
      return;
    }

    // The smallest element holding every card is the list itself.
    let list = cards[0].parentElement;
    while (list && !list.contains(cards[cards.length - 1])) list = list.parentElement;
    if (!list?.parentElement) return;

    if (button && button.nextElementSibling === list) return;
    button?.remove();
    button = document.createElement('button');
    button.type = 'button';
    button.className = EXPORT_CLASS;
    button.textContent = 'Export';
    button.title = 'Download this watchlist as a Markdown file to give an LLM for recommendations';
    button.setAttribute('aria-label', 'Export watchlist as Markdown');
    button.addEventListener('click', () => {
      try {
        exportWatchlist(button);
      } catch {
        // A failed export leaves the page as it was.
      }
    });
    list.before(button);
  };

  let scheduled = false;
  const scheduleUpdate = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      try {
        badgeCards();
      } catch {
        // Never let badging break the page.
      }
      try {
        renderFilter();
      } catch {
        // A broken filter must not take the badges or the page with it.
      }
      try {
        renderExport();
      } catch {
        // Nor must the export button.
      }
    });
  };

  window.addEventListener('message', (event) => {
    if (event.source !== window || event.origin !== location.origin) return;
    const message = event.data;
    if (message?.source !== SOURCE || message.type !== 'api-response') return;

    try {
      if (indexResponse(message.body)) scheduleUpdate();
    } catch {
      // A response we can't read just means no badges from it.
    }
    try {
      indexDetails(message.url, message.body);
    } catch {
      // Nor anything for the export.
    }
  });

  // Cards arrive and change as the user scrolls and navigates.
  new MutationObserver(scheduleUpdate).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['href'],
  });

  try {
    chrome.storage.local
      .get(STORAGE_KEY)
      .then((stored) => {
        hiddenLabels = sanitizeHiddenLabels(stored[STORAGE_KEY]);
        scheduleUpdate();
      })
      .catch(() => {});

    // Keeps other open tabs in step.
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local' || !changes[STORAGE_KEY]) return;
      hiddenLabels = sanitizeHiddenLabels(changes[STORAGE_KEY].newValue);
      scheduleUpdate();
    });
  } catch {
    // Without storage the filter still works, it just isn't remembered.
  }
})();

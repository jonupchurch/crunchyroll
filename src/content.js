// Isolated-world content script: receives API responses from page-hook.js,
// keeps track of each series' audio, and badges cards: English dub, dubbed
// but not in English, or no dub at all. On browse pages it also adds toggles
// that hide cards by label. Runs at document_start so no early response is
// missed.
(() => {
  const SOURCE = 'cr-enhancer';
  const BADGE_CLASS = 'cr-enhancer-dub-badge';
  const POSITIONED_CLASS = 'cr-enhancer-positioned';
  const FILTER_CLASS = 'cr-enhancer-filter';
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
  const { collectAudioInfo, linkTargetFromHref, LABEL_KINDS, sanitizeHiddenLabels, toggleLabel } =
    globalThis.crEnhancer;

  const BADGES = {
    en: { text: 'EN DUB', label: 'English dub available' },
    'no-en': { text: 'no-en', label: 'Dubbed, but not in English' },
    'no-dub': { text: 'no-dub', label: 'Subtitled only, no dub' },
  };

  // Series id -> { hasEnglish, hasDub }. A series that isn't here is unknown.
  const audioBySeries = new Map();
  // Episode id -> series id, for cards that only link to an episode.
  const seriesByEpisode = new Map();
  let hiddenLabels = [];

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
    return series.length > 0 || episodes.length > 0;
  };

  // Which badge a card linking to href should carry, or null if the series
  // isn't known yet.
  const badgeKindFor = (href) => {
    const target = linkTargetFromHref(href);
    if (!target) return null;
    const seriesId = target.kind === 'series' ? target.id : seriesByEpisode.get(target.id);
    const audio = audioBySeries.get(seriesId);
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
    for (const card of document.querySelectorAll('[data-t="watch-list-card"]')) {
      const host = card.querySelector('[class*="watchlist-card-image--"]');
      const link = card.querySelector('a[href*="/series/"]') ?? card.querySelector('a[href*="/watch/"]');
      if (host && link) cards.push({ host, href: link.getAttribute('href') });
    }

    // Everywhere else: a series link that wraps its poster image.
    for (const link of document.querySelectorAll('a[href*="/series/"]')) {
      if (link.querySelector('img') && !link.closest('[data-t="watch-list-card"]')) {
        cards.push({ host: link, href: link.getAttribute('href') });
      }
    }

    return cards;
  };

  const addBadge = (host, kind) => {
    const badge = document.createElement('span');
    badge.className = BADGE_CLASS;
    badge.dataset.kind = kind;
    badge.textContent = BADGES[kind].text;
    badge.setAttribute('aria-label', BADGES[kind].label);
    // Only give the host a positioning context if the site hasn't already.
    if (getComputedStyle(host).position === 'static') host.classList.add(POSITIONED_CLASS);
    if (host.offsetWidth < COMPACT_BELOW_PX) badge.dataset.size = 'compact';
    host.append(badge);
  };

  const removeBadge = (badge) => {
    badge.parentElement?.classList.remove(POSITIONED_CLASS);
    badge.remove();
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
    const wanted = new Map();
    for (const { host, href } of findCards()) {
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

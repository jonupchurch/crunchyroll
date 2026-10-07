// Isolated-world content script: receives API responses from page-hook.js,
// keeps track of each series' audio, and badges cards: English dub, dubbed
// but not in English, or no dub at all. Runs at document_start so no early response is missed.
(() => {
  const SOURCE = 'cr-enhancer';
  const BADGE_CLASS = 'cr-enhancer-dub-badge';
  const POSITIONED_CLASS = 'cr-enhancer-positioned';
  const { collectAudioInfo, linkTargetFromHref } = globalThis.crEnhancer;

  const BADGES = {
    en: { text: 'EN DUB', label: 'English dub available' },
    'no-en': { text: 'no-en', label: 'Dubbed, but not in English' },
    'no-dub': { text: 'no-dub', label: 'Subtitled only, no dub' },
  };

  // Series id -> { hasEnglish, hasDub }. A series that isn't here is unknown.
  const audioBySeries = new Map();
  // Episode id -> series id, for cards that only link to an episode.
  const seriesByEpisode = new Map();

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
    host.append(badge);
  };

  const removeBadge = (badge) => {
    badge.parentElement?.classList.remove(POSITIONED_CLASS);
    badge.remove();
  };

  const badgeCards = () => {
    const wanted = new Map();
    for (const { host, href } of findCards()) {
      const kind = badgeKindFor(href);
      if (kind) wanted.set(host, kind);
    }

    // The site recycles card elements while scrolling, so a badge can end up
    // on a card that now shows a different series.
    for (const badge of document.querySelectorAll(`.${BADGE_CLASS}`)) {
      if (wanted.get(badge.parentElement) === badge.dataset.kind) wanted.delete(badge.parentElement);
      else removeBadge(badge);
    }

    for (const [host, kind] of wanted) addBadge(host, kind);
  };

  let scheduled = false;
  const scheduleBadging = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      try {
        badgeCards();
      } catch {
        // Never let badging break the page.
      }
    });
  };

  window.addEventListener('message', (event) => {
    if (event.source !== window || event.origin !== location.origin) return;
    const message = event.data;
    if (message?.source !== SOURCE || message.type !== 'api-response') return;

    try {
      if (indexResponse(message.body)) scheduleBadging();
    } catch {
      // A response we can't read just means no badges from it.
    }
  });

  // Cards arrive and change as the user scrolls and navigates.
  new MutationObserver(scheduleBadging).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['href'],
  });
})();

// Isolated-world content script: receives API responses from page-hook.js,
// keeps track of which series have English audio, and badges the cards of
// those that do. Runs at document_start so no early response is missed.
(() => {
  const SOURCE = 'cr-enhancer';
  const BADGE_CLASS = 'cr-enhancer-dub-badge';
  const POSITIONED_CLASS = 'cr-enhancer-positioned';
  const { collectAudioInfo, linkTargetFromHref } = globalThis.crEnhancer;

  // Series id -> has English audio. A series that isn't here is unknown.
  const englishBySeries = new Map();
  // Episode id -> series id, for cards that only link to an episode.
  const seriesByEpisode = new Map();

  const indexResponse = (body) => {
    const { series, episodes } = collectAudioInfo(body);
    for (const { id, hasEnglish } of series) {
      // True wins: a partial response never takes away a known English track.
      englishBySeries.set(id, hasEnglish || englishBySeries.get(id) === true);
    }
    for (const { id, seriesId } of episodes) seriesByEpisode.set(id, seriesId);
    return series.length > 0 || episodes.length > 0;
  };

  const hasEnglishAudio = (href) => {
    const target = linkTargetFromHref(href);
    if (!target) return false;
    const seriesId = target.kind === 'series' ? target.id : seriesByEpisode.get(target.id);
    return englishBySeries.get(seriesId) === true;
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

  const addBadge = (host) => {
    const badge = document.createElement('span');
    badge.className = BADGE_CLASS;
    badge.textContent = 'EN DUB';
    badge.setAttribute('aria-label', 'English dub available');
    // Only give the host a positioning context if the site hasn't already.
    if (getComputedStyle(host).position === 'static') host.classList.add(POSITIONED_CLASS);
    host.append(badge);
  };

  const removeBadge = (badge) => {
    badge.parentElement?.classList.remove(POSITIONED_CLASS);
    badge.remove();
  };

  const badgeCards = () => {
    const wanted = new Set();
    for (const { host, href } of findCards()) {
      if (hasEnglishAudio(href)) wanted.add(host);
    }

    // The site recycles card elements while scrolling, so a badge can end up
    // on a card that now shows a different series.
    for (const badge of document.querySelectorAll(`.${BADGE_CLASS}`)) {
      if (wanted.has(badge.parentElement)) wanted.delete(badge.parentElement);
      else removeBadge(badge);
    }

    for (const host of wanted) addBadge(host);
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

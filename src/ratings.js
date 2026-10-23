// Pure logic for the rating badge: pulling each series' average star rating
// and maturity rating out of captured responses, and the text the badge
// shows. No DOM and no extension APIs, so it runs as a content script and
// under Node for tests.
(() => {
  const MAX_DEPTH = 16;
  // US TV ratings, mildest first. Other schemes are ranked by their number.
  const TV_ORDER = ['TV-Y', 'TV-Y7', 'TV-G', 'TV-PG', 'TV-14', 'TV-MA'];

  const isObject = (value) => typeof value === 'object' && value !== null;
  const isId = (value) => typeof value === 'string' && value !== '';
  const isText = (value) => typeof value === 'string' && value.trim() !== '';

  // The average arrives as a string ("4.8") or a number; anything outside
  // 0–5 is treated as unknown.
  const starsOf = (rating) => {
    if (!isObject(rating)) return null;
    const value = typeof rating.average === 'number' ? rating.average : Number.parseFloat(rating.average);
    return Number.isFinite(value) && value > 0 && value <= 5 ? value : null;
  };

  const severity = (label) => {
    const tv = TV_ORDER.indexOf(label.toUpperCase());
    if (tv !== -1) return 100 + tv;
    const number = Number.parseInt(label.replace(/\D+/g, ''), 10);
    return Number.isFinite(number) ? number : -1;
  };

  const strictest = (labels) => {
    const valid = Array.isArray(labels) ? labels.filter(isText).map((label) => label.trim()) : [];
    if (valid.length === 0) return null;
    return valid.reduce((best, label) => (severity(label) > severity(best) ? label : best));
  };

  // Response bodies come from the site and are treated as untrusted.
  const collectRatings = (body) => {
    const ratings = [];

    const visit = (node, depth) => {
      if (!isObject(node) || depth > MAX_DEPTH) return;
      if (Array.isArray(node)) {
        for (const entry of node) visit(entry, depth + 1);
        return;
      }

      const metadata = node.series_metadata ?? node.movie_listing_metadata;
      if (isId(node.id) && isObject(metadata)) {
        const stars = starsOf(node.rating);
        const maturity = strictest(metadata.maturity_ratings);
        if (stars !== null || maturity !== null) ratings.push({ id: node.id, stars, maturity });
      }

      for (const value of Object.values(node)) visit(value, depth + 1);
    };

    visit(body, 0);
    return ratings;
  };

  // { text, label } for the badge, or null when there's nothing to show.
  const ratingBadge = ({ stars = null, maturity = null } = {}) => {
    const starText = stars === null ? null : stars.toFixed(1);
    if (starText === null && maturity === null) return null;
    return {
      text: [starText && `★${starText}`, maturity].filter(Boolean).join(' · '),
      label: [starText && `Rated ${starText} out of 5`, maturity].filter(Boolean).join(', '),
    };
  };

  const api = { collectRatings, ratingBadge };
  globalThis.crEnhancer = Object.assign(globalThis.crEnhancer ?? {}, api);
  if (typeof module !== 'undefined') module.exports = api;
})();

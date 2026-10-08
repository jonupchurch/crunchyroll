// Pure logic for the label filter: which labels exist and which the viewer has
// hidden. No DOM and no extension APIs, so it runs as a content script and
// under Node for tests.
(() => {
  const LABEL_KINDS = ['en', 'no-en', 'no-dub'];

  // Stored settings are read back as untrusted: anything that isn't a known
  // label is dropped, and a value that isn't a list means nothing is hidden.
  const sanitizeHiddenLabels = (value) =>
    Array.isArray(value) ? LABEL_KINDS.filter((kind) => value.includes(kind)) : [];

  const toggleLabel = (hidden, kind) => {
    if (!LABEL_KINDS.includes(kind)) return sanitizeHiddenLabels(hidden);
    const current = sanitizeHiddenLabels(hidden);
    return current.includes(kind)
      ? current.filter((entry) => entry !== kind)
      : sanitizeHiddenLabels([...current, kind]);
  };

  const api = { LABEL_KINDS, sanitizeHiddenLabels, toggleLabel };
  globalThis.crEnhancer = Object.assign(globalThis.crEnhancer ?? {}, api);
  if (typeof module !== 'undefined') module.exports = api;
})();

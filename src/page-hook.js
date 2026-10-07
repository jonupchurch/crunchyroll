// Runs in the page's own JS world (manifest "world": "MAIN") so it can see the
// site's fetch calls. Forwards catalog API responses to content.js via
// window.postMessage; it has no access to extension APIs.
(() => {
  const SOURCE = 'cr-enhancer';
  const API_PATH = /\/content\/v2\//;

  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args);
    try {
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
      if (url && API_PATH.test(url) && response.ok) {
        response
          .clone()
          .json()
          .then((body) => window.postMessage({ source: SOURCE, type: 'api-response', url, body }, location.origin))
          .catch(() => {});
      }
    } catch {
      // Never let the hook break the site's own request.
    }
    return response;
  };
})();

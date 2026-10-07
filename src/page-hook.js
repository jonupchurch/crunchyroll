// Runs in the page's own JS world (manifest "world": "MAIN") so it can see the
// site's network calls. Forwards catalog API responses to content.js via
// window.postMessage; it has no access to extension APIs.
(() => {
  const SOURCE = 'cr-enhancer';
  const API_PATH = /\/content\/v2\//;

  const forward = (url, body) => {
    window.postMessage({ source: SOURCE, type: 'api-response', url, body }, location.origin);
  };

  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args);
    try {
      const input = args[0];
      const url = input instanceof Request ? input.url : String(input);
      if (API_PATH.test(url) && response.ok) {
        response
          .clone()
          .json()
          .then((body) => forward(url, body))
          .catch(() => {});
      }
    } catch {
      // Never let the hook break the site's own request.
    }
    return response;
  };

  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    try {
      const urlString = String(url);
      if (API_PATH.test(urlString)) {
        this.addEventListener('load', () => {
          try {
            if (this.status < 200 || this.status >= 300) return;
            const body = this.responseType === 'json' ? this.response : JSON.parse(this.responseText);
            forward(urlString, body);
          } catch {
            // Non-JSON or unreadable response; ignore.
          }
        });
      }
    } catch {
      // Never let the hook break the site's own request.
    }
    return originalOpen.call(this, method, url, ...rest);
  };

  console.debug('[cr-enhancer] page hook installed');
})();

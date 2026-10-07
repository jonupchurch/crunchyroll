// Isolated-world content script: receives API responses from page-hook.js and
// (once the features are specced) decorates series cards in the DOM.
(() => {
  const SOURCE = 'cr-enhancer';

  window.addEventListener('message', (event) => {
    if (event.source !== window || event.origin !== location.origin) return;
    const message = event.data;
    if (message?.source !== SOURCE || message.type !== 'api-response') return;

    // Scaffold only: proves the pipeline works end to end.
    console.debug('[cr-enhancer] captured', message.url, message.body);
  });
})();

// compat.js — makes the visuals safe to open by double-click (file://).
//
// Loaded first, from every visual's <head>:
//
//     <script src="../../_shared/compat.js"></script>
//
// Why it exists
// -------------
// 81 visuals deep-link their slider state into the URL hash with
// history.replaceState(). Browsers may refuse that call on a file://
// document, and the throw lands in the middle of an update handler — the
// sliders stop responding for the rest of the session. There is nothing to
// recover: a deep-link is a convenience, not part of the visual.
//
// So the two history methods are wrapped once, here, and a refusal becomes a
// no-op instead of a dead page. Over http nothing changes; the original call
// succeeds and the wrapper is invisible.
//
// Keep this file dependency-free and side-effect-free beyond the wrap. It
// runs before everything else on every page.

(function () {
  'use strict';

  var h = window.history;

  ['replaceState', 'pushState'].forEach(function (method) {
    var original = h[method];
    if (typeof original !== 'function') return;

    h[method] = function () {
      try {
        return original.apply(h, arguments);
      } catch (e) {
        // file:// document — URL deep-linking is unavailable here. The visual
        // itself is unaffected, so swallow it and carry on.
      }
    };
  });
})();

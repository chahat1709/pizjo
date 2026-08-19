// Test-only diagnostics. Production behavior is implemented by the application itself.
// This file intentionally avoids fabricating DOM nodes or controller globals.
(function () {
  window.PizjoTestMode = true;
  window.dispatchEvent(new CustomEvent('pizjo-test-ready'));
})();

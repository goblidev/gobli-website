/* Redirect hand-off for pages that are not real pages.

   GitHub Pages has no server-side router, so index.html's in-page sections
   (/products, /services, ...) need help when visited directly. Stash the path
   this visit was for, then go to the homepage; nav.js reads it back and
   scrolls to the matching section.

   Used by:
     404.html             no data-path: the requested URL itself is stashed
     products.html etc.   data-path="/products" names the section explicitly

   Always load this with an absolute src (/assets/redirect.js): 404.html is
   served at arbitrary depths, where a relative path would not resolve. */
(function () {
  var script = document.currentScript;
  var path = (script && script.getAttribute('data-path')) || location.pathname;
  try {
    sessionStorage.setItem('gobli-redirect-path', path);
  } catch (e) {
    // Storage can be unavailable (strict privacy modes). Still redirect; the
    // visitor just lands at the top of the homepage instead of the section.
  }
  location.replace('/');
})();

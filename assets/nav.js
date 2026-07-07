// Mobile nav (<details class="nav-mobile">): native semantics already expose
// open/closed state to assistive tech, but <details> doesn't close itself on
// link tap, Escape, or outside click — add that here so it behaves like the
// rest of the site's overlays (buy popup, etc).
document.addEventListener('DOMContentLoaded', () => {
  const nav = document.querySelector('.nav-mobile');
  if (!nav) return;
  const panel = nav.querySelector('.nav-mobile-panel');

  function close() { nav.open = false; }

  panel.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.open) close();
  });

  document.addEventListener('click', (e) => {
    if (nav.open && !nav.contains(e.target)) close();
  });
});

// ---------------------------------------------------------------------
// Clean-URL section navigation (index.html only - pages without a #hero
// element skip this entirely). Rewrites in-page anchor jumps (#trust,
// #proof, ...) to real-looking paths (/self-hosted, /proof, ...) via the
// History API instead of leaving a "#hash" in the address bar. GitHub
// Pages has no server-side router, so 404.html plus the DOMContentLoaded
// handler below fake one: a fresh visit, refresh, or shared link to one
// of these paths gets redirected back to index.html and scrolled to the
// right section.
// ---------------------------------------------------------------------
(function () {
  const SECTION_PATHS = {
    hero: '/',
    how: '/source-included',
    products: '/products',
    trust: '/self-hosted',
    proof: '/proof',
    faq: '/before-you-snipe',
  };
  const PATH_TO_SECTION = Object.fromEntries(
    Object.entries(SECTION_PATHS).map(([id, path]) => [path, id])
  );

  if (!document.getElementById('hero')) return;

  function scrollToSection(id, behavior) {
    const el = document.getElementById(id);
    if (!el) return;
    const navEl = document.querySelector('.site-nav');
    const navHeight = navEl ? navEl.offsetHeight : 0;
    const top = id === 'hero'
      ? 0
      : Math.max(el.getBoundingClientRect().top + window.pageYOffset - navHeight - 12, 0);
    window.scrollTo({ top, behavior: behavior || 'smooth' });
  }

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    const id = a.getAttribute('href').slice(1);
    if (!(id in SECTION_PATHS)) return; // leave the #main skip-link alone
    a.addEventListener('click', (e) => {
      e.preventDefault();
      history.pushState({ section: id }, '', SECTION_PATHS[id]);
      scrollToSection(id);
    });
  });

  window.addEventListener('popstate', () => {
    const id = PATH_TO_SECTION[location.pathname] || (location.hash || '').slice(1) || 'hero';
    scrollToSection(id, 'auto');
  });

  document.addEventListener('DOMContentLoaded', () => {
    const redirectedPath = sessionStorage.getItem('gobli-redirect-path');
    if (redirectedPath) sessionStorage.removeItem('gobli-redirect-path');
    const path = redirectedPath || location.pathname;
    const idFromPath = PATH_TO_SECTION[path];
    const hashId = (location.hash || '').slice(1);
    const idFromHash = hashId in SECTION_PATHS ? hashId : null;
    const id = idFromPath || idFromHash;
    if (!id) return;
    history.replaceState({ section: id }, '', SECTION_PATHS[id]);
    requestAnimationFrame(() => scrollToSection(id, 'auto'));
  });
})();

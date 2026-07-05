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

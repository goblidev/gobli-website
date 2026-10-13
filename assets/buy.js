/* Buy popup (focus trap, ESC to close, click-outside).
   Kept out of home.js on purpose: that file is an ES module that imports
   three.js, and a module stops at its first error. With the popup inside it,
   a browser without WebGL - or a failed three.js download on a bad mobile
   connection - also took out every "buy" button on the page. On its own,
   the popup works whatever happens to the 3D goblin.
   Loaded as a classic script, wrapped so its names stay out of the global
   scope it shares with nav.js. */
(() => {
const overlay  = document.getElementById('drawerOverlay');
const drawerEl = document.getElementById('drawer');
const closeBtn = document.getElementById('drawerClose');

// One drawer serves every product and service. Each trigger carries its own
// copy in data- attributes; the fields left in the markup are the fallback.
const drawerFields = {
  product: document.getElementById('drawerTitle'),
  price:   document.getElementById('drawerSub'),
  note:    document.getElementById('drawerNote'),
  trust:   document.getElementById('drawerTrust'),
};
const drawerDefaults = Object.fromEntries(
  Object.entries(drawerFields).map(([k, el]) => [k, el.textContent])
);

let lastFocused = null;

function onKeydown(e){
  if (e.key === 'Escape') { closeDrawer(); return; }
  if (e.key === 'Tab') {
    const focusables = drawerEl.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])');
    if (!focusables.length) return;
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
}

function fillDrawer(data){
  // Entities in the data- attributes are already decoded by the parser, so
  // textContent is both correct and safe here.
  Object.keys(drawerFields).forEach((k) => {
    drawerFields[k].textContent = (data && data[k]) || drawerDefaults[k];
  });
}

function openDrawer(){
  lastFocused = document.activeElement;
  overlay.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  closeBtn.focus();
  document.addEventListener('keydown', onKeydown);
}
function closeDrawer(){
  overlay.classList.remove('is-open');
  document.body.style.overflow = '';
  document.removeEventListener('keydown', onKeydown);
  if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
}

document.querySelectorAll('[data-open-drawer]').forEach((btn) => {
  btn.addEventListener('click', () => { fillDrawer(btn.dataset); openDrawer(); });
});
closeBtn.addEventListener('click', closeDrawer);
overlay.addEventListener('click', (e) => { if (e.target === overlay) closeDrawer(); });
})();

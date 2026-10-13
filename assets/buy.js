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
// copy in data- attributes; what's left in the markup (Gobli Pro's copy) is
// the fallback.
const drawerFields = {
  product: document.getElementById('drawerTitle'),
  price:   document.getElementById('drawerSub'),
  note:    document.getElementById('drawerNote'),
};
const drawerDefaults = Object.fromEntries(
  Object.entries(drawerFields).map(([k, el]) => [k, el.textContent])
);

// The two lists take their items from data-steps / data-never, separated by
// "|". The "never" items differ per product: seed recovery can't promise it
// will never ask about a seed phrase.
const drawerLists = {
  steps: document.getElementById('drawerSteps'),
  never: document.getElementById('drawerNever'),
};
const listDefaults = Object.fromEntries(
  Object.entries(drawerLists).map(([k, el]) => [k, Array.from(el.children, (li) => li.textContent.trim())])
);
// New items are copies of the first one in the markup, so the never-list's
// x icon comes along without being redrawn here.
const listItemTemplates = Object.fromEntries(
  Object.entries(drawerLists).map(([k, el]) => [k, el.firstElementChild.cloneNode(true)])
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
  Object.keys(drawerLists).forEach((k) => {
    const items = (data && data[k]) ? data[k].split('|') : listDefaults[k];
    drawerLists[k].replaceChildren(...items.map((text) => {
      const li = listItemTemplates[k].cloneNode(true);
      li.querySelector('span').textContent = text.trim();
      return li;
    }));
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

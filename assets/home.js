/* Homepage scripts: the 3D hero and the buy popup.
   Lives in its own file rather than inline in index.html so the site's
   Content-Security-Policy can forbid inline scripts.
   NOTE: import paths below resolve relative to THIS file (assets/), but
   CONFIG.modelURL is fetched relative to the page, so it keeps its
   ./assets/ prefix. */
/* =====================================================================
   GOBLI HEAD — lifted verbatim from gobli_hero_full.html (the full-body
   model revision) per the build brief. Every line below this banner down
   to `window.__gobliReady = ...` is unchanged from the tested source,
   except the additive lines (marked) that hide the "summoning goblin…"
   loading caption once the GLB loads, or surface a load error.
   Do not retune the CONFIG values — they were measured against the model.
   ===================================================================== */
import * as THREE from './vendor/three.module.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';

// ===================== GOBLI HEAD — config =====================
// Updated to the full-body model (gobli_full.glb) and its re-measured
// tracking range, per the tested gobli_hero_full.html reference.
const CONFIG = {
  modelURL: './assets/gobli_home.glb',
  baseYaw:  -Math.PI/2,   // model faces camera at this Y rotation (measured)
  yawRange:  0.42,        // max left/right turn toward cursor (rad ~24deg)
  pitchRange:0.12,        // max up/down (rad ~7deg)
  ease:      0.075,       // cursor follow smoothing (lower = lazier)
  idleAmp:   0.05,        // idle sway amplitude (rad) when cursor still
  idleSpeed: 0.6,         // idle sway speed
  bobAmp:    0.015,       // vertical breathing of the model (world units)
  camZ:      3.0, fov: 32, fit: 1.30
};
// ==============================================================

const stage  = document.getElementById('gobliStage');
const canvas = document.getElementById('gobliCanvas');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true});
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(CONFIG.fov, 1, 0.1, 100);
camera.position.set(0,0,CONFIG.camZ);

// environment (soft reflections for PBR + eye catchlights)
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

// lighting rig — key (white), rim (goblin green), fill (hoodie purple)
scene.add(new THREE.AmbientLight(0xffffff, 0.35));
const key = new THREE.DirectionalLight(0xffffff, 1.25); key.position.set(2.2,2.6,3); scene.add(key);
const rim = new THREE.DirectionalLight(0x9bd75a, 0.7);  rim.position.set(-3,1.2,-2);  scene.add(rim);
const fill= new THREE.DirectionalLight(0x7a4ddb, 0.45); fill.position.set(-2,-1.4,2);  scene.add(fill);

const pivot = new THREE.Group(); scene.add(pivot);
let model=null, modelBaseY=0;

// --- additive: defer the ~3.5MB model fetch until the browser is idle, so it
// doesn't compete with fonts/three.module.js/first paint for bandwidth on
// load — same pattern already used for donate.html's (larger) heart model.
// Falls back to a short timeout on browsers without requestIdleCallback
// (Safari). The loader callbacks themselves are unchanged from the tested
// source below. ---
function loadModel(){
new GLTFLoader().load(CONFIG.modelURL, (gltf)=>{
  const m = gltf.scene;
  const box = new THREE.Box3().setFromObject(m);
  const c = box.getCenter(new THREE.Vector3());
  m.position.sub(c);                                   // center at origin
  const size = box.getSize(new THREE.Vector3());
  m.scale.setScalar(CONFIG.fit / Math.max(size.x,size.y,size.z));
  pivot.add(m);
  pivot.rotation.y = CONFIG.baseYaw;
  modelBaseY = pivot.position.y;
  model = pivot;
  // --- additive: hide the loading caption once the head is in the scene.
  // Inline style, not the `hidden` attribute — `.gobli-loading{display:flex}`
  // below is an author-origin rule with the same specificity as the
  // browser's built-in `[hidden]{display:none}`, and author rules win that
  // tie, so `.hidden = true` alone silently does nothing. Inline style
  // always wins regardless. ---
  const loadingEl = document.getElementById('gobliLoading');
  if (loadingEl) loadingEl.style.display = 'none';
  // --- end additive ---
}, undefined, (e)=>{
  console.error('GLB load error', e);
  // --- additive: surface the file://-vs-http:// footgun directly in the UI ---
  const loadingEl = document.getElementById('gobliLoading');
  if (loadingEl) loadingEl.textContent = 'gobli failed to load, serve over http://, not file://';
  // --- end additive ---
});
}
if (window.requestIdleCallback) {
  requestIdleCallback(loadModel, { timeout: 2000 });
} else {
  setTimeout(loadModel, 200);
}
// --- end additive ---

// pointer state (-1..1 across the stage), eased
let tx=0,ty=0,cx=0,cy=0,lastMove=performance.now();
function onMove(e){
  const r = stage.getBoundingClientRect();
  tx = Math.max(-1,Math.min(1,(e.clientX-(r.left+r.width/2))/(r.width/2)));
  ty = Math.max(-1,Math.min(1,(e.clientY-(r.top+r.height/2))/(r.height/2)));
  lastMove = performance.now();
}
window.addEventListener('mousemove', onMove, {passive:true});
window.addEventListener('mouseleave', ()=>{tx=0;ty=0;});
window.addEventListener('touchmove', e=>{ if(e.touches[0]) onMove(e.touches[0]); }, {passive:true});

function resize(){
  const r = stage.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio||1, 2);
  renderer.setPixelRatio(dpr);
  renderer.setSize(r.width, r.height, false);
  camera.aspect = r.width/r.height; camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(stage); resize();

// Skip the render/animation work while the canvas is scrolled off-screen —
// a continuous WebGL draw call costs real GPU/CPU even when invisible, and
// on mobile that competes with scroll compositing. Still tick the rAF chain
// so it resumes the instant the hero scrolls back into view.
let heroVisible = true;
new IntersectionObserver((entries)=>{ heroVisible = entries[0].isIntersecting; }, {threshold:0}).observe(stage);

const clock = new THREE.Clock();
function tick(){
  if(!heroVisible){ requestAnimationFrame(tick); return; }
  const t = clock.getElapsedTime();
  cx += (tx-cx)*CONFIG.ease;
  cy += (ty-cy)*CONFIG.ease;
  if(model){
    if(reduce){
      model.rotation.y = CONFIG.baseYaw;
      model.rotation.x = 0;
    } else {
      const idle = (performance.now()-lastMove > 1400);
      const sway = idle ? Math.sin(t*CONFIG.idleSpeed)*CONFIG.idleAmp : 0;
      model.rotation.y = CONFIG.baseYaw + cx*CONFIG.yawRange + sway;
      model.rotation.x = cy*CONFIG.pitchRange;
      model.position.y = modelBaseY + Math.sin(t*1.1)*CONFIG.bobAmp; // breathing
    }
  }
  renderer.render(scene,camera);
  requestAnimationFrame(tick);
}
tick();
window.__gobliReady = ()=> !!model;

/* =====================================================================
   Site interactions: buy popup (focus trap, ESC to close, click-outside).
   ===================================================================== */

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

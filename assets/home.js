/* Homepage script: the 3D hero. (The buy popup is assets/buy.js - kept
   separate so a 3D failure can't take the buy buttons down with it.)
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
   loading caption once the GLB loads, and show a still Gobli when the 3D
   one can't appear (no WebGL, or the model failed to download).
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

// --- additive: a still Gobli for when the 3D one can't appear. Without it a
// visitor is left looking at "summoning goblin..." forever. Sized inline so
// it doesn't depend on a fresh style.css. ---
function showStill(){
  const loadingEl = document.getElementById('gobliLoading');
  if (loadingEl) loadingEl.style.display = 'none';
  canvas.style.display = 'none';
  if (stage.querySelector('.gobli-still')) return;
  const still = document.createElement('img');
  still.className = 'gobli-still';
  still.src = './assets/pose_sniper.png';   // relative to the page, like modelURL
  still.alt = 'Gobli, a hooded goblin holding a sniper rifle';
  still.width = 480; still.height = 480;
  still.style.cssText = 'position:relative;z-index:2;display:block;width:100%;height:100%;object-fit:contain';
  stage.appendChild(still);
}
// No WebGL (some old phones, locked-down browsers): three.js would throw on
// the line below, so show the still and stop here.
const hasWebGL = (()=>{
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); }
  catch { return false; }
})();
if (!hasWebGL) {
  showStill();
  throw new Error('No WebGL - showing the still Gobli instead of the 3D one');
}
// --- end additive ---

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
  // --- additive: opened straight from disk, the model can never load - say
  // so, for whoever is developing. Anywhere else it's a visitor on a bad
  // connection, who gets the still Gobli instead of an instruction. ---
  if (location.protocol === 'file:') {
    const loadingEl = document.getElementById('gobliLoading');
    if (loadingEl) loadingEl.textContent = 'gobli failed to load, serve over http://, not file://';
  } else {
    showStill();
  }
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

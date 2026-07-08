# Gobli — marketing site

A marketing site for Gobli (Solana sniper toolset, AI goblin mascot): a one-page
home (`index.html`) plus a handful of standalone pages (About, Donate, Terms,
Privacy, Disclaimer). The hero is a real 3D model that tracks the cursor.

## Run it (must be over HTTP — not `file://`)

The hero uses ES-module imports and fetches the `.glb` model; Chrome blocks both
over `file://`. From this folder:

```
npx serve .
```

or

```
python3 -m http.server 8000
```

then open the printed `localhost` URL.

## Structure

```
index.html              home page: hero, products, trust, FAQ, buy popup
about.html              Company > About
donate.html             Support > Donate (heart-pose 3D hero + SOL/ETH/BTC tip QR + copy)
terms.html              Legal > Terms
privacy.html            Legal > Privacy
disclaimer.html         Legal > Disclaimer
assets/
  style.css             shared design system + layout for every page above
  favicon.png           tightly-cropped goblin face, 48x48 — browser tab icon only
  apple-touch-icon.png  same art at 180x180 (Apple's standard size) — iOS/iPadOS home
                        screen icon, linked via &lt;link rel="apple-touch-icon"&gt; on
                        every page. Both are downsized from the same 512px master.
  gobli_home.glb         Gobli's full-body 3D model (homepage hero)
  gobli_heart.glb        "making a heart" 3D model for donate.html's hero (replaced
                         the earlier kiss-pose model). Optimized from a 55.9MB/979k-
                         vert raw Tripo export down to 4.7MB/87k verts + 1024² textures
                         via `gltf-transform` (visually identical to the 9.2MB/160k-vert
                         first pass at the size it's actually rendered on the page). No
                         Draco/meshopt compression, still loads with the plain
                         GLTFLoader. Fetch is deferred via requestIdleCallback in
                         donate.html so it doesn't compete with first paint.
  proof_snipe.mp4        unedited screen recording for the "Proof" section on index.html (id="proof"):
                         a real snipe with no VPS and Helius's free tier, showing Telegram send time
                         vs. on-chain confirm time. Sped up 2x, no sound, no cuts. 16MB, so the
                         <video> tag uses preload="metadata" instead of eager-loading it.
  proof_thumbnail.jpg    poster frame for the proof_snipe.mp4 <video>, shown before playback.
                         Downscaled to 1600px wide (retina-appropriate for the ~800px max
                         display width inside .proof-box) and re-exported as JPEG q82, ~200KB.
                         Bump the ?v= query string on the poster="" attribute in index.html
                         whenever this file is replaced, browsers cache it by filename alone.
  og_banner.jpg          social preview image for index.html's og:image / twitter:image
                         (link/card previews when the site is shared elsewhere). Center-cropped
                         to the standard 1200x630 OG ratio and exported as JPEG q88 (~125KB) from
                         the source art. Referenced via the REPLACE_ME_DOMAIN placeholder until
                         the real domain is live.
  gobli_logo.png         flat brand mark — nav/footer icon
  pose_sniper.png        Gobli holding a sniper rifle — card art for the Sniper product
  pose_shadow.png        Gobli as a detective — card art for the Shadow (wallet tracker) product
  pose_mirror.png        Gobli holding a sniper rifle while checking a hand mirror — card art
                         for the Mirror (copy-trade) product
  pose_source_included.png  Gobli holding a "Source Included" wood sign — art for the source
                         trust section on index.html (id="how")
  vendor/
    three.module.js      Three.js r160
    GLTFLoader.js
    RoomEnvironment.js
    BufferGeometryUtils.js
    qrcode-generator.js  vendored QR Code Generator for JavaScript (Kazuhiko Arase, MIT,
                         v1.4.4) — the actual QR encoding engine, exposes the `qrcode`
                         global. No CDN.
    qrcode.js            thin wrapper around qrcode-generator.js — paints a wallet
                         address onto a &lt;canvas&gt; at EC level L (auto version) and
                         exposes `window.GobliQR.renderToCanvas`. Loaded after
                         qrcode-generator.js on donate.html; both files are required.
archive/                old assets kept for reference, do not deploy
```

No CDN is used for any of the above. The **only** external network request the
page makes is to Google Fonts (Space Grotesk / Inter / JetBrains Mono).

## Deployment

Hosted on GitHub Pages (`gh-pages`-free legacy build, serving from `master`
root) at the repo `goblidev/gobli-website`. Custom domain
`gobli.io` is registered with Cloudflare and set as the Pages `cname`; the
`CNAME` file at the repo root is what GitHub Pages reads to route it (don't
delete it). The OG/canonical/twitter meta block in `index.html`'s `<head>`
already points at `https://gobli.io/`.

The Telegram links (`https://t.me/goblidev`) are the real invite link.

## The hero component

`.gobli-stage` / `.gobli-glow` / `.gobli-canvas` / `.gobli-floor` and the entire
hero `<script type="module">` block are lifted verbatim from the tested
`gobli_hero_full.html` reference (the full-body model revision), including
the tuned `CONFIG` constants (`baseYaw`, `yawRange`, `ease`, etc.). Don't
retune these blind — they were measured against the actual model. The only
additions are a couple of lines that hide the "summoning goblin…" loading
caption once the GLB has loaded, and surface a load-error message in its place
if the GLB fails to fetch (most commonly: opened over `file://` instead of
`http://`).

**Gotcha worth knowing:** the loading caption is hidden by setting an inline
`style.display = 'none'`, not the `hidden` attribute. `.gobli-loading` has its
own `display:flex` rule in the page's author stylesheet, which is the same
specificity as the browser's built-in `[hidden]{display:none}` — and author
rules win that tie. So `el.hidden = true` silently does nothing here; only an
inline style (or a more specific `.gobli-loading[hidden]` rule) reliably wins.

# Gobli — marketing site

A marketing site for Gobli (Solana sniper toolset, AI goblin mascot): a one-page
home (`index.html`) plus a handful of standalone pages (How It Works, About,
Donate, Terms, Privacy, Disclaimer). The hero is a real 3D model that tracks the
cursor.

Two products ship today, the Manual Sniper and the Auto-Sniper, alongside one
by-hand service (seed phrase recovery). Every one of them has a card in
`index.html`; there are no "coming soon" cards.

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
index.html              home page: hero, products, services, proof, FAQ, buy popup
how-gobli-works.html    How It Works: one card per sniper, each linking its own PDF guide
404.html                clean-URL fallback for direct/refreshed deep links
about.html              Company > About
donate.html             Support > Donate (SOL/ETH/BTC tip QR + copy)
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
  gobli_donate.glb       "making a heart" 3D model, previously donate.html's hero.
                         Unused since that hero was removed; nothing references it and
                         it is no longer downloaded by any page. Kept, not deleted.
  proof_manual.mp4       unedited screen recording of the Manual Sniper, left card of the "Proof"
                         section on index.html (id="proof"). 1920x1080, 24s, 8MB.
  proof_auto.mp4         same for the Auto-Sniper, right card. 1920x1080, 71s, 30MB. Both <video>
                         tags use preload="metadata" so neither file downloads until played.
  proof_manual_poster.jpg / proof_auto_poster.jpg
                         poster frames shown before playback: purpose-made branded thumbnails,
                         normalised to exactly 1280x720 and exported as JPEG q82 progressive.
                         Bump the ?v= query string on the poster="" attribute in index.html
                         whenever either is replaced, browsers cache by filename alone
                         (currently ?v=2).
  og_banner.jpg          social preview image for index.html's og:image / twitter:image
                         (link/card previews when the site is shared elsewhere). Center-cropped
                         to the standard 1200x630 OG ratio and exported as JPEG q88 (~125KB) from
                         the source art. Referenced via the live gobli.io URL in index.html's
                         OG/twitter meta tags.
  gobli_logo.png         flat brand mark — nav/footer icon
  gobli_sniper.png       Gobli taking aim down a sniper rifle — card art for the Manual Sniper,
                         on index.html and how-gobli-works.html. Downscaled from a 1024px master
                         to 480x480 and quantized to a 256-colour palette (~31KB instead of
                         ~185KB); indistinguishable at the 150px it actually renders at.
  gobli_auto_sniper.png  Gobli asleep cradling the rifle — card art for the Auto-Sniper, same
                         two pages, same downscale/quantize treatment.
  gobli_seed.png         Gobli hunched over a laptop — art for the seed phrase recovery
                         service on index.html, same downscale/quantize treatment.
  gobli-manual-sniper.pdf  Manual Sniper setup guide, linked from how-gobli-works.html.
  gobli-auto-sniper.pdf    Auto-Sniper setup guide, linked from the same page. Both are the
                         post-purchase setup guides, published here as the public explainers.
                         Checked clean of Info-dict/XMP leaks before shipping; re-check on
                         every replacement.
  pose_shadow.png        Gobli as a detective. Unused, superseded by gobli_seed.png.
  pose_sniper.png        Older flat sniper art, superseded by gobli_sniper.png. Unused.
  pose_mirror.png        Gobli with a rifle and a hand mirror. Unused since the Mirror card was
                         removed.
  pose_source_included.png  Gobli holding a "Source Included" wood sign. Unused since the
                         standalone source/trust sections were folded into the product cards.
                         The four unused poses are kept because the art is still good.
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

## No CDN

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

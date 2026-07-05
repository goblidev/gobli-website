/*!
 * Thin wrapper around the vendored qrcode-generator library (Kazuhiko Arase,
 * MIT) — see assets/vendor/qrcode-generator.js, loaded before this file.
 * Paints a wallet address onto a <canvas> at EC level L (auto version).
 *
 * Exposes: window.GobliQR.renderToCanvas(canvas, text, options) -> boolean
 */
(function (global) {
  'use strict';

  function renderToCanvas(canvas, text, options) {
    options = options || {};
    var scale = options.scale || 6;
    // ISO/IEC 18004 calls for a minimum 4-module quiet zone around a QR code;
    // thinner margins can decode fine off a clean screenshot but are
    // unreliable for real camera scanners pointed at a lit screen.
    var margin = options.margin != null ? options.margin : 4;
    var fg = options.fg || '#0b0f0c';
    var bg = options.bg || '#e7f0e0';

    var qr;
    try {
      qr = global.qrcode(0, 'L');
      qr.addData(String(text), 'Byte');
      qr.make();
    } catch (e) {
      return false;
    }

    var count = qr.getModuleCount();
    var size = (count + margin * 2) * scale;
    canvas.width = size;
    canvas.height = size;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = fg;
    for (var r = 0; r < count; r++) {
      for (var c = 0; c < count; c++) {
        if (qr.isDark(r, c)) ctx.fillRect((c + margin) * scale, (r + margin) * scale, scale, scale);
      }
    }
    return true;
  }

  global.GobliQR = { renderToCanvas: renderToCanvas };
})(window);

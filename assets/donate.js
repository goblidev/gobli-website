/* Donate page: renders each coin's QR code and wires its Copy button.
   Bump the ?v= on this file's <script> tag in donate.html whenever an
   address changes, so no browser keeps showing a stale one. */
const DONATIONS = {
  SOL: '5n71BQVWy4Rgp8PGKGdJjgz34nZMHvKvD76bAooXYnTK',
  ETH: '0x7296E23Cb5F5A15D4dFc331B9b66f9aB35Fe1BDF',
  BTC: 'bc1qx83v83tjs6elwxtylvd69w2rhtufhcvr8xlfex',
};

document.querySelectorAll('.donate-box').forEach((box) => {
  const address = DONATIONS[box.dataset.coin];
  const addressEl = box.querySelector('.donate-address');
  const qrCanvas = box.querySelector('.donate-qr');
  const copyBtn = box.querySelector('.donate-copy');

  addressEl.textContent = address;
  if (window.GobliQR) {
    window.GobliQR.renderToCanvas(qrCanvas, address, { fg: '#0b0f0c', bg: '#e7f0e0', scale: 6 });
  }

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(address);
    } catch (err) {
      const range = document.createRange();
      range.selectNodeContents(addressEl);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
    copyBtn.textContent = 'Copied';
    copyBtn.classList.add('is-copied');
    setTimeout(() => { copyBtn.textContent = 'Copy'; copyBtn.classList.remove('is-copied'); }, 1800);
  });
});

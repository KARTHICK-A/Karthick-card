/* Karthick A — contact card · shared behaviour.
   Everything here is progressive: with JavaScript off, every page still reads,
   every link works, and the contact QR (rendered at build time) still scans. */
(function () {
  'use strict';

  var SCRIPT = document.currentScript && document.currentScript.src;
  var ROOT = SCRIPT ? new URL('../', SCRIPT).href : '';
  var doc = document.documentElement;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---- toast -------------------------------------------------------- */
  var toast = $('#toast'), toastTimer;
  function say(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.hidden = true; }, 2400);
  }

  /* ---- theme -------------------------------------------------------- */
  var THEME_COLOR = { dark: '#04060c', light: '#eef1f6' };
  var themeBtn = $('.theme');
  function currentTheme() {
    var t = doc.getAttribute('data-theme');
    if (t) return t;
    return window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  function paintThemeUI() {
    var t = currentTheme();
    if (themeBtn) themeBtn.setAttribute('aria-label', 'Switch to ' + (t === 'light' ? 'dark' : 'light') + ' theme');
    // An explicit choice overrides the media-query theme-color pair.
    if (doc.getAttribute('data-theme')) {
      $$('meta[name="theme-color"]').forEach(function (m) { m.removeAttribute('media'); m.setAttribute('content', THEME_COLOR[t]); });
    }
  }
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = currentTheme() === 'light' ? 'dark' : 'light';
      doc.setAttribute('data-theme', next);
      try { localStorage.setItem('kc-theme', next); } catch (e) { /* ignore */ }
      paintThemeUI();
    });
  }
  paintThemeUI();

  /* ---- copy buttons ------------------------------------------------- */
  function legacyCopy(text) {
    var t = document.createElement('textarea');
    t.value = text; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t); t.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { /* ignore */ }
    document.body.removeChild(t);
    return ok;
  }
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return legacyCopy(text); });
    }
    return Promise.resolve(legacyCopy(text));
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.copy');
    if (!b) return;
    var label = b.getAttribute('data-label') || 'Value';
    var text = b.getAttribute('data-copy');
    copyText(text).then(function (ok) {
      if (!ok) { say('Copy failed — ' + text); return; }
      say(label + ' copied');
      b.setAttribute('data-done', 'true');
      setTimeout(function () { b.removeAttribute('data-done'); }, 1600);
    });
  });

  /* ---- share -------------------------------------------------------- */
  var shareBtn = $('#share');
  if (shareBtn) {
    shareBtn.hidden = false;
    shareBtn.addEventListener('click', function () {
      var data = { title: document.title, text: 'Karthick A — Embedded Systems Engineer', url: pageUrl() };
      if (navigator.share) {
        navigator.share(data).catch(function () { /* dismissed */ });
      } else {
        copyText(data.url).then(function (ok) { say(ok ? 'Link copied' : 'Copy failed — ' + data.url); });
      }
    });
  }
  function pageUrl() {
    // file:// and some previews report an opaque origin; fall back to the canonical URL.
    var canon = $('link[rel="canonical"]');
    if (location.origin === 'null' || /^(file|about|blob):/.test(location.protocol)) return canon ? canon.href : location.href;
    return (location.origin + location.pathname).replace(/index\.html$/, '');
  }

  /* ---- QR mode switch (home) ---------------------------------------- */
  var plate = $('#plate');
  if (plate) {
    var qrSvg0 = plate.innerHTML;       // the contact code, rendered at build time
    var meta = $('#qrmeta'), hint = $('#qrhint');
    var tabs = { vcard: $('#tab-vcard'), url: $('#tab-url') };
    var HINT = {
      vcard: 'Point your phone camera at the code. It adds my name, role, company, phone, both emails and website.',
      url: 'Opens this page — projects, profile and every link.'
    };
    var LABEL = {
      vcard: 'QR code containing the contact details of Karthick A',
      url: 'QR code linking to this contact page'
    };
    var META0 = meta ? meta.textContent : '';
    var qrLoading = null;

    var loadQR = function () {
      if (window.qrcode) return Promise.resolve();
      if (!qrLoading) qrLoading = new Promise(function (ok, no) {
        var s = document.createElement('script');
        s.src = ROOT + 'vendor/qrcode.js';
        s.onload = ok; s.onerror = function () { qrLoading = null; no(); };
        document.head.appendChild(s);
      });
      return qrLoading;
    };
    // Always dark-on-white with a 4-module quiet zone: inverted codes fail on many scanners.
    var svgFor = function (text, label) {
      var c = qrcode(0, 'M'); c.addData(text, 'Byte'); c.make();
      var n = c.getModuleCount(), q = 4, side = n + q * 2, d = '';
      for (var r = 0; r < n; r++) {
        var run = 0;
        for (var col = 0; col <= n; col++) {
          var dark = col < n && c.isDark(r, col);
          if (dark) { run++; continue; }
          if (run) { d += 'M' + (col - run + q) + ' ' + (r + q) + 'h' + run + 'v1h-' + run + 'z'; run = 0; }
        }
      }
      return { n: n, html: '<svg class="qr-svg" role="img" aria-label="' + label + '" viewBox="0 0 ' + side + ' ' + side +
        '" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg"><rect width="' + side + '" height="' + side +
        '" fill="#fff"/><path fill="#000" d="' + d + '"/></svg>' };
    };
    var setMode = function (mode) {
      Object.keys(tabs).forEach(function (k) { tabs[k].setAttribute('aria-pressed', String(k === mode)); });
      if (hint) hint.textContent = HINT[mode];
      if (mode === 'vcard') {
        plate.innerHTML = qrSvg0;
        if (meta) meta.textContent = META0;
        return;
      }
      loadQR().then(function () {
        var out = svgFor(pageUrl(), LABEL.url);
        plate.innerHTML = out.html;
        if (meta) meta.textContent = 'v' + ((out.n - 17) / 4) + ' · ECC M';
      }, function () {
        say('Could not build the page code — try again');
        setMode('vcard');
      });
    };
    if (tabs.vcard && tabs.url) {
      tabs.vcard.addEventListener('click', function () { setMode('vcard'); });
      tabs.url.addEventListener('click', function () { setMode('url'); });
    }
  }

  /* ---- lightbox ----------------------------------------------------- */
  var lb = $('#lb');
  if (lb && typeof lb.showModal === 'function') {
    var cap = $('figcaption', lb);
    var img = document.createElement('img');       // created here: an <img> without src is not valid markup
    img.alt = '';
    cap.parentNode.insertBefore(img, cap);
    var prev = $('.lb-prev', lb), next = $('.lb-next', lb), close = $('.lb-close', lb);
    var shots = $$('[data-lb]');
    var idx = 0, opener = null;
    var show = function (i) {
      idx = (i + shots.length) % shots.length;
      var s = shots[idx];
      var thumb = $('img', s);
      img.onerror = function () { img.onerror = null; img.src = thumb.currentSrc || thumb.src; };   // offline: fall back to the cached thumbnail
      img.src = s.getAttribute('data-lb');
      img.alt = s.getAttribute('data-alt') || '';
      cap.textContent = s.getAttribute('data-tag') + ' — ' + (s.getAttribute('data-alt') || '');
      var many = shots.length > 1;
      prev.hidden = next.hidden = !many;
    };
    shots.forEach(function (s, i) {
      s.addEventListener('click', function () { opener = s; show(i); lb.showModal(); close.focus(); });
    });
    close.addEventListener('click', function () { lb.close(); });
    prev.addEventListener('click', function () { show(idx - 1); });
    next.addEventListener('click', function () { show(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('lb-in')) lb.close(); });
    lb.addEventListener('keydown', function (e) {
      if (shots.length < 2) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(idx - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); show(idx + 1); }
    });
    lb.addEventListener('close', function () { if (opener) opener.focus(); });
    // swipe
    var x0 = null;
    lb.addEventListener('pointerdown', function (e) { x0 = e.clientX; });
    lb.addEventListener('pointerup', function (e) {
      if (x0 === null || shots.length < 2) return;
      var dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 60) show(idx + (dx < 0 ? 1 : -1));
    });
  } else {
    // No <dialog>: the thumbnail buttons simply open the full image.
    $$('[data-lb]').forEach(function (s) {
      s.addEventListener('click', function () { window.open(s.getAttribute('data-lb'), '_blank', 'noopener'); });
    });
  }

  /* ---- offline cache ------------------------------------------------ */
  if ('serviceWorker' in navigator && ROOT) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register(ROOT + 'sw.js')['catch'](function () { /* optional */ });
    });
  }
})();

// Shared by the static guide pages. Load it in <head> (not deferred) so the
// theme is set before first paint.
//
// 1. Theme: same rule as the inline script in index.html and
//    src/context/ThemeContext.tsx (key 'rp-theme-mode', light by default,
//    'system' follows the OS). Switching the theme in the app updates any
//    open guide tab through the storage event.
// 2. Radiance: the Home pattern wash /home and /playground use, rendered by the
//    vendored renderer exactly as RadianceBackground does. The files in
//    public/vendor/radiance/ are never edited; the version for cache busting
//    comes from their manifest, so npm run radiance:update keeps it current.
//    Set data-radiance-hero on <html> to change the hero height (default 440).
(function () {
  var KEY = 'rp-theme-mode';
  var root = document.documentElement;

  function resolveTheme() {
    var mode = 'light';
    try {
      var stored = localStorage.getItem(KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') mode = stored;
    } catch (e) {}
    if (mode === 'system') {
      mode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return mode;
  }

  function applyTheme() {
    var theme = resolveTheme();
    root.setAttribute('data-theme', theme);
    var local = document.querySelector('.g-radiance .radiance-local');
    if (local) {
      local.setAttribute('data-radiance-appearance', theme);
      if (window.RadianceLanguageRenderer) window.RadianceLanguageRenderer.refresh();
    }
  }

  applyTheme();
  window.addEventListener('storage', function (e) { if (e.key === KEY) applyTheme(); });
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) mq.addEventListener('change', applyTheme);
  }

  var VENDOR = '/vendor/radiance/';

  function addFile(file, version) {
    var href = VENDOR + file + (version ? '?v=' + encodeURIComponent(version) : '');
    if (/\.css$/.test(file)) {
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    } else {
      var script = document.createElement('script');
      script.src = href;
      document.head.appendChild(script);
    }
  }

  function mountWash(version) {
    var hero = parseInt(root.getAttribute('data-radiance-hero') || '440', 10);
    var wrap = document.createElement('div');
    wrap.className = 'g-radiance';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.style.setProperty('--radiance-hero-height', hero + 'px');
    wrap.innerHTML =
      '<div class="radiance-home-stage"><div class="radiance-home">' +
      '<div class="radiance-local" data-radiance-pattern="home" data-radiance-appearance="' +
      root.getAttribute('data-theme') + '"></div></div></div>';
    document.body.insertBefore(wrap, document.body.firstChild);
    addFile('radiance-home.css', version);
    addFile('radiance-renderer.js', version);
  }

  function start() {
    fetch(VENDOR + 'manifest.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : {}; })
      .catch(function () { return {}; })
      .then(function (m) { mountWash(m && m.vendorVersion); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();

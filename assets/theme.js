/* Runs before first paint (blocking, in <head>) so the saved theme never flashes. */
(function () {
  var d = document.documentElement;
  d.classList.add('js');
  try {
    var t = localStorage.getItem('kc-theme');
    if (t === 'light' || t === 'dark') d.setAttribute('data-theme', t);
  } catch (e) { /* storage blocked: fall back to the OS preference */ }
})();

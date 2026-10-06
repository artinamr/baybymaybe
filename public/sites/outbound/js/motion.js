(function () {
  'use strict';
  var root = document.documentElement;
  var media = window.matchMedia('(prefers-reduced-motion: reduce)');
  var saved = false;
  try { saved = localStorage.getItem('nerodyn-reduced-motion') === '1'; } catch (e) {}
  var control;
  function update() {
    var reduced = media.matches || saved;
    root.classList.toggle('motion-reduced', reduced);
    if (control) {
      control.textContent = reduced ? 'Animations: Off' : 'Animations: On';
      control.title = media.matches ? 'Animations follow your device preference.' : reduced ? 'Turn visual animations on' : 'Pause visual animations';
      control.setAttribute('aria-checked', String(!reduced));
      control.disabled = media.matches;
    }
    document.dispatchEvent(new CustomEvent('showcase:motion', { detail: { reduced: reduced } }));
  }
  update();
  media.addEventListener('change', update);
  function boot() {
    var footer = document.querySelector('footer');
    if (!footer) return;
    var row = document.createElement('div');
    row.className = 'motion-preference';
    control = document.createElement('button');
    control.type = 'button';
    control.className = 'motion-control';
    control.setAttribute('role', 'switch');
    control.setAttribute('aria-label', 'Visual animations');
    control.addEventListener('click', function () {
      saved = !saved;
      try { localStorage.setItem('nerodyn-reduced-motion', saved ? '1' : '0'); } catch (e) {}
      update();
    });
    row.appendChild(control);
    var base = footer.querySelector('.footer-legal, .foot-base, .footer-bottom');
    (base || footer).appendChild(row);
    update();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

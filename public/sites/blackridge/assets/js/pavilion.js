'use strict';
/* BLACKRIDGE · pavilion study. Site / Structure / Light.
   Composed architectural layers with camera drift and pointer parallax.
   Falls back to the assembled still without JavaScript. */
(function () {
  const stage = document.querySelector('[data-study]');
  if (!stage) return;

  let reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('motion-reduced');
  document.addEventListener('showcase:motion', (e) => { reduced = e.detail.reduced; if (reduced) setCycling(false); });
  const cam = stage.querySelector('.study-cam');
  const layers = {};
  stage.querySelectorAll('img[data-layer]').forEach((img) => { layers[img.dataset.layer] = img; });
  const buttons = [...stage.querySelectorAll('.study-btn')];
  const note = document.querySelector('[data-study-note]');
  const labelEl = stage.querySelector('[data-study-label]');
  const cycleBtn = stage.querySelector('.study-cycle');
  const progress = stage.querySelector('.study-progress');
  const order = ['site', 'structure', 'light'];
  const TICK = 5600;

  const notes = {
    site: 'The pavilion settles on its basalt pad; the screens close to the north-west wind and the ground contours run past it.',
    structure: 'Roof and screens lift away. The glazed core and the timber service box carry the composition.',
    light: 'Assembled again. Low western sun moves across the interior; the hearth holds the room at dusk.',
  };

  let current = 'site';
  let sweepTimer = null;
  let cycling = false;
  let cycleTimer = null;

  const startTick = () => {
    if (!progress) return;
    progress.style.setProperty('--tick', TICK + 'ms');
    progress.classList.remove('run');
    void progress.offsetWidth;
    progress.classList.add('run');
  };
  const stopTick = () => { if (progress) progress.classList.remove('run'); };
  const stepState = () => setState(order[(order.indexOf(current) + 1) % order.length]);

  function setCycling(on) {
    if (on && reduced) on = false;
    cycling = on;
    if (cycleBtn) cycleBtn.setAttribute('aria-pressed', String(on));
    clearInterval(cycleTimer);
    if (on) { startTick(); cycleTimer = setInterval(stepState, TICK); }
    else stopTick();
  }
  if (cycleBtn) cycleBtn.addEventListener('click', () => setCycling(!cycling));

  /* pause the cycle while the study is off screen */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        clearInterval(cycleTimer);
        if (en.isIntersecting && cycling) { startTick(); cycleTimer = setInterval(stepState, TICK); }
        else if (!en.isIntersecting) stopTick();
      });
    }, { threshold: 0.25 }).observe(stage);
  }

  function setState(next) {
    if (!layers[next] || next === current) return;
    current = next;
    stage.dataset.state = next;
    Object.keys(layers).forEach((k) => { layers[k].classList.toggle('is-active', k === next); layers[k].setAttribute('aria-hidden', String(k !== next)); });
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.state === next)));
    if (note) note.textContent = notes[next];
    if (labelEl) labelEl.textContent = next.toUpperCase();
    if (next === 'light' && !reduced) {
      stage.classList.remove('sweep');
      void stage.offsetWidth; // restart animation
      stage.classList.add('sweep');
      clearTimeout(sweepTimer);
      sweepTimer = setTimeout(() => stage.classList.remove('sweep'), 1700);
    }
    if (cycling) { clearInterval(cycleTimer); cycleTimer = setInterval(stepState, TICK); startTick(); }
  }

  buttons.forEach((b) => b.addEventListener('click', () => setState(b.dataset.state)));

  /* keyboard: arrows move through the three states */
  const controls = stage.querySelector('.study-controls');
  if (controls) {
    controls.addEventListener('keydown', (e) => {
      const i = order.indexOf(current);
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const n = order[(i + 1) % order.length];
        setState(n);
        buttons.find((button) => button.dataset.state === n).focus();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const n = order[(i - 1 + order.length) % order.length];
        setState(n);
        buttons.find((button) => button.dataset.state === n).focus();
      } else if (e.key === '1' || e.key === '2' || e.key === '3') {
        const n = order[Number(e.key) - 1];
        setState(n);
        buttons.find((button) => button.dataset.state === n).focus();
      }
    });
  }

  /* pointer parallax · desktop pointers only, never when motion is reduced */
  const fine = window.matchMedia('(pointer: fine)').matches;
  if (fine && !reduced && !stage.classList.contains("photographic-study")) {
    let raf = null;
    stage.addEventListener('pointermove', (e) => {
      if (reduced) return;
      const r = stage.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      const ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        cam.style.setProperty('--px', (nx * 7).toFixed(2));
        cam.style.setProperty('--py', (ny * 5).toFixed(2));
        raf = null;
      });
    });
    stage.addEventListener('pointerleave', () => {
      cam.style.setProperty('--px', '0');
      cam.style.setProperty('--py', '0');
    });
  }
})();

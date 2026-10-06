'use strict';
/* BLACKRIDGE · site behavior. No dependencies. */
(function () {
  const doc = document;
  let reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches || doc.documentElement.classList.contains('motion-reduced');
  doc.addEventListener('showcase:motion', (e) => { reduced = e.detail.reduced; });
  doc.documentElement.classList.add('js');

  /* ---------- header ---------- */
  const head = doc.querySelector('.site-head');
  const onScroll = () => head && head.classList.toggle('scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- hero parallax ---------- */
  const heroMedia = doc.querySelector('.hero-media');
  if (heroMedia && !reduced) {
    let raf = null;
    const par = () => {
      raf = null;
      if (reduced) return;
      const y = Math.min(window.scrollY, window.innerHeight);
      heroMedia.style.transform = 'translateY(' + (y * 0.16).toFixed(1) + 'px)';
    };
    window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(par); }, { passive: true });
  }

  /* ---------- print sheet ---------- */
  doc.querySelectorAll('[data-print]').forEach((el) => {
    el.addEventListener('click', () => window.print());
  });

  /* ---------- mobile nav ---------- */
  const toggle = doc.querySelector('.nav-toggle');
  const nav = doc.querySelector('.site-nav');
  if (toggle && nav) {
    const close = () => {
      toggle.setAttribute('aria-expanded', 'false');
      nav.classList.remove('open');
      doc.body.style.overflow = '';
    };
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('open', open);
      doc.body.style.overflow = open ? 'hidden' : '';
    });
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) close(); });
    doc.addEventListener('keydown', (e) => {
      if (!nav.classList.contains('open')) return;
      if (e.key === 'Escape') { close(); toggle.focus(); }
      if (e.key === 'Tab') {
        const links = [...nav.querySelectorAll('a')];
        const cycle = [...links, toggle];
        const idx = cycle.indexOf(doc.activeElement);
        e.preventDefault(); cycle[(idx + (e.shiftKey ? -1 : 1) + cycle.length) % cycle.length].focus();
      }
    });
    window.matchMedia('(min-width:881px)').addEventListener('change', (e) => { if (e.matches) close(); });
  }

  /* ---------- page curtain ---------- */
  if (!reduced) {
    const curtain = doc.createElement('div');
    curtain.className = 'curtain';
    curtain.setAttribute('aria-hidden', 'true');
    doc.body.appendChild(curtain);
    curtain.addEventListener('animationend', () => curtain.remove());
    setTimeout(() => { if (curtain.parentNode) curtain.remove(); }, 1400);

    doc.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || a.target === '_blank' || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.hasAttribute('download')) return;
      if (url.pathname === location.pathname && url.search === location.search && url.hash) return;
      e.preventDefault();
      doc.body.classList.add('leaving');
      setTimeout(() => { location.href = url.href; }, reduced ? 0 : 430);
    });
  }

  window.addEventListener('pageshow', () => doc.body.classList.remove('leaving'));

  /* ---------- scroll reveals ---------- */
  const toReveal = doc.querySelectorAll('.reveal');
  if (toReveal.length && 'IntersectionObserver' in window && !reduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    toReveal.forEach((el) => io.observe(el));
  } else {
    toReveal.forEach((el) => el.classList.add('in'));
  }

  /* ---------- lightbox ---------- */
  const figures = [...doc.querySelectorAll('figure[data-lb]')];
  if (figures.length) {
    const lb = doc.createElement('div');
    lb.className = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Image viewer');
    lb.innerHTML =
      '<button class="lb-btn lb-close" aria-label="Close (Esc)">&#215;</button>' +
      '<button class="lb-btn lb-prev" aria-label="Previous image">&#8592;</button>' +
      '<button class="lb-btn lb-next" aria-label="Next image">&#8594;</button>' +
      '<figure><img alt=""><figcaption><span class="cap"></span><span class="num"></span></figcaption></figure>';
    doc.body.appendChild(lb);

    const img = lb.querySelector('img');
    const cap = lb.querySelector('.cap');
    const num = lb.querySelector('.num');
    let idx = 0;
    let lastFocus = null;
    let background = [];

    const render = () => {
      const f = figures[idx];
      const source = f.querySelector('img');
      img.src = source.currentSrc || source.src;
      img.alt = source.alt || '';
      cap.textContent = f.dataset.lb || '';
      const credit = f.dataset.credit || '';
      num.textContent = credit ? credit + ' · ' + (idx + 1) + ' / ' + figures.length : (idx + 1) + ' / ' + figures.length;
    };
    const open = (i) => {
      idx = i;
      lastFocus = doc.activeElement;
      render();
      background = [...doc.body.children].filter((el) => el !== lb && !el.inert);
      background.forEach((el) => { el.inert = true; });
      lb.classList.add('open');
      doc.body.style.overflow = 'hidden';
      lb.querySelector('.lb-close').focus();
    };
    const closeLb = () => {
      lb.classList.remove('open');
      doc.body.style.overflow = '';
      img.removeAttribute('src');
      background.forEach((el) => { el.inert = false; });
      background = [];
      if (lastFocus) lastFocus.focus();
    };
    const step = (d) => { idx = (idx + d + figures.length) % figures.length; render(); };

    figures.forEach((f, i) => {
      f.classList.add('lb-capable');
      const media = f.querySelector('.ph');
      if (!media) return;
      media.style.cursor = 'zoom-in';
      media.setAttribute('role', 'button');
      media.setAttribute('tabindex', '0');
      media.setAttribute('aria-label', 'Open image viewer');
      media.addEventListener('click', () => open(i));
      media.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); }
      });
    });

    lb.querySelector('.lb-close').addEventListener('click', closeLb);
    lb.querySelector('.lb-prev').addEventListener('click', () => step(-1));
    lb.querySelector('.lb-next').addEventListener('click', () => step(1));
    lb.addEventListener('click', (e) => { if (e.target === lb) closeLb(); });
    doc.addEventListener('keydown', (e) => {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') closeLb();
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'Tab') {
        const controls = [...lb.querySelectorAll('button')];
        const index = controls.indexOf(doc.activeElement);
        e.preventDefault(); controls[(index + (e.shiftKey ? -1 : 1) + controls.length) % controls.length].focus();
      }
    });
  }

  /* ---------- contact form (local demonstration) ---------- */
  const form = doc.querySelector('#enquiry');
  if (form) {
    const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    const setErr = (input, msg) => {
      const field = input.closest('.field');
      field.classList.toggle('invalid', !!msg);
      const err = field.querySelector('.err');
      if (err) err.textContent = msg || '';
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (err) { err.id = input.id + '-error'; input.setAttribute('aria-describedby', err.id); }
    };
    const validators = {
      name: (v) => (v.trim().length >= 2 ? '' : 'Please tell us your name.'),
      email: (v) => (emailOk(v.trim()) ? '' : 'That email address does not look right.'),
      ptype: (v) => (v ? '' : 'Please choose a project type.'),
      location: (v) => (v.trim().length >= 2 ? '' : 'Where is the project sited?'),
      brief: (v) => (v.trim().length >= 20 ? '' : 'A sentence or two about the project (at least 20 characters).'),
    };
    form.querySelectorAll('input, select, textarea').forEach((input) => {
      input.addEventListener('blur', () => {
        if (validators[input.name]) setErr(input, validators[input.name](input.value));
      });
      input.addEventListener('input', () => {
        if (input.closest('.field').classList.contains('invalid')) setErr(input, validators[input.name](input.value));
      });
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let firstBad = null;
      Object.keys(validators).forEach((name) => {
        const input = form.elements[name];
        const msg = validators[name](input.value);
        setErr(input, msg);
        if (msg && !firstBad) firstBad = input;
      });
      if (firstBad) { firstBad.focus(); return; }
      const success = doc.querySelector('#form-success');
      form.hidden = true;
      success.classList.add('show');
      success.setAttribute('tabindex', '-1');
      success.focus();
      success.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    });
  }

  /* ---------- footer year ---------- */
  doc.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
})();

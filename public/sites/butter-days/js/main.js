/* ==========================================================================
   BUTTER DAYS — SITE BEHAVIOUR
   --------------------------------------------------------------------------
   Everything here is progressive enhancement: every page is complete and
   usable with JavaScript disabled. Sections are independent so a failure in
   one never breaks another.

   1.  Utilities
   2.  Header: navigation, scroll progress, back to top
   3.  Scroll reveals
   4.  Hero parallax
   5.  Opening hours (Pacific/Auckland)
   6.  Menu tabs
   7.  Pastry box builder
   8.  Box -> enquiry handoff
   9.  Demonstration forms
    ========================================================================== */
(function () {
  'use strict';

  /* Mark the document so CSS can enable reveal animations only when they
     can actually run — otherwise content would be stuck at opacity 0. */
  document.documentElement.classList.add('js');

  /* ---------------------------------------------------------------------- *
   * 1. UTILITIES
   * ---------------------------------------------------------------------- */
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  function motionReduced() { return reduceMotion.matches || document.documentElement.classList.contains('motion-reduced'); }

  function money(n) {
    return '$' + n.toFixed(2);
  }

  /* Fill every .js-year with the current year. */
  $$('.js-year').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---------------------------------------------------------------------- *
   * 2. HEADER
   * ---------------------------------------------------------------------- */
  function initHeader() {
    var header = $('.site-header');
    var toggle = $('.nav-toggle');
    var nav = $('.main-nav');
    var progress = $('.scroll-progress-bar');
    var toTop = $('[data-to-top]');

    /* --- mobile navigation --- */
    if (toggle && nav) {
      var setOpen = function (open) {
        nav.classList.toggle('open', open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      };

      toggle.addEventListener('click', function () {
        setOpen(toggle.getAttribute('aria-expanded') !== 'true');
      });

      /* Escape closes and returns focus to the control that opened it. */
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && nav.classList.contains('open')) {
          setOpen(false);
          toggle.focus();
        }
      });

      /* Clicking outside dismisses the panel. */
      document.addEventListener('click', function (e) {
        if (!nav.classList.contains('open')) return;
        if (nav.contains(e.target) || toggle.contains(e.target)) return;
        setOpen(false);
      });

      /* Following a link should never leave the panel open behind it. */
      nav.addEventListener('click', function (e) {
        if (e.target.closest('a')) setOpen(false);
      });

      /* Crossing the breakpoint hides the panel so it cannot get stuck open. */
      window.matchMedia('(min-width: 60.0625rem)').addEventListener('change', function (e) {
        if (e.matches) setOpen(false);
      });
    }

    /* --- scroll progress + header elevation --- */
    var ticking = false;
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var doc = document.documentElement;
        var max = doc.scrollHeight - doc.clientHeight;
        var ratio = max > 0 ? Math.min(doc.scrollTop / max, 1) : 0;
        if (progress) progress.style.setProperty('--progress', ratio.toFixed(4));
        if (header) header.setAttribute('data-scrolled', doc.scrollTop > 8 ? 'true' : 'false');
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    /* --- back to top --- */
    if (toTop) {
      toTop.addEventListener('click', function () {
        window.scrollTo({
          top: 0,
          behavior: motionReduced() ? 'auto' : 'smooth'
        });
        /* Move focus somewhere sensible for keyboard and screen-reader users. */
        var brand = $('.brand');
        if (brand) {
          brand.setAttribute('tabindex', '-1');
          brand.focus({ preventScroll: true });
        }
      });
    }
  }

  /* ---------------------------------------------------------------------- *
   * 3. SCROLL REVEALS
   * ---------------------------------------------------------------------- */
  function initReveals() {
    var items = $$('.reveal, .reveal-l, .reveal-r');
    if (!items.length) return;

    var show = function (el) {
      el.classList.add('in');
    };

    if (!('IntersectionObserver' in window) || motionReduced()) {
      items.forEach(show);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        show(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    items.forEach(function (el) {
      /* Honour an author-supplied stagger without inline styles. */
      var delay = parseInt(el.style.getPropertyValue('--reveal-delay'), 10);
      if (!isNaN(delay)) el.style.setProperty('--reveal-delay', delay + 'ms');
      io.observe(el);
    });
  }

  /* ---------------------------------------------------------------------- *
   * 4. HERO PARALLAX
   * ---------------------------------------------------------------------- */
  function initHeroParallax() {
    var art = $('.hero-art');
    var scene = $('.hero-scene img');
    if (!art || !scene || motionReduced()) return;

    var ticking = false;
    var update = function () {
      if (motionReduced()) return;
      var rect = art.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      /* Normalise the art's position across the viewport to -1..1. */
      var centre = rect.top + rect.height / 2;
      var offset = (window.innerHeight / 2 - centre) / window.innerHeight;
      art.style.setProperty('--hero-shift', (offset * -100).toFixed(1) + 'px');
    };

    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { update(); ticking = false; });
    }, { passive: true });
    update();
  }

  /* ---------------------------------------------------------------------- *
   * 5. OPENING HOURS
   *    Evaluated in Pacific/Auckland regardless of the visitor's timezone.
   * ---------------------------------------------------------------------- */
  var HOURS = {
    /* 0 = Sunday. Minutes from midnight. */
    0: { open: 8 * 60, close: 13 * 60 },   /* Sunday   */
    1: null,                               /* Monday   */
    2: { open: 7 * 60, close: 15 * 60 },   /* Tuesday  */
    3: { open: 7 * 60, close: 15 * 60 },   /* Wednesday*/
    4: { open: 7 * 60, close: 15 * 60 },   /* Thursday */
    5: { open: 7 * 60, close: 15 * 60 },   /* Friday   */
    6: { open: 8 * 60, close: 13 * 60 }    /* Saturday */
  };

  function nzNow() {
    var parts = new Intl.DateTimeFormat('en-NZ', {
      timeZone: 'Pacific/Auckland',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).formatToParts(new Date());

    var get = function (type) {
      var found = parts.find(function (p) { return p.type === type; });
      return found ? found.value : '';
    };

    var dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    var hour = parseInt(get('hour'), 10);
    /* Some engines report midnight as "24"; normalise it. */
    if (hour === 24) hour = 0;

    return {
      day: dayMap[get('weekday')],
      minutes: hour * 60 + parseInt(get('minute'), 10)
    };
  }

  function isOpenNow(now) {
    var today = HOURS[now.day];
    if (!today) return false;
    return now.minutes >= today.open && now.minutes < today.close;
  }

  /* The hours lists group days into ranges such as "Sat - Sun", so match any
     mention of the current day rather than requiring the label to start with it. */
  var DAY_WORDS = {
    0: /\b(sun|sunday)\b/i,
    1: /\b(mon|monday)\b/i,
    2: /\b(tue|tuesday)\b/i,
    3: /\b(wed|wednesday)\b/i,
    4: /\b(thu|thurs|thursday)\b/i,
    5: /\b(fri|friday)\b/i,
    6: /\b(sat|saturday)\b/i
  };

  /* Find the next day we are open, searching forward up to a week. */
  function nextOpening(day, minutes) {
    for (var offset = 0; offset <= 7; offset++) {
      var candidate = (day + offset) % 7;
      var hours = HOURS[candidate];
      if (!hours) continue;
      /* Today only counts if we have not passed closing yet. */
      if (offset === 0 && minutes >= hours.close) continue;
      return { day: candidate, hours: hours, isToday: offset === 0, inDays: offset };
    }
    return null;
  }

  var DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  function openingStatus(now) {
    var today = HOURS[now.day];
    if (today && now.minutes >= today.open && now.minutes < today.close) {
      return 'Open now until ' + formatMinutes(today.close);
    }
    if (!today) {
      return 'Closed today. We rest on Mondays';
    }
    if (now.minutes < today.open) {
      return 'Closed. Opens at ' + formatMinutes(today.open) + ' today';
    }
    var next = nextOpening(now.day, now.minutes);
    if (!next) return 'Closed for the week';
    if (next.inDays === 1) {
      return 'Closed. Opens ' + DAY_NAMES[next.day] + ' at ' + formatMinutes(next.hours.open);
    }
    return 'Closed. Opens ' + DAY_NAMES[next.day] + ' at ' + formatMinutes(next.hours.open);
  }

  function formatMinutes(mins) {
    var h = Math.floor(mins / 60);
    var m = mins % 60;
    var suffix = h >= 12 ? 'pm' : 'am';
    var display = h % 12 === 0 ? 12 : h % 12;
    return display + (m ? ':' + String(m).padStart(2, '0') : '') + suffix;
  }

  function initHours() {
    var now = nzNow();
    var open = isOpenNow(now);
    var today = HOURS[now.day];

    /* Mark today's row in every hours list. Lists either carry the
       `.hours-list` class (visit page, home strip) or the shared footer
       `data-hours-list` attribute — highlight both. */
    var pattern = DAY_WORDS[now.day];
    $$('.hours-list li, [data-hours-list] li').forEach(function (li) {
      var first = li.firstElementChild;
      if (first && pattern.test(first.textContent)) {
        li.setAttribute('data-today', 'true');
      }
    });

    var message = openingStatus(now);

    /* Footer status pill. */
    $$('[data-open-status]').forEach(function (el) {
      el.setAttribute('data-open', open ? 'true' : 'false');
      var text = $('.footer-status-text', el);
      if (text) text.textContent = message;
    });

    /* Standalone badges on the visit page. */
    $$('.open-badge[data-open-status]').forEach(function (el) {
      el.setAttribute('data-open', open ? 'true' : 'false');
      var text = $('.open-badge-text', el) || el;
      text.textContent = message;
    });

    /* aria-live region so the answer is available without sight. */
    $$('[data-hours-live]').forEach(function (el) {
      el.textContent = message;
    });
  }

  /* ---------------------------------------------------------------------- *
   * 6. MENU TABS
   * ---------------------------------------------------------------------- */
  function initMenuTabs() {
    var tablist = $('.menu-tabs');
    if (!tablist) return;

    var tabs = $$('.menu-tab', tablist);
    var panels = $$('.menu-panel');
    var live = $('#menu-live');
    if (!tabs.length || !panels.length) return;

    function activate(tab, moveFocus, updateHash) {
      tabs.forEach(function (t) {
        var selected = t === tab;
        t.setAttribute('aria-selected', selected ? 'true' : 'false');
        t.tabIndex = selected ? 0 : -1;
      });

      panels.forEach(function (p) {
        var active = p.id === tab.getAttribute('data-tab');
        p.hidden = !active;
        if (active) {
          /* Restart the entrance animation on every switch. */
          p.style.animation = 'none';
          void p.offsetWidth;
          p.style.animation = '';
        }
      });

      if (live) live.textContent = 'Showing the ' + tab.textContent.trim() + ' menu.';
      if (moveFocus) tab.focus();
      if (updateHash) { try { history.replaceState(null, "", "#" + tab.getAttribute("data-tab")); } catch (_) {} }
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { activate(tab, false, true); });

      tab.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
        else if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === 'Home') next = tabs[0];
        else if (e.key === 'End') next = tabs[tabs.length - 1];
        if (!next) return;
        e.preventDefault();
        activate(next, true, true);
      });
    });

    /* Deep links such as menu.html#tab-cakes open the matching tab. */
    function applyHash(scroll) {
      var wanted = window.location.hash.replace('#', '');
      if (!wanted) return false;
      var match = tabs.find(function (t) { return t.getAttribute('data-tab') === wanted; });
      if (!match) return false;
      activate(match, false);
      if (scroll) {
        /* Images and fonts above us are still settling when the script first
           runs, so the layout height keeps changing for a moment. Scroll now
           for instant feedback, then confirm on the next two frames and once
           more after images finish loading, so the tabs really end up at the
           top of the viewport instead of a moving target. */
        var anchor = document.getElementById('menu-top');
        if (!anchor) return true;
        var scrollToTabs = function () {
          anchor.scrollIntoView({ behavior: motionReduced() ? 'auto' : 'smooth', block: 'start' });
        };
        scrollToTabs();
        requestAnimationFrame(function () { requestAnimationFrame(scrollToTabs); });
        window.addEventListener('load', scrollToTabs, { once: true });
      }
      return true;
    }

    applyHash(true);
    window.addEventListener('hashchange', function () { applyHash(false); });
  }

  /* ---------------------------------------------------------------------- *
   * 7. PASTRY BOX BUILDER
   * ---------------------------------------------------------------------- */
  var PASTRIES = [
    { id: 'almond-croissant',   name: 'Almond croissant',         price: 7.5,  img: 'assets/img/pastry-almond-croissant.svg' },
    { id: 'cinnamon-knot',      name: 'Cinnamon knot',            price: 6.5,  img: 'assets/img/pastry-cinnamon-knot.svg' },
    { id: 'pain-au-chocolat',  name: 'Pain au chocolat',        price: 6.0,  img: 'assets/img/pastry-pain-au-chocolat.svg' },
    { id: 'lemon-morning-bun', name: 'Lemon morning bun',       price: 6.5,  img: 'assets/img/pastry-lemon-morning-bun.svg' },
    { id: 'fruit-danish',      name: 'Pear and almond Danish',  price: 6.5,  img: 'assets/img/pastry-fruit-danish.svg' },
    { id: 'cheddar-scroll',    name: 'Cheddar and chive scroll', price: 7.0,  img: 'assets/img/pastry-cheddar-scroll.svg' }
  ];
  var BOX_MAX = 6;
  var BOX_STORAGE_KEY = 'butterdays-box';

  /* Three columns by two rows, comfortably inside the drawn box. */
  var SLOT_X = [89, 200, 311];
  var SLOT_Y = [156, 232];
  var SLOT_R = 36;

  function pastryById(id) {
    for (var i = 0; i < PASTRIES.length; i++) {
      if (PASTRIES[i].id === id) return PASTRIES[i];
    }
    return null;
  }

  function describeBox(order) {
    if (!order.length) return '';
    var lines = [];
    PASTRIES.forEach(function (p) {
      var count = order.filter(function (q) { return q.id === p.id; }).length;
      if (count) lines.push(count + ' \u00D7 ' + p.name);
    });
    var total = order.reduce(function (sum, p) { return sum + p.price; }, 0);
    return lines.join(', ') + ' (illustrative total ' + money(total) + ')';
  }

  function loadBox() {
    try {
      var raw = window.sessionStorage.getItem(BOX_STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw)
        .map(pastryById)
        .filter(Boolean)
        .slice(0, BOX_MAX);
    } catch (err) {
      return [];
    }
  }

  function saveBox(order) {
    try {
      window.sessionStorage.setItem(
        BOX_STORAGE_KEY,
        JSON.stringify(order.map(function (p) { return p.id; }))
      );
    } catch (err) {
      /* Storage may be blocked; the builder still works for this page. */
    }
  }

  function initBox() {
    var section = $('#saturday-box');
    if (!section) return null;

    var tilesWrap = $('#box-tiles');
    var slotsGroup = $('#box-slots');
    var countEl = $('#box-count');
    var priceEl = $('#box-price');
    var chipsWrap = $('#box-chips');
    var resetBtn = $('#box-reset');
    var enquireBtn = $('#box-enquire');
    var noteEl = $('#box-limit-note');

    var order = loadBox();

    function renderSlots() {
      if (!slotsGroup) return;
      var markup = '';
      for (var i = 0; i < BOX_MAX; i++) {
        var cx = SLOT_X[i % SLOT_X.length];
        var cy = SLOT_Y[Math.floor(i / SLOT_X.length)];
        var pastry = order[i];

        markup += '<circle cx="' + cx + '" cy="' + cy + '" r="' + SLOT_R +
          '" fill="#FBF3E7" stroke="rgba(70,40,26,.28)" stroke-width="3" stroke-dasharray="6 7"/>';

        if (pastry) {
          var size = SLOT_R * 2;
          markup += '<clipPath id="slot-clip-' + i + '"><circle cx="' + cx + '" cy="' + cy + '" r="' + SLOT_R + '"/></clipPath>' +
            '<g clip-path="url(#slot-clip-' + i + ')">' +
            '<image href="' + pastry.img + '" x="' + (cx - SLOT_R) + '" y="' + (cy - SLOT_R) +
            '" width="' + size + '" height="' + size + '" preserveAspectRatio="xMidYMid slice"/>' +
            '</g>' +
            '<circle cx="' + cx + '" cy="' + cy + '" r="' + SLOT_R +
            '" fill="none" stroke="#A63F35" stroke-width="4"/>';
        }
      }
      slotsGroup.innerHTML = markup;
    }

    function countOf(id) {
      return order.filter(function (p) { return p.id === id; }).length;
    }

    function renderTiles() {
      if (!tilesWrap) return;
      $$('.pastry-tile', tilesWrap).forEach(function (tile) {
        var count = countOf(tile.getAttribute('data-pastry'));
        tile.setAttribute('aria-pressed', count > 0 ? 'true' : 'false');
        var counter = $('.pt-count', tile);
        if (counter) counter.textContent = '\u00D7' + count;
      });
    }

    function renderChips() {
      if (!chipsWrap) return;
      chipsWrap.innerHTML = '';

      /* One chip per distinct pastry, with a stepper for multiples. */
      PASTRIES.forEach(function (pastry) {
        var count = countOf(pastry.id);
        if (!count) return;

        var chip = document.createElement('span');
        chip.className = 'box-chip';

        var img = document.createElement('img');
        img.src = pastry.img;
        img.alt = '';
        chip.appendChild(img);

        var label = document.createElement('span');
        label.textContent = pastry.name + ' \u00D7' + count;
        chip.appendChild(label);

        var remove = document.createElement('button');
        remove.type = 'button';
        remove.innerHTML = '&times;';
        remove.setAttribute(
          'aria-label',
          'Remove ' + (count > 1 ? 'one ' : '') + pastry.name
        );
        remove.addEventListener('click', function () {
          for (var i = order.length - 1; i >= 0; i--) {
            if (order[i].id === pastry.id) { order.splice(i, 1); break; }
          }
          render();
          var replacement = $('button[aria-label="Remove ' + (count > 2 ? 'one ' : '') + pastry.name + '"]', chipsWrap);
          if (replacement) replacement.focus();
          else { var tile = $('[data-pastry="' + pastry.id + '"]', tilesWrap); if (tile) tile.focus(); }
        });
        chip.appendChild(remove);

        chipsWrap.appendChild(chip);
      });
    }

    function render() {
      saveBox(order);

      var count = order.length;
      var total = order.reduce(function (sum, p) { return sum + p.price; }, 0);

      if (countEl) countEl.innerHTML = count + ' <small>/ ' + BOX_MAX + ' selected</small>';
      if (priceEl) priceEl.textContent = money(total);

      if (noteEl) {
        if (count === 0) {
          noteEl.textContent = 'Choose a pastry to add it to your box. Select it again to add another.';
          noteEl.classList.remove('box-full');
        } else if (count < BOX_MAX) {
          noteEl.textContent = 'Room for ' + (BOX_MAX - count) + ' more.';
          noteEl.classList.remove('box-full');
        } else {
          noteEl.textContent = 'Your box is full \u2014 a lovely selection!';
          noteEl.classList.add('box-full');
        }
      }

      if (enquireBtn) enquireBtn.disabled = count === 0;
      if (resetBtn) resetBtn.disabled = count === 0;

      renderSlots();
      renderTiles();
      renderChips();
      var summary = $('#box-summary-field');
      if (summary) summary.value = describeBox(order);
    }

    function add(id) {
      var pastry = pastryById(id);
      if (!pastry) return false;

      if (order.length >= BOX_MAX) {
        if (noteEl) {
          noteEl.textContent = 'The box holds six pastries. Remove one to make a change.';
          noteEl.classList.add('box-full');
        }
        return false;
      }

      order.push(pastry);
      render();
      return true;
    }

    if (tilesWrap) {
      /* The tiles are real buttons, so click alone covers pointer, Enter
         and Space. Adding a keydown handler here would double-fire. */
      tilesWrap.addEventListener('click', function (e) {
        var tile = e.target.closest('.pastry-tile');
        if (tile) add(tile.getAttribute('data-pastry'));
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        order = [];
        render();
        var first = $('.pastry-tile', tilesWrap);
        if (first) first.focus();
      });
    }

    render();

    return {
      add: add,
      reset: function () { order = []; render(); },
      summary: function () { return describeBox(order); }
    };
  }

  /* ---------------------------------------------------------------------- *
   * 8. BOX -> ENQUIRY HANDOFF
   * ---------------------------------------------------------------------- */
  function initBoxEnquiry(box) {
    var enquireBtn = $('#box-enquire');
    if (!enquireBtn) return;

    enquireBtn.addEventListener('click', function () {
      var summary = box ? box.summary() : describeBox(loadBox());
      if (!summary) return;

      var field = $('#box-summary-field');
      if (field) field.value = summary;

      var target = $('#box-enquiry-form') || $('#contact-form');
      if (!target) return;

      target.scrollIntoView({
        behavior: motionReduced() ? 'auto' : 'smooth',
        block: 'start'
      });

      setTimeout(function () {
        var name = $('[name="name"]', target);
        if (name) name.focus({ preventScroll: true });
      }, motionReduced() ? 0 : 650);
    });
  }

  /* Mirror a box built on the home page into the contact form elsewhere. */
  function initBoxEcho() {
    if ($('#saturday-box')) return;

    var field = $('#box-summary-field');
    if (!field || field.value) return;

    var order = loadBox();
    if (!order.length) return;

    field.value = describeBox(order);
  }

  /* ---------------------------------------------------------------------- *
   * 9. DEMONSTRATION FORMS
   * ---------------------------------------------------------------------- */
  function fieldMessage(field) {
    if (field.validity.customError) return field.validationMessage;
    if (field.validity.valueMissing) return 'This field is required.';
    if (field.validity.typeMismatch) return 'Please check this value \u2014 it looks incomplete.';
    if (field.validity.rangeUnderflow) return 'That value is below the minimum we accept.';
    if (field.validity.rangeOverflow) return 'That value is above the maximum we accept.';
    if (field.validity.tooShort) return 'Please add a little more detail.';
    return 'Please check this field.';
  }

  function describeField(field) {
    var label = field.closest('.field');
    var caption = label ? $('label', label) : null;
    return caption ? caption.textContent.replace('*', '').trim() : 'This field';
  }

  function showFieldError(field) {
    var message = fieldMessage(field);
    field.classList.add('field-error');
    field.setAttribute('aria-invalid', 'true');

    /* A visible, announced message \u2014 colour alone is not enough. */
    var wrapper = field.closest('.field');
    var node = wrapper ? $('.field-error-msg', wrapper) : null;
    if (!node && wrapper) {
      node = document.createElement('p');
      node.className = 'field-error-msg';
      node.id = field.id + '-error';
      wrapper.appendChild(node);
    }
    if (node) {
      node.id = node.id || field.id + '-error';
      node.textContent = describeField(field) + ': ' +
        message.charAt(0).toLowerCase() + message.slice(1);
      node.classList.add('show');
      field.setAttribute('aria-describedby', node.id);
    }
  }

  function clearFieldError(field) {
    field.classList.remove('field-error');
    field.removeAttribute('aria-invalid');
    var wrapper = field.closest('.field');
    var node = wrapper ? $('.field-error-msg', wrapper) : null;
    if (node) {
      node.classList.remove('show');
      node.textContent = '';
      field.removeAttribute('aria-describedby');
    }
  }

  function initForms(box) {
    $$('form.demo-form').forEach(function (form) {
      var loader = $('.rolling-loader', form);
      var status = $('.form-status', form);

      var messages = {
        'cake-enquiry': 'This is a demonstration website. Your enquiry was noted locally; nothing was sent and no date was reserved.',
        'box-enquiry-form': 'This is a demonstration website. Your box enquiry was noted locally; nothing was sent and no pastries were reserved.',
        'contact-form': 'This is a demonstration website. Your message stayed in this browser and was not sent to the bakery.'
      };

      var submit = $('[type="submit"]', form);
      var submitting = false;
      var dateField = $('input[type="date"]', form);
      if (dateField) {
        var parts = new Intl.DateTimeFormat('en-CA', {timeZone:'Pacific/Auckland',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
        function part(t) { return parts.find(function(p) { return p.type === t; }).value; }
        var minimum = new Date(Date.UTC(Number(part('year')), Number(part('month')) - 1, Number(part('day')) + (form.id === 'cake-enquiry' ? 2 : 0)));
        dateField.min = minimum.toISOString().slice(0,10);
      }
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (submitting) return;
        if (form.id === 'box-enquiry-form' && box && !box.summary()) {
          if (status) { status.textContent = 'Choose at least one pastry for your box first.'; status.classList.add('show'); }
          var firstPastry = $('.pastry-tile');
          if (firstPastry) firstPastry.focus();
          return;
        }

        var fields = $$('[required]', form);
        var firstInvalid = null;

        fields.forEach(function (field) {
          /* Native validation messages read oddly alongside our own copy. */
          if (typeof field.setCustomValidity === 'function') field.setCustomValidity('');
          if (typeof field.value === 'string' && !field.value.trim() && field.type !== 'checkbox') field.setCustomValidity('Please enter a value.');
          if (field.checkValidity()) {
            clearFieldError(field);
          } else {
            showFieldError(field);
            if (!firstInvalid) firstInvalid = field;
          }
        });

        if (firstInvalid) {
          firstInvalid.focus();
          if (status) {
            status.textContent = 'Please correct the highlighted fields and try again.';
            status.classList.add('show');
          }
          return;
        }

        submitting = true;
        if (submit) submit.disabled = true;
        form.setAttribute('aria-busy', 'true');
        if (loader) loader.classList.add('on');
        if (status) status.classList.remove('show');

        setTimeout(function () {
          submitting = false;
          if (submit) submit.disabled = false;
          form.removeAttribute('aria-busy');
          if (loader) loader.classList.remove('on');

          var nameField = $('[name="name"]', form);
          var firstName = nameField && nameField.value.trim()
            ? nameField.value.trim().split(/\s+/)[0]
            : '';

          if (status) {
            status.innerHTML = '';
            var strong = document.createElement('strong');
            strong.textContent = firstName ? 'Thank you, ' + firstName + '.' : 'Thank you.';
            var body = document.createElement('span');
            body.textContent = ' ' + (messages[form.id] ||
              'This is a demonstration website. Nothing was sent.');
            status.appendChild(strong);
            status.appendChild(body);
            status.classList.add('show');
            status.focus({ preventScroll: true });
          }

          form.reset();
          fields.forEach(clearFieldError);
          var summary = $('#box-summary-field', form);
          if (summary) summary.value = box ? box.summary() : describeBox(loadBox());
          $$('.field-error-msg', form).forEach(function (n) {
            n.classList.remove('show');
            n.textContent = '';
          });
        }, motionReduced() ? 0 : 900);
      });

      /* Clear an error as soon as the field becomes valid. */
      form.addEventListener('input', function (e) {
        var field = e.target;
        if (!field.matches || !field.matches('[required]')) return;
        field.setCustomValidity('');
        if (field.classList.contains('field-error') && field.value.trim() && field.checkValidity()) {
          clearFieldError(field);
        }
      });
    });
  }

  /* ---------------------------------------------------------------------- *
   * BOOT
   * ---------------------------------------------------------------------- */
  function boot() {
    initHeader();
    initReveals();
    initHeroParallax();
    initHours();
    initMenuTabs();
    var box = initBox();
    initBoxEnquiry(box);
    initBoxEcho();
    initForms(box);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

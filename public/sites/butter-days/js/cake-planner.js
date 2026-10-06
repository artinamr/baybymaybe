(function () {
  'use strict';
  var planner = document.querySelector('[data-cake-planner]');
  if (!planner) return;
  var guests = planner.querySelector('#planner-guests');
  var portion = planner.querySelector('#planner-portion');
  var count = planner.querySelector('[data-guest-count]');
  var title = planner.querySelector('[data-cake-title]');
  var detail = planner.querySelector('[data-cake-detail]');
  var scale = planner.querySelector('[data-cake-scale]');
  var handoff = planner.querySelector('[data-cake-handoff]');
  var recommendation;

  function update() {
    var n = Number(guests.value);
    var dessert = portion.value === 'dessert';
    if (n <= 15) recommendation = { name: 'The little celebration', detail: dessert ? 'A 20cm single-tier cake, cut into generous dessert portions.' : 'A 15cm single-tier cake, cut into smaller finger portions.', scale: 'small' };
    else if (n <= 30) recommendation = { name: 'The Statement', detail: dessert ? 'A 20cm celebration cake with 12 cupcakes alongside.' : 'A tall 15cm celebration cake, cut into finger portions.', scale: 'medium' };
    else if (n <= 45) recommendation = { name: 'A two-tier occasion', detail: dessert ? '20cm and 15cm tiers with tartlets to share.' : '20cm and 15cm tiers, cut into finger portions.', scale: 'large' };
    else if (n <= 60) recommendation = { name: 'The Wedding Quiet', detail: dessert ? 'Three tiers with a small dessert table alongside.' : '20cm and 15cm tiers with a soft buttercream finish.', scale: 'large' };
    else recommendation = { name: 'A table full of good things', detail: 'A two-tier centrepiece with a full dessert table. A larger gathering deserves a plan made just for it.', scale: 'feast' };
    count.textContent = n + ' guests';
    guests.setAttribute('aria-valuetext', n + ' guests');
    title.textContent = recommendation.name;
    detail.textContent = recommendation.detail;
    scale.dataset.size = recommendation.scale;
  }

  guests.addEventListener('input', update);
  portion.addEventListener('change', update);
  handoff.addEventListener('click', function () {
    var form = document.querySelector('#cake-enquiry');
    var field = document.querySelector('#ce-guests');
    var notes = document.querySelector('#ce-notes');
    if (!form || !field) return;
    field.value = guests.value;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    if (notes) {
      // Replace only our own prior planner line, preserving what the visitor wrote.
      var lines = notes.value.split('\n').filter(function (line) { return line.indexOf('Serving planner: ') !== 0; });
      lines.push('Serving planner: ' + guests.value + ' guests; ' + portion.options[portion.selectedIndex].text + '; ' + recommendation.name + '.');
      notes.value = lines.filter(Boolean).join('\n');
    }
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('motion-reduced');
    form.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    var name = document.querySelector('#ce-name');
    if (name) name.focus({ preventScroll: true });
  });
  update();
})();

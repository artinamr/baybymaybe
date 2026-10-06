/* ============================================================
   OUTBOUND — interactive New Zealand route map
   Pins, tabs and summary card stay in sync. Keyboard accessible.
   Honours prefers-reduced-motion (paths draw instantly).
   ============================================================ */
(function () {
  "use strict";

  function initMap(root) {
    var pins = Array.prototype.slice.call(root.querySelectorAll(".map-pin"));
    var tabs = Array.prototype.slice.call(root.querySelectorAll("[data-map-tab]"));
    var panel = root.querySelector("[data-map-panel]");
    if (!pins.length || !panel) return;

    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var cardMedia = panel.querySelector("[data-card-media]");
    var cardMediaImg = panel.querySelector("[data-card-media] img");
    var cardTitle = panel.querySelector("[data-card-title]");
    var cardKicker = panel.querySelector("[data-card-kicker]");
    var cardDesc = panel.querySelector("[data-card-desc]");
    var cardLink = panel.querySelector("[data-card-link]");
    var cardPrice = panel.querySelector("[data-card-price]");
    var cardChips = panel.querySelector("[data-card-chips]");

    var swapTimer;
    function fadeSwap(fn) {
      window.clearTimeout(swapTimer);
      if (reduce) { fn(); return; }
      panel.classList.add("swapping");
      swapTimer = window.setTimeout(function () {
        fn();
        panel.classList.remove("swapping");
      }, 230);
    }

    function activate(id, focusPin) {
      var pin = root.querySelector('.map-pin[data-key="' + id + '"]');
      if (!pin) return;

      var d = pin.dataset;

      pins.forEach(function (p) {
        var on = p === pin;
        p.classList.toggle("active", on);
        p.setAttribute("aria-pressed", on ? "true" : "false");
      });

      /* dim the other routes so the active line reads instantly */
      root.querySelectorAll(".route-path").forEach(function (rp) {
        rp.classList.toggle("active", rp.dataset.route === id);
      });

      /* card header takes the route's own colour */
      var head = panel.querySelector("[data-card-head]");
      if (head && d.accent) head.style.background = d.accent;

      tabs.forEach(function (t) {
        var on = t.dataset.mapTab === id;
        t.setAttribute("aria-pressed", on ? "true" : "false");
      });

      fadeSwap(function () {
        if (cardMediaImg) {
          cardMediaImg.src = d.img;
          cardMediaImg.alt = d.imgalt;
        }
        if (cardTitle) cardTitle.textContent = d.title;
        if (cardKicker) cardKicker.textContent = d.kicker;
        if (cardDesc) cardDesc.textContent = d.desc;
        if (cardLink) cardLink.setAttribute("href", d.href);
        if (cardPrice) cardPrice.childNodes[0].nodeValue = d.price;
        if (cardChips) {
          cardChips.innerHTML = "";
          String(d.chips).split("|").forEach(function (c) {
            if (!c) return;
            var s = document.createElement("span");
            s.className = "chip";
            s.textContent = c;
            cardChips.appendChild(s);
          });
        }
      });

      if (focusPin) pin.focus({ preventScroll: true });
    }

    pins.forEach(function (pin) {
      pin.addEventListener("click", function () { activate(pin.dataset.key, false); });
      pin.addEventListener("keydown", function (e) {
        var i = pins.indexOf(pin);
        if (e.key === "ArrowDown" || e.key === "ArrowRight") {
          e.preventDefault();
          pins[(i + 1) % pins.length].focus();
        } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
          e.preventDefault();
          pins[(i - 1 + pins.length) % pins.length].focus();
        } else if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          activate(pin.dataset.key, false);
        }
      });
    });

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () { activate(tab.dataset.mapTab, false); });
    });

    tabs.forEach(function(tab, index) {
      tab.addEventListener('keydown', function(e) {
        var n = index;
        if (e.key === 'ArrowRight') n = (index + 1) % tabs.length;
        else if (e.key === 'ArrowLeft') n = (index - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') n = 0;
        else if (e.key === 'End') n = tabs.length - 1;
        else return;
        e.preventDefault(); activate(tabs[n].dataset.mapTab, false); tabs[n].focus();
      });
    });
    /* draw-in on first reveal */
    var paths = Array.prototype.slice.call(root.querySelectorAll(".route-path"));
    if (paths.length && "IntersectionObserver" in window && !reduce) {
      var drawn = false;
      function drawPaths() {
        if (drawn) return;
        drawn = true;
        paths.forEach(function (p, i) {
          p.style.transition = "stroke-dashoffset 1.6s cubic-bezier(.16,1,.3,1) " + (i * 0.15) + "s";
          p.style.strokeDashoffset = "0";
          window.setTimeout(function () {
            p.style.strokeDasharray = "";
            p.style.strokeDashoffset = "";
            p.style.transition = "";
          }, 2200 + i * 150);
        });
      }
      /* Safety net for embedded webviews where IntersectionObserver may
         starve: show routes statically rather than leaving them hidden. */
      window.setTimeout(drawPaths, 3000);
      paths.forEach(function (p) {
        var len = p.getTotalLength();
        p.style.strokeDasharray = String(len);
        p.style.strokeDashoffset = String(len);
        p.style.opacity = "1";
      });
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          drawPaths();
          io.disconnect();
        });
      }, { threshold: 0.35 });
      io.observe(root.querySelector(".map-frame") || root);
    }

    var initial = root.dataset.mapInitial || pins[0].dataset.key;
    activate(initial, false);
  }

  function boot() {
    document.querySelectorAll("[data-map]").forEach(initMap);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

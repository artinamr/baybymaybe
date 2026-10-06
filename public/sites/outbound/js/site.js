/* ============================================================
   OUTBOUND — shared site JS
   Nav, reveal-on-scroll, form validation + demo confirmation,
   adventure filters with strong empty state, URL preselect.
   No dependencies. Honours prefers-reduced-motion.
   ============================================================ */
(function () {
  "use strict";

  var mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  document.documentElement.classList.add("js");

  /* ---------------- mobile nav ---------------- */
  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.getElementById("main-nav");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });

    document.addEventListener('click', function (e) {
      if (!nav.contains(e.target) && !toggle.contains(e.target)) { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
    });
    window.matchMedia('(min-width:901px)').addEventListener('change', function (e) {
      if (e.matches) { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------------- article reading progress ---------------- */
  function initProgress() {
    var bar = document.querySelector("[data-progress]");
    var article = document.querySelector("[data-article]");
    if (!bar || !article) return;
    var roleEl = bar.closest('[role="progressbar"]') || bar.parentElement;

    function update() {
      var rect = article.getBoundingClientRect();
      var total = rect.height - window.innerHeight;
      var done = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : (rect.top < 0 ? 1 : 0);
      bar.style.transform = "scaleX(" + done.toFixed(3) + ")";
      roleEl.setAttribute("aria-valuenow", String(Math.round(done * 100)));
    }
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ---------------- word-slam headline animation ---------------- */
  /* Wraps each word of [data-slam] in a span so it can fly in from below.
     Split at load, so it degrades to normal text without JS. */
  function initSlam() {
    var nodes = document.querySelectorAll("[data-slam]");
    if (!nodes.length) return;

    if (mqReduce.matches) {
      nodes.forEach(function (el) { el.classList.add("slam-in"); });
      return;
    }

    nodes.forEach(function (el) {
      var outlined = !!el.querySelector(".stroke");
      var words = (el.textContent || "").trim().split(/\s+/);
      el.textContent = "";
      var line = document.createElement("span");
      line.className = "slam-words";
      words.forEach(function (w, i) {
        var span = document.createElement("span");
        span.className = "rv-word" + (outlined ? " stroke" : "");
        span.textContent = w;
        line.appendChild(span);
        if (i < words.length - 1) line.appendChild(document.createTextNode(" "));
      });
      el.appendChild(line);
      el.setAttribute("data-slam-ready", "true");
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("slam-in");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.2 });
    nodes.forEach(function (el) { io.observe(el); });

    /* same starvation guard as the reveal system */
    var pendingSlam = Array.prototype.slice.call(nodes);
    var last = 0;
    function sweepSlam() {
      if (!pendingSlam.length) return;
      var limit = window.innerHeight * 0.94;
      pendingSlam = pendingSlam.filter(function (el) {
        if (el.getBoundingClientRect().top < limit) {
          el.classList.add("slam-in");
          return false;
        }
        return true;
      });
    }
    window.addEventListener("scroll", function () {
      var now = Date.now();
      if (now - last < 120) return;
      last = now;
      sweepSlam();
    }, { passive: true });
    sweepSlam();
  }

  /* ---------------- packing checklist ---------------- */
  function initChecklist() {
    var lists = document.querySelectorAll("[data-checklist]");
    if (!lists.length) return;

    lists.forEach(function (list) {
      var wrap = list.closest("[data-checklist-wrap]") || list.parentElement;
      var bar = wrap.querySelector(".pack-progress .bar i");
      var label = wrap.querySelector(".pack-progress .count");
      var boxes = Array.prototype.slice.call(list.querySelectorAll("input[type=checkbox]"));

      function update() {
        var done = boxes.filter(function (b) { return b.checked; }).length;
        if (bar) bar.style.width = (boxes.length ? (done / boxes.length) * 100 : 0) + "%";
        if (label) {
          label.textContent = done + " / " + boxes.length + " packed";
        }
      }

      boxes.forEach(function (b) {
        b.addEventListener("change", update);
      });
      update();
    });
  }

  /* ---------------- reveal on scroll ---------------- */
  function initReveals() {
    var items = document.querySelectorAll(".rv, .rv-line, .rv-img");
    if (!items.length) return;

    if (mqReduce.matches || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("rv-in"); });
      return;
    }

    /* Safety net: some embedded/preview webviews starve IntersectionObserver
       callbacks, which would leave clip-path reveals stuck invisible. A cheap
       scroll sweep reveals anything that has entered the viewport, so content
       can never stay hidden. IO remains the primary trigger. */
    var pending = Array.prototype.slice.call(items);

    function sweep() {
      if (!pending.length) return;
      var limit = window.innerHeight * 0.94;
      pending = pending.filter(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < limit) {
          el.classList.add("rv-in");
          return false;
        }
        return true;
      });
    }

    var lastSweep = 0;
    window.addEventListener("scroll", function () {
      var now = Date.now();
      if (now - lastSweep < 120) return;
      lastSweep = now;
      sweep();
    }, { passive: true });
    window.addEventListener("resize", sweep);
    sweep();

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("rv-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------------- adventure filter ---------------- */
  function initFilters() {
    var bar = document.querySelector("[data-filter-bar]");
    if (!bar) return;

    var regionBtns = Array.prototype.slice.call(bar.querySelectorAll("[data-region]"));
    var diffBtns = Array.prototype.slice.call(bar.querySelectorAll("[data-difficulty]"));
    var cards = Array.prototype.slice.call(document.querySelectorAll(".adv-card, .adv-block"));
    var countEl = document.querySelector("[data-filter-count]");
    var emptyEl = document.querySelector(".filter-empty");
    var resetBtns = Array.prototype.slice.call(document.querySelectorAll("[data-filter-reset]"));

    var state = { region: "all", difficulty: "all" };

    function apply() {
      var visible = 0;
      cards.forEach(function (card) {
        var matchRegion = state.region === "all" || card.dataset.region === state.region;
        var matchDiff = state.difficulty === "all" || card.dataset.difficulty === state.difficulty;
        var show = matchRegion && matchDiff;
        card.classList.toggle("hide", !show);
        if (show) {
          visible++;
          card.classList.remove("enter");
          void card.offsetWidth; /* restart animation */
          card.classList.add("enter");
        }
        card.setAttribute("aria-hidden", show ? "false" : "true");
      });

      if (countEl) {
        countEl.innerHTML = "<b>" + visible + "</b> trip" + (visible === 1 ? "" : "s") + " shown";
      }

      if (emptyEl) {
        emptyEl.classList.toggle("show", visible === 0);
        if (visible === 0) {
          var msg = emptyEl.querySelector("[data-empty-msg]");
          if (msg) {
            msg.textContent =
              "No " +
              (state.difficulty === "all" ? "" : state.difficulty + "-grade ") +
              "trips in " +
              (state.region === "all" ? "" : regionName(state.region)) +
              " this season. Reset the filters, or write to us and we'll design something around your dates.";
          }
        }
      }
    }

    function regionName(slug) {
      return { otago: "Otago", nelson: "Nelson / Tasman", canterbury: "Canterbury" }[slug] || slug;
    }

    function bind(btns, key) {
      btns.forEach(function (btn) {
        btn.addEventListener("click", function () {
          state[key] = btn.dataset[key === "region" ? "region" : "difficulty"];
          btns.forEach(function (b) {
            b.setAttribute("aria-pressed", b === btn ? "true" : "false");
          });
          apply();
        });
      });
    }
    bind(regionBtns, "region");
    bind(diffBtns, "difficulty");

    resetBtns.forEach(function (resetBtn) {
      resetBtn.addEventListener("click", function () {
        state.region = "all";
        state.difficulty = "all";
        regionBtns.concat(diffBtns).forEach(function (b) {
          b.setAttribute("aria-pressed", b.dataset.region === "all" || b.dataset.difficulty === "all" ? "true" : "false");
        });
        apply();
      });
    });

    apply();
  }

  /* ---------------- enquiry form ---------------- */
  function initEnquiryForm() {
    var form = document.querySelector("[data-enquiry-form]");
    if (!form) return;

    var status = document.querySelector("[data-form-status]");
    var parts = new Intl.DateTimeFormat('en-CA', {timeZone:'Pacific/Auckland',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
    function datePart(type) { return parts.find(function(p) { return p.type === type; }).value; }
    var today = datePart('year') + '-' + datePart('month') + '-' + datePart('day');
    form.elements.date.min = today;
    form.querySelectorAll('.field[data-field]').forEach(function(field) {
      var input = field.querySelector('input, select, textarea');
      var error = field.querySelector('.error-msg');
      if (input && error) { error.id = input.id + '-error'; input.setAttribute('aria-describedby', error.id); }
    });
    var statusTitle = status ? status.querySelector("[data-status-title]") : null;
    var statusMsg = status ? status.querySelector("[data-status-msg]") : null;

    function setError(name, on) {
      var field = form.querySelector('[data-field="' + name + '"]');
      if (field) field.classList.toggle("invalid", on);
      var input = form.elements[name];
      if (input) input.setAttribute("aria-invalid", on ? "true" : "false");
    }

    function validate() {
      var ok = true;
      var firstBad = null;

      var party = form.elements.party.value;
      if (!/^[1-9][0-9]*$/.test(party) || +party < 1 || +party > 12) {
        setError("party", true); ok = false; firstBad = firstBad || form.elements.party;
      } else setError("party", false);

      var date = form.elements.date.value;
      if (!date || date < today) { setError("date", true); ok = false; firstBad = firstBad || form.elements.date; }
      else setError("date", false);

      var name = form.elements.name.value.trim();
      if (name.length < 2) { setError("name", true); ok = false; firstBad = firstBad || form.elements.name; }
      else setError("name", false);

      var email = form.elements.email.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { setError("email", true); ok = false; firstBad = firstBad || form.elements.email; }
      else setError("email", false);

      var msg = form.elements.message.value.trim();
      if (msg.length < 10) { setError("message", true); ok = false; firstBad = firstBad || form.elements.message; }
      else setError("message", false);

      if (firstBad && document.activeElement === form.querySelector('[type="submit"]')) firstBad.focus();
      return ok;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate()) {
        var firstInvalid = form.querySelector('[aria-invalid="true"]');
        if (firstInvalid) firstInvalid.focus();
        if (status) { status.classList.remove("show"); status.setAttribute("hidden", ""); }
        return;
      }

      var trip = (form.querySelector('input[name="trip"]:checked') || {}).value || "Any adventure";
      var name = form.elements.name.value.trim();
      var party = form.elements.party.value;
      var date = form.elements.date.value;

      if (statusTitle) statusTitle.textContent = "Request noted locally. Nothing has been sent";
      if (statusMsg) {
        statusMsg.textContent =
          "Demo confirmation only. In this concept build no booking exists and no email has left your device. " +
          "Recorded locally: " + trip + " · party of " + party + " · preferred date " + date + " · for " + name + ".";
      }
      if (status) {
        status.removeAttribute("hidden");
        status.classList.add("show");
        status.setAttribute("tabindex", "-1");
        status.focus();
      }
      form.reset();
    });

    /* live re-validate once a field was flagged */
    form.addEventListener("input", function (e) {
      var field = e.target.closest(".field");
      if (field && field.classList.contains("invalid")) validate();
    });
  }

  /* ---------------- URL param preselect (trip=x) ---------------- */
  function initTripPreselect() {
    var params = new URLSearchParams(location.search);
    var trip = params.get("trip");
    if (!trip) return;

    var input = Array.prototype.find.call(document.querySelectorAll('input[name="trip"]'), function (item) { return item.value === trip || item.value.toLowerCase().replace(/\s+/g, "-") === trip; });
    if (input) {
      input.checked = true;
      var form = input.closest("form");
      if (form) {
        form.dataset.preselected = "true";
        var first = form.querySelector('input[name="trip"]');
        if (first && !first.closest(".trip-option").dataset.hinted) {
          /* flash the preselected control so the choice is visible */
          var span = input.nextElementSibling;
          if (span) {
            span.style.transition = "background-color .4s";
            span.style.backgroundColor = "rgba(3,40,238,.18)";
            setTimeout(function () { span.style.backgroundColor = ""; }, 1800);
          }
        }
      }
    }
  }

  /* ---------------- footer year ---------------- */
  function initYear() {
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  function init() {
    initNav();
    initSlam();
    initProgress();
    initReveals();
    initChecklist();
    initFilters();
    initEnquiryForm();
    initTripPreselect();
    initYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

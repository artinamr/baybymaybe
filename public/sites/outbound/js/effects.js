/* ============================================================
   OUTBOUND — stage 3: cinematic effects layer
   Curtain cleanup · grain · scroll progress · procedural
   topography · scroll-velocity marquees · type drift ·
   count-up stats · elevation profile · trail-talk stories ·
   trip matcher · magnetic buttons · cursor glow · summit
   easter egg · text scramble.

   No dependencies. Everything is progressive enhancement:
   without this file every page still reads and works.
   Honours prefers-reduced-motion throughout.
   ============================================================ */
(function () {
  "use strict";

  var mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reduce = mqReduce.matches || document.documentElement.classList.contains("motion-reduced");
  document.addEventListener("showcase:motion", function (e) { reduce = e.detail.reduced; });
  mqReduce.addEventListener && mqReduce.addEventListener("change", function (e) {
    reduce = e.matches || document.documentElement.classList.contains("motion-reduced");
  });

  /* ============================================================
     CURTAIN — the inline head script parks the page behind a
     branded curtain once per session. CSS lifts it; we just
     unlock scrolling and remove the hook so styles can't leak.
     ============================================================ */
  function initCurtain() {
    var root = document.documentElement;
    if (!root.classList.contains("fx-curtain")) return;
    var unlock = function () {
      root.classList.remove("fx-curtain");
    };
    /* CSS lift runs ~2.3s; unlock after, and also force-unlock on
       any early interaction so the page can never feel frozen. */
    window.setTimeout(unlock, 950);
    ["pointerdown", "keydown", "wheel", "touchstart"].forEach(function (ev) {
      window.addEventListener(ev, unlock, { once: true, passive: true });
    });
  }

  /* ============================================================
     FILM GRAIN — one fixed noise sheet, cheap and steady.
     ============================================================ */
  function initGrain() {
    if (reduce) return;
    if (document.querySelector(".fx-grain")) return;
    var g = document.createElement("div");
    g.className = "fx-grain";
    g.setAttribute("aria-hidden", "true");
    document.body.appendChild(g);
  }

  /* ============================================================
     SCROLL PROGRESS — top hairline on every page.
     ============================================================ */
  function initProgress() {
    if (document.querySelector(".fx-progress")) return;
    var bar = document.createElement("div");
    bar.className = "fx-progress";
    bar.setAttribute("aria-hidden", "true");
    var fill = document.createElement("i");
    bar.appendChild(fill);
    document.body.appendChild(bar);

    var ticking = false;
    function update() {
      ticking = false;
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var done = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      fill.style.transform = "scaleX(" + done.toFixed(4) + ")";
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
  }

  /* ============================================================
     PROCEDURAL TOPOGRAPHY — hand-drawn contour rings behind
     hero and dark sections. Deterministic wobble per ring.
     ============================================================ */
  function contourPath(cx, cy, r, seed, squash) {
    var pts = 46, d = "", i;
    for (i = 0; i <= pts; i++) {
      var a = (i / pts) * Math.PI * 2;
      var wobble =
        1 +
        0.12 * Math.sin(3 * a + seed) +
        0.075 * Math.sin(5 * a + seed * 1.7) +
        0.045 * Math.sin(8 * a + seed * 2.3) +
        0.03 * Math.sin(13 * a + seed * 3.1);
      var x = cx + Math.cos(a) * r * wobble * 1.32;
      var y = cy + Math.sin(a) * r * wobble * squash;
      d += (i === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1) + " ";
    }
    return d + "Z";
  }

  function topoSVG() {
    var s = '<svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">';
    s += '<g class="fx-topo-drift">';
    var i, ring = 0;
    /* cluster one: big massif upper right */
    for (i = 0; i < 10; i++) {
      ring++;
      s += '<path class="contours' + (i % 2 ? " faint" : "") + '" d="' +
        contourPath(940, 170, 60 + i * 52, i * 1.31 + 0.7, 0.86) + '"/>';
    }
    /* cluster two: smaller hill lower left */
    for (i = 0; i < 7; i++) {
      ring++;
      s += '<path class="contours' + (i % 2 ? " faint" : "") + '" d="' +
        contourPath(140, 700, 40 + i * 46, i * 1.77 + 2.2, 0.72) + '"/>';
    }
    /* cluster three: whisper of ranges mid-left */
    for (i = 0; i < 5; i++) {
      s += '<path class="contours faint" d="' +
        contourPath(520, 420, 50 + i * 70, i * 2.11 + 4.4, 0.55) + '"/>';
    }
    return s + "</g></svg>";
  }

  function initTopo() {
    var hosts = document.querySelectorAll(".hero, .adventure-hero, .page-hero, .scene-sticky, .fx-404");
    if (!hosts.length) return;
    hosts.forEach(function (host) {
      if (host.querySelector(".fx-topo")) return;
      var layer = document.createElement("div");
      layer.className = "fx-topo";
      layer.setAttribute("aria-hidden", "true");
      layer.innerHTML = topoSVG();
      /* behind content, above photography */
      host.insertBefore(layer, host.children[1] || null);
    });
  }

  /* ============================================================
     SCROLL-VELOCITY MARQUEES — strips run at their own pace,
     then speed up (or reverse) with the reader's scroll.
     ============================================================ */
  function initMarquees() {
    if (reduce) return;
    var tracks = Array.prototype.slice.call(document.querySelectorAll(".strip-track"));
    if (!tracks.length) return;

    function unit(t) {
      /* one repeat unit = first span + the gap before the second span */
      var gap = parseFloat(window.getComputedStyle(t).columnGap) || 0;
      var first = t.children[0];
      return (first ? first.getBoundingClientRect().width : t.scrollWidth / 2) + gap;
    }

    var meta = tracks.map(function (t) {
      t.classList.add("marquee-js");
      return { el: t, half: unit(t), x: 0, vel: 0 };
    });

    function measure() {
      meta.forEach(function (m) {
        m.half = unit(m.el);
      });
    }
    window.addEventListener("resize", measure);

    var lastY = window.scrollY, lastT = performance.now();

    window.setInterval(function () {
      if (document.hidden || reduce) return;
      var now = performance.now();
      var dt = Math.min(64, now - lastT) / 1000;
      lastT = now;

      var y = window.scrollY;
      var instant = (y - lastY) / Math.max(dt, 0.001); /* px per second */
      lastY = y;

      meta.forEach(function (m, idx) {
        if (!m.half) return;
        /* ease scroll influence in and out */
        m.vel += (instant * 0.045 - m.vel) * Math.min(1, dt * 6);
        var dir = idx % 2 ? -1 : 1;
        var base = m.half / 24 * dir; /* one loop ≈ 24s */
        m.x += (base + m.vel * dir * 0.5) * dt;
        /* wrap into [-half, 0) so the seam never shows */
        if (m.x <= -m.half) m.x += m.half;
        if (m.x > 0) m.x -= m.half;
        m.el.style.transform = "translate3d(" + m.x.toFixed(2) + "px,0,0)";
      });
    }, 32);
  }

  /* ============================================================
     TYPE DRIFT — ghost outline words and giant index numerals
     slide gently against the scroll for depth.
     ============================================================ */
  function initTypeDrift() {
    if (reduce) return;
    var nodes = Array.prototype.slice.call(
      document.querySelectorAll(".ghost-type, .giant-index, .fx-footer-word")
    );
    if (!nodes.length) return;

    var items = nodes.map(function (el) {
      return { el: el, speed: el.classList.contains("ghost-type") ? 0.16 : el.classList.contains("fx-footer-word") ? 0.24 : 0.09 };
    });

    var ticking = false;
    function update() {
      ticking = false;
      if (reduce) return;
      var vh = window.innerHeight;
      items.forEach(function (it) {
        var host = it.el.parentElement.getBoundingClientRect();
        if (host.bottom < -200 || host.top > vh + 200) return;
        var progress = (vh / 2 - (host.top + host.height / 2)) / vh; /* -1 .. 1 */
        var shift = progress * it.speed * 100;
        it.el.style.transform = "translate3d(" + shift.toFixed(2) + "px,0,0)";
      });
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
  }

  /* ============================================================
     COUNT-UP STATS — numbers roll when the band comes into view.
     ============================================================ */
  function initCounters() {
    var nums = Array.prototype.slice.call(document.querySelectorAll("[data-count]"));
    if (!nums.length) return;

    function run(el) {
      if (el.dataset.countDone) return;
      el.dataset.countDone = "1";
      var target = parseFloat(el.dataset.count) || 0;
      var decimals = (el.dataset.count.split(".")[1] || "").length;
      function fmt(v) {
        return decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString("en-NZ");
      }
      if (reduce) {
        el.textContent = fmt(target);
        return;
      }
      var dur = 1700, t0 = performance.now();
      function tick(now) {
        var p = Math.min(1, (now - t0) / dur);
        /* ease-out-expo */
        var e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
        el.textContent = fmt(target * e);
        if (p < 1) window.requestAnimationFrame(tick);
      }
      window.requestAnimationFrame(tick);
    }

    if (!("IntersectionObserver" in window)) {
      nums.forEach(run);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          run(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    nums.forEach(function (el) { io.observe(el); });

    /* starvation guard: never leave a number half-rendered */
    window.setTimeout(function () {
      nums.forEach(function (el) {
        if (!el.dataset.countDone && el.getBoundingClientRect().top < window.innerHeight) run(el);
      });
    }, 2800);
  }

  /* ============================================================
     ELEVATION PROFILE — draws itself when scrolled into view.
     ============================================================ */
  function initElevation() {
    var host = document.querySelector("[data-elevation]");
    if (!host) return;
    var path = host.querySelector(".route");
    var profile = host.querySelector(".profile");
    if (!path) return;

    function draw() {
      if (host.dataset.elevDone) return;
      host.dataset.elevDone = "1";
      if (reduce) return;
      [profile, path].forEach(function (p, i) {
        if (!p) return;
        try {
          var len = p.getTotalLength();
          p.style.strokeDasharray = String(len);
          p.style.strokeDashoffset = String(len);
          p.style.transition = "stroke-dashoffset 1.8s cubic-bezier(.16,1,.3,1) " + (i * 0.25) + "s";
          window.requestAnimationFrame(function () {
            p.style.strokeDashoffset = "0";
          });
        } catch (err) { /* path not measurable — leave it visible */ }
      });
    }

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { draw(); io.disconnect(); }
        });
      }, { threshold: 0.3 });
      io.observe(host);
      window.setTimeout(draw, 3200); /* starvation guard */
    } else {
      draw();
    }
  }

  /* ============================================================
     TRAIL TALK — story-style testimonial rotator.
     ============================================================ */
  function initVoices() {
    var root = document.querySelector("[data-voices]");
    if (!root) return;
    var slides = Array.prototype.slice.call(root.querySelectorAll(".fx-voice"));
    var bars = Array.prototype.slice.call(root.querySelectorAll(".fx-voice-bars button"));
    var counter = root.querySelector("[data-voice-count]");
    var prev = root.querySelector("[data-voice-prev]");
    var next = root.querySelector("[data-voice-next]");
    if (slides.length < 2) return;

    var idx = 0, timer = null, paused = false;
    var DUR = 7000;

    function show(n, userDriven) {
      idx = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) { s.classList.toggle("is-live", i === idx); s.hidden = i !== idx; s.id = "guest-story-" + i; s.setAttribute("aria-labelledby", "guest-tab-" + i); });
      bars.forEach(function (b, i) {
        b.setAttribute("aria-selected", i === idx ? "true" : "false"); b.tabIndex = i === idx ? 0 : -1; b.id = "guest-tab-" + i; b.setAttribute("aria-controls", "guest-story-" + i);
        if (i < idx) b.dataset.seen = "true"; else delete b.dataset.seen;
      });
      /* retrigger the active bar's fill so it always runs 0 → 100% */
      if (!reduce && bars[idx]) {
        var fill = bars[idx].querySelector("i");
        if (fill) {
          fill.style.width = "0";
          void fill.offsetWidth;
          fill.style.width = "";
        }
      }
      if (counter) {
        counter.textContent =
          String(idx + 1).padStart(2, "0") + " / " + String(slides.length).padStart(2, "0");
      }
      if (userDriven) restart();
    }

    function restart() {
      window.clearTimeout(timer);
      if (reduce || paused) return;
      timer = window.setTimeout(function () { show(idx + 1); restart(); }, DUR);
    }

    if (prev) prev.addEventListener("click", function () { show(idx - 1, true); });
    if (next) next.addEventListener("click", function () { show(idx + 1, true); });
    bars.forEach(function (b, i) {
      b.addEventListener("click", function () { show(i, true); });
    });

    root.addEventListener("mouseenter", function () {
      paused = true; window.clearTimeout(timer);
    });
    root.addEventListener("mouseleave", function () {
      paused = false; restart();
    });
    root.addEventListener("focusin", function () {
      paused = true; window.clearTimeout(timer);
    });
    root.addEventListener("focusout", function () {
      paused = false; restart();
    });

    document.addEventListener('showcase:motion', function () { restart(); });
    bars.forEach(function (bar, index) {
      bar.addEventListener('keydown', function (e) {
        var n = index;
        if (e.key === 'ArrowRight') n = (index + 1) % bars.length;
        else if (e.key === 'ArrowLeft') n = (index - 1 + bars.length) % bars.length;
        else if (e.key === 'Home') n = 0;
        else if (e.key === 'End') n = bars.length - 1;
        else return;
        e.preventDefault(); show(n, true); bars[n].focus();
      });
    });
    show(0);
    restart();
  }

  /* ============================================================
     TRIP MATCHER — three questions, one honest answer.
     ============================================================ */
  function initMatcher() {
    var root = document.querySelector("[data-matcher]");
    if (!root) return;

    var result = root.querySelector("[data-match-result]");
    var rTitle = root.querySelector("[data-match-title]");
    var rWhy = root.querySelector("[data-match-why]");
    var rLink = root.querySelector("[data-match-link]");
    var rPrice = root.querySelector("[data-match-price]");

    var TRIPS = {
      ridge: {
        title: "Ridge to River",
        price: "NZ$395 · Full day · Moderate",
        href: "adventures/ridge-to-river.html"
      },
      tide: {
        title: "After the Tide",
        price: "NZ$745 · 2 days · Easy to moderate",
        href: "adventures/after-the-tide.html"
      },
      clouds: {
        title: "Above the Clouds",
        price: "NZ$295 · Full day · Moderate to hard",
        href: "adventures/above-the-clouds.html"
      }
    };

    function pick() {
      var energy = (root.querySelector('input[name="energy"]:checked') || {}).value || "steady";
      var terrain = (root.querySelector('input[name="terrain"]:checked') || {}).value || "heights";
      var time = (root.querySelector('input[name="time"]:checked') || {}).value || "day";

      /* weighted vote — terrain dominates, energy and time break ties */
      var score = { ridge: 0, tide: 0, clouds: 0 };
      function add(map) { for (var k in map) score[k] += map[k]; }
      if (terrain === "coast") add({ tide: 3 });
      else if (terrain === "river") add({ ridge: 3 });
      else if (terrain === "ridges") add({ clouds: 3, ridge: 2 });
      else add({ clouds: 3, tide: 1 });
      if (energy === "steady") add({ tide: 2, clouds: -1, ridge: -1 });
      else if (energy === "solid") add({ ridge: 2, clouds: 1 });
      else add({ clouds: 2, ridge: 1, tide: -1 });
      if (time === "day") add({ ridge: 1, clouds: 1, tide: -1 });
      else add({ tide: 3 });
      var key = "clouds", best = -Infinity;
      for (var k in score) {
        if (score[k] > best) { best = score[k]; key = k; }
      }

      var energyWord = { steady: "steady", solid: "solid", big: "full-send" }[energy];
      var terrainWord = { ridges: "ridgelines", river: "moving water", coast: "the coast", heights: "high ground" }[terrain];
      var terrainWordSafe = terrainWord;
      var timeWord = time === "day" ? "one good day" : "a full weekend";

      var trip = TRIPS[key];
      if (rTitle) rTitle.textContent = trip.title;
      if (rPrice) rPrice.textContent = trip.price;
      if (rLink) rLink.setAttribute("href", trip.href);
      if (rWhy) {
        rWhy.innerHTML =
          "You want <b>" + terrainWordSafe + "</b> at a <b>" + energyWord +
          "</b> pace with <b>" + timeWord + "</b> to spend. That’s this one.";
        if (key === "tide" && time === "day") rWhy.textContent = "The coast needs two days. Give After the Tide a full weekend, or try a one-day mountain or river trip.";
      }
      if (result) {
        result.classList.remove("flip-in");
        void result.offsetWidth;
        result.classList.add("flip-in");
      }
    }

    root.addEventListener("change", function (e) {
      if (e.target && e.target.name) pick();
    });
    pick();
  }

  /* ============================================================
     MAGNETIC BUTTONS — primary CTAs lean toward the cursor.
     ============================================================ */
  function initMagnetic() {
    if (reduce) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    var btns = Array.prototype.slice.call(
      document.querySelectorAll(".btn-acid, .btn-primary, .nav-cta")
    );
    btns.forEach(function (btn) {
      btn.classList.add("magnet");
      btn.addEventListener("pointermove", function (e) {
        var r = btn.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        var dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        btn.style.transform =
          "translate(" + (dx * 7).toFixed(1) + "px," + (dy * 5).toFixed(1) + "px)";
      });
      btn.addEventListener("pointerleave", function () {
        btn.style.transform = "";
      });
    });
  }

  /* ============================================================
     CURSOR GLOW — a headlamp pool of light on dark sections.
     ============================================================ */
  function initGlow() {
    if (reduce) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    var glow = document.createElement("div");
    glow.className = "fx-glow";
    glow.setAttribute("aria-hidden", "true");
    document.body.appendChild(glow);

    var tx = 0, ty = 0, cx = 0, cy = 0, on = false;

    document.addEventListener("pointermove", function (e) {
      tx = e.clientX; ty = e.clientY;
      var el = e.target;
      var over = el && el.closest && el.closest(
        ".on-dark, .hero, .adventure-hero, .page-hero, .scene-sticky, .fx-summit"
      );
      if (over !== on) {
        on = !!over;
        glow.classList.toggle("on", on);
      }
    }, { passive: true });

    (function tick() {
      if (reduce) { window.requestAnimationFrame(tick); return; }
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      glow.style.transform = "translate3d(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px,0)";
      window.requestAnimationFrame(tick);
    })();
  }

  /* ============================================================
     SUMMIT EASTER EGG — the classic code summons a hidden plate.
     ============================================================ */
  function initSummit() {
    var seq = [
      "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
      "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"
    ];
    var pos = 0;
    var plate = null;

    function build() {
      if (plate) return plate;
      plate = document.createElement("div");
      plate.className = "fx-summit";
      plate.setAttribute("role", "dialog");
      plate.setAttribute("aria-modal", "true");
      plate.setAttribute("aria-label", "Summit mode");
      plate.innerHTML =
        '<div class="fx-topo" aria-hidden="true"></div>' +
        '<div class="plate">' +
        '<span class="tape">Secret route unlocked</span>' +
        "<h2>You found the <span class=\"stroke\">high line.</span></h2>" +
        "<p>Between the first switchback and the last rapid there is a version of your weekend " +
        "that tells itself for years. That’s the whole business model.</p>" +
        '<button class="fx-summit-close" type="button">Back to the trail</button>' +
        "</div>";
      document.body.appendChild(plate);
      var topoWrap = plate.querySelector(".fx-topo");
      if (topoWrap) topoWrap.innerHTML = topoSVG();
      plate.querySelector(".fx-summit-close").addEventListener("click", close);
      plate.addEventListener("click", function (e) {
        if (e.target === plate) close();
      });
      return plate;
    }

    function open() {
      var p = build();
      p.classList.add("open");
      p.querySelector(".fx-summit-close").focus();
      if (!reduce) {
        /* little confetti of contour dust */
        for (var i = 0; i < 14; i++) (function (n) {
          var spark = document.createElement("span");
          spark.setAttribute("aria-hidden", "true");
          spark.style.cssText =
            "position:absolute;z-index:3;width:10px;height:10px;background:" +
            (n % 3 ? "#CCFF00" : "#FF5A1F") + ";left:" + (10 + Math.random() * 80) + "vw;" +
            "top:-20px;opacity:.9;" +
            "animation:fx-fall " + (1.6 + Math.random() * 1.8) + "s ease-in " + (Math.random() * .8) + "s forwards;";
          p.appendChild(spark);
          window.setTimeout(function () { spark.remove(); }, 4200);
        })(i);
      }
    }

    function close() {
      if (plate) plate.classList.remove("open");
    }

    document.addEventListener("keydown", function (e) {
      var key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (key === seq[pos]) {
        pos++;
        if (pos === seq.length) {
          pos = 0;
          open();
        }
      } else {
        pos = key === seq[0] ? 1 : 0;
      }
      if (e.key === "Escape") close();
    });
  }

  /* ============================================================
     TEXT SCRAMBLE — coordinates and labels settle like a
     satellite fix. Runs once per element on reveal.
     ============================================================ */
  function initScramble() {
    if (reduce) return;
    var nodes = Array.prototype.slice.call(document.querySelectorAll("[data-scramble]"));
    if (!nodes.length) return;
    var glyphs = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789°/·";

    function run(el) {
      if (el.dataset.scrambled) return;
      el.dataset.scrambled = "1";
      var final = el.textContent;
      var chars = final.split("");
      var start = performance.now(), dur = 1100;
      function tick(now) {
        var p = Math.min(1, (now - start) / dur);
        el.textContent = chars
          .map(function (c, i) {
            if (c === " " || c === "·") return c;
            return i / chars.length < p ? c : glyphs[(Math.random() * glyphs.length) | 0];
          })
          .join("");
        if (p < 1) window.requestAnimationFrame(tick);
        else el.textContent = final;
      }
      window.requestAnimationFrame(tick);
    }

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            run(entry.target);
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });
      nodes.forEach(function (el) { io.observe(el); });
      window.setTimeout(function () {
        nodes.forEach(function (el) {
          if (!el.dataset.scrambled && el.getBoundingClientRect().top < window.innerHeight) run(el);
        });
      }, 2600);
    } else {
      nodes.forEach(run);
    }
  }

  /* ============================================================
     FOOTER WORDMARK — the brand signs off at full size.
     ============================================================ */
  function initFooterWord() {
    var footer = document.querySelector(".site-footer .wrap");
    if (!footer || footer.querySelector(".fx-footer-word")) return;
    var word = document.createElement("div");
    word.className = "fx-footer-word";
    word.setAttribute("aria-hidden", "true");
    word.textContent = "OUTBOUND";
    footer.appendChild(word);
  }

  /* ============================================================
     BOOT
     ============================================================ */
  function init() {
    initCurtain();
    initGrain();
    initProgress();
    initTopo();
    initMarquees();
    initFooterWord();
    initTypeDrift();
    initCounters();
    initElevation();
    initVoices();
    initMatcher();
    initMagnetic();
    initGlow();
    initSummit();
    initScramble();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

/* ============================================================
   OUTBOUND — scroll scene
   One brief scroll-driven moment: a landscape slides behind
   oversized type. rAF-polled so it tracks even where scroll
   events are unreliable (embedded webviews). Fully static
   under prefers-reduced-motion.
   ============================================================ */
(function () {
  "use strict";

  function initScene() {
    var scene = document.querySelector("[data-parallax-scene]");
    if (!scene) return;

    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return; /* scene stays static; the type panel still reads fine */

    var img = scene.querySelector("img");
    if (!img) return;

    var lastY = null;

    function update() {
      if (document.hidden || document.documentElement.classList.contains("motion-reduced")) return;
      var y = window.scrollY || window.pageYOffset || 0;
      if (y !== lastY) {
        lastY = y;
        var rect = scene.getBoundingClientRect();
        var total = rect.height + window.innerHeight;
        if (total > 0) {
          var progress = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / total));
          var shift = (0.5 - progress) * 14; /* percent drift inside oversized box */
          img.style.transform = "translateY(" + shift.toFixed(2) + "%)";
        }
      }
    }

    /* Poll rather than rely on scroll events/rAF alone: the transform only
       changes when scrollY changes, so a short interval is imperceptible and
       works even in throttled or embedded webviews. */
    window.addEventListener("scroll", update, { passive: true });
    window.setInterval(update, 120);
    update();
  }

  function boot() { initScene(); }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

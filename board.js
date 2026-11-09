// Leaderboard: the totals count up when they come into view (not with reduced motion).
(function () {
  "use strict";
  var nums = document.querySelectorAll("[data-count]");
  if (!nums.length || !("IntersectionObserver" in window)) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  function run(el) {
    var end = Number(el.getAttribute("data-count")) || 0, t0 = null, dur = 1400;
    function step(t) {
      if (t0 === null) t0 = t;
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(end * e).toLocaleString("en-GB");
      if (k < 1) requestAnimationFrame(step);
    }
    el.textContent = "0";
    requestAnimationFrame(step);
  }
  var seen = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { run(e.target); seen.unobserve(e.target); } });
  }, { threshold: 0.4 });
  nums.forEach(function (el) { seen.observe(el); });
})();

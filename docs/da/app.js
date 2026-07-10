/* =========================================================
   Chợ Vỉa Hè — DA · interactions
   Vanilla JS, zéro dépendance. Tout dégrade sous
   prefers-reduced-motion et sans JS (état de repos = visible).
   ========================================================= */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Reveal sections + tracé crayon (IntersectionObserver) ---- */
  if (reduce || !('IntersectionObserver' in window)) {
    // état visible d'emblée, pas d'observation
    document.querySelectorAll('[data-reveal]').forEach(function (el) { el.classList.add('is-in'); });
    document.querySelectorAll('[data-pencil]').forEach(function (el) { el.classList.add('is-drawn'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in', 'is-drawn');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

    document.querySelectorAll('[data-reveal], [data-pencil]').forEach(function (el) { io.observe(el); });
  }

  /* ---- Longueur réelle de chaque path crayon (pour un tracé propre) ---- */
  document.querySelectorAll('[data-pencil] path').forEach(function (p) {
    try {
      var len = Math.ceil(p.getTotalLength());
      p.parentElement.parentElement.style.setProperty('--len', len);
    } catch (err) { /* getTotalLength indispo : le fallback CSS suffit */ }
  });

  /* ---- Magnétisme léger des cartes/boutons (subtil, désactivé si reduced) ---- */
  if (!reduce && window.matchMedia('(pointer:fine)').matches) {
    document.querySelectorAll('[data-magnetic]').forEach(function (el) {
      var strength = 10;
      el.addEventListener('pointermove', function (ev) {
        var r = el.getBoundingClientRect();
        var mx = (ev.clientX - r.left - r.width / 2) / r.width;
        var my = (ev.clientY - r.top - r.height / 2) / r.height;
        el.style.transform = 'translate(' + (mx * strength) + 'px,' + (my * strength - 3) + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  /* ---- empêcher la navigation des faux liens de démo ---- */
  document.querySelectorAll('a[href="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); });
  });
})();

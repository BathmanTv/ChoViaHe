/* =========================================================
   Chợ Vỉa Hè — analytics GoatCounter (sans cookie, pas de bandeau RGPD)
   Compte: https://choviahe.goatcounter.com  (code "choviahe")
   — pages vues automatiques
   — événements: resa-clic / tel-clic / itineraire-clic / carte-clic
   — resa-completee: réservation réellement finalisée dans le module Zenchef
   Ne compte PAS localhost (données de dev exclues).
   ========================================================= */
(function () {
  'use strict';

  var HOSTS_IGNORES = ['localhost', '127.0.0.1', '[::1]'];
  if (HOSTS_IGNORES.indexOf(location.hostname) !== -1) return;

  // charge count.js (async, non bloquant)
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://gc.zgo.at/count.js';
  s.setAttribute('data-goatcounter', 'https://choviahe.goatcounter.com/count');
  document.head.appendChild(s);

  function track(path, title) {
    if (window.goatcounter && typeof window.goatcounter.count === 'function') {
      window.goatcounter.count({ path: path, title: title || path, event: true });
    }
  }

  // Clics sortants qui comptent (l'action n°1 = réserver)
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (!a || !a.href) return;
    if (a.href.indexOf('bookings.zenchef.com') !== -1) track('resa-clic', 'Clic Réserver');
    else if (a.href.indexOf('tel:') === 0) track('tel-clic', 'Clic Appeler');
    else if (a.href.indexOf('google.com/maps') !== -1) track('itineraire-clic', 'Clic Itinéraire');
    else if (a.getAttribute('href') && a.getAttribute('href').indexOf('carte') !== -1) track('carte-clic', 'Clic vers la carte');
  }, { passive: true });

  // Réservation FINALISÉE dans le module Zenchef (la vraie conversion)
  window.addEventListener('zc-widget-booking-completed', function () {
    track('resa-completee', 'Réservation complétée (widget)');
  });
})();

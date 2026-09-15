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

  /* On ne mesure QUE la production. Deux raisons :
     1. le compte GoatCounter n'existe pas encore → chaque page de l'aperçu
        GitHub Pages déclenchait une erreur 400 dans la console ;
     2. une fois le compte créé, les relectures sur l'aperçu seraient
        comptées comme du vrai trafic et fausseraient les chiffres.
     Liste blanche plutôt que liste noire : un nouvel environnement de test
     est ainsi exclu par défaut, sans qu'on ait à y penser. */
  var HOTES_PROD = ['choviahe.fr', 'www.choviahe.fr'];
  if (HOTES_PROD.indexOf(location.hostname) === -1) return;

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

  /* Clics sortants qui comptent (l'action n°1 = réserver).
     Détection par attribut data-track explicite, jamais par sous-chaîne d'URL :
     le lien du PDF contenait « carte » et celui des avis « google.com/maps »,
     ce qui gonflait les deux métriques dès le premier jour. */
  var LIBELLES = {
    resa: 'Clic Réserver', tel: 'Clic Appeler', itineraire: 'Clic Itinéraire',
    carte: 'Clic vers la carte', 'carte-pdf': 'Téléchargement du PDF', avis: 'Clic vers les avis Google',
    'cafe-bong': 'Clic vers Café Bống', 'bep-chay': 'Clic vers Bếp Chay'
  };
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (!a) return;
    var quoi = a.getAttribute('data-track');
    if (!quoi) {
      if (a.href && a.href.indexOf('bookings.zenchef.com') !== -1) quoi = 'resa';
      else if (a.href && a.href.indexOf('tel:') === 0) quoi = 'tel';
      else return;
    }
    if (LIBELLES[quoi]) track(quoi + '-clic', LIBELLES[quoi]);
  }, { passive: true });

  // Réservation FINALISÉE dans le module Zenchef (la vraie conversion)
  window.addEventListener('zc-widget-booking-completed', function () {
    track('resa-completee', 'Réservation complétée (widget)');
  });
})();

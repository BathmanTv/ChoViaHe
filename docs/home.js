/* =========================================================
   Chợ Vỉa Hè — Home V1 · interactions
   Structure (menu, focus-trap) EN VANILLA — zéro dépendance.
   Couche motion (reveals, scooter signature, parallaxe, Lenis)
   POSÉE PAR-DESSUS via GSAP + ScrollTrigger + Lenis (CDN, defer).

   Progressive enhancement strict :
   - sans JS : la page est complète et lisible (.no-js retiré très tôt).
   - GSAP/Lenis absents (CDN KO) : fallback IntersectionObserver.
   - prefers-reduced-motion : AUCUN mouvement (pas de Lenis, pas de
     scrub, pas d'oscillation) — page statique, tout visible d'emblée.

   FEEL : calme, artisanal, "on feuillette un carnet". Jamais rapide.
   Eases power3.out pour les reveals, scrub linéaire pour le scooter.
   ========================================================= */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGSAP = !!(window.gsap && window.ScrollTrigger);
  var HEADER_OFFSET = 64; // ~ --header-h ; offset ancre header fixe

  /* =======================================================
     1. REVEALS + TRACÉ CRAYON
     GSAP si dispo & mouvement autorisé, sinon IntersectionObserver,
     sinon (reduce / pas d'IO) tout visible immédiatement.
     Un seul système actif à la fois — pas de double observation.
     ======================================================= */
  function revealFallbackVisible() {
    document.querySelectorAll('[data-reveal]').forEach(function (el) { el.classList.add('is-in'); });
  }

  /* V2 : les séparateurs crayon rouges ont été retirés (demande cliente).
     Les transitions entre sections sont désormais portées par les bandeaux
     photo pleine largeur. */

  /* `motion-armed` (posé dans le <head>, avant le premier rendu) cache les
     blocs à révéler. Il ne doit être levé QUE si GSAP ne prend pas la main —
     sinon on annulerait l'animation. */
  function desarmer() { document.documentElement.classList.remove('motion-armed'); }

  if (reduce) {
    // Mouvement réduit : rien ne bouge, tout est là.
    desarmer();
    revealFallbackVisible();
  } else if (hasGSAP) {
    initMotion();
  } else if ('IntersectionObserver' in window) {
    // CDN motion KO mais IO dispo : reveals doux CSS-driven (comme le build de base).
    desarmer();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
    document.querySelectorAll('[data-reveal]').forEach(function (el) { io.observe(el); });
  } else {
    desarmer();
    revealFallbackVisible();
  }

  /* Garde-fou ultime : si au bout de 3 s GSAP n'a pas pris la main (script
     tombé, exception…), on lève l'état caché. Mieux vaut du contenu sans
     animation que du contenu invisible. */
  setTimeout(function () {
    if (!document.documentElement.classList.contains('gsap-ready')) desarmer();
  }, 3000);

  /* =======================================================
     2. MOTION GSAP (uniquement si hasGSAP && !reduce)
     ======================================================= */
  function initMotion() {
    var gsap = window.gsap;
    var ScrollTrigger = window.ScrollTrigger;
    gsap.registerPlugin(ScrollTrigger);

    // Signale à la CSS que GSAP pilote : les sections [data-reveal] repassent
    // visibles (opacity:1), GSAP gère seul le masquage des enfants animés.
    // Évite tout flash "section cachée puis montrée".
    document.documentElement.classList.add('gsap-ready');

    /* ---- Lenis : smooth scroll desktop, natif sur tactile ---- */
    // Sur pointeur grossier (tactile) le scroll natif rend mieux et évite
    // tout risque de jank / scroll capturé sur mobile (leçon Café Bống).
    var finePointer = window.matchMedia('(pointer:fine)').matches;
    var lenis = null;

    if (window.Lenis && finePointer) {
      lenis = new window.Lenis({
        lerp: 0.14,        // retour user: 0.09 trop lent, feel plus direct
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1
      });
      // UN SEUL RAF : Lenis piloté par le ticker GSAP.
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    }

    /* ---- Ancres : défilement doux vers les sections, offset header ---- */
    // Intercepte tous les liens d'ancrage internes (header, hero, footer).
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (!href || href === '#') return;              // faux liens gérés plus bas
      var target = document.getElementById(href.slice(1));
      if (!target) return;
      a.addEventListener('click', function (e) {
        e.preventDefault();
        if (lenis) {
          lenis.scrollTo(target, { offset: -HEADER_OFFSET, duration: 1.1 });
        } else {
          // pas de Lenis (tactile) : scroll natif avec offset manuel.
          var y = target.getBoundingClientRect().top + window.pageYOffset - HEADER_OFFSET;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      });
    });

    /* ---- Reveals : opacity + translateY, stagger léger sur enfants ---- */
    gsap.utils.toArray('[data-reveal]').forEach(function (section) {
      // le diptyque a son propre reveal séquencé (moment émotion) — on l'exclut ici.
      if (section.classList.contains('voyages-diptyque')) return;

      // état "repos = visible" retiré côté JS : on part de l'état animé.
      // On anime les enfants directs porteurs de texte (titre + blocs),
      // sinon la section entière — fondu doux, pas de bloc qui saute.
      var kids = section.querySelectorAll(':scope > .wrap > *, :scope > .lieu-inner > *');
      // On EXCLUT les enfants qui portent eux-mêmes data-reveal : ils ont
      // leur propre tween. Sans ça (.duo par exemple) l'élément est anime
      // deux fois — le second tween, en overwrite, coupe le premier en cours
      // et l'image sursaute.
      var items = [];
      Array.prototype.forEach.call(kids, function (el) {
        if (!el.hasAttribute('data-reveal')) items.push(el);
      });
      if (!items.length) items = [section];

      // L'état caché vient du CSS (.gsap-ready …). On anime UNIQUEMENT vers
      // l'état visible : pas de saut au démarrage (clignotement), et un
      // ScrollTrigger.refresh() ne peut plus ré-appliquer un état de départ
      // sur un tween déjà joué (ce qui laissait des blocs invisibles).
      gsap.to(items, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.08,
        overwrite: 'auto',
        scrollTrigger: {
          trigger: section,
          start: 'top 82%',
          once: true            // joue une fois, puis reste visible (fail-to-visible)
        }
      });
    });

    /* ---- Diptyque "le carnet… / …et le vrai" : reveal séquencé (émotion) ----
       Le dessin apparaît d'abord, la photo 0.15s après — on "pose le carnet
       puis on montre le vrai". Fondu doux + léger décalage vertical, la
       rotation artisanale (CSS) est préservée. Fail-to-visible via once. */
    (function initDiptyque() {
      var dip = document.querySelector('.voyages-diptyque');
      if (!dip) return;
      var carnet = dip.querySelector('.diptyque-item--carnet');
      var reel = dip.querySelector('.diptyque-item--reel');
      if (!carnet || !reel) return;

      var tl = gsap.timeline({
        scrollTrigger: { trigger: dip, start: 'top 80%', once: true }
      });
      // état caché posé en CSS (.gsap-ready .voyages-diptyque .diptyque-item)
      tl.to(carnet, { opacity: 1, y: 0, duration: 0.85, ease: 'power3.out' }, 0)
        .to(reel, { opacity: 1, y: 0, duration: 0.85, ease: 'power3.out' }, 0.15);
    })();

    /* ---- Médaillons histoire (patron / famille) : reveal doux + tilt ----
       Le tilt final (-1.5deg / +1deg) est posé en fin d'anim et laissé sur
       l'élément (transform GSAP), remplaçant le rotate CSS statique. */
    (function initMedaillons() {
      var meds = document.querySelectorAll('.genese-medaillon');
      if (!meds.length) return;
      meds.forEach(function (med, i) {
        var img = med.querySelector('img');
        if (!img) return;
        var endRot = med.classList.contains('genese-medaillon--famille') ? 1 : -1.5;
        gsap.fromTo(img,
          { opacity: 0, y: 22, rotation: 0 },
          {
            opacity: 1, y: 0, rotation: endRot,
            duration: 0.9, ease: 'power3.out', delay: i * 0.08,
            scrollTrigger: { trigger: med, start: 'top 85%', once: true }
          });
      });
    })();

    /* ---- SIGNATURE : le scooter traverse la piste au scrub ---- */
    initScooter(gsap, ScrollTrigger);

    /* ---- Micro-parallaxe des marginalia (8–16px max, subtil) ---- */
    initParallax(gsap);

    /* ---- Recalcule après chargement des polices/images (pas de désalignement) ---- */
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ScrollTrigger.refresh(); filetDeSecurite(); });
    }
    window.addEventListener('load', function () {
      ScrollTrigger.refresh();
      setTimeout(filetDeSecurite, 1200);
    });
  }

  /* =======================================================
     FILET DE SÉCURITÉ DES APPARITIONS
     Un bloc resté invisible sur un site client, c'est du contenu perdu
     sans que personne s'en aperçoive. Quoi qu'il arrive en amont (refresh
     mal placé, trigger jamais franchi, CDN lent), tout élément déjà passé
     sous le bas de l'écran doit être visible. On ne touche qu'aux éléments
     encore à opacité ~0 : aucune animation en cours n'est cassée.
     ======================================================= */
  function filetDeSecurite() {
    document.querySelectorAll('[data-reveal] .wrap > *, [data-reveal] .lieu-inner > *').forEach(function (el) {
      // NE JAMAIS toucher un élément en cours d'animation : sinon on écrase
      // l'opacité de départ pendant que GSAP l'anime → clignotement.
      if (window.gsap && gsap.isTweening(el)) return;
      var r = el.getBoundingClientRect();
      // uniquement ce qui est ENTIÈREMENT passé au-dessus de l'écran : un bloc
      // encore visible est soit déjà révélé, soit en train de l'être.
      if (r.bottom > 0) return;
      if (parseFloat(getComputedStyle(el).opacity) > 0.05) return;
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
  }

  /* =======================================================
     3. SCOOTER — la signature
     Translation X de la piste au scrub du scroll, bob vertical
     sinus (2–3px) + rotation ±1deg ("roule sur le papier").
     Légendes Hà Nội / Sài Gòn en fondu quand le scooter les croise.
     Course = ~1 viewport de scroll, PAS de pin (pas de scroll-trap).
     ======================================================= */
  function initScooter(gsap, ScrollTrigger) {
    var track = document.querySelector('[data-scooter]');
    if (!track) return;
    var scooter = track.querySelector('.scooter');
    var legHanoi = track.querySelector('.track-legend--hanoi');
    var legSaigon = track.querySelector('.track-legend--saigon');
    if (!scooter) return;

    // Direction voulue (user): GAUCHE -> DROITE. Le dessin v3 régénéré
    // regarde à droite → aucun flip CSS. Hà Nội = départ (gauche), Sài Gòn
    // = arrivée (droite). x part de 0 (gauche) et CROÎT vers travel() (droite).
    function travel() {
      var trackW = track.clientWidth;
      var sW = scooter.offsetWidth;
      var maxX = trackW - sW - trackW * 0.04;
      return Math.max(0, maxX);
    }

    // légendes invisibles au repos (JS présent) ; réapparaissent au croisement.
    if (legHanoi) gsap.set(legHanoi, { opacity: 0 });
    if (legSaigon) gsap.set(legSaigon, { opacity: 0 });

    // état initial du scooter côté GAUCHE (x = 0)
    gsap.set(scooter, { x: 0, y: 0, rotation: 0, transformOrigin: '50% 100%' });

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: track,
        start: 'top 78%',      // commence quand la piste entre bien dans le champ
        end: 'bottom 45%',     // ~1 viewport de course, se termine avant de sortir
        scrub: 0.6,            // scrub quasi-linéaire, léger lissage
        invalidateOnRefresh: true, // relit travel() (cible droite) au resize
        // will-change posé pendant la course seulement, retiré sinon (perf).
        onEnter: function () { scooter.classList.add('is-riding'); },
        onLeave: function () { scooter.classList.remove('is-riding'); },
        onEnterBack: function () { scooter.classList.add('is-riding'); },
        onLeaveBack: function () { scooter.classList.remove('is-riding'); }
      }
    });

    // translation principale gauche→droite (ease none = suit le scroll = "on roule")
    // valeur en fonction : relue à chaque refresh (invalidateOnRefresh) → responsive.
    tl.to(scooter, { x: function () { return travel(); }, ease: 'none', duration: 1 }, 0);

    // bob vertical sinusoïdal + rotation : petites oscillations sur la course.
    // On les superpose via des keyframes pour l'effet "cahote sur le papier".
    tl.to(scooter, {
      keyframes: {
        y: [0, -3, 0, -2, 0, -3, 0],
        rotation: [0, -1, 0.5, -0.8, 0.6, -1, 0]
      },
      ease: 'none',
      duration: 1
    }, 0);

    // Légendes : Hà Nội tôt (départ), Sài Gòn tard (arrivée) — fondu au croisement.
    if (legHanoi) {
      tl.to(legHanoi, { opacity: 1, ease: 'power2.out', duration: 0.2 }, 0.08);
    }
    if (legSaigon) {
      tl.to(legSaigon, { opacity: 1, ease: 'power2.out', duration: 0.2 }, 0.62);
    }

    // Recalcule la position de départ (GAUCHE, x = 0) si la largeur change.
    // travel() (la cible droite) est relue par le tween au refresh de ScrollTrigger.
    ScrollTrigger.addEventListener('refreshInit', function () {
      gsap.set(scooter, { x: 0 });
    });
  }

  /* =======================================================
     4. MICRO-PARALLAXE — café + coriandre (8–16px), subtil
     transform-only, scrub. Jamais sur mobile étroit (économie).
     ======================================================= */
  function initParallax(gsap) {
    // désactive sous 640px : marges trop serrées, gain visuel nul, coût inutile.
    if (window.matchMedia('(max-width: 640px)').matches) return;

    // marginalia "historiques" (sélecteur fixe) + toute [data-parallax].
    var picks = [
      { sel: '.marg-cafe', amt: -14 },
      { sel: '.marg-coriandre', amt: 12 },
      { sel: '.marg-baguette', amt: -10 }
    ];
    picks.forEach(function (p) {
      var el = document.querySelector(p.sel);
      if (el) parallaxOne(el, p.amt);
    });

    // marginalia parsemées : amplitude portée par data-parallax (±8–16px).
    document.querySelectorAll('[data-parallax]').forEach(function (el) {
      var amt = parseFloat(el.getAttribute('data-parallax'));
      if (!amt || isNaN(amt)) amt = 10;
      // borne dure ±16px (garde-fou subtilité).
      amt = Math.max(-16, Math.min(16, amt));
      parallaxOne(el, amt);
    });

    function parallaxOne(el, amt) {
      gsap.to(el, {
        y: amt,
        ease: 'none',
        scrollTrigger: {
          trigger: el.closest('.section') || el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      });
    }
  }

  /* =======================================================
     5. MENU MOBILE (overlay plein écran, focus trap, Échap)
     VANILLA — indépendant de GSAP. Inchangé du build de base.
     ======================================================= */
  var burger = document.querySelector('[data-burger]');
  var overlay = document.getElementById('menu-overlay');
  var closeBtn = overlay ? overlay.querySelector('[data-close]') : null;
  var lastFocus = null;

  function focusables() {
    return overlay.querySelectorAll('a[href], button:not([disabled])');
  }

  function openMenu() {
    if (!overlay) return;
    lastFocus = document.activeElement;
    overlay.hidden = false;
    void overlay.offsetWidth;               // reflow puis anime
    overlay.classList.add('is-open');
    burger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    var f = focusables();
    if (f.length) f[0].focus();
  }

  function closeMenu() {
    if (!overlay) return;
    overlay.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    var done = function () {
      overlay.hidden = true;
      overlay.removeEventListener('transitionend', done);
    };
    if (reduce) { done(); } else { overlay.addEventListener('transitionend', done); }
    if (lastFocus) lastFocus.focus();
  }

  if (burger && overlay) {
    burger.addEventListener('click', openMenu);
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);

    // fermer au clic sur un lien d'ancre du menu
    overlay.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', function (e) {
      if (overlay.hidden) return;
      if (e.key === 'Escape') { closeMenu(); return; }
      if (e.key === 'Tab') {
        var f = focusables();
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ---- Empêcher la navigation des liens encore morts (#) ---- */
  document.querySelectorAll('a[href="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); });
  });

  /* =======================================================
     6. STICKY BAR MOBILE (Réserver / Appeler / Itinéraire)
     VANILLA — indépendante de GSAP.
     Visible dès que la couverture est passée, puis reste tout le
     long de la page (demande user). CSS restreint à ≤780px.
     ======================================================= */
  (function initStickyActions() {
    var bar = document.querySelector('[data-sticky-actions]');
    if (!bar) return;
    var cover = document.querySelector('.couverture');
    if (!cover) return;
    if (!('IntersectionObserver' in window)) return; // sans IO : reste masquée

    bar.hidden = false; // rend l'élément présent ; .is-visible pilote l'apparition

    var coverIO = new IntersectionObserver(function (entries) {
      var visible = !entries[0].isIntersecting;
      bar.classList.toggle('is-visible', visible);
      // D2 : quand la sticky bar est visible, on masque le CTA du header sur
      // mobile (CSS ≤780px .sticky-active .header-cta) pour éviter 3 « Réserver »
      // jaunes simultanés. Desktop inchangé (media query).
      document.documentElement.classList.toggle('sticky-active', visible);
    }, { threshold: 0, rootMargin: '-10% 0px 0px 0px' });
    coverIO.observe(cover);

    suivreBarreNavigateur(bar);
  })();

  /* =======================================================
     BARRE D'OUTILS DU NAVIGATEUR MOBILE
     Firefox Android (et Chrome en mode barre basse) place SA barre en bas de
     l'écran, par-dessus tout élément en position fixe : notre barre
     Réserver / Appeler / Itinéraire se retrouvait dessous, invisible.
     `visualViewport` donne la zone réellement visible ; on en déduit la
     hauteur masquée et on remonte la barre d'autant (--vv-bas).
     ======================================================= */
  function suivreBarreNavigateur(bar) {
    var vv = window.visualViewport;
    if (!vv) return;                       // navigateur ancien : comportement inchangé
    var placer = function () {
      var masque = window.innerHeight - (vv.height + vv.offsetTop);
      // garde-fou : au-delà de 240px c'est un clavier virtuel ou un zoom,
      // pas une barre d'outils — on ne bouge pas.
      if (!isFinite(masque) || masque < 0 || masque > 240) masque = 0;
      bar.style.setProperty('--vv-bas', Math.round(masque) + 'px');
    };
    placer();
    vv.addEventListener('resize', placer);
    vv.addEventListener('scroll', placer);
    window.addEventListener('orientationchange', function () { setTimeout(placer, 250); });
  }

  /* =======================================================
     7. LANTERNES — pause du balancement hors écran (D5)
     L'animation CSS sway/entrance ne tourne que lorsque le hero
     est visible. reduced-motion : laissé tel quel (déjà animation:none).
     ======================================================= */
  (function initLanternPause() {
    if (reduce) return;                       // reduced-motion : rien à piloter
    var lanternes = document.querySelector('.lanternes-pendantes');
    if (!lanternes) return;
    if (!('IntersectionObserver' in window)) return;

    var io = new IntersectionObserver(function (entries) {
      lanternes.style.animationPlayState = entries[0].isIntersecting ? 'running' : 'paused';
    }, { threshold: 0 });
    io.observe(lanternes);
  })();

  /* =======================================================
     8. ZENCHEF — overlay chargé À LA DEMANDE
     Le SDK (et l'iframe bookings + ses trackers) ne charge RIEN
     avant le premier clic Réserver: RGPD propre sans bandeau,
     et ~15 requêtes de moins à chaque visite.
     Fallback: si le SDK ne répond pas en 4s, on suit le lien direct.
     Sans JS: les liens fonctionnent tels quels.
     ======================================================= */
  (function initZenchefLazy() {
    /* MOBILE : PAS d'overlay. Vérifié en navigateur — le module Zenchef pose
       son propre élément par-dessus notre barre et masque « Appeler » et
       « Itinéraire » ; ni ZenchefWidget.close() ni #zc-action-close ne le
       referment (le seul recours est sa croix interne). Sur petit écran on
       ouvre donc la page de réservation dans un nouvel onglet : plein écran,
       natif, et notre barre d'actions reste intacte au retour.
       (Demande cliente : les boutons Appeler / Itinéraire doivent rester
       visibles et utilisables en toutes circonstances.) */
    var petitEcran = window.matchMedia('(max-width: 780px), (pointer: coarse)').matches;
    if (petitEcran) return;   // les liens gardent leur comportement natif (_blank)

    function openWhenReady(fallbackHref, deadline) {
      if (window.ZenchefWidget && typeof window.ZenchefWidget.open === 'function') {
        window.ZenchefWidget.open();
        return;
      }
      if (Date.now() > deadline) { window.open(fallbackHref, '_blank', 'noopener'); return; }
      setTimeout(function () { openWhenReady(fallbackHref, deadline); }, 120);
    }
    document.querySelectorAll('a[href*="bookings.zenchef.com"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        if (!document.getElementById('zenchef-sdk')) {
          var js = document.createElement('script');
          js.id = 'zenchef-sdk';
          js.src = 'https://sdk.zenchef.com/v1/sdk.min.js';
          document.head.appendChild(js);
        }
        openWhenReady(a.href, Date.now() + 4000);
      });
    });
  })();
})();

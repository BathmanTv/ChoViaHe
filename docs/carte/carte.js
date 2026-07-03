/* =========================================================
   Chợ Vỉa Hè — La Carte · interactions
   VANILLA pour la structure (menu, sticky bar), GSAP optionnel
   par-dessus pour reveals + tracé crayon. Fallback IntersectionObserver.
   Progressive enhancement strict : sans JS, la carte est complète et lisible.
   ========================================================= */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGSAP = !!(window.gsap && window.ScrollTrigger);

  /* ---- longueur réelle des paths crayon ---- */
  document.querySelectorAll('[data-pencil] path').forEach(function (p) {
    try {
      var len = Math.ceil(p.getTotalLength());
      p.parentElement.parentElement.style.setProperty('--len', len);
    } catch (err) { /* fallback CSS */ }
  });

  function revealVisible() {
    document.querySelectorAll('[data-reveal]').forEach(function (el) { el.classList.add('is-in'); });
    document.querySelectorAll('[data-pencil]').forEach(function (el) { el.classList.add('is-drawn'); });
  }

  /* =======================================================
     1. REVEALS + tracé crayon
     ======================================================= */
  if (reduce) {
    revealVisible();
  } else if (hasGSAP) {
    var gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;
    gsap.registerPlugin(ScrollTrigger);
    document.documentElement.classList.add('gsap-ready');

    gsap.utils.toArray('[data-reveal]').forEach(function (section) {
      // on anime l'en-tête de section + les sous-titres/notes, PAS les <ul>
      // eux-mêmes (dont les items ont leur propre stagger ci-dessous).
      var head = section.querySelectorAll(':scope > .wrap > *:not(.menu-list)');
      var items = head.length ? head : [section];
      gsap.from(items, {
        opacity: 0, y: 24, duration: 0.7, ease: 'power3.out', stagger: 0.06,
        scrollTrigger: { trigger: section, start: 'top 85%', once: true }
      });
    });

    /* Stagger léger sur les items de menu : chaque liste se révèle une fois,
       décalage max 0.04s/item pour un feel "on parcourt la carte" sans lourdeur. */
    gsap.utils.toArray('.menu-list').forEach(function (list) {
      var items = list.querySelectorAll(':scope > .menu-item');
      if (!items.length) return;
      gsap.from(items, {
        opacity: 0, y: 16, duration: 0.55, ease: 'power2.out',
        stagger: 0.04,
        scrollTrigger: { trigger: list, start: 'top 88%', once: true }
      });
    });

    document.querySelectorAll('[data-pencil]').forEach(function (sep) {
      ScrollTrigger.create({ trigger: sep, start: 'top 88%', once: true, onEnter: function () { sep.classList.add('is-drawn'); } });
    });

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    }
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  } else if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in', 'is-drawn');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
    document.querySelectorAll('[data-reveal], [data-pencil]').forEach(function (el) { io.observe(el); });
  } else {
    revealVisible();
  }

  /* =======================================================
     2. MENU MOBILE (overlay, focus trap, Échap) — VANILLA
     ======================================================= */
  var burger = document.querySelector('[data-burger]');
  var overlay = document.getElementById('menu-overlay');
  var closeBtn = overlay ? overlay.querySelector('[data-close]') : null;
  var lastFocus = null;

  function focusables() { return overlay.querySelectorAll('a[href], button:not([disabled])'); }

  function openMenu() {
    if (!overlay) return;
    lastFocus = document.activeElement;
    overlay.hidden = false;
    void overlay.offsetWidth;
    overlay.classList.add('is-open');
    burger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    var f = focusables(); if (f.length) f[0].focus();
  }
  function closeMenu() {
    if (!overlay) return;
    overlay.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    var done = function () { overlay.hidden = true; overlay.removeEventListener('transitionend', done); };
    if (reduce) { done(); } else { overlay.addEventListener('transitionend', done); }
    if (lastFocus) lastFocus.focus();
  }

  if (burger && overlay) {
    burger.addEventListener('click', openMenu);
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);
    document.addEventListener('keydown', function (e) {
      if (overlay.hidden) return;
      if (e.key === 'Escape') { closeMenu(); return; }
      if (e.key === 'Tab') {
        var f = focusables(); if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* =======================================================
     3. STICKY BAR MOBILE (Réserver / Appeler)
     Sur la page carte, il n'y a pas de hero .couverture : on prend
     l'en-tête .carte-header comme repère. La barre apparaît une fois
     l'en-tête sorti et se masque quand le CTA final est visible.
     CSS restreint l'affichage à ≤780px.
     ======================================================= */
  (function initStickyActions() {
    var bar = document.querySelector('[data-sticky-actions]');
    if (!bar) return;
    var cover = document.querySelector('.carte-header');
    if (!cover) return;
    if (!('IntersectionObserver' in window)) return;

    bar.hidden = false;
    // Reste visible tout le long une fois l'en-tête passé (demande user).
    var coverIO = new IntersectionObserver(function (entries) {
      var visible = !entries[0].isIntersecting;
      bar.classList.toggle('is-visible', visible);
      // D2 : masque le CTA du header sur mobile quand la sticky bar est là
      // (cohérent avec la home, CSS partagée ≤780px .sticky-active .header-cta).
      document.documentElement.classList.toggle('sticky-active', visible);
    }, { threshold: 0, rootMargin: '-10% 0px 0px 0px' });
    coverIO.observe(cover);
  })();
})();

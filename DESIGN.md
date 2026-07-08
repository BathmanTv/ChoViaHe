---
version: 1.0
name: ChoViaHe-carnet-de-voyage
description: Design system du site Chợ Vỉa Hè (restaurant de cuisine de rue vietnamienne, Toulouse). Concept — le site EST le carnet de voyage de la famille. Fond papier chaud avec grain et trame de lignes carnet, illustrations crayon de couleur d'Oriane posées sur le papier (jamais en plein cadre), photos réelles rares et plein cadre en contrepoint. Le jaune néon du lieu réel est réservé aux grands moments (CTA, section "Le Lieu"). Hiérarchie 70% papier / 25% encres illustration / 5% éclats néon. Feel motion calme et artisanal ("on feuillette"), jamais clinquant.

colors:
  papier: "#F7F2E9"          # fond global — jamais de blanc pur
  papier-ombre: "#EFE6D6"    # cartes, encarts
  encre: "#1E1A17"           # texte courant — jamais de noir pur (contraste 14:1)
  encre-doux: "#4a423a"      # texte secondaire
  framboise: "#C0264B"       # marque n°1 — titres h2, prix, liens. AA en gros texte sur papier (5.2:1), PAS en corps <18px
  orange: "#E9531F"          # RÉSERVE (défini, pas encore employé dans le code)
  bleu-lanterne: "#1E6E8C"   # annotations manuscrites, kicker, focus
  vert-coriandre: "#2E7D32"  # RÉSERVE — touches végétales, jamais en aplat large
  jaune-neon: "#F2B300"      # ACCENT RARE — CTA Réserver + section Le Lieu uniquement. Texte = encre, JAMAIS blanc sur jaune
  rouge-neon: "#E4002B"      # glow décoratif néon uniquement, jamais du texte
  ligne-carnet: "rgba(30,110,140,0.10)"  # trame horizontale 32px du papier

typography:
  # 3 familles, self-hosted (docs/fonts/), subsets latin + vietnamese OBLIGATOIRES
  # (diacritiques ợ ỉ ệ ắ — toute nouvelle fonte doit être testée sur "Chợ Vỉa Hè phở bún chả")
  display:
    fontFamily: "Lora, Georgia, serif"
    usage: "h1/h2/h3, wordmark, noms viet"
    italique: "disponible en 400 ET 600 (fichiers lora-400i/600i chargés) — ne jamais demander une graisse italique non chargée: le navigateur synthétise un faux oblique, laid sur les diacritiques viet"
    h1: { fontSize: "clamp(2.6rem, 1.2rem + 9vw, 7rem)", fontWeight: 600, lineHeight: 1.02, mobile: "clamp(2.2rem, 1rem + 8vw, 4rem)" }
    h2: { fontSize: "clamp(1.8rem, 1.2rem + 3.2vw, 3rem)", fontWeight: 600, color: framboise, letterSpacing: "-0.01em" }
  hand:
    fontFamily: "Dancing Script, Segoe Script, cursive"
    fontWeight: 600
    usage: "STRICTEMENT LIMITÉ — numéros de page (pg. 0X), annotations, légendes, questions FAQ. Jamais de corps de texte, jamais d'info critique (prix, horaires)"
    rotation: "-4deg à +3deg sur inline-block UNIQUEMENT (bloc pleine largeur pivoté = chevauchements; texte de corps pivoté = rendu flottant Windows)"
  corps:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "clamp(1rem, 0.95rem + 0.35vw, 1.12rem)"
    lineHeight: 1.65
    weights: { corps: 400, labels: 500, prix: 600 }
    prix: "tabular-nums, couleur framboise, alignés à droite avec pointillés de liaison"

tokens:
  # une valeur par rôle — jamais de radius/ombre saisis à la main (dérive constatée au benchmark)
  radius: { card: "var(--r-card) = 14px", photo: "var(--r-photo) = 14px", ui: "var(--r-ui) = 10px" }
  shadows: { card: "var(--sh-card) = 0 8px 20px rgba(30,26,23,0.08)", photo: "var(--sh-photo) = 0 12px 28px rgba(30,26,23,0.22)" }

components:
  btn-cta:
    base: "fond jaune-neon, texte encre, pill radius 999px, ombre portée dure 6px assombrie"
    hover: "translateY(-3px), halo radial jaune, ombre 9px"
    active: "translateY(0), ombre 3px"
    contrainte: "min-height 44px partout (cible tactile)"
  ink-link:
    base: "texte encre, pas de soulignement"
    hover: "souligné framboise qui se dessine (scaleX origin left 0.4s) + tache aquarelle radiale derrière"
  sticky-actions:
    quoi: "barre fixe bas d'écran ≤780px — Réserver (jaune, flex 1.3) / Appeler / Itinéraire"
    comportement: "apparaît quand le hero sort du viewport, reste ensuite; masque le CTA header (classe html.sticky-active) — UN SEUL Réserver jaune visible à la fois"
  cartes: "fond papier-ombre, radius 14px, ombre douce 0 8px 20px rgba(30,26,23,0.08), SANS rotation (texte)"
  photos: "radius 14px, ombre 0 12px 28px, rotation ±1-1.5deg (images seulement, jamais de texte), object-fit cover 2:3"
  illustrations: "PNG détourés d'Oriane posés sur le papier, jamais en fond, jamais mélangés à une photo dans le même cadre; marginalia décoratives aria-hidden, opacité 0.5-0.85. RÈGLE BINAIRE ≤780px: toute marginalia positionnée en % de bord est MASQUÉE, sauf whitelist explicitement testée à 375px sans chevauchement de texte"
  separateur-crayon: "SVG path framboise stroke 3.5, tracé stroke-dashoffset au scroll-in (--len calculé JS)"

layout:
  wrap: "max-width 1080px, padding-inline clamp(1.15rem, 5vw, 4rem)"
  sections: "chaque section = une double-page du carnet, numéro manuscrit pg. 0X bleu incliné"
  decorations-hero: "guirlande/lanternes accrochées au bord bas du header fixe (top = header-h), alignées à la colonne de contenu sur écran large (max(clamp, calc(50% - 620px)))"
  pacing: "sections papier calmes → crescendo (séparateur crayon + guirlande) → éclat jaune section Le Lieu → contact SOBRE (zéro animation à la conversion)"

motion:
  feel: "calme, artisanal — l'énergie vient des couleurs, pas de la vitesse"
  stack: "GSAP 3.12.5 + ScrollTrigger + Lenis 1.1.14 (CDN épinglés, defer). Lenis desktop only (pointer:fine), lerp 0.14. UN SEUL RAF (Lenis sur ticker GSAP)"
  signature: "le scooter d'Oriane traverse la piste au scrub — LE SENS SUIT TOUJOURS LE DESSIN (v3 regarde à droite → gauche→droite, Hà Nội haut-gauche départ, Sài Gòn bas-droite arrivée). Piste full-bleed mobile. PAS de pin (scroll-trap interdit)"
  reveals: "opacity + translateY 24px, power3.out, 0.7s, stagger 0.08, once:true (fail-to-visible)"
  regles: "transform/opacity uniquement; will-change posé/retiré par trigger, jamais permanent; prefers-reduced-motion = TOUT statique; sans JS = tout visible"

constraints:
  - "Budget page mobile < 1,5 MB; image LCP < 200 KB fetchpriority=high; AVIF+WebP 3 largeurs responsive (pipeline tools/optimize-images.mjs)"
  - "Fonts self-hosted docs/fonts/ (CNIL + perf) — jamais de <link> Google Fonts en prod"
  - "Contraste: encre sur jaune 9.2:1 OK; blanc sur jaune INTERDIT; rouge-néon jamais en texte; focus sur fond jaune = outline encre"
  - "Diacritiques viet partout dans les noms (lang=\"vi\"), variantes sans accents glissées naturellement dans les descriptions (pho, bo bun, bun cha)"
  - "Zéro scroll horizontal à 375px; alt text descriptifs réels; un seul h1; skip-link"
  - "Encodage: jamais PowerShell Get/Set-Content sur ces fichiers (mojibake cp1252) — contrôle: node tools/check-encoding.mjs"

references:
  da-page: "docs/da/ — direction artistique v1 montrable client"
  tokens-source: "docs/home.css :root"
  bibliotheque: "E:/Projets/_shared/awesome-design-md/design-md/ — étalons de spécification"
---

Ce fichier est le contrat de design du projet. Tout agent (builder, motion, reviewer, SEO)
le lit AVANT de toucher au code, au lieu de re-déduire les tokens depuis le CSS.
Le tenir à jour à chaque pivot de direction artistique.

---
version: 2.0
name: ChoViaHe-carnet-de-voyage
description: Design system du site Chợ Vỉa Hè (restaurant de cuisine de rue vietnamienne, Toulouse). Concept — le site EST le carnet de voyage de la famille. V2 (retours cliente 07.2026) — le carnet passe de DISPOSITIF à MATIÈRE: plus de numéros de page, plus de séparateurs crayon, plus de mention "carnet de voyage"; à la place, le vrai papier kraft de la carte imprimée (texture échantillonnée), les illustrations d'Oriane et de grandes photos. Le jaune du lieu déménage de la section "Le Lieu" vers le PIED DE PAGE de toutes les pages. Feel motion calme et artisanal ("on feuillette"), jamais clinquant.

colors:
  # V2 — kraft échantillonné au pixel sur la carte imprimée (voir tools/extract-texture.mjs)
  papier: "#EADCBD"          # fond global kraft (V1 était #F7F2E9, ivoire froid)
  papier-ombre: "#DFCDA6"    # cartes, encarts
  encre: "#1E1A17"           # texte courant — 12.6:1 sur kraft
  encre-doux: "#4a423a"      # texte secondaire — 7.3:1
  framboise: "#C0264B"       # titres h2 et GROS texte uniquement (4.3:1 sur kraft)
  framboise-fonce: "#A81F3F" # corps, liens, petits labels (5.3:1) — le kraft assombrit, d'où la variante
  orange: "#E9531F"          # RÉSERVE
  bleu-lanterne: "#1E6E8C"   # filets, focus, gros texte (4.25:1)
  bleu-fonce: "#17566E"      # labels, légendes, petits textes (6.0:1)
  vert-coriandre: "#2E7D32"  # code des plats végétariens (repris de la carte imprimée)
  jaune-neon: "#F2B300"      # PIED DE PAGE de toutes les pages + CTA. Encre sur jaune (9.0:1), JAMAIS blanc
  rouge-neon: "#E4002B"      # glow décoratif uniquement, jamais du texte
  ligne-carnet: "rgba(30,90,115,0.07)"  # trame 32px, adoucie (le kraft porte déjà de la matière)

texture:
  fichier: "docs/assets/papier-tile.webp (700x425, 2.2 Ko)"
  origine: "marbrures extraites de la couverture du PDF de la carte, contraste écrasé, tuile en miroir 4 quadrants"
  usage: "body::after, mix-blend-mode: overlay (le gris ~128 est neutre en overlay: il module sans assombrir). JAMAIS multiply."
  regle: "la texture doit se SENTIR, pas se voir — écart-type cible < 8"

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
  footer:
    quoi: "V2 — fond jaune sur TOUTES les pages (la signature de marque répétée). 2 colonnes (infos pratiques / navigation) + illustration d'Oriane ancrée en bas à droite pour l'habiter"
    piege: "le CTA Réserver est jaune → sur fond jaune il disparaît. Dans le footer il passe en .btn-cta--ink (fond encre, texte papier). Attention aussi à .footer-infos a qui surcharge la couleur par spécificité — d'où .footer-infos .btn-cta--ink"
  SUPPRIMÉS EN V2: "numéros de page manuscrits (pg. 0X), séparateurs crayon rouges (.pencil-sep + JS), annotation « le carnet de voyage d'une famille », fond jaune de la section Le Lieu"

layout:
  wrap: "max-width 1080px (--wrap-max), prose 940px (--wrap-prose), large 1240px (--wrap-wide)"
  rail: "RÈGLE MAÎTRESSE (réf. manmoi.vn): un seul rail vertical — titres, textes et boutons démarrent au même x. Colonne de texte à 78% du conteneur plafonnée à 66 caractères → la gouttière droite (~22%) accueille les illustrations d'Oriane. Jamais de bouton centré sous un texte aligné à gauche, jamais deux blocs centrés consécutifs"
  diptyques: "images alternées droite / gauche / droite, de taille RIGOUREUSEMENT IDENTIQUE — seul le côté change (c'est ce qui fait rythme et pas patchwork)"
  ratios: "DEUX formats seulement, très éloignés: bandeau plein-bleed ~2.8:1 (100vw, ~55vh) et images contenues 1:1 ou 3:2. INTERDIT 4:3 et 16:9 (formats mous)"
  espacement: "rapport 5:1 — sections 80px desktop / 48px mini mobile (--sec-y), paragraphes 16px"
  ouverture: "les longs blocs s'ouvrent par 2-3 lignes courtes (<35 car.) en Dancing Script (.lede), une par paragraphe"
  decorations-hero: "guirlande/lanternes accrochées au bord bas du header fixe (top = header-h), alignées à la colonne de contenu sur écran large"
  pacing: "sections kraft → bandeau photo plein-bleed comme séparateur (remplace les traits crayon supprimés) → contact SOBRE → piste du scooter → pied de page jaune"

motion:
  feel: "calme, artisanal — l'énergie vient des couleurs, pas de la vitesse"
  stack: "GSAP 3.12.5 + ScrollTrigger + Lenis 1.1.14 (CDN épinglés, defer). Lenis desktop only (pointer:fine), lerp 0.14. UN SEUL RAF (Lenis sur ticker GSAP)"
  signature: "le scooter d'Oriane traverse la piste au scrub — LE SENS SUIT TOUJOURS LE DESSIN (v3 regarde à droite → gauche→droite, Hà Nội départ à gauche, Sài Gòn arrivée à droite). V2: la piste est descendue JUSTE AU-DESSUS DU PIED DE PAGE (demande cliente), pleine largeur. PAS de pin (scroll-trap interdit)"
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

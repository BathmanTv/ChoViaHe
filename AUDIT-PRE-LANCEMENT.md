# Audit pré-lancement — 2 septembre 2026

Quatre lentilles indépendantes (SEO technique, design, QA fonctionnelle, déploiement)
plus Lighthouse et mes propres mesures. Chaque affirmation chiffrée ci-dessous a été
contre-vérifiée : DNS interrogé en direct, dimensions d'images lues sur les fichiers,
bug du menu reproduit, contrastes recalculés, écarts de pixels remesurés.

**Lighthouse (staging public)** — accueil mobile **78** / carte mobile **94** /
desktop **99** ; accessibilité 100 et bonnes pratiques 100 partout. Le score SEO
(66) ne tombe que sur `noindex`, qui est voulu en staging.

---

## État au 2 septembre, soir — appliqué

Feu vert donné sur tout sauf le DNS (rendez-vous OVH) et l'illustration du plateau
(aucune autre disponible). **122 modifications en quatre lots**, chacune avec son
contrôle dans le harnais : **139/139**, en local et sur l'URL publique.
Sauvegarde préalable : tag `avant-audit-2026-09-02` + archive.

| Lighthouse mobile | avant | après |
|---|---|---|
| Accueil — performance | 78 | **87** |
| Accueil — premier rendu (FCP) | 3,1 s | **1,8 s** |
| Accueil — LCP | 4,0 s | 3,8 s |
| Carte — performance | 94 | 92 |
| Accessibilité / bonnes pratiques | 100 / 100 | 100 / 100 |

Le premier rendu de l'accueil a été divisé par presque deux (polices préchargées,
CDN pré-connecté). Le LCP bouge peu : il reste dominé par le rendu de la feuille
de style sur 4G simulée, et le site n'a pas de build pour l'inliner — c'est le
plafond de l'architecture statique, pas un défaut. La carte perd 2 points dans
la marge d'erreur de Lighthouse ; son CLS est monté de 0,031 à 0,046 avec le
sommaire collant (toujours « bon », seuil 0,1), corrigé par un préchargement de
la graisse 600 que je n'ai pas remesuré — une ligne, l'effet serait noyé dans
la variance.

**Non fait, volontairement** : le Place ID Google (donnée cliente), le PDF avec
couche texte (fichier source de la graphiste), l'illustration du plateau, la
navigation sans JavaScript (marginal), et le masquage du « Réserver » collant près
du bouton final — la cliente a demandé que la barre reste stable tout du long.

---

Deux colonnes dans tout ce qui suit :
- **Mécanique** : correctif sans arbitrage, je l'applique sur un mot.
- **Décision** : ça change quelque chose de visible ou ça dépend de la cliente.

---

## P0 — bloque la mise en ligne

### Décision — La zone DNS de choviahe.fr est chez Wix, pas chez OVH
Vérifié en direct : `ns12.wixdns.net` / `ns13.wixdns.net` font autorité. Mon plan
supposait une zone OVH existante — elle n'existe pas encore. Une re-délégation de
serveurs de noms passe par le registre `.fr` et se propage plus lentement qu'un
simple enregistrement. **À lancer plusieurs jours avant la date de bascule**, et à
confirmer depuis deux résolveurs publics avant de toucher au moindre enregistrement.
C'est le point à mettre à l'ordre du jour du rendez-vous OVH avec la cliente.

### Mécanique — Le menu mobile peut figer la page
Ouvrir le burger, taper un lien, retaper le burger dans les 400 ms : menu invisible,
défilement bloqué, Échap sans effet. Reproduit 4/4. Cause : `closeMenu()` pose un
`transitionend` qui cache l'overlay — s'il se déclenche après une réouverture, il
cache un menu déjà rouvert. Même code dupliqué sur la carte.
→ `home.js:391-397`, `carte.js:126-133`

### Mécanique — `/notre-histoire` redirigera vers une 404
`RewriteRule … /#histoire [R=301,L]` : sans le drapeau `NE`, Apache encode `#` en
`%23`. Deux règles concernées. → `.htaccess:32,36`

### Mécanique — La règle http→https peut boucler sur OVH
Deux conditions négatives combinées : si le proxy OVH n'envoie pas
`X-Forwarded-Proto` ET laisse `%{HTTPS}` vide sous TLS, tout boucle. Remplacer par un
test positif `=http`, qui échoue en ouvert (pas de redirection) au lieu de boucler.
→ `.htaccess:18-20`

### Mécanique — Cache d'un an sur le CSS/JS, sans aucun versionnage
`home.css` a changé une vingtaine de fois. Le premier visiteur revenant après une
future modification gardera l'ancienne feuille **un an**. Ajouter `?v=AAAAMMJJ` sur
chaque lien CSS/JS (et le faire bumper par `pre-prod.mjs`). → `.htaccess:64-65`,
les 4 pages

### Mécanique — Les mentions légales deviennent fausses à la bascule
« Aucun traceur tiers » alors que GoatCounter s'active sur choviahe.fr. Le paragraphe
correct est déjà rédigé en commentaire juste en dessous. → `mentions-legales:109-111`

### Mécanique — Les statistiques compteraient les mauvais clics
Le lien PDF contient « carte » → compté comme visite de la carte. Le lien « Lire tous
les avis » contient `google.com/maps` → compté comme itinéraire. Les deux métriques
qu'on veut suivre seraient fausses dès le jour 1. Passer par un attribut
`data-track` explicite. → `analytics.js:41-42`

---

## P1 — avant la mise en ligne

### Mécanique

- **Prix du phở désalignés** : deux cartes sur quatre passent le prix à la ligne
  (mesuré : décalage 36 px contre −4). → `carte.css:138-143, 345-352`
- **Pointillés de 735 px sur les plats** : seule la liste des tapas a la classe
  deux-colonnes ; plats, desserts et boissons ne l'ont pas. → `carte/index.html`
- **Justification dans les vignettes de plats** : colonne de 206 px, rivières de
  blanc. La demande cliente visait le texte courant, pas ces vignettes. Retirer
  `.plat-desc` de la liste. → `home.css:233`
- **Bleu sous le seuil de contraste** : `--bleu` fait 4,52:1 sur papier (limite) et
  3,94:1 sur papier-ombre (échec). Tout texte bleu sous 24 px passe en
  `--bleu-fonce` (6,39 / 5,56). → `carte.css:121-129, 229-235, 319-325`, `home.css:872`
- **Lien d'évitement inopérant** : Lenis intercepte `.skip-link` et ne déplace pas
  le focus. Exclure du sélecteur + `focus()` sur la cible. → `home.js:105-120`
- **Menu inatteignable en paysage mobile** : à 360 px de haut, « Réserver une table »
  est sous le bord, et l'overlay ne défile pas. → `home.css:438-449`
- **La page défile derrière le menu ouvert** (fenêtre étroite, souris) : Lenis ignore
  `overflow:hidden`. `lenis.stop()` à l'ouverture. → `home.js:90-101, 381, 390`
- **Zenchef bloqué = 4 s d'écran mort** (desktop) : ramener le repli à 1,2 s, état
  « Ouverture… » sur le bouton, drapeau anti double-ouverture. → `home.js:520-527`
- **Trois hauteurs d'images fausses** : `poulets` 360 déclaré / 906 réel,
  `panier-debout` 720 / 415, `velo` sur la 404 360 / 487. → `index.html:262,553`,
  `404.html:102`
- **Aucune police préchargée** : le titre attend trois allers-retours. Précharger
  Lora 600 (latin + vietnamien) et Be Vietnam Pro 400. Et **89 Ko de Lora italique
  pour deux titres** (`.lieu-title`, `.histoire-punch`) : les passer en droit.
  → `index.html:36-37`, `home.css:711,818`
- **Pas de `preconnect` vers jsdelivr** (GSAP, Lenis). Une ligne. → `index.html`
- **`text/javascript` absent** de la compression et du cache : Apache récent sert
  les `.js` ainsi. → `.htaccess:53,65`
- **Cibles tactiles sous 44 px** : logo de l'en-tête (104×20), « ← le carnet »
  (88×36), « Lire tous les avis » (202×24), liens de la 404. Le motif existe déjà
  sur les liens du pied de page. → `home.css:382,943`, `carte.css:16-25`
- **Sitemap `lastmod` périmé** (03/08 alors que la carte date du 31/08) et deux
  commentaires devenus faux : « STAGING — RETIRER » sur un script générique
  (`index.html:10`), et « le PDF est le brouillon » alors que c'est la version
  définitive (`carte/index.html:260-267`). Quelqu'un qui suit ces commentaires à
  la lettre casse le site.

### Décision

- **Hero desktop : 212 px de vide** entre le titre et le bouton « Réserver ».
  La grille répartit le surplus de hauteur de l'image entre les deux lignes.
  Correctif = envelopper titre + bouton dans une seule cellule. Change la
  composition, à voir avec toi.
- **Deux « Réserver » jaunes visibles au repos** (en-tête + héros), puis trois
  avec la barre collante en bas de page. DESIGN.md dit « un seul à la fois ».
  Correctif = masquer celui de l'en-tête tant que celui du héros est à l'écran.
- **Image de partage en portrait 1600×2399** : WhatsApp, Facebook et LinkedIn la
  recadrent au hasard ou l'ignorent. Il faut **produire** un visuel paysage
  1200×630 — quelle photo ?
- **La fiche Google n'est reliée à rien** : les liens Maps sont des recherches
  textuelles. Avec le **Place ID** (que la cliente peut trouver en 2 min), on
  pointe directement la fiche, on ajoute `hasMap`, et le lien « laisser un avis »
  devient direct. Dépend des accès.
- **H1 de la carte sans mot-clé** : « Nhật ký chuyến đi / La Carte ». Proposition :
  « La Carte — cuisine de rue vietnamienne à Toulouse ». Texte visible, à valider.
- **Hiérarchie des titres écrasée** : h1 56 px, « Un lieu, vivant, vibrant » 54 px,
  h2 48 px — trois titres framboise à ±8 px, le lieu lit au rang du H1. Remonter le
  H1, plafonner les h2. Visible, à valider.
- **Pied de page mobile** : le vélo coupe le bloc, 164 px de jaune vide. Repositionner.
- **Aucune affordance de lien** sur les trois articles de presse au tactile (seul
  le survol change la couleur). Filet permanent discret à ajouter — c'est un choix
  visuel.

---

## P2 — après la mise en ligne

- **Sommaire de la carte** : 9 646 px de défilement mobile (11 écrans), aucune
  ancre. Un bandeau collant de 6 puces sous l'en-tête. Vraie amélioration, mais
  c'est une fonctionnalité, pas un correctif.
- **PDF de la carte = 8 images** : 144 dpi, aucun texte, illisible par un lecteur
  d'écran. Régénérer avec couche texte demande le fichier source de la graphiste.
- **Poids mobile réel 1,98 Mo** en défilement complet : à dpr 3, `sizes="92vw"`
  fait choisir le palier 1600 px pour un rendu de 359 px. Ajouter un palier 1200
  et plafonner `sizes`.
- **Menu mobile sans JavaScript** : contenu intact (vérifié), mais plus de
  navigation d'en-tête. Marginal, à traiter proprement plus tard.
- **Menu = pas un dialogue** pour VoiceOver/TalkBack (`role`, `aria-modal`, `inert`).
- **404** : seule page sans pied de page jaune, 54 px de vide en bas sur mobile.
- **Illustration du plateau** : une bouteille de sriracha pour « le plateau à
  partager ». Demander un dessin de plateau à Oriane ; sinon `paniers`.
- **Marginalia à gauche** alors que DESIGN.md réserve la gouttière droite ;
  alternance des fonds de la carte cassée sur la dernière rubrique.
- `hasMap`, `BreadcrumbList`, `ReserveAction` dans le JSON-LD ; HSTS à activer une
  fois HTTPS stable ; un ping de disponibilité gratuit.

---

## Écarté

- **Plan de rollback DNS + tag `prod-*`** : oui pour le tag (il est déjà dans le
  process), mais le « rollback » c'est repointer les NS vers Wix — une ligne dans
  MISE-EN-LIGNE.md, pas un chantier.
- **`lastmod` conditionnel au contenu** : sur trois URLs, on le fait à la main.
- **Test via fichier hosts avant bascule DNS** : juste, mais lourd pour la cliente ;
  la vraie vérification se fera le jour J sur l'URL réelle, Wix restant actif.

---

## Ce que ça donne

**24 correctifs mécaniques**, dont 6 bloquants. Aucun ne change ce que la cliente
voit, sauf pour le rendre correct. Un mot et je les applique, harnais rejoué
derrière, en un seul commit.

**8 décisions**, dont une qui ne dépend que d'elle (le DNS) et deux qui demandent
un contenu (l'image de partage, le Place ID). Le reste, c'est de la composition :
je propose, tu tranches.

Le site est **sain** : accessibilité et bonnes pratiques à 100, aucune erreur
console, CLS nul, tous les liens en 200. Ce qui reste est du réglage — et un DNS
à lancer cette semaine.

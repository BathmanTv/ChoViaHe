# Mise en ligne de choviahe.fr — plan complet

Objectif : le site est en ligne sur le vrai domaine **début août**, pour que Google ait
le temps de le réindexer avant l'ouverture officielle du **1er septembre**.

Le lancement du site et l'ouverture du restaurant ne sont pas la même date, et c'est
volontaire. Google met deux à six semaines à digérer un changement de site. Attendre le
1er septembre, c'est se retrouver invisible pendant tout le mois de septembre.

---

## Où on en est

**Prêt et vérifié**

- Les deux pages publiques (accueil + carte), la page mentions légales, la page 404
- La carte complète en HTML avec les prix — c'est la page la plus consultée d'un restaurant
- Les données structurées que Google lit : fiche restaurant, carte plat par plat avec les
  prix, questions-réponses. C'est ce qui alimente les résultats enrichis et les résumés IA
- Adresse, téléphone et horaires strictement identiques entre le site, les données
  structurées et le site Wix actuel — je l'ai vérifié, aucune divergence
- Images optimisées (AVIF + WebP, trois largeurs), polices hébergées chez nous
  (pas de requête vers Google Fonts : exigence CNIL)
- Mesure d'audience sans cookie, donc **pas de bandeau de consentement** à afficher
- `robots.txt`, `sitemap.xml`, favicons, page 404 maison
- Mentions légales conformes (SIRET, gérants, directrice de publication)

**Créé aujourd'hui**

- `docs/.htaccess` — force `https://www.choviahe.fr` en une seule adresse, redirige les
  anciennes pages Wix, active compression et cache
- `tools/pre-prod.mjs` — une commande qui bascule le site de "invisible pour Google" à
  "indexable" et contrôle qu'il ne reste pas de bloquant

**Encore bloqué**

- Le PDF de la carte est un brouillon (il contient des « BLA BLA BLA »)
- Trois prix manquants : cà phê sữa đá, trà đá, trà tắc
- Le compte de mesure d'audience n'existe pas encore
- Pas encore d'avis Google affichés sur le site

---

## Phase 1 — L'hébergement (à faire en premier, tout le reste en dépend)

Le domaine `choviahe.fr` est déjà chez OVH. Il manque l'hébergement.

- Prendre une offre **OVH Perso** (environ 6 €/mois). Le site est statique, il n'y a ni
  base de données ni code serveur : la plus petite offre suffit largement.
- Dans l'espace client OVH, associer le domaine `choviahe.fr` à cet hébergement
  (« multisite »), avec `www.choviahe.fr` en domaine principal.
- Activer le **certificat SSL gratuit** (Let's Encrypt) fourni par OVH. Sans lui, le
  navigateur affiche « site non sécurisé » et Google déclasse.
- Compter jusqu'à 24 h de propagation DNS. C'est la seule étape qu'on ne peut pas accélérer,
  d'où l'importance de la lancer tôt.

Le transfert des fichiers se fait en FTP (identifiants fournis par OVH) : on envoie tout le
contenu du dossier `docs/` à la racine de l'hébergement, **fichier `.htaccess` compris** —
c'est un fichier caché, beaucoup de logiciels FTP ne l'affichent pas par défaut.

---

## Phase 2 — La bascule, dans cet ordre

| Ordre | Action | Pourquoi cet ordre |
|---|---|---|
| 1 | `node tools/pre-prod.mjs` | Rend le site indexable et signale les bloquants restants |
| 2 | Relire ce que la commande affiche | Elle refuse de dire « OK » s'il reste un problème |
| 3 | Envoyer les fichiers en FTP | Le site est en ligne mais Wix répond encore |
| 4 | Vérifier sur son téléphone : réserver, appeler, itinéraire | Ce sont les 3 seules actions qui comptent |
| 5 | Basculer le DNS de Wix vers OVH | À partir de là, le vrai site répond |
| 6 | Tester les anciennes adresses Wix | Elles doivent rediriger, pas afficher une erreur |
| 7 | Search Console (phase 3) | Google apprend l'existence du nouveau site |
| 8 | Fiche Google Business (phase 4) | Le levier principal |

**Les anciennes adresses à tester après la bascule** — chacune doit atterrir sur le
nouveau site sans page d'erreur :

- `choviahe.fr/menu` → doit arriver sur la carte
- `choviahe.fr/copie-de-menu` → doit arriver sur la carte
- `choviahe.fr/notre-histoire` → doit arriver sur l'histoire, en page d'accueil
- `choviahe.fr` sans le `www` → doit basculer sur `www.choviahe.fr`
- `http://` sans le `s` → doit basculer en `https://`

Ces redirections existent pour une raison simple : le site Wix est référencé depuis des
mois. Sans elles, tout ce capital est perdu et les visiteurs tombent sur une page d'erreur.

**Ne pas fermer le compte Wix tout de suite.** Garder un mois, le temps d'être sûr que rien
n'a été oublié.

---

## Phase 3 — Google Search Console

C'est l'outil gratuit de Google qui montre sur quelles recherches le site apparaît, à
quelle position, et signale les problèmes. Gratuit, indispensable, 20 minutes.

- Aller sur `search.google.com/search-console`, ajouter la propriété **`choviahe.fr`**
  en type « Domaine » (pas « Préfixe d'URL » : le type Domaine couvre le `www`, le non-`www`
  et le `http` d'un coup).
- Google demande de prouver la propriété via un enregistrement DNS **TXT** à ajouter dans
  la zone DNS OVH. C'est un copier-coller, la validation prend quelques minutes.
- Soumettre le sitemap : `https://www.choviahe.fr/sitemap.xml`
- Dans « Inspection d'URL », demander l'indexation de l'accueil puis de la carte.
  Ça accélère la prise en compte de quelques jours.
- Créer aussi la propriété pour l'**ancien** site Wix si un accès existe, et y déclarer le
  changement d'adresse. Si l'accès Wix est perdu, les redirections `.htaccess` font le
  travail toutes seules, simplement un peu plus lentement.

**À surveiller les deux premières semaines** : la courbe des impressions doit monter, et
l'onglet « Pages » ne doit signaler aucune erreur d'exploration.

---

## Phase 4 — La fiche Google Business (le vrai levier)

70 % des réservations passent déjà par là. Une heure de travail sur cette fiche rapporte
plus qu'une journée de développement. C'est le point le plus important de tout ce document.

**Le jour de la bascule**

- Changer le champ « Site web » de la fiche : il doit pointer vers `https://www.choviahe.fr`
- Changer le champ « Menu » : il doit pointer vers `https://www.choviahe.fr/carte/`
  (la page HTML, pas le PDF — Google lit la page, il ne lit pas bien un PDF)
- Vérifier le bouton « Réserver » : il doit ouvrir Zenchef

**Les informations doivent être identiques au caractère près** entre la fiche, le site et
Instagram. Une divergence sur le numéro ou les horaires fait perdre de la confiance à Google
et du classement. Voici la version de référence :

- Nom : **Chợ Vỉa Hè**
- Adresse : **8 rue de Metz, 31000 Toulouse**
- Téléphone : **05 62 85 83 92**
- Horaires : **mardi à samedi, 12h00–14h30 et 19h00–22h30**
- Catégorie principale : **Restaurant vietnamien**
- Catégories secondaires : *Restaurant de cuisine de rue*, *Restaurant asiatique*

**Le contenu qui fait la différence**

- Une vingtaine de photos, dont les plats les plus vendus. Les photos de plats génèrent
  beaucoup plus de clics que les photos de salle.
- Renseigner les attributs : végétarien, à emporter, sur place, accès handicapé,
  paiement par carte. Ce sont eux qui font apparaître la fiche sur les recherches
  filtrées (« restaurant végétarien Toulouse »).
- Publier un « Post » à l'ouverture (nouvelle carte de la rentrée). C'est gratuit et ça
  remonte la fiche.

**Les avis, c'est le point critique.** Les moteurs de recherche et les résumés IA
s'appuient massivement dessus. Concrètement : un QR code sur l'addition qui mène
directement au formulaire d'avis, et répondre à **tous** les avis, y compris les mauvais.
Le volume et la fraîcheur comptent plus que la note.

Quand il y aura une dizaine d'avis, on ajoutera la note et deux ou trois témoignages
sur le site, avec le balisage qui fait apparaître les étoiles dans Google.

---

## Phase 5 — Après la mise en ligne

**La semaine du lancement**

- Créer le compte de mesure d'audience sur `goatcounter.com` avec le code **`choviahe`**.
  Le code du site est déjà en place et attend ce compte. Sans cookie, donc sans bandeau.
- Vérifier depuis un vrai téléphone que les clics « Réserver », « Appeler » et
  « Itinéraire » sont bien comptés.

**Le premier mois**

- Mettre à jour les horaires sur la fiche Google pour toute fermeture exceptionnelle.
  Un client devant une porte close laisse un mauvais avis.
- Regarder dans Search Console sur quelles recherches le site sort. Les surprises de ce
  rapport valent plus que toutes les suppositions.
- Remplacer le PDF brouillon par la version définitive dès qu'elle existe.

**Plus tard, si ça vaut le coup**

- La version anglaise, en pages statiques séparées. Zone touristique, ça se justifie.
- Le vietnamien après. C'est une question de fierté familiale, elle se respecte en la
  séquençant, pas en la supprimant.

---

## Ce dont j'ai besoin de la cliente

Rien ici ne bloque la mise en ligne — le site peut partir sans. Mais chaque élément manquant
est une occasion perdue.

- Le PDF **définitif** de la carte (celui d'aujourd'hui contient des « BLA BLA BLA »)
- Les trois prix manquants : cà phê sữa đá, trà đá, trà tắc
- Confirmation de la colonne de prix des boissons chaudes (2 / 2,50 / 4,50 / 4,50)
- Les accès à la fiche Google Business, ou une session de 30 minutes ensemble dessus
- Le logo en version vectorielle
- Le texte de l'histoire familiale, si elle veut compléter

---

## Les commandes

Basculer en production :

```bash
node tools/pre-prod.mjs
```

Revenir en staging (site invisible pour Google) :

```bash
node tools/pre-prod.mjs --revert
```

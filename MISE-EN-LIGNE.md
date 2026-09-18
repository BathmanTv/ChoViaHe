# Mise en ligne de choviahe.fr — plan complet

Objectif : le site est en ligne sur le vrai domaine **le plus tôt possible**, pour que
Google ait le temps de le réindexer. Google met deux à six semaines à digérer un
changement de site — chaque semaine gagnée sur la bascule, c'est une semaine de
visibilité en plus pendant la rentrée.

---

## Où on en est — 18 septembre

**Le dossier de production est prêt : `dist-ovh/`** (fabriqué par `node tools/pre-prod.mjs`)

- 11 Mo, 123 fichiers. Les pages publiques y sont indexables, `docs/` (l'aperçu GitHub)
  reste invisible pour Google : pas de doublon.
- 145 contrôles automatiques passés sur ce dossier, PC et mobile. Aucune image ni
  ressource manquante sur 4 pages × 3 largeurs d'écran × 3 densités de pixels.
- Carte du 18/09 (Phở : 2 déclinaisons), logo officiel en SVG, textes du teaser validés.
- Mesure d'audience GoatCounter : compte créé, s'active seule sur choviahe.fr.
- `.htaccess` : redirections des anciennes adresses Wix, https et www forcés
  **uniquement sur choviahe.fr** (l'adresse technique OVH reste testable avant le DNS).

**Encore en attente, côté cliente**

- **Le domaine** — il reste chez Wix (décision du 15/09) : pointage DNS vers OVH (phase 0)
- **La résiliation de Wix Premium** avant son renouvellement du 3 novembre 2026
- Les accès à la fiche Google Business : Place ID pour relier le site à la fiche, note
  et nombre d'avis à afficher
- ~~Le logo vectoriel~~ : reçu le 18/09 (.ai), intégré en SVG

---

## Phase 0 — Le domaine est chez Wix : à régler avant tout le reste

**Corrigé le 15 septembre, vérifié dans le compte Wix et au registre `.fr`.** Le plan
partait du principe que choviahe.fr était déjà chez OVH. C'est faux :

| Élément | Constat |
|---|---|
| Registraire | **EPAG Domainservices** (le prestataire de domaines de Wix) |
| Où il se gère | compte Wix choviahe.toulouse@gmail.com, rubrique Domaines |
| Expiration | 19 juillet 2027 (renouvellement Wix prévu le 19 juin 2027) |
| Serveurs de noms | ns12 / ns13.wixdns.net |
| E-mail sur le domaine | aucun (MX vide) — rien à migrer |

**Et un point d'argent :** l'abonnement **Wix Premium Light** se renouvelle le
**3 novembre 2026**. Une fois le nouveau site en ligne, il ne sert plus à rien : à
résilier avant cette date.

### Décision du 15 septembre : le domaine reste chez Wix

On ne transfère pas le domaine pour le moment. Le site est hébergé chez OVH, et on
fait **pointer choviahe.fr depuis la zone DNS de Wix** vers cet hébergement. Rien ne
bouge côté registraire, Wix continue de renouveler le domaine.

Ordre qui ne coupe jamais le site :

1. **Hébergement OVH** : prendre l'offre, y déposer le site (phase 1), le tester sur
   l'adresse technique fournie par OVH. Wix sert toujours l'ancien site.
2. **Déclarer choviahe.fr dans l'hébergement OVH** (rubrique Multisite), en domaine
   « externe ». OVH affiche alors deux valeurs à recopier chez Wix : l'**adresse IP**
   de l'hébergement et un enregistrement **TXT `ovhcontrol`** qui prouve qu'on possède
   le domaine.
3. **Chez Wix, « Gérer les enregistrements DNS »** sur choviahe.fr :
   - ajouter le TXT `ovhcontrol` donné par OVH ;
   - rubrique **A (Hôte)** : il y a **trois** lignes `choviahe.fr` (185.230.63.171,
     .186 et .107). En modifier une avec l'IP OVH et **supprimer les deux autres** —
     sinon une partie des visiteurs tomberait encore sur Wix ;
   - remplacer le **CNAME `www`** (aujourd'hui `cdn3.wixdns.net`) pour qu'il pointe vers
     l'hébergement OVH.
   Vérifié le 15/09 dans le compte : ces lignes sont bien modifiables (bouton « … »
   sur chaque ligne, « Ajouter un enregistrement » pour le TXT).
   Si Wix refuse malgré tout de modifier ces lignes tant que le domaine est « connecté » au site
   Wix, il faut d'abord le détacher (« Retirer de ce site ») — à faire juste avant, car
   l'ancien site cesse alors de répondre sur ce domaine.
4. **Certificat SSL** : l'activer dans OVH une fois que le domaine pointe dessus
   (Let's Encrypt a besoin que le domaine réponde depuis OVH).
5. **Vérification** — tant que la réponse montre des adresses Wix, on attend :

```bash
nslookup choviahe.fr 8.8.8.8
nslookup www.choviahe.fr 8.8.8.8
```

6. **Résiliation** : une fois le site stable sur OVH, résilier **uniquement « Forfait
   Premium Light »** (renouvellement 3 novembre 2026). **Ne pas toucher à l'abonnement
   « Domaine »** : c'est lui qui garde choviahe.fr.

**Retour arrière** : remettre chez Wix l'enregistrement A et le CNAME d'origine
(3 IP 185.230.63.x et `cdn3.wixdns.net`). Tant que Premium n'est pas résilié, l'ancien
site revient.

**Plus tard, si on veut tout regrouper** : le menu du domaine Wix propose « Transférer
en dehors de Wix ». Transfert d'un `.fr` vers OVH en moins d'une journée, quand le
client le décidera.

## Phase 1 — L'hébergement

Le domaine est encore chez Wix (voir phase 0). L'hébergement, lui, se prend chez OVH dès maintenant.

- Prendre une offre **OVH Perso** (environ 6 €/mois). Le site est statique, il n'y a ni
  base de données ni code serveur : la plus petite offre suffit largement.
- Dans l'espace client OVH, associer le domaine `choviahe.fr` à cet hébergement
  (« multisite »), avec `www.choviahe.fr` en domaine principal.
- Activer le **certificat SSL gratuit** (Let's Encrypt) fourni par OVH. Sans lui, le
  navigateur affiche « site non sécurisé » et Google déclasse.
- Compter jusqu'à 24 h de propagation DNS. C'est la seule étape qu'on ne peut pas accélérer,
  d'où l'importance de la lancer tôt.

Le transfert des fichiers se fait en FTP, avec FileZilla (identifiants fournis par OVH, à
saisir soi-même, jamais dans une conversation) :

1. `node tools/pre-prod.mjs` → fabrique `dist-ovh/`, doit finir par « Aucun bloquant ».
2. FileZilla : Serveur `ftp.clusterXXX.hebergement.com` (indiqué par OVH), port 21.
3. À droite, ouvrir le dossier **`www`** et supprimer la page d'attente d'OVH qui s'y trouve.
4. À gauche, ouvrir `E:\Projets\ChoViaHe\dist-ovh`, **tout sélectionner** (Ctrl+A) et
   glisser dans `www`. Le contenu, pas le dossier `dist-ovh` lui-même.
5. Vérifier que **`.htaccess`** est bien arrivé : c'est un fichier caché. Dans FileZilla,
   menu Serveur → « Forcer l'affichage des fichiers cachés ».
6. Ouvrir l'adresse technique OVH (`choviahe.clusterXXX.hosting.ovh.net`) : le site doit
   s'afficher. Wix sert toujours choviahe.fr à ce stade, personne ne voit rien.

---

## Phase 2 — La bascule, dans cet ordre

| Ordre | Action | Pourquoi cet ordre |
|---|---|---|
| 1 | `node tools/pre-prod.mjs`, puis `git tag prod-AAAA-MM-JJ` | On sait exactement quelle version part en ligne |
| 2 | Envoyer `dist-ovh/` en FTP (phase 1) | Le site existe chez OVH, Wix répond encore |
| 3 | Tester sur l'adresse technique OVH | On voit le vrai site avant tout le monde |
| 4 | OVH : Multisite → ajouter `choviahe.fr` et `www.choviahe.fr` (domaine externe) | OVH donne l'IP et le TXT `ovhcontrol` |
| 5 | Wix : TXT `ovhcontrol`, 1 A modifié + 2 supprimés, CNAME `www` (phase 0) | À partir de là, le vrai site répond |
| 6 | `nslookup` jusqu'à ne plus voir d'IP Wix, puis activer le SSL dans OVH | Let's Encrypt a besoin du DNS déjà basculé |
| 7 | Sur téléphone : réserver, appeler, itinéraire, + anciennes adresses Wix | Les 3 actions qui comptent, et le référencement acquis |
| 8 | Search Console (phase 3), fiche Google (phase 4) | Google apprend l'existence du nouveau site |
| 9 | Résilier **Premium Light** seul, avant le 3 nov. | Plus rien ne sert chez Wix, sauf le domaine |

**Si `http://` ne bascule pas en `https://`** après l'étape 6 : la règle du `.htaccess`
échoue volontairement en ouvert (jamais de boucle). Dans ce cas, activer l'option
« HTTPS » / redirection dans l'espace OVH du multisite, ou me le signaler.

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
n'a été oublié. Avant de le couper : exporter la liste des pages indexées (Search Console
de l'ancienne propriété, ou le `sitemap.xml` Wix) pour vérifier qu'aucune URL ne manque
aux redirections du `.htaccess`.

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

- Vérifier depuis un vrai téléphone que les clics « Réserver », « Appeler » et
  « Itinéraire » sont bien comptés.

**Le premier mois**

- Une fois le HTTPS confirmé stable, activer HSTS : décommenter la ligne
  `Strict-Transport-Security` dans le `.htaccess`.
- Poser un ping de disponibilité gratuit (UptimeRobot ou équivalent) sur
  `https://www.choviahe.fr/` — on est prévenu avant les clients.

- Mettre à jour les horaires sur la fiche Google pour toute fermeture exceptionnelle.
  Un client devant une porte close laisse un mauvais avis.
- Regarder dans Search Console sur quelles recherches le site sort. Les surprises de ce
  rapport valent plus que toutes les suppositions.

**Plus tard, si ça vaut le coup**

- La version anglaise, en pages statiques séparées. Zone touristique, ça se justifie.
- Le vietnamien après. C'est une question de fierté familiale, elle se respecte en la
  séquençant, pas en la supprimant.

---

## Ce dont j'ai besoin de la cliente

Rien ici ne bloque la mise en ligne — le site peut partir sans. Mais chaque élément manquant
est une occasion perdue.

- Les accès à la fiche Google Business, ou une session de 30 minutes ensemble dessus
- Le texte de l'histoire familiale, si elle veut compléter

---

## Les commandes

Fabriquer le dossier de production `dist-ovh/` (à renvoyer en FTP à chaque mise à jour) :

```bash
node tools/pre-prod.mjs
```

`docs/` n'est jamais modifié par cette commande : l'aperçu GitHub reste en noindex.
Vérifier le dossier avant envoi (dans un autre terminal : `npx --yes serve dist-ovh -l 4325`) :

```bash
SITE_URL="http://localhost:4325" python tools/verif-retours.py
```

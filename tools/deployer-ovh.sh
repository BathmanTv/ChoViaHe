#!/bin/bash
# Envoie dist-ovh/ dans www/ chez OVH, en SFTP, avec les identifiants enregistrés
# par tools/ovh-identifiants.sh (~/.netrc : le mot de passe n'est jamais affiché).
#   wsl -d Ubuntu bash /mnt/e/Projets/ChoViaHe/tools/deployer-ovh.sh           simulation : liste ce qui changerait
#   wsl -d Ubuntu bash /mnt/e/Projets/ChoViaHe/tools/deployer-ovh.sh --go      envoi réel (miroir exact, supprime
#                                                                              sur le serveur ce qui n'est plus dans dist-ovh/)
#   wsl -d Ubuntu bash /mnt/e/Projets/ChoViaHe/tools/deployer-ovh.sh --sonde   envoie seulement tools/sonde-ovh.php
#                                                                              (le prochain --go la supprime)
# Toujours lancer `node tools/pre-prod.mjs` avant.
set -eu
HOTE=ftp.cluster131.hosting.ovh.net
PROJ=/mnt/e/Projets/ChoViaHe
grep -q "^machine $HOTE " ~/.netrc 2>/dev/null || { echo "Identifiants absents : lancer d'abord tools/ovh-identifiants.sh"; exit 2; }
[ -f "$PROJ/dist-ovh/.htaccess" ] && [ -f "$PROJ/dist-ovh/index.html" ] || { echo "dist-ovh/ incomplet : lancer node tools/pre-prod.mjs"; exit 2; }
LOGIN=$(awk -v h="$HOTE" '$1=="machine" && $2==h {print $4}' ~/.netrc)
BASE="set sftp:auto-confirm yes; set net:max-retries 2; set net:timeout 30; set cmd:fail-exit yes"
# .ovhconfig (réglages PHP d'OVH) et .well-known (validation SSL) ne viennent pas de nous : jamais supprimés.
MIROIR="mirror -R --delete --parallel=4 --exclude-glob .ovhconfig --exclude .well-known/ $PROJ/dist-ovh/ www/"

case "${1:-}" in
  --go)    lftp -e "$BASE; $MIROIR --verbose; bye" "sftp://$LOGIN@$HOTE" ;;
  --sonde) lftp -e "$BASE; put $PROJ/tools/sonde-ovh.php -o www/sonde-ovh.php; bye" "sftp://$LOGIN@$HOTE" && echo "Sonde envoyée." ;;
  "")      echo "SIMULATION (rien n'est envoyé) :"; lftp -e "$BASE; $MIROIR --dry-run; bye" "sftp://$LOGIN@$HOTE" ;;
  *)       echo "Option inconnue : $1"; exit 2 ;;
esac

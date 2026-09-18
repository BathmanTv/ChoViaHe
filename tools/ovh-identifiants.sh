#!/bin/bash
# À lancer UNE fois, par toi, dans ton propre terminal (jamais par Claude) :
#     wsl -d Ubuntu bash /mnt/e/Projets/ChoViaHe/tools/ovh-identifiants.sh
# Demande le mot de passe FTP OVH sans l'afficher et l'enregistre dans ~/.netrc
# (lisible par ton compte WSL seulement). tools/deployer-ovh.sh s'en sert ensuite
# sans que le mot de passe apparaisse nulle part.
# Pour changer de mot de passe plus tard : relancer ce script.
set -eu
HOTE=ftp.cluster131.hosting.ovh.net
read -r -p "Identifiant FTP OVH [upwwidd] : " LOGIN; LOGIN=${LOGIN:-upwwidd}
read -r -s -p "Mot de passe FTP OVH (rien ne s'affiche, c'est normal) : " MDP; echo
[ -n "$MDP" ] || { echo "Mot de passe vide, rien enregistré."; exit 1; }
touch ~/.netrc; chmod 600 ~/.netrc
grep -v "^machine $HOTE " ~/.netrc > ~/.netrc.tmp || true
printf 'machine %s login %s password %s\n' "$HOTE" "$LOGIN" "$MDP" >> ~/.netrc.tmp
mv ~/.netrc.tmp ~/.netrc; chmod 600 ~/.netrc; unset MDP
echo "Enregistré. Test de connexion (liste du dossier www) :"
lftp -e "set sftp:auto-confirm yes; set net:max-retries 1; set net:timeout 20; cls -1 www | head -5; bye" "sftp://$LOGIN@$HOTE" \
  && echo "Connexion OK." || echo "ÉCHEC : mot de passe ou identifiant refusé. Relancer le script."

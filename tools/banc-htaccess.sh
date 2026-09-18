#!/bin/bash
# Banc d'essai du .htaccess dans un vrai Apache 2.4 (WSL Ubuntu, apache2 installé).
#   wsl -d Ubuntu -u root -- bash /mnt/e/Projets/ChoViaHe/tools/banc-htaccess.sh [fichier.htaccess]
# Sert dist-ovh/ avec le .htaccess donné (défaut : docs/.htaccess) et rejoue les cas
# du proxy OVH (TLS terminé devant Apache -> en-tête X-Forwarded-Proto).
# Sortie : une ligne par cas, OK/ECHEC, code et Location obtenus. Code 1 s'il y a un échec.
set -u
PROJ=/mnt/e/Projets/ChoViaHe
HT=${1:-$PROJ/docs/.htaccess}
ROOT=/tmp/banc-choviahe; PORT=8089
rm -rf "$ROOT"; cp -r "$PROJ/dist-ovh" "$ROOT"; cp "$HT" "$ROOT/.htaccess"
cat > /tmp/banc.conf <<EOF
ServerRoot /etc/apache2
Listen 127.0.0.1:$PORT
PidFile /tmp/banc.pid
ErrorLog /tmp/banc-error.log
LoadModule mpm_prefork_module /usr/lib/apache2/modules/mod_mpm_prefork.so
LoadModule authz_core_module /usr/lib/apache2/modules/mod_authz_core.so
LoadModule dir_module /usr/lib/apache2/modules/mod_dir.so
LoadModule mime_module /usr/lib/apache2/modules/mod_mime.so
LoadModule rewrite_module /usr/lib/apache2/modules/mod_rewrite.so
LoadModule headers_module /usr/lib/apache2/modules/mod_headers.so
LoadModule expires_module /usr/lib/apache2/modules/mod_expires.so
LoadModule deflate_module /usr/lib/apache2/modules/mod_deflate.so
LoadModule filter_module /usr/lib/apache2/modules/mod_filter.so
TypesConfig /etc/mime.types
User www-data
Group www-data
DocumentRoot $ROOT
<Directory $ROOT>
  AllowOverride All
  Require all granted
</Directory>
EOF
/usr/sbin/apache2 -f /tmp/banc.conf -k stop >/dev/null 2>&1; sleep 0.5
/usr/sbin/apache2 -f /tmp/banc.conf -k start || { cat /tmp/banc-error.log; exit 2; }
sleep 0.5

echec=0
# cas <chemin> <Host> <X-Forwarded-Proto|-> <code attendu> <Location attendue|->
cas() {
  local h=(-H "Host: $2"); [ "$3" != "-" ] && h+=(-H "X-Forwarded-Proto: $3")
  local r; r=$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' "${h[@]}" "http://127.0.0.1:$PORT$1")
  local code=${r%% *} loc=${r#* }; [ -z "$loc" ] && loc=-
  if [ "$code" = "$4" ] && [ "$loc" = "$5" ]; then printf 'OK     '; else printf 'ECHEC  '; echec=1; fi
  printf '%-22s %-40s %-6s -> %s %s   (attendu %s %s)\n' "$1" "$2 ${3/-/sans-proxy}" "" "$code" "$loc" "$4" "$5"
}
W=www.choviahe.fr; N=choviahe.fr; T=choviahe.cluster100.hosting.ovh.net; H=https://www.choviahe.fr
cas /menu               $N http  301 $H/carte/
cas /copie-de-menu      $N http  301 $H/carte/
cas /notre-histoire     $N http  301 "$H/#histoire"
cas /fr/menu            $W https 301 $H/carte/
cas /en/notre-histoire  $W https 301 "$H/#histoire"
cas /_api/x             $W https 301 $H/
cas /carte              $W https 301 $H/carte/
cas /mentions-legales   $W https 301 $H/mentions-legales/
cas /index.html         $W https 301 $H/
cas /carte/index.html   $W https 301 $H/carte/
cas /                   $N http  301 $H/
cas /                   $N https 301 $H/
cas /carte/             $W http  301 $H/carte/
cas /                   $W https 200 -
cas /carte/             $W https 200 -
cas /                   $W -     200 -
cas /                   $T -     200 -
cas /carte/             $T -     200 -
cas /page-quelconque    $W https 404 -

# la 404 doit être la page maison, et les en-têtes de sécurité présents
curl -s -H "Host: $W" -H "X-Forwarded-Proto: https" "http://127.0.0.1:$PORT/page-quelconque" | grep -q 'Page envolée' \
  && echo "OK     404 = page maison" || { echo "ECHEC  404 = page maison"; echec=1; }
entetes=$(curl -sI -H "Host: $W" -H "X-Forwarded-Proto: https" "http://127.0.0.1:$PORT/")
for e in X-Content-Type-Options Referrer-Policy X-Frame-Options Permissions-Policy Content-Security-Policy; do
  echo "$entetes" | grep -qi "^$e:" && echo "OK     en-tête $e" || echo "--     en-tête $e absent"
done
echo "$entetes" | grep -qi "^Strict-Transport-Security:" && { echo "ECHEC  HSTS actif trop tôt"; echec=1; } || echo "OK     HSTS pas encore actif"

/usr/sbin/apache2 -f /tmp/banc.conf -k stop
exit $echec

<?php
// Sonde temporaire : ce que le proxy OVH transmet à Apache (le .htaccess
// suppose X-Forwarded-Proto). À envoyer dans www/, ouvrir en http:// ET en
// https://, puis SUPPRIMER du serveur. Ne jamais la laisser en ligne.
header('Content-Type: text/plain; charset=utf-8');
header('X-Robots-Tag: noindex');
foreach (['HTTP_HOST', 'HTTP_X_FORWARDED_PROTO', 'HTTPS', 'SERVER_PORT', 'REQUEST_SCHEME', 'HTTP_X_FORWARDED_FOR'] as $k) {
    echo str_pad($k, 24), ': ', $k === 'HTTP_X_FORWARDED_FOR' ? (isset($_SERVER[$k]) ? '(présent)' : '(absent)') : ($_SERVER[$k] ?? '(absent)'), "\n";
}

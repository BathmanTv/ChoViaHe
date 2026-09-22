# -*- coding: utf-8 -*-
"""Fabrique les icônes du site à partir de l'illustration des lanternes.
    python tools/favicon.py
Google n'affiche une icône dans ses résultats que si elle est carrée ET
d'un multiple de 48 px (48, 96, 144, 192...). Les 16/32 px seuls ne suffisent pas.
"""
import sys, io
sys.stdout.reconfigure(encoding='utf-8')
from PIL import Image
import numpy as np

SRC = 'img/Illus Oriane/lanternes.png'
PAPIER = (241, 227, 201)

im = Image.open(SRC).convert('RGBA')
a = np.array(im)
# Le PNG a des pixels parasites sur les bords : on cadre sur la DENSITÉ par ligne
# et par colonne (>2 % de pixels opaques), pas sur le premier pixel non transparent.
# Zone haut-gauche = la lanterne bleue, corps + col, sans le pompon (illisible en petit).
zone = a[:2150, :1350, 3] > 128
col, row = zone.sum(axis=0), zone.sum(axis=1)
xi = np.nonzero(col > 0.02 * zone.shape[0])[0]
yi = np.nonzero(row > 0.02 * zone.shape[1])[0]
x0, x1, y0, y1 = xi.min(), xi.max(), yi.min(), yi.max()
# On ne « recadre » pas : on DÉTOURE la lanterne et on la pose entière au centre
# d'un carré papier. Un cadrage carré autour d'elle ferait entrer la lanterne
# orange voisine, et rétrécir le carré couperait la lanterne bleue.
# La lanterne orange voisine mord dans le rectangle de la bleue : on ne garde que
# la forme CONNECTÉE la plus grande (la lanterne bleue), le reste redevient papier.
from scipy import ndimage
bloc = im.crop((x0, y0, x1, y1))
op = np.array(bloc)[..., 3] > 128
etiq, n = ndimage.label(ndimage.binary_closing(op, np.ones((9, 9))))
tailles = ndimage.sum(op, etiq, range(1, n + 1))
garde = (etiq == (int(np.argmax(tailles)) + 1))
print(f'{n} formes trouvées, la plus grande fait {int(tailles.max())} px')
px = np.array(bloc)
px[..., 3] = np.where(garde, px[..., 3], 0)
lanterne = Image.fromarray(px)
COTE = 512
marge = 0.86                                   # la lanterne occupe 86 % du carré
k = (COTE * marge) / max(lanterne.width, lanterne.height)
lanterne = lanterne.resize((max(1, int(lanterne.width * k)), max(1, int(lanterne.height * k))), Image.LANCZOS)
carre = Image.new('RGBA', (COTE, COTE), PAPIER + (255,))
carre.alpha_composite(lanterne, ((COTE - lanterne.width) // 2, (COTE - lanterne.height) // 2))
print(f'lanterne {x1-x0}x{y1-y0} -> posée dans un carré de {COTE}px')
carre = carre.convert('RGB')

for taille, nom in [(192, 'icon-192.png'), (96, 'icon-96.png'),
                    (180, 'apple-touch-icon.png'), (32, 'favicon-32.png'), (16, 'favicon-16.png')]:
    carre.resize((taille, taille), Image.LANCZOS).save('docs/' + nom, optimize=True)
    print('  docs/' + nom, taille)
carre.resize((48, 48), Image.LANCZOS).save('docs/favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
print('  docs/favicon.ico 16+32+48')

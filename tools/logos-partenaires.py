# -*- coding: utf-8 -*-
"""Prépare les logos Café Bống et Bếp Chay pour le bloc « nos autres adresses ».
    python tools/logos-partenaires.py
Les sources ont un fond BLANC opaque : posées sur le papier crème du site elles
feraient autocollant. On transforme donc la luminosité en transparence (l'encre
reste, le blanc disparaît) et on reteinte l'encre à la couleur du site.
"""
import sys;sys.stdout.reconfigure(encoding='utf-8')
from PIL import Image
import numpy as np

ENCRE = (30, 26, 23)          # --encre du site
# Bếp Chay : sa signature « cuisine végétarienne vietnamienne » est illisible à
# 72 px ET redondante avec notre texte juste à côté. On ne garde que le nom
# (le dessin s'arrête à y=295, la signature commence à 312).
COUPE = {'bep-chay': 300}

for nom in ['cafe-bong', 'bep-chay']:
    src = Image.open(f'img/Logos partenaires/{nom}.png').convert('RGBA')
    if nom in COUPE:
        src = src.crop((0, 0, src.width, COUPE[nom]))
    im = np.array(src).astype(float)
    lum = im[..., :3].mean(axis=2)
    alpha = np.clip(255 - lum, 0, 255) * (im[..., 3] / 255)      # blanc -> transparent
    out = np.zeros_like(im)
    out[..., 0], out[..., 1], out[..., 2] = ENCRE
    out[..., 3] = alpha
    img = Image.fromarray(out.astype('uint8'))
    bb = img.getbbox()
    marge = 6
    img = img.crop((max(0, bb[0] - marge), max(0, bb[1] - marge),
                    min(img.width, bb[2] + marge), min(img.height, bb[3] + marge)))
    for larg in (160, 320):
        h = round(larg * img.height / img.width)
        img.resize((larg, h), Image.LANCZOS).save(f'docs/assets/logos-{nom}-{larg}.webp', quality=90, method=6)
    print(f'{nom:10s} détouré {img.size} -> 160 et 320 px de large')

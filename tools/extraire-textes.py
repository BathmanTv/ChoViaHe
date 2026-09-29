# -*- coding: utf-8 -*-
"""Extrait TOUS les textes français du site dans un classeur Excel, prêt pour
un traducteur vietnamien.

    python tools/extraire-textes.py     ->  traduction-vi.xlsx

Une ligne = un texte à traduire, avec son repère technique pour la réintégration.
Les noms de plats vietnamiens (lang="vi") ne sont PAS extraits : ils restent tels quels.
"""
import sys, io, os, re
sys.stdout.reconfigure(encoding='utf-8')
from bs4 import BeautifulSoup, NavigableString
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from openpyxl.utils import get_column_letter

PAGES = [
    ('docs/index.html',                  'Accueil'),
    ('docs/carte/index.html',            'La carte'),
    ('docs/mentions-legales/index.html', 'Mentions légales'),
    ('docs/404.html',                    'Page 404'),
]
# Blocs à ignorer : techniques, ou déjà en vietnamien.
IGNORER_PARENTS = {'script', 'style', 'noscript'}


def reperer(el):
    """Chemin lisible pour retrouver l'élément : section > balise.classe"""
    sec = el.find_parent('section')
    nom = ''
    if sec is not None:
        nom = sec.get('id') or (sec.get('class') or [''])[0]
    classe = (el.get('class') or [''])[0]
    return f"{nom or 'page'} > {el.name}{'.' + classe if classe else ''}"


def textes_page(chemin):
    html = io.open(chemin, encoding='utf-8').read()
    soup = BeautifulSoup(html, 'lxml')
    lignes = []

    # 1. métadonnées
    if soup.title:
        lignes.append(('Métadonnées', '<title> (onglet + résultat Google)', soup.title.get_text(strip=True)))
    for nom, libelle in [('description', 'Description Google (meta description)'),
                         ('og:title', 'Titre de partage (réseaux sociaux)'),
                         ('og:description', 'Description de partage'),
                         ('og:image:alt', 'Texte alternatif de l’image de partage')]:
        m = soup.find('meta', attrs={'name': nom}) or soup.find('meta', attrs={'property': nom})
        if m and m.get('content'):
            lignes.append(('Métadonnées', libelle, m['content']))

    # 2. textes visibles, au niveau du BLOC (jamais le fragment)
    # find_all(string=True) coupait les phrases à chaque <span>/<strong> : le
    # traducteur recevait « Au Vietnam, » puis « le marché fait partie intégrante ».
    BLOCS = ['h1', 'h2', 'h3', 'h4', 'p', 'li', 'dt', 'dd', 'figcaption',
             'blockquote', 'address', 'summary', 'th', 'td', 'button', 'label']
    corps = soup.body
    if corps:
        for el in corps.find_all(BLOCS + ['a']):
            # un bloc qui en contient d'autres serait un doublon de ses enfants
            if el.find(BLOCS):
                continue
            # lien : seulement s'il porte son propre libellé (menu, bouton, lien de pied)
            if el.name == 'a' and el.find_parent(BLOCS):
                continue
            if el.get('lang') == 'vi':            # bloc entièrement vietnamien
                continue
            # bloc qui ne contient QUE des liens (barre de boutons) : un par ligne,
            # sinon le traducteur reçoit « Réserver une table Feuilleter le carnet ».
            liens = el.find_all('a', recursive=False) if el.name != 'a' else []
            if len(liens) >= 2 and len(''.join(l.get_text(strip=True) for l in liens)) >= 0.8 * len(el.get_text(strip=True)):
                for l in liens:
                    t = ' '.join(l.get_text(' ', strip=True).split())
                    if t:
                        lignes.append(('Texte de la page', reperer(l), t))
                continue
            txt = ' '.join(el.get_text(' ', strip=True).split())
            if len(txt) < 2 or not re.search(r'[A-Za-zÀ-ỹ]', txt):
                continue
            lignes.append(('Texte de la page', reperer(el), txt))

    # 3. textes alternatifs des images (lus par Google et par les lecteurs d'écran)
    for img in soup.find_all('img'):
        alt = (img.get('alt') or '').strip()
        if alt:
            lignes.append(('Texte alternatif d’image', os.path.basename(img.get('src', '')), alt))

    # 4. libellés d'accessibilité invisibles à l'écran
    for el in soup.find_all(attrs={'aria-label': True}):
        lignes.append(('Libellé d’accessibilité', reperer(el), el['aria-label'].strip()))

    return lignes


ENTETE = PatternFill('solid', fgColor='C0264B')
BORDURE = Border(*[Side(style='thin', color='DDDDDD')] * 4)


def feuille(wb, titre, lignes, largeurs=(22, 34, 70, 70, 26)):
    ws = wb.create_sheet(titre[:31])
    ws.append(['Rubrique', 'Repère (ne pas modifier)', 'Texte FRANÇAIS', 'TRADUCTION VIETNAMIENNE', 'Remarque du traducteur'])
    for c in ws[1]:
        c.font = Font(bold=True, color='FFFFFF'); c.fill = ENTETE
        c.alignment = Alignment(vertical='center', horizontal='center')
    ws.freeze_panes = 'A2'
    vus = set()
    for i, (rub, rep, txt) in enumerate(lignes):
        if (rub, txt) in vus:        # même phrase répétée (menu, pied de page) : une seule ligne
            continue
        vus.add((rub, txt))
        # phrase découpée en plusieurs lignes à l'écran (effet typographique) :
        # le traducteur doit le savoir, sinon il traduit un fragment hors contexte.
        note = ''
        # « suite » seulement si la ligne suivante commence en minuscule : sinon les
        # entrées de menu (« Le lieu », « Contact ») étaient signalées à tort.
        suivant = lignes[i + 1][2] if i + 1 < len(lignes) and lignes[i + 1][1] == rep else ''
        suite = txt[-1] not in '.!?:…»' and bool(suivant) and suivant[0].islower()
        debut_minuscule = txt[0].islower()
        if suite or debut_minuscule:
            note = 'Phrase affichée sur plusieurs lignes : à lire avec la ligne voisine.'
        ws.append([rub, rep, txt, '', note])
    for i, l in enumerate(largeurs, 1):
        ws.column_dimensions[get_column_letter(i)].width = l
    for row in ws.iter_rows(min_row=2):
        for c in row:
            c.alignment = Alignment(wrap_text=True, vertical='top'); c.border = BORDURE
        if row[3].column_letter == 'D':
            row[3].fill = PatternFill('solid', fgColor='FFF9E3')   # colonne à remplir, en jaune
    return ws.max_row - 1


wb = Workbook(); wb.remove(wb.active)

# --- consignes, en première page ---
ws = wb.create_sheet('À LIRE D’ABORD')
consignes = [
    ['Traduction du site Chợ Vỉa Hè en vietnamien', ''],
    ['', ''],
    ['Comment remplir', ''],
    ['1.', 'Une ligne = un texte du site. Écrivez la traduction dans la colonne jaune « TRADUCTION VIETNAMIENNE ».'],
    ['2.', 'Ne touchez jamais à la colonne « Repère » : elle sert à remettre chaque texte au bon endroit.'],
    ['3.', 'Laissez vide ce qui ne doit pas être traduit, et expliquez pourquoi dans « Remarque ».'],
    ['', ''],
    ['Ce qu’il ne faut PAS traduire', ''],
    ['•', 'Les noms de plats vietnamiens (phở, bún chả, chả cốm…) : ils sont déjà en vietnamien et n’apparaissent pas dans ce fichier.'],
    ['•', 'Le nom du restaurant « Chợ Vỉa Hè », les noms propres (Toulouse, Hà Nội, Zenchef, Google), les adresses et les numéros.'],
    ['•', 'Les prix et les horaires (12h00–14h30) : ils seront repris tels quels.'],
    ['', ''],
    ['Contraintes de place', ''],
    ['•', 'Boutons et menus (« Réserver une table », « La carte », « Contact ») : rester aussi court que le français, sinon le bouton déborde sur téléphone.'],
    ['•', 'Titre de l’onglet et description Google : respecter environ 60 signes pour le titre, 155 pour la description.'],
    ['', ''],
    ['Ton à conserver', ''],
    ['•', 'Le site est écrit comme un carnet de voyage : chaleureux, simple, à la première personne du pluriel (« nous »).'],
    ['•', 'Vouvoyer le visiteur, comme en français.'],
    ['', ''],
    ['Questions ou doutes', 'Écrire dans la colonne « Remarque du traducteur », ne pas inventer.'],
]
for l in consignes:
    ws.append(l)
ws['A1'].font = Font(bold=True, size=14, color='C0264B')
for r in (3, 8, 13, 17):
    ws.cell(row=r, column=1).font = Font(bold=True)
ws.column_dimensions['A'].width = 12
ws.column_dimensions['B'].width = 110
for row in ws.iter_rows():
    for c in row:
        c.alignment = Alignment(wrap_text=True, vertical='top')

total = 0
for chemin, titre in PAGES:
    n = feuille(wb, titre, textes_page(chemin))
    print(f'{titre:20s} {n:4d} textes')
    total += n

wb.save('traduction-vi.xlsx')
print(f'\ntraduction-vi.xlsx écrit — {total} textes au total')

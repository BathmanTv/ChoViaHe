# Tire du logo officiel (.ai = PDF compatible, tracés blancs) deux SVG colorés :
#   docs/assets/logo-nom.svg     « Chợ Vỉa Hè » seul, framboise (en-tête)
#   docs/assets/logo-complet.svg nom + « Cuisine de rue vietnamienne », encre (pied de page)
# Relancer si la cliente renvoie un nouveau .ai : python tools/logo-svg.py
import fitz, re, io
SRC = 'img/BRANDING-CHO VIA HE-LOGO.ai'
M = 2  # marge en points
for out, y1, color in [('docs/assets/logo-nom.svg', 668, '#C0264B'),
                       ('docs/assets/logo-complet.svg', 736, '#1E1A17')]:
    doc = fitz.open(SRC); p = doc[0]
    p.set_cropbox(fitz.Rect(39 - M, 455 - M, 803 + M, y1 + M))
    svg = p.get_svg_image(text_as_path=True)
    svg = re.sub(r'fill="#ffffff"', f'fill="{color}"', svg, flags=re.I)
    svg = re.sub(r'\s+', ' ', svg).replace('> <', '><')
    io.open(out, 'w', encoding='utf-8').write(svg)
    print(out, len(svg), 'o', re.search(r'viewBox="[^"]+"', svg).group(0))

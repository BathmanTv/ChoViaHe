# -*- coding: utf-8 -*-
"""
Contrôle point par point des retours clients, sur PC ET mobile.
À rejouer AVANT tout envoi au client.

    npx --yes serve docs -l 4324        (dans un autre terminal)
    python tools/verif-retours.py

Chaque ligne est un retour numéroté : on mesure dans le navigateur, on ne
se fie jamais au fait qu'un fichier ait été édité. Sortie : OK / ECHEC.
Code de sortie 1 s'il reste un échec.
"""
import sys
from playwright.sync_api import sync_playwright

# La console Windows est en cp1252 : sans ça, le moindre caractère vietnamien
# affiché dans un détail fait planter tout le rapport.
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

BASE = "http://localhost:4324"
resultats = []


def verif(num, libelle, ok, detail=""):
    resultats.append((num, libelle, bool(ok), detail))


def bloc(titre):
    print(f"\n{'=' * 68}\n{titre}\n{'=' * 68}")


# Deux contrôles de structure, ajoutés après un bug réel : une nouvelle
# section avait repris la classe ET l'id d'un bloc existant, si bien que ses
# styles débordaient sur lui et que le document portait un id en double.
JS_IDS_DOUBLONS = """(() => {
  const vus = {}, doubles = [];
  for (const el of document.querySelectorAll('[id]')) {
    if (vus[el.id]) { if (!doubles.includes(el.id)) doubles.push(el.id); }
    else vus[el.id] = 1;
  }
  return doubles;
})()"""

JS_CHEVAUCHEMENTS = """(() => {
  // Éléments porteurs de texte, dans le flux (on ignore les décorations
  // absolues et tout ce qui est aria-hidden : elles se superposent exprès).
  const sel = 'h1, h2, h3, p, li, blockquote, figcaption, address, dt, dd';
  // Un élément est « hors flux » si LUI ou un de ses ancêtres est en position
  // absolute / fixed / sticky : l'en-tête fixe et la barre collante passent
  // par-dessus le contenu, c'est voulu et ce n'est pas un chevauchement.
  const horsFlux = el => {
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      const pos = getComputedStyle(n).position;
      if (pos === 'absolute' || pos === 'fixed' || pos === 'sticky') return true;
    }
    return false;
  };
  const els = [...document.querySelectorAll(sel)].filter(el => {
    if (el.closest('[aria-hidden="true"], [hidden]')) return false;
    if (horsFlux(el)) return false;
    const st = getComputedStyle(el);
    if (st.display === 'none' || st.visibility === 'hidden') return false;
    if (parseFloat(st.opacity) < 0.05) return false;
    const b = el.getBoundingClientRect();
    return b.width > 4 && b.height > 4;
  });
  const out = [];
  for (let i = 0; i < els.length; i++) {
    for (let j = i + 1; j < els.length; j++) {
      const A = els[i], B = els[j];
      if (A.contains(B) || B.contains(A)) continue;   // imbrication normale
      const a = A.getBoundingClientRect(), b = B.getBoundingClientRect();
      const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (ox > 6 && oy > 6) {
        const nom = e => e.tagName.toLowerCase() + (e.className ? '.' + String(e.className).split(' ')[0] : '');
        out.push(`${nom(A)} x ${nom(B)} (${Math.round(ox)}x${Math.round(oy)}px)`);
      }
    }
  }
  return out.slice(0, 8);
})()"""


def controle_structure(page, nom):
    """Doublons d'id + chevauchements de texte, sur la page entière."""
    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    page.wait_for_timeout(1500)          # laisse toutes les apparitions finir
    page.evaluate("window.scrollTo(0, 0)")
    page.wait_for_timeout(400)
    doubles = page.evaluate(JS_IDS_DOUBLONS)
    chevauche = page.evaluate(JS_CHEVAUCHEMENTS)
    verif("Struct", f"Aucun identifiant en double ({nom})", not doubles, str(doubles))
    verif("Struct", f"Aucun chevauchement de texte ({nom})", not chevauche, str(chevauche))


with sync_playwright() as p:
    b = p.chromium.launch()

    # =================================================================
    # PC — 1280x900
    # =================================================================
    bloc("PC — 1280 x 900")
    pc = b.new_page(viewport={"width": 1280, "height": 900})
    errs_pc = []
    pc.on("console", lambda m: errs_pc.append(m.text) if m.type == "error" else None)
    pc.goto(BASE + "/", wait_until="networkidle")
    pc.wait_for_timeout(1200)

    d = pc.evaluate("""(() => {
      const q = s => document.querySelector(s);
      const txt = document.body.innerText;
      return {
        fond: getComputedStyle(document.body).backgroundColor,
        justif: getComputedStyle(q('.prose p')).textAlign,
        justifAvis: getComputedStyle(q('.avis blockquote p')).textAlign,
        nbPlats: document.querySelectorAll('.plat-card').length,
        bunCha: txt.includes('Bún chả'),
        titreCarte: q('#carte-title').textContent.trim(),
        titreLieu: q('#lieu-title').innerText.replace(/\\n/g, ' ').trim(),
        lieuIntro: q('.lieu-intro').textContent.trim(),
        reserver: q('.reserver-lead').textContent.trim(),
        fourchette: !!q('.carte-fourchette'),
        duo: [...document.querySelectorAll('.duo-item')].map(f => f.className.split(' ')[1]),
        nav: [...document.querySelectorAll('.main-nav a')].map(a => a.textContent.trim()),
        presse: document.querySelectorAll('.presse-item').length,
        avis: document.querySelectorAll('.avis').length,
        footHoraires: /12h–14h30/.test(q('.footer').innerText),
        footSign: !!q('.footer-sign'),
        etal: (txt.match(/étal/gi) || []).length,
        deborde: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    })()""")

    verif(1, "Fond couleur du carnet (#F1E3C9)", d["fond"] == "rgb(241, 227, 201)", d["fond"])
    verif(2, "Paragraphes justifiés (accueil)", d["justif"] == "justify", d["justif"])
    verif(2, "Avis justifiés", d["justifAvis"] == "justify", d["justifAvis"])
    verif(3, "Carte bún chả retirée du teaser", d["nbPlats"] == 3 and not d["bunCha"],
          f"{d['nbPlats']} plats, bún chả présent={d['bunCha']}")
    verif(5, "Titre carte « comme au Vietnam »", d["titreCarte"] == "La cuisine de rue, comme au Vietnam", d["titreCarte"])
    verif(5, "« étal » seulement dans le récit familial (2)", d["etal"] == 2, f"{d['etal']} occurrence(s)")
    verif(6, "Texte réservation « un coin de nos stands »", "un coin de nos stands" in d["reserver"], d["reserver"][-45:])
    verif(7, "Duo : photo avant dessin", d["duo"] == ["duo-item--reel", "duo-item--carnet"], str(d["duo"]))
    verif(8, "Fourchette de prix retirée", not d["fourchette"])
    verif(11, "Titre lieu « Un lieu, vivant, vibrant »", "Un lieu" in d["titreLieu"] and "vibrant" in d["titreLieu"], d["titreLieu"])
    verif(11, "Accroche lieu « l'énergie qui pulse »", "pulse" in d["lieuIntro"], d["lieuIntro"][-40:])
    verif(12, "3 articles de presse", d["presse"] == 3, str(d["presse"]))
    verif(12, "2 avis Google", d["avis"] == 2, str(d["avis"]))
    verif(13, "Horaires retirés du pied de page", not d["footHoraires"])
    verif(13, "Redite nom + adresse retirée", not d["footSign"])
    verif(15, "Menu : La carte en premier", d["nav"][0] == "La carte", str(d["nav"][:3]))
    verif("—", "Aucun débordement horizontal (PC)", d["deborde"] <= 0, f"{d['deborde']}px")
    verif("—", "Aucune erreur JavaScript (PC)", not errs_pc, str(errs_pc[:2]))

    # --- retour « le verre saute » : la marginalia ne doit jamais être animée ---
    marg = pc.evaluate("""(() => {
      const el = document.querySelector('.marg-cafe');
      if (!el) return null;
      const avant = getComputedStyle(el).opacity;
      el.scrollIntoView({block: 'center'});
      return {avant, transform: getComputedStyle(el).transform,
              anime: !!(window.gsap && gsap.isTweening(el))};
    })()""")
    pc.wait_for_timeout(900)
    apres = pc.evaluate("""(() => {
      const el = document.querySelector('.marg-cafe');
      return {opacite: getComputedStyle(el).opacity, anime: !!(window.gsap && gsap.isTweening(el))};
    })()""")
    stable = (float(marg["avant"]) > 0.5 and float(apres["opacite"]) > 0.5
              and not marg["anime"] and not apres["anime"])
    verif("Bug", "Le verre à côté de « il était une fois » ne saute plus",
          stable, f"opacité avant={marg['avant']} après={apres['opacite']} tween={apres['anime']}")
    controle_structure(pc, "accueil PC")
    pc.close()

    # --- page carte, PC ---
    pcc = b.new_page(viewport={"width": 1280, "height": 900})
    errs_c = []
    pcc.on("console", lambda m: errs_c.append(m.text) if m.type == "error" else None)
    pcc.goto(BASE + "/carte/", wait_until="networkidle")
    pcc.wait_for_timeout(1000)
    c = pcc.evaluate("""(() => {
      const q = s => document.querySelector(s);
      return {
        fond: getComputedStyle(document.body).backgroundColor,
        justif: getComputedStyle(q('.menu-item-desc')).textAlign,
        plateauPho: !!q('#plateau .pho-intro'),
        plateauClasse: q('#plateau').className,
        prixPlateau: q('.plateau-prix').textContent.trim(),
        pdf: [...document.querySelectorAll('a')].map(a => a.textContent.trim()).find(t => /Télécharger/.test(t)) || '',
        etal: (document.body.innerText.match(/étal/gi) || []).length,
        nav: [...document.querySelectorAll('.main-nav a')].map(a => a.textContent.trim()),
        nbPlats: document.querySelectorAll('.menu-item').length,
        deborde: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    })()""")
    verif(1, "Fond du carnet (page carte)", c["fond"] == "rgb(241, 227, 201)", c["fond"])
    verif(2, "Descriptions de plats justifiées", c["justif"] == "justify", c["justif"])
    verif(4, "Plateau : mise en page du phở", c["plateauPho"] and "pho-section" in c["plateauClasse"], c["plateauClasse"])
    verif(4, "Prix du plateau conservé", c["prixPlateau"].startswith("23"), c["prixPlateau"])
    verif(5, "Plus aucun « étal » sur la carte", c["etal"] == 0, str(c["etal"]))
    verif(14, "Lien PDF sans le mot « illustrée »", "illustrée" not in c["pdf"], c["pdf"])
    verif(15, "Menu carte : La carte en premier", c["nav"][0] == "La carte", str(c["nav"][:3]))
    verif("—", "Carte complète (>40 plats)", c["nbPlats"] > 40, f"{c['nbPlats']} entrées")
    verif("—", "Aucun débordement (carte PC)", c["deborde"] <= 0, f"{c['deborde']}px")
    verif("—", "Aucune erreur JS (carte PC)", not errs_c, str(errs_c[:2]))
    controle_structure(pcc, "carte PC")
    pcc.close()

    # =================================================================
    # Fenêtre non maximisée — le bug Mac (retour 10)
    # =================================================================
    bloc("FENÊTRE NON MAXIMISÉE — 820 / 900 / 1000 / 1100 px")
    for w in [820, 900, 1000, 1100]:
        pg = b.new_page(viewport={"width": w, "height": 800})
        pg.goto(BASE + "/", wait_until="networkidle")
        pg.wait_for_timeout(700)
        m = pg.evaluate("""(() => {
          const r = s => { const e = document.querySelector(s); if (!e) return null;
            const b = e.getBoundingClientRect(); return {t: b.top, b: b.bottom, l: b.left, r: b.right}; };
          return {
            couv: Math.round(document.querySelector('.couverture').getBoundingClientRect().height),
            cta: r('.header-cta'), lant: r('.lanternes-pendantes'),
            titreH: Math.round(document.querySelector('.cover-title').getBoundingClientRect().height),
            standVisible: document.querySelector('.cover-stand').getBoundingClientRect().top < 800,
            deborde: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          };
        })()""")
        chevauche = m["lant"]["t"] < m["cta"]["b"] and m["lant"]["l"] < m["cta"]["r"]
        # Le critère n'est PAS « la couverture tient pile dans l'écran » : un
        # héros qui dépasse un peu invite au défilement, c'est voulu. Ce qui
        # était cassé, c'est une couverture de 1118px sur un écran de 800 qui
        # rejetait toute l'illustration sous la ligne de flottaison. Plafond
        # retenu : 1,15x la hauteur d'écran, ET le stand visible d'emblée.
        tient = m["couv"] <= 800 * 1.15
        print(f"  {w}px : couverture={m['couv']}px  stand visible={m['standVisible']}  "
              f"lanternes/CTA chevauchent={chevauche}  débordement={m['deborde']}px")
        verif(10, f"Couverture raisonnable, <=920px ({w}px)", tient, f"{m['couv']}px")
        verif(10, f"Lanternes ne touchent pas Réserver ({w}px)", not chevauche)
        verif(10, f"Stand visible au 1er écran ({w}px)", m["standVisible"])
        verif(10, f"Aucun débordement ({w}px)", m["deborde"] <= 0, f"{m['deborde']}px")
        pg.close()

    # =================================================================
    # MOBILE — 390x844 (iPhone) + 360x740 (Android courant)
    # =================================================================
    bloc("MOBILE — 390 x 844 puis 360 x 740")
    for w, h in [(390, 844), (360, 740)]:
        mo = b.new_page(viewport={"width": w, "height": h}, is_mobile=True, has_touch=True)
        errs_m = []
        mo.on("console", lambda m: errs_m.append(m.text) if m.type == "error" else None)
        mo.goto(BASE + "/", wait_until="networkidle")
        mo.wait_for_timeout(1000)

        mm = mo.evaluate("""(() => {
          const q = s => document.querySelector(s);
          return {
            fond: getComputedStyle(document.body).backgroundColor,
            justif: getComputedStyle(q('.prose p')).textAlign,
            burger: getComputedStyle(q('.burger')).display !== 'none',
            navBureau: getComputedStyle(q('.main-nav')).display !== 'none',
            presse: document.querySelectorAll('.presse-item').length,
            avis: document.querySelectorAll('.avis').length,
            nbPlats: document.querySelectorAll('.plat-card').length,
            footHoraires: /12h–14h30/.test(q('.footer').innerText),
            deborde: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            couv: Math.round(q('.couverture').getBoundingClientRect().height),
          };
        })()""")
        verif(1, f"Fond du carnet (mobile {w})", mm["fond"] == "rgb(241, 227, 201)", mm["fond"])
        verif(2, f"Paragraphes justifiés (mobile {w})", mm["justif"] == "justify", mm["justif"])
        verif(3, f"3 plats dans le teaser (mobile {w})", mm["nbPlats"] == 3, str(mm["nbPlats"]))
        verif(12, f"3 articles + 2 avis (mobile {w})", mm["presse"] == 3 and mm["avis"] == 2)
        verif(13, f"Horaires retirés du pied (mobile {w})", not mm["footHoraires"])
        verif("—", f"Burger seul, pas de nav bureau ({w})", mm["burger"] and not mm["navBureau"])
        verif("—", f"Aucun débordement horizontal ({w})", mm["deborde"] <= 0, f"{mm['deborde']}px")
        verif("—", f"Aucune erreur JS (mobile {w})", not errs_m, str(errs_m[:2]))

        # barre collante : doit apparaître tôt et rester
        apparition = None
        for y in range(0, 2000, 100):
            mo.evaluate(f"window.scrollTo(0, {y})")
            mo.wait_for_timeout(140)
            if mo.eval_on_selector("[data-sticky-actions]", "e => e.classList.contains('is-visible')"):
                apparition = y
                break
        boutons = mo.eval_on_selector_all("[data-sticky-actions] a", "els => els.map(e => e.textContent.trim())")
        print(f"  {w}px : barre visible dès {apparition}px — boutons {boutons}")
        verif("—", f"Barre Réserver/Appeler/Itinéraire tôt ({w})",
              apparition is not None and apparition <= 400 and len(boutons) == 3, f"{apparition}px, {boutons}")

        # le verre ne saute pas non plus sur mobile
        mo.evaluate("document.querySelector('.marg-cafe').scrollIntoView({block:'center'})")
        mo.wait_for_timeout(800)
        op = mo.eval_on_selector(".marg-cafe", "e => getComputedStyle(e).opacity")
        verif("Bug", f"Le verre reste stable (mobile {w})", float(op) > 0.5, f"opacité={op}")
        controle_structure(mo, f"accueil mobile {w}")
        mo.close()

        # page carte en mobile
        mc = b.new_page(viewport={"width": w, "height": h}, is_mobile=True, has_touch=True)
        mc.goto(BASE + "/carte/", wait_until="networkidle")
        mc.wait_for_timeout(900)
        cc = mc.evaluate("""(() => ({
          plateauPho: !!document.querySelector('#plateau .pho-intro'),
          justif: getComputedStyle(document.querySelector('.menu-item-desc')).textAlign,
          deborde: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          fond: getComputedStyle(document.body).backgroundColor,
        }))()""")
        verif(4, f"Plateau en mise en page phở (mobile {w})", cc["plateauPho"])
        verif(2, f"Descriptions justifiées (carte mobile {w})", cc["justif"] == "justify", cc["justif"])
        verif(1, f"Fond du carnet (carte mobile {w})", cc["fond"] == "rgb(241, 227, 201)", cc["fond"])
        verif("—", f"Aucun débordement (carte mobile {w})", cc["deborde"] <= 0, f"{cc['deborde']}px")
        controle_structure(mc, f"carte mobile {w}")
        mc.close()

    b.close()

# =====================================================================
bloc("RÉCAPITULATIF")
echecs = [r for r in resultats if not r[2]]
for num, lib, ok, det in resultats:
    marque = "OK   " if ok else "ECHEC"
    suffixe = f"   [{det}]" if det and not ok else ""
    print(f"  {marque}  n°{num:<4} {lib}{suffixe}")

print(f"\n  {len(resultats) - len(echecs)}/{len(resultats)} contrôles passés.")
if echecs:
    print("\n  ECHECS :")
    for num, lib, _, det in echecs:
        print(f"    - n°{num} {lib}  ->  {det}")
    sys.exit(1)
print("  Tout est pris en compte, PC et mobile.")

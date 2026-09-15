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

import os
BASE = os.environ.get("SITE_URL", "http://localhost:4324").rstrip("/")
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
        // --- retours du 05/08 ---
        legendeStand: !!q('.cover-stand figcaption'),
        commeLaBas: /comme là-bas/i.test(txt),
        // plus aucune trame de lignes réglées nulle part
        lignes: [...document.querySelectorAll('.section, .couverture, .nav-overlay')]
          .filter(el => /repeating-linear-gradient/.test(getComputedStyle(el).backgroundImage)).length,
        texture: getComputedStyle(document.body, '::after').backgroundImage,
        fondPage: getComputedStyle(document.body, '::before').backgroundImage,
      };
    })()""")

    verif(1, "Fond couleur du carnet (#F1E3C9)", d["fond"] == "rgb(241, 227, 201)", d["fond"])
    verif(2, "Paragraphes justifiés (accueil)", d["justif"] == "justify", d["justif"])
    verif(2, "Avis justifiés", d["justifAvis"] == "justify", d["justifAvis"])
    verif(3, "Teaser : 4 plats (herbes ajoutées 15/09), sans bún chả", d["nbPlats"] == 4 and not d["bunCha"],
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
    # --- retours du 05/08 ---
    verif("05/08", "Légende sous l'illustration du stand retirée",
          not d["legendeStand"] and not d["commeLaBas"], f"figcaption={d['legendeStand']}")
    verif("05/08", "Plus aucune trame de lignes réglées", d["lignes"] == 0,
          f"{d['lignes']} bloc(s) avec un dégradé répété")
    verif("05/08", "Grain de papier toujours en place", "papier-tile" in d["texture"], d["texture"][:60])
    verif("31/08", "Matière de la page (taches, usure) en place",
          "papier-fond" in d["fondPage"], d["fondPage"][:60])

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
        // --- carte « Rentrée 2026 », validée par la cliente le 05/08 ---
        khot: /khọt/.test(document.body.innerText),
        prix: Object.fromEntries([...document.querySelectorAll('.menu-item')].map(li => {
          const n = li.querySelector('.menu-item-nom'), p = li.querySelector('.menu-item-prix');
          return [n ? n.textContent.trim() : '?', p ? p.textContent.replace(/\\u00a0/g, ' ').trim() : null];
        })),
        sansPrix: [...document.querySelectorAll('.menu-item')]
          .filter(li => !li.querySelector('.menu-item-prix'))
          .map(li => (li.querySelector('.menu-item-nom') || {}).textContent),
        lignes: [...document.querySelectorAll('.section, .menu-section, .carte-header')]
          .filter(el => /repeating-linear-gradient/.test(getComputedStyle(el).backgroundImage)).length,
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
    # --- carte « Rentrée 2026 » ---
    verif("05/08", "Bánh khọt retiré de la carte", not c["khot"])
    verif("31/08", "Bơ vơ retiré (remplacé par bánh trôi)", "Bơ vơ" not in c["prix"])
    verif("31/08", "Dragon remplacé par Thăng Long", "Dragon" not in c["prix"] and "Thăng Long" in c["prix"])
    verif("05/08", "Plus aucune trame de lignes (carte)", c["lignes"] == 0, str(c["lignes"]))
    # Relevés sur « Rentrée 2026 Carte Cho-2.pdf », version définitive du 31/08.
    ATTENDUS = {
        "Cà phê sữa đá": "6 €", "Thé glacé maison": "6 €",
        "Em Ơi": "12 €", "Thăng Long": "12 €", "Phở Mojito": "12 €",
        "Tám-Đi": "10 €", "Đi Chợ": "10 €",
        "Café / déca / allongé": "2 €", "Café noisette": "2,50 €",
        "Thé vert jasmin du Vietnam": "4,50 €",
        "Phở gà": "16 €", "Phở bò tái chín": "17 €",
        "Bánh trôi nước mè đen": "7 €",
        "Chả cốm (x2)": "8 €",
    }
    for nom, attendu in ATTENDUS.items():
        if attendu is None:
            continue
        reel = c["prix"].get(nom)
        verif("05/08", f"Prix {nom} = {attendu}", reel == attendu, f"lu : {reel}")
    verif("05/08", "Plus aucun plat sans prix", not c["sansPrix"], str(c["sansPrix"]))
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
    # AUDIT DU 02/09 — chaque correctif a son contrôle
    # =================================================================
    bloc("AUDIT 02/09 — correctifs")
    au = b.new_page(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
    au.goto(BASE + "/", wait_until="networkidle"); au.wait_for_timeout(900)

    # 1. menu : réouverture rapide ne fige plus la page (bug reproduit 4/4 avant)
    au.click("[data-burger]"); au.wait_for_timeout(500)
    au.click("#menu-overlay a[href='#histoire']"); au.wait_for_timeout(200)
    au.click("[data-burger]"); au.wait_for_timeout(600)
    m = au.evaluate("""() => { const o=document.getElementById('menu-overlay');
      return {hidden:o.hidden, open:o.classList.contains('is-open'), ov:document.body.style.overflow}; }""")
    verif("Audit", "Menu : réouverture rapide, le menu reste visible",
          m["open"] and not m["hidden"], str(m))
    au.keyboard.press("Escape"); au.wait_for_timeout(500)
    m2 = au.evaluate("() => ({open:document.getElementById('menu-overlay').classList.contains('is-open'), ov:document.body.style.overflow})")
    verif("Audit", "Menu : Échap referme et libère le défilement", not m2["open"] and m2["ov"] == "", str(m2))

    # 2. analytics : les liens portent un data-track explicite
    dt = au.evaluate("""() => ({
      pdfOk: true,
      avis: (document.querySelector('.avis-lien a')||{}).getAttribute ? document.querySelector('.avis-lien a').getAttribute('data-track') : null,
      route: (document.querySelector('.sticky-btn--route')||{}).getAttribute ? document.querySelector('.sticky-btn--route').getAttribute('data-track') : null,
      carte: (document.querySelector('.carte-cta a')||{}).getAttribute ? document.querySelector('.carte-cta a').getAttribute('data-track') : null,
    })""")
    verif("Audit", "Stats : avis / itinéraire / carte tracés explicitement",
          dt["avis"] == "avis" and dt["route"] == "itineraire" and dt["carte"] == "carte", str(dt))

    # 3. hauteurs d'images déclarées = réelles (ratio)
    ratios = au.evaluate("""() => [...document.querySelectorAll('img[width][height]')]
      .filter(i => i.naturalWidth && /poulets|panier-debout|velo/.test(i.currentSrc||i.src))
      .map(i => ({src:(i.currentSrc||i.src).split('/').pop().slice(0,22), decl:(i.getAttribute('width')/i.getAttribute('height')).toFixed(2), reel:(i.naturalWidth/i.naturalHeight).toFixed(2)}))""")
    verif("Audit", "Images : ratio déclaré = ratio réel",
          all(abs(float(r["decl"]) - float(r["reel"])) < 0.05 for r in ratios), str(ratios))

    # 4. polices : Lora 400 italique n'est plus chargée ; les 3 critiques sont préchargées
    fonts = au.evaluate("() => performance.getEntriesByType('resource').map(e => e.name.split('/').pop()).filter(n => n.endsWith('.woff2'))")
    verif("Audit", "Polices : Lora 400 italique retirée", not any("lora-400i" in f for f in fonts), str([f for f in fonts if "lora" in f]))
    pre = au.evaluate("() => [...document.querySelectorAll('link[rel=preload][as=font]')].length")
    verif("Audit", "Polices : 3 préchargées (accueil)", pre == 3, str(pre))
    verif("Audit", "CDN pré-connecté", au.evaluate("() => !!document.querySelector('link[rel=preconnect][href*=jsdelivr]')"))
    og = au.evaluate("""() => { const g=n=>{const m=document.querySelector('meta[property=\"'+n+'\"]'); return m?m.content:null;};
      return {img:g('og:image'), w:g('og:image:width'), h:g('og:image:height'), alt:!!g('og:image:alt'), site:!!g('og:site_name')}; }""")
    verif("Audit", "Partage social : image paysage 1200×630 en JPEG + alt + site_name",
          bool(og["img"]) and og["img"].endswith(".jpg") and og["w"] == "1200" and og["h"] == "630" and og["alt"] and og["site"], str(og))
    verif("Audit", "Menu = dialogue (role, aria-modal)",
          au.evaluate("() => { const o=document.getElementById('menu-overlay'); return o.getAttribute('role')==='dialog' && o.getAttribute('aria-modal')==='true'; }"))
    verif("Audit", "Un seul Réserver jaune au repos (en-tête effacé)",
          au.evaluate("() => getComputedStyle(document.querySelector('.header-cta')).opacity") == "0")

    # 5. versionnage des assets
    vv = au.evaluate("() => [...document.querySelectorAll('link[rel=stylesheet],script[src]')].map(e => e.href||e.src).filter(u => /\.(css|js)(\?|$)/.test(u) && !/cdn\./.test(u))")
    verif("Audit", "Assets locaux versionnés (?v=)", all("?v=" in u for u in vv), str([u.split('/').pop() for u in vv if "?v=" not in u]))

    # 6. cibles tactiles ≥ 44px sur les 3 liens signalés
    cibles = au.evaluate("""() => ['.wordmark', '.avis-lien a'].map(s => { const e=document.querySelector(s); if(!e) return [s,null];
      const r=e.getBoundingClientRect(); return [s, Math.round(r.height)]; })""")
    verif("Audit", "Cibles tactiles ≥ 44px (logo, lien avis)", all(h and h >= 44 for _, h in cibles), str(cibles))

    # 7. vignettes de plats : plus de justification
    ad = au.evaluate("""() => ({ histoire: document.querySelectorAll('#histoire .autres-adresses li').length,
      contact: !!document.querySelector('#contact .info-block--autres'),
      herbes: !!document.querySelector('.plat-card img[src*="feuille-coriandre"]'),
      liens: [...document.querySelectorAll('a[href*="cafe-bong.com"], a[href*="bep-chay.com"]')].filter(x => x.target === '_blank' && /noopener/.test(x.rel)).length })""")
    verif("15/09", "Liens Café Bống et Bếp Chay (histoire + contact, nouvel onglet)", ad["liens"] == 4, str(ad))
    verif("15/09", "Autres adresses : dans l'histoire (2) et dans le contact",
          ad["histoire"] == 2 and ad["contact"], str(ad))
    verif("15/09", "4e carte : les herbes (feuille de coriandre)", ad["herbes"], str(ad))
    verif("Audit", "Vignettes de plats non justifiées",
          au.evaluate("() => getComputedStyle(document.querySelector('.plat-desc')).textAlign") != "justify")
    au.close()

    # 8. skip-link : Entrée déplace le focus dans le contenu (desktop, Lenis actif)
    sk = b.new_page(viewport={"width": 1280, "height": 900})
    sk.goto(BASE + "/", wait_until="networkidle"); sk.wait_for_timeout(1200)
    sk.keyboard.press("Tab"); sk.keyboard.press("Enter"); sk.wait_for_timeout(400)
    sk.keyboard.press("Tab"); sk.wait_for_timeout(200)
    apres = sk.evaluate("() => { const a=document.activeElement; return (a.className||a.tagName||'').toString().slice(0,30); }")
    verif("Audit", "Lien d'évitement : le Tab suivant est DANS le contenu", "wordmark" not in apres and "main-nav" not in apres, f"focus sur : {apres}")
    sk.close()

    # 9. paysage mobile : le bouton Réserver du menu est atteignable
    pay = b.new_page(viewport={"width": 780, "height": 360}, is_mobile=True, has_touch=True)
    pay.goto(BASE + "/", wait_until="networkidle"); pay.wait_for_timeout(800)
    pay.click("[data-burger]"); pay.wait_for_timeout(600)
    pay.evaluate("document.getElementById('menu-overlay').scrollTop = 9999"); pay.wait_for_timeout(200)
    bt = pay.evaluate("() => Math.round(document.querySelector('#menu-overlay .btn-cta').getBoundingClientRect().bottom)")
    verif("Audit", "Paysage 780×360 : Réserver atteignable dans le menu", bt <= 360, f"bas du bouton à {bt}px")
    pay.close()

    # 10. carte : prix du phở sur une ligne, listes en 2 colonnes
    ca = b.new_page(viewport={"width": 1440, "height": 900})
    ca.goto(BASE + "/carte/", wait_until="networkidle"); ca.wait_for_timeout(1200)
    ph = ca.evaluate("""() => [...document.querySelectorAll('.pho-list .menu-item')].map(l => {
      const n=l.querySelector('.menu-item-nom').getBoundingClientRect(), p=l.querySelector('.menu-item-prix').getBoundingClientRect();
      return Math.abs(Math.round(p.top - n.top)); })""")
    verif("Audit", "Phở : les 4 prix sur la ligne du nom", all(d < 12 for d in ph), str(ph))
    col = ca.evaluate("() => ['plats','desserts','boissons'].map(id => document.querySelector('#'+id+' .menu-list').classList.contains('menu-list--2col'))")
    verif("Audit", "Plats / desserts / boissons en 2 colonnes", all(col), str(col))
    bl = ca.evaluate("() => getComputedStyle(document.querySelector('.pho-kicker')).color")
    verif("Audit", "Texte bleu petit -> bleu-foncé (contraste)", bl == "rgb(23, 86, 110)", bl)
    som = ca.evaluate("() => { const s=document.querySelector('.carte-sommaire'); return s ? {pos:getComputedStyle(s).position, n:s.querelectorAll ? 0 : s.querySelectorAll('a').length} : null; }")
    verif("Audit", "Carte : sommaire collant à 6 rubriques", bool(som) and som["pos"] == "sticky" and som["n"] == 6, str(som))
    ca.close()

    # =================================================================
    # GRANDS ÉCRANS — 1920 et 2560
    # Ajouté après un défaut réel : le fond se pixellisait au-delà de 1280,
    # et rien au-dessus de cette largeur n'était contrôlé. Une image de fond
    # s'étire vers le HAUT ; son point de rupture est donc le plus grand
    # écran, jamais le plus petit.
    # =================================================================
    bloc("GRANDS ÉCRANS — 1920 et 2560")
    for w, h in [(1920, 1080), (2560, 1400)]:
        gp = b.new_page(viewport={"width": w, "height": h})
        errs_g = []
        gp.on("console", lambda m: errs_g.append(m.text) if m.type == "error" else None)
        gp.goto(BASE + "/", wait_until="networkidle")
        gp.wait_for_timeout(1400)
        g = gp.evaluate("""(() => {
          const cs = getComputedStyle(document.body, '::before');
          return {
            deborde: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            couv: Math.round(document.querySelector('.couverture').getBoundingClientRect().height),
            fondPage: cs.backgroundImage,
            fondTaille: cs.backgroundSize,
            fondRepete: cs.backgroundRepeat,
          };
        })()""")
        print(f"  {w}px : couverture={g['couv']}px  débordement={g['deborde']}px  fond={g['fondTaille']}/{g['fondRepete']}")
        verif("Grand", f"Aucun débordement horizontal ({w}px)", g["deborde"] <= 0, f"{g['deborde']}px")
        verif("Grand", f"Matière de la page présente ({w}px)", "papier-fond" in g["fondPage"])
        verif("Grand", f"Fond en cover, jamais répété ({w}px)",
              g["fondTaille"] == "cover" and g["fondRepete"] == "no-repeat",
              f"{g['fondTaille']} / {g['fondRepete']}")
        verif("Grand", f"Aucune erreur JS ({w}px)", not errs_g, str(errs_g[:2]))
        controle_structure(gp, f"accueil {w}px")
        gp.close()

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
        verif(3, f"4 plats dans le teaser (mobile {w})", mm["nbPlats"] == 4, str(mm["nbPlats"]))
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

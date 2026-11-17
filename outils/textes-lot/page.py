# Produit la page de lecture du brouillon (publiée en page privée pour le propriétaire).
import json, html, sys
B = json.load(open("brouillon.json"))
out = sys.argv[1]
NOM = {"ora": "Forma Trisse", "c01": "Mme Larchive", "c02": "Général Calpin", "c03": "M. Laplume", "c04": "Mme Bonna Bitude",
       "c05": "Dupond et Dupont", "c06": "Hermès Coursier", "c07": "Fabienne du CDI", "c08": "Senty Nell", "c09": "Lana Mageuse", "c10": "Alex Pédition"}
HUE = {"ora": 190, "c01": 150, "c02": 210, "c03": 260, "c04": 30, "c05": 120, "c06": 175, "c07": 280, "c08": 350, "c09": 45, "c10": 320}
ETAT = {"sommeil": "parle en dormant", "demi": "ensommeillée", "eveil": "réveillée"}
def etat(e):
    t = ETAT[e["etat"]]
    if e["qui"] not in ("ora", "c01") and e["etat"] == "eveil": return "présentation"
    if e["qui"] in ("c02", "c03", "c05", "c06", "c10") and e["etat"] == "demi": return "ensommeillé"
    return t
chars = sum(len(e["texte"]) for e in B)
fr = lambda x: f"{x:,}".replace(",", "\u202f")
NELL = next(i + 1 for i, e in enumerate(B) if e["id"] == "c08.role")
CRED = round(chars / 100) * 100
sections = []
for e in B:
    if not sections or sections[-1][0] != e["section"]: sections.append((e["section"], []))
    sections[-1][1].append(e)
def card(n, e):
    h = HUE[e["qui"]]; dort = e["etat"] == "sommeil"
    ch = ""
    if e.get("choix"):
        ch = '<div class="choix">' + "".join(f'<span class="ch{" ok" if e.get("bonne") == i else ""}">{html.escape(c)}{" ✓" if e.get("bonne") == i else ""}</span>' for i, c in enumerate(e["choix"])) + "</div>"
    return f'''<article class="l" data-qui="{e["qui"] if e["qui"] in ("ora","c01") else "autres"}" style="--h:{h}">
<div class="tete"><span class="num">n° {n}</span><span class="qui">{html.escape(NOM[e["qui"]])}</span><span class="etat {e["etat"]}">{etat(e)}</span></div>
<p class="txt{" dort" if dort else ""}">{html.escape(e["texte"])}</p>{ch}
<div class="ou">{html.escape(e["ou"])}</div></article>'''
n = 0; body = []
for titre, lst in sections:
    cards = []
    for e in lst:
        n += 1; cards.append(card(n, e))
    qs = sorted({e["qui"] if e["qui"] in ("ora", "c01") else "autres" for e in lst})
    body.append(f'<section data-quis="{" ".join(qs)}"><h2>{html.escape(titre)}</h2><div class="liste">{"".join(cards)}</div></section>')
page = f'''<title>Répliques du lot 3.19</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Space+Grotesk:wght@400;500;700&display=swap">
<style>
/* Feuille de lecture sombre, aux couleurs de FORMA-8 : une carte par réplique, teintée par le personnage. */
:root {{ --bg:#04060c; --panel:#0b1222; --line:#1c2a44; --text:#e8f1ff; --text2:#a9b8d3; --text3:#6f7f9c; --cyan:#3be8ff; --led:#4dffa0; --amber:#ffb547;
  --sans:"Space Grotesk", system-ui, sans-serif; --mono:"JetBrains Mono", ui-monospace, monospace; color-scheme: dark; }}
body {{ background: var(--bg); color: var(--text); font-family: var(--sans); font-size: 16px; line-height: 1.5; padding-block: 20px 60px;
  padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }}
.w {{ max-width: 620px; margin: 0 auto; display: grid; gap: 22px; }}
.kick {{ font-family: var(--mono); font-size: 11px; letter-spacing: .16em; color: var(--cyan); }}
h1 {{ color: #f4f8ff; font-size: 26px; line-height: 1.15; margin: 4px 0 8px; text-wrap: balance; }}
h2 {{ font-size: 18px; margin: 0 0 10px; text-wrap: balance; }}
p {{ margin: 0; }}
.intro {{ color: var(--text2); display: grid; gap: 10px; }}
.chiffres {{ display: flex; flex-wrap: wrap; gap: 8px; }}
.chiffres span {{ font-family: var(--mono); font-size: 12.5px; border: 1px solid var(--line); border-radius: 999px; padding: 5px 11px; color: var(--text); background: var(--panel); font-variant-numeric: tabular-nums; }}
.notes {{ background: var(--panel); border: 1px solid var(--line); border-radius: 16px; padding: 14px 16px; display: grid; gap: 8px; }}
.notes h2 {{ margin: 0; }}
.notes ul {{ margin: 0; padding-left: 20px; display: grid; gap: 6px; color: var(--text2); }}
.notes b {{ color: var(--text); }}
.notes .alerte {{ color: var(--amber); }}
.filtres {{ position: sticky; top: env(safe-area-inset-top, 0px); z-index: 5; background: var(--bg); padding: 10px 0; display: flex; flex-wrap: wrap; gap: 8px; border-bottom: 1px solid var(--line); }}
body::before {{ content: ""; position: fixed; inset: 0 0 auto; height: env(safe-area-inset-top, 0px); z-index: 10; background: var(--bg); }}
.filtres button {{ font: 500 14px var(--sans); color: var(--text); background: transparent; border: 1px solid var(--line); border-radius: 999px; padding: 7px 13px; cursor: pointer; }}
.filtres button[aria-pressed="true"] {{ background: var(--cyan); color: #04060c; border-color: var(--cyan); }}
.filtres button:focus-visible {{ outline: 2px solid var(--cyan); outline-offset: 2px; }}
section {{ display: grid; }}
.liste {{ display: grid; gap: 10px; }}
.l {{ border: 1px solid hsl(var(--h) 90% 60% / .35); border-radius: 16px 16px 16px 4px; padding: 10px 13px 11px;
  background: linear-gradient(135deg, hsl(var(--h) 55% 13%), #080d19 62%); display: grid; gap: 6px; min-width: 0; }}
.tete {{ display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 10px; font-family: var(--mono); font-size: 11px; letter-spacing: .1em; }}
.num {{ color: var(--text3); font-variant-numeric: tabular-nums; }}
.qui {{ color: hsl(var(--h) 100% 72%); text-transform: uppercase; font-weight: 600; }}
.etat {{ color: var(--text3); font-style: italic; letter-spacing: .04em; }}
.etat.eveil {{ color: var(--led); font-style: normal; }}
.txt {{ font-size: 16.5px; line-height: 1.45; overflow-wrap: anywhere; }}
.txt.dort {{ font-style: italic; color: var(--text2); }}
.choix {{ display: flex; flex-wrap: wrap; gap: 6px; }}
.ch {{ font-size: 13.5px; border: 1px solid hsl(var(--h) 90% 60% / .45); border-radius: 10px; padding: 4px 9px; color: var(--text); }}
.ch.ok {{ border-color: var(--led); color: var(--led); }}
.ou {{ font-size: 12.5px; color: var(--text3); }}
.vide {{ color: var(--text3); }}
@media (prefers-reduced-motion: no-preference) {{ .l {{ transition: opacity .15s; }} }}
</style>
<div class="w">
<header class="intro">
<div class="kick">FORMA-8 · LOT « COMPAGNON ET RÈGLES DE PAROLE »</div>
<h1>Les nouvelles répliques de l'équipe, à relire avant l'enregistrement</h1>
<p>Aucune voix n'est encore enregistrée : rien n'a été dépensé. Lis, puis dis-moi ce que tu veux changer en citant le <b>numéro</b> de la réplique (par exemple « n° 12 : plus drôle »). Le texte en <i>italique</i> est dit en dormant, avec la voix endormie que tu as choisie et le grésillement à 35 %, qui baisse à mesure que le personnage se réveille.</p>
<div class="chiffres"><span>{len(B)} répliques</span><span>{fr(chars)} caractères</span><span>≈ {fr(CRED)} crédits (estimation)</span></div>
</header>
<div class="notes">
<h2>À savoir avant de lire</h2>
<ul>
<li><b>Forma Trisse dort au début</b>, comme les autres : elle bafouille au premier lancement et aux protocoles 1 et 2, puis s'éclaircit (protocoles 3 à 5) et se réveille à la fin du caisson 00. Mme Larchive suit le même chemin au caisson 01. Les pistes utiles restent glissées dans leur demi-sommeil.</li>
<li><b>Un seul exemplaire de chaque personnage</b> : les encadrés « ORA » à l'intérieur des leçons deviennent du texte de leçon ordinaire (sans voix), parce que Forma Trisse parle déjà depuis son hublot en bas de l'écran. Sur la carte, la phrase « Prochain réveil : … » disparaît : c'est le membre endormi qui parle depuis sa capsule.</li>
<li><b>Répliques raccourcies</b> : la plupart tiennent en une ou deux phrases. Celles qui contenaient une donnée variable (ton prénom, un nombre de notions, un score) ne la disent plus : le nombre reste affiché à côté.</li>
<li><b>Babillage</b> : les textes écrits sur le moment par Claude (« Forma Trisse reformule », « Demander à Forma Trisse », questions aux membres) sont dits en petits sons robotiques, sans enregistrement.</li>
<li class="alerte"><b>À trancher, n° {NELL} (Senty Nell)</b> : le surnom « Agent Nell » emploie le mot « agent », qui est une notion du cours (l'agent IA, caisson 00, protocole 3). Sa présentation s'affiche dès le début du jeu : le validateur la refuse, et le mot prêterait à confusion. Je l'ai retiré de sa présentation ; le surnom peut revenir plus tard, dans son caisson (08).</li>
<li class="alerte"><b>Crédits</b> : environ {fr(CRED)} caractères, soit à peu près autant de crédits, sur les 20\u202f650 qui te restent. C'est plus que les 9\u202f000 annoncés hier, parce que j'ai ajouté le défi du jour, les réactions au toucher et les phrases de retour. Je ne suis pas certain que les indications de ton entre crochets (voix endormie) soient comptées : prévois une marge de 10 à 20 %.</li>
</ul>
</div>
<nav class="filtres" aria-label="Filtrer par personnage">
<button type="button" data-f="tous" aria-pressed="true">Tous</button>
<button type="button" data-f="ora" aria-pressed="false">Forma Trisse</button>
<button type="button" data-f="c01" aria-pressed="false">Mme Larchive</button>
<button type="button" data-f="autres" aria-pressed="false">Les autres</button>
</nav>
{"".join(body)}
</div>
<script>
const bs = document.querySelectorAll(".filtres button");
function filtre(f) {{
  bs.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.f === f)));
  document.querySelectorAll(".l").forEach((l) => {{ l.hidden = f !== "tous" && l.dataset.qui !== f; }});
  document.querySelectorAll("section").forEach((s) => {{ s.hidden = f !== "tous" && !s.dataset.quis.split(" ").includes(f); }});
}}
bs.forEach((b) => b.addEventListener("click", () => filtre(b.dataset.f)));
</script>
'''
open(out, "w").write(page)
print(n, "cartes")

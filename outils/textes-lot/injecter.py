# Range les répliques validées (brouillon.json) dans le contenu de l'appli (src/content). Rejouable sans risque.
import json, re
from collections import OrderedDict
B = {e["id"]: e for e in json.load(open("outils/textes-lot/brouillon.json"))}
T = lambda id: B[id]["texte"]
def dump(o, p, indent=None):
    if indent is None:
        try: second = open(p).read().split("\n")[1]; indent = len(second) - len(second.lstrip(" "))
        except (FileNotFoundError, IndexError): indent = 1
    open(p, "w").write(json.dumps(o, ensure_ascii=False, indent=indent or 1) + "\n")

# ---- 1. Répliques de l'équipe (equipe.json)
eq = json.load(open("src/content/equipe.json"), object_pairs_hook=OrderedDict)
for r in ["c00", "c01"]:
    for f in ["role", "dort", "demi", "reveil"]: eq[r][f] = T(f"{r}.{f}")
for i in range(2, 11):
    r = f"c{i:02d}"
    for f in ["role", "dort"]: eq[r][f] = T(f"{r}.{f}")
dump(eq, "src/content/equipe.json")

# ---- 2. Compagnon (compagnon.json) : un état de sommeil par protocole, des réactions par état
comp = json.load(open("src/content/compagnon.json"), object_pairs_hook=OrderedDict)
comp["_lisez-moi"] = ("Répliques du compagnon : le membre du caisson accompagne le joueur pendant un protocole. Chaque protocole a un "
  "« etat » (sommeil : il dort et bafouille ; demi : ensommeillé mais clair) qui choisit ses réactions (reactions.sommeil ou "
  "reactions.demi : premier, perseverance, indice, serie ; règles dans src/lib/companion.ts). Il parle à l'ouverture (debut), "
  "quand certains blocs apparaissent (blocs : numéro du bloc à partir de 0) et à la fin (fin). Hors protocole : carte (sur la "
  "carte, quand il est le prochain à réveiller), panne, panneFin (panne réparée, avant l'arc), livraison (une fois réveillé). "
  "À la première personne, le joueur tutoyé. Une réplique n'emploie que des notions déjà définies là où elle s'affiche "
  "(contrôlé par scripts/validate-content.mjs). Toute réplique modifiée doit être réenregistrée (voix endormie : "
  "[sleepy] [mumbling] [slowly] ; ensommeillée : [sleepy]).")
for r in ["c00", "c01"]:
    c = OrderedDict()
    c["reactions"] = OrderedDict()
    for etat in ["sommeil", "demi"]:
        c["reactions"][etat] = OrderedDict((k, [T(f"{r}.reac.{etat}.{k}.{i}") for i in (1, 2)]) for k in ["premier", "perseverance", "indice", "serie"])
    c["protocoles"] = OrderedDict()
    for p in ["p1", "p2", "p3", "p4", "p5"]:
        ids = [k for k in B if k.startswith(f"{r}.{p}.")]
        d = OrderedDict(etat=B[ids[0]]["etat"])
        d["debut"] = T(f"{r}.{p}.debut")
        d["blocs"] = OrderedDict((k.split(".")[2], T(k)) for k in ids if k.split(".")[2] not in ("debut", "fin"))
        d["fin"] = T(f"{r}.{p}.fin")
        c["protocoles"][p] = d
    if f"carte.{r}" in B: c["carte"] = T(f"carte.{r}")
    for k in ["panne", "panneFin", "livraison"]: c[k] = T(f"{r}.{k}")
    comp[r] = c
dump(comp, "src/content/compagnon.json")

# ---- 3. Interactions (interactions.json)
def pool(prefix):
    out = OrderedDict()
    for k, e in B.items():
        if not k.startswith(prefix + "."): continue
        _, qui, etat, _n = k.split(".")
        out.setdefault(qui, OrderedDict()).setdefault(etat, []).append(e["texte"])
    return out
I = OrderedDict()
I["_lisez-moi"] = ("Répliques des interactions avec l'équipe (lot du 17/11/2026, textes validés par le propriétaire) : premier lancement "
  "(boot), carte, scènes de réveil où l'équipe se parle, phrases de retour (une phrase très courte quand on revient sur une page), "
  "réactions au toucher, défi du jour, questions aux membres (sans clé Claude) et bulles des autres pages. Les personnages sont "
  "désignés par leur identifiant de voix (ora = Forma Trisse, c01 = Mme Larchive…). « sommeil » : le personnage dort encore ; "
  "« eveil » : il est réveillé. Chaque réplique a sa voix (src/content/voix-enregistrements.json) ; toute réplique modifiée doit "
  "être réenregistrée.")
I["boot"] = OrderedDict(accueil=T("boot.accueil"), ambiance=OrderedDict(texte=T("boot.ambiance"), choix=B["boot.ambiance"]["choix"]), levier=T("boot.levier"))
I["carte"] = OrderedDict(premiere=T("carte.premiere"), surchauffe=OrderedDict(
    (etat, OrderedDict(question=T(f"carte.surchauffe.q.{etat}"), choix=B[f"carte.surchauffe.q.{etat}"]["choix"],
                       oui=T(f"carte.surchauffe.oui.{etat}"), non=T(f"carte.surchauffe.non.{etat}"))) for etat in ["sommeil", "eveil"]))
I["scenes"] = OrderedDict(
    c00=[{"qui": "ora", "reveil": True}] + [{"qui": B[f"scene.c00.{i}"]["qui"], "texte": T(f"scene.c00.{i}")} for i in (1, 2, 3)],
    c01=[{"qui": "ora", "texte": T("scene.c01.1")}, {"qui": "c01", "texte": T("scene.c01.2")}, {"qui": "c01", "reveil": True}, {"qui": "ora", "texte": T("scene.c01.3")}])
I["retours"] = pool("retour")
I["toucher"] = pool("toucher")
I["defis"] = OrderedDict()
for qui in ["ora", "c01"]:
    qs = []
    for n in range(1, 10):
        if f"defi.{qui}.{n}.q" not in B: break
        e = B[f"defi.{qui}.{n}.q"]
        qs.append(OrderedDict(question=e["texte"], choix=e["choix"], bonne=e["bonne"], piste=T(f"defi.{qui}.{n}.piste")))
    I["defis"][qui] = OrderedDict(questions=qs, bravo=[T(f"defi.{qui}.bravo.{i}") for i in (1, 2)], fait=T(f"defi.{qui}.fait"))
I["question"] = OrderedDict((qui, OrderedDict(cle=T(f"question.{qui}.cle"))) for qui in ["ora", "c01"])
I["annexes"] = OrderedDict()
for k, e in B.items():
    if not k.startswith("annexe."): continue
    parts = k.split("."); etat = parts[-1]; nom = ".".join(parts[1:-1])
    I["annexes"].setdefault(nom, OrderedDict())[etat] = e["texte"]
dump(I, "src/content/interactions.json")

# ---- 4. Caissons : noms, métiers, accords ; encadrés d'ORA devenus texte de leçon
NOMS = {"c00": ("Forma Trisse", "la formatrice", "f"), "c01": ("Mme Larchive", "l'Archiviste", "f"), "c02": ("Général Calpin", "le Règlement de bord", "m"),
  "c03": ("M. Laplume", "le Scribe", "m"), "c04": ("Mme Bonna Bitude", "la Boucle", "f"), "c05": ("Dupond et Dupont", "les Inspecteurs", "mp"),
  "c06": ("Hermès Coursier", "le Messager", "m"), "c07": ("Fabienne du CDI", "la Mémoire", "f"), "c08": ("Senty Nell", "la Sentinelle", "f"),
  "c09": ("Lana Mageuse", "les Escouades et les Réflexes", "f"), "c10": ("Alex Pédition", "le Lancement", "m")}
REMPL = [("Ici dort **l'Archiviste**. Elle", "Ici dort **Mme Larchive**, l'archiviste. Elle"), ("le dernier secret de l'Archiviste", "le dernier secret de Mme Larchive"),
         ("L'Archiviste te regarde faire", "Mme Larchive te regarde faire"), ("**Demander à ORA**", "**Demander à Forma Trisse**")]
for r, (nom, metier, genre) in NOMS.items():
    p = f"src/content/caissons/{r}.json"; raw = open(p).read()
    for a, b in REMPL: raw = raw.replace(a, b)
    c = json.loads(raw, object_pairs_hook=OrderedDict)
    out = OrderedDict()
    for k, v in c.items():
        out[k] = nom if k == "member" else v
        if k == "member": out["metier"] = metier; out["genre"] = genre
    for s in out.get("steps", []):
        s["blocks"] = [OrderedDict(type="text", md=b["md"]) if b.get("type") == "callout" and b.get("tone") == "ora" else b for b in s["blocks"]]
    dump(out, p)
print("ok")

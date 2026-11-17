# Vérifie le brouillon : aucun mot surveillé avant sa notion, zéro emoji (contrôle simple), longueur.
import json, re, sys
B = json.load(open("outils/textes-lot/brouillon.json"))
g = {n["id"]: n for n in json.load(open("src/content/glossary.json"))}
order = []  # (room, step, block index, notion)
steps = {}
for r in ["c00", "c01"]:
    c = json.load(open(f"src/content/caissons/{r}.json"))
    for s in c["steps"]:
        steps[(r, s["id"])] = s
        for i, b in enumerate(s["blocks"]):
            if b["type"] == "definition": order.append((r, s["id"], i, b["notion"]))
def known_before(room, step=None, block=None):
    k = set()
    for (r, s, i, n) in order:
        if r < room or (r == room and step and (s < step or (s == step and block is not None and i <= block))): k.add(n)
    return k
ALL00 = known_before("c01"); ALL01 = {n for (_, _, _, n) in order}
def known_for(e):
    id = e["id"]; m = re.match(r"(c0[01])\.(p\d)\.(\w+)$", id)
    if m:
        r, p, k = m.groups(); nb = len(steps[(r, p)]["blocks"])
        return known_before(r, p, 0 if k == "debut" else nb if k == "fin" else int(k))
    if id.startswith(("c01.reac", "carte.c01", "c01.dort", "c01.demi", "retour.c01.sommeil", "toucher.c01.sommeil", "c01.panne")): return ALL00
    if id.startswith(("defi.ora", "question", "scene.c00", "annexe.preparation")) or ".eveil" in id and id.startswith(("retour.ora", "toucher.ora", "carte.surchauffe")): return ALL00
    if id.startswith(("defi.c01", "c01.livraison", "c01.reveil", "scene.c01", "retour.c01.eveil", "toucher.c01.eveil")): return ALL01
    if id in ("c00.livraison", "c00.reveil"): return ALL00
    return set()
bad = 0
for e in B:
    k = known_for(e)
    for n in g.values():
        if n["id"] in k: continue
        for w in n.get("watch") or []:
            texts = [e["texte"]] + e.get("choix", [])
            for t in texts:
                if re.search(r"(?<![\w])" + re.escape(w) + r"(?![\w])", t, re.I):
                    print("MOT TROP TÔT", e["id"], "«", w, "»", t); bad += 1
    if re.search("[\U0001F300-\U0001FAFF☀-➿]", e["texte"]): print("EMOJI", e["id"]); bad += 1
print("problèmes :", bad)

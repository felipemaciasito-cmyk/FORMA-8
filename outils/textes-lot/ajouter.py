# Range des prises ElevenLabs : python3 outils/textes-lot/ajouter.py <id>=<url> [<id>=<url> ...]
# (pour un personnage à deux voix : <id>=<url>|<url-duo>). Inscrit chaque prise dans prises.json.
import json, subprocess, sys, os
W = {w["id"]: w for w in json.load(open("outils/textes-lot/travail.json"))}
P = "outils/textes-lot/prises.json"
prises = json.load(open(P)) if os.path.exists(P) else {}
BASE = "https://elevenlabsusercontent.com/database/workspace/ac534a796dbc4ec3832fb5af035eff4a/content_generation/"
def full(u):
    # Forme courte « session/génération/signature@expiration » (expiration par défaut : 1794895200).
    if u.startswith("http"): return u
    path, _, exp = u.partition("@")
    sess, gen, sig = path.split("/", 2)
    return f"{BASE}{sess}/{gen}/content.mp3?Expires={exp or 1794895200}&KeyName=assets-cdn-key-1&Signature={sig}"
for a in sys.argv[1:]:
    id, url = a.split("=", 1)
    w = W[id]; urls = [full(u) for u in url.split("|")]
    cmd = ["node", "scripts/voix.mjs", "ajouter", w["qui"], urls[0], "--texte", w["texte"], "--envoye", w["envoye"]]
    if len(urls) > 1: cmd += ["--duo", urls[1]]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode: print("ÉCHEC", id, r.stderr[-300:]); continue
    prises[id] = True; print("ok", id)
json.dump(prises, open(P, "w"), ensure_ascii=False, indent=0)
print(len(prises), "/", len(W), "prises rangées")

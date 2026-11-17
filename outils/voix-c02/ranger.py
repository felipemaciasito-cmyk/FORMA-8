# Range les prises du caisson 02 : python3 outils/voix-c02/ranger.py <index>=<generation>/<signature>[@<expiration>] ...
# (session d'après sessions.txt). Appelle scripts/voix.mjs ajouter, qui télécharge, vérifie et inscrit la prise.
import json, subprocess, sys
W = json.load(open("outils/voix-c02/travail.json"))
S = dict(l.split() for l in open("outils/voix-c02/sessions.txt") if l.strip())
BASE = "https://elevenlabsusercontent.com/database/workspace/ac534a796dbc4ec3832fb5af035eff4a/content_generation/"
ok = 0
for a in sys.argv[1:]:
    i, rest = a.split("=", 1)
    rest, _, exp = rest.partition("@")
    gen, sig = rest.split("/", 1)
    w = W[int(i)]
    url = f"{BASE}{S[i]}/{gen}/content.mp3?Expires={exp or 1794924000}&KeyName=assets-cdn-key-1&Signature={sig}"
    r = subprocess.run(["node", "scripts/voix.mjs", "ajouter", w["qui"], url, "--texte", w["texte"], "--envoye", w["envoye"]], capture_output=True, text=True)
    if r.returncode: print("ÉCHEC", i, (r.stderr or r.stdout)[-300:]); continue
    ok += 1
print(ok, "prise(s) rangée(s)")

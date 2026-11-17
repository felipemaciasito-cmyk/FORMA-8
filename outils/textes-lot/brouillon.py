# Brouillon des répliques du lot « compagnon et règles de parole » (section 3.19 du transfert).
# Source unique : ce fichier produit brouillon.json (relu par le propriétaire avant tout enregistrement).
# États : "sommeil" (endormi, bafouille, voix endormie), "demi" (ensommeillé mais clair), "eveil" (réveillé).
import json
S, D, E = "sommeil", "demi", "eveil"
L = []
def add(sec, id, qui, etat, ou, texte, **kw):
    L.append(dict(section=sec, id=id, qui=qui, etat=etat, ou=ou, texte=texte, **kw))

# ---------------------------------------------------------------- 1. Premier lancement
s = "1. Premier lancement : Forma Trisse dort encore"
add(s, "boot.accueil", "ora", S, "Après le BIOS, avec le champ du prénom (remplace l'accueil d'ORA)",
    "… mmh… qui a rallumé la lune ?… je suis Forma Trisse… je crois… onze dormeurs dans la réserve… réveille-nous… et on construira ton produit… ton prénom ?…")
add(s, "boot.ambiance", "ora", S, "Question du fond sonore, réponses dans la bulle",
    "… les machines ronronnent… comme un gros chat… tu veux les entendre ?… tu pourras changer d'avis… dans Réglages…",
    choix=["Oui, allume le fond sonore", "Non merci"])
add(s, "boot.levier", "ora", S, "Devant le levier",
    "… abaisse le grand levier… le courant réveillera tout le monde… enfin… presque…")

# ---------------------------------------------------------------- 2. Carte
s = "2. La carte"
add(s, "carte.premiere", "ora", S, "Première visite de la carte (aucun protocole fait)",
    "… zzz… caisson 00… c'est mon lit… viens me réveiller…")
add(s, "carte.surchauffe.q.sommeil", "ora", S, "Retour sur la carte, des notions à réviser (Forma pas encore réveillée)",
    "… ça sent le chaud… des notions surchauffent… on les refroidit ?…", choix=["Oui, en maintenance", "Plus tard"])
add(s, "carte.surchauffe.oui.sommeil", "ora", S, "Réponse à « Oui »", "… bonne idée… je te suis… zzz…")
add(s, "carte.surchauffe.non.sommeil", "ora", S, "Réponse à « Plus tard »", "… plus tard… oui… moi aussi… plus tard…")
add(s, "carte.surchauffe.q.eveil", "ora", E, "Même moment, Forma réveillée",
    "Des notions surchauffent. On les refroidit d'abord ?", choix=["Oui, en maintenance", "Plus tard"])
add(s, "carte.surchauffe.oui.eveil", "ora", E, "Réponse à « Oui »", "Allons-y. Quelques minutes suffisent.")
add(s, "carte.surchauffe.non.eveil", "ora", E, "Réponse à « Plus tard »", "D'accord. Elles t'attendront.")
add(s, "carte.c01", "c01", S, "Sur la carte, Mme Larchive est la prochaine à réveiller",
    "… zzz… caisson 01… c'est moi… viens me réveiller… j'ai rangé la girafe…")

# ---------------------------------------------------------------- 3. Forma Trisse
s = "3. Forma Trisse dans son caisson (00)"
add(s, "c00.role", "ora", E, "Sous-titre et fiche (affiché dès le début)",
    "Je suis Forma Trisse, ta formatrice. Je t'apprends les bases, et je t'aide à réveiller l'équipe.")
add(s, "c00.dort", "ora", S, "Page du caisson, avant le premier protocole",
    "… zzz… formatrice en veille… le premier protocole… il me réveillera…")
add(s, "c00.demi", "ora", D, "Page du caisson, après le premier protocole",
    "Mmh… mes circuits reviennent, un par un. Continue : tu apprends vite.")
add(s, "c00.reveil", "ora", E, "Scène de réveil",
    "Pleine puissance ! Les bases sont posées, et ta page est en ligne. Allons réveiller les autres.")

s = "4. Forma Trisse t'accompagne dans les protocoles (caisson 00)"
P = {
 "p1": (S, "Ce qu'est une application", {
   "debut": "… mmh… protocole un… on parle d'applications… et de magasins… je crois… zzz…",
   "6": "… le client… le magasin… retiens le magasin… il reviendra souvent…",
   "9": "… une question… prends ton temps… une erreur ne grille rien…",
   "fin": "… la batterie… termine… branche-la sur la centrale… et j'ouvrirai un œil…"}),
 "p2": (S, "Les trois langues d'une page", {
   "debut": "… mmh… aujourd'hui… on ouvre le capot d'une page… sans rien écrire… promis…",
   "5": "… les murs… la peinture… l'électricité… trois langues… une seule maison…",
   "6": "… ton premier code… repère juste ce qui change… le reste… pas grave…",
   "fin": "… je sens mes circuits… termine le protocole… zzz…"}),
 "p3": (D, "Créer avec une IA", {
   "debut": "Mmh… ce protocole parle un peu de moi : l'intelligence artificielle. Je me réveille, promis.",
   "7": "Décrire, laisser faire, vérifier. Retiens ces trois temps… pardon, je bâille.",
   "13": "Explique avec tes mots, comme à un ami. J'écoute, les yeux mi-clos.",
   "fin": "Mes yeux s'ouvrent. Termine le protocole et branche la batterie."}),
 "p4": (D, "Choisir ton produit", {
   "debut": "Moment important : tu choisis le produit que toute l'équipe construira avec toi.",
   "2": "La serrure d'abord, la clé ensuite. Beaucoup de projets font l'inverse.",
   "7": "Note plusieurs idées avant de choisir. La première n'est pas toujours la bonne.",
   "fin": "Ton produit a un nom. Toute l'équipe le portera. Termine le protocole."}),
 "p5": (D, "Ta première mise en ligne", {
   "debut": "Dernier protocole : aujourd'hui, ton produit existe sur internet. Prévois deux quarts.",
   "3": "Une étape à la fois. Si un écran ne ressemble pas, touche « Je suis bloqué ».",
   "6": "Ton premier ordre de mission. Copie-le tel quel dans Claude Code.",
   "11": "Encore cette procédure, et ta page sera visible par tout le monde.",
   "fin": "Ta page est en ligne. Termine, puis répare la panne : je serai réveillée."}),
}
def where(k): return "Ouverture du protocole" if k == "debut" else "Fin du protocole" if k == "fin" else f"Quand le bloc {k} apparaît"
for p, (etat, titre, d) in P.items():
    for k, t in d.items(): add(s, f"c00.{p}.{k}", "ora", etat, f"{p.upper()} « {titre} » · {where(k)}", t)
add(s, "c00.panne", "ora", D, "Début de la panne", "Une panne, juste avant mon réveil ! Lis chaque alerte : une erreur grille un fusible.")
add(s, "c00.panneFin", "ora", D, "Panne réparée, avant l'arc", "Réparé. Envoie l'arc dans ma capsule, et j'ouvre les yeux.")
add(s, "c00.livraison", "ora", E, "Page du caisson, une fois réveillée", "Ta livraison prouve que ta page existe vraiment. Je la vérifie sur GitHub.")

s = "5. Forma Trisse réagit à tes réponses (caisson 00)"
R00 = {
 S: {"premier": ["… mmh… oui… bonne réponse… une cellule s'allume… c'est tout chaud…", "… exact… j'ai rêvé d'un voyant vert… c'était toi…"],
     "perseverance": ["… une erreur… puis la bonne… c'est comme ça qu'on retient… zzz…", "… raté… puis trouvé… le meilleur ordre…"],
     "indice": ["… pas ça… la réponse dort juste au-dessus… dans les définitions…", "… les chaussettes… mmh… remonte d'un ou deux blocs… et réessaie…"],
     "serie": ["… trois d'affilée… mes paupières clignotent…", "… encore une… je vais finir par me réveiller…"]},
 D: {"premier": ["Bonne réponse. Une cellule s'allume.", "Exact. Je le sens dans mes circuits."],
     "perseverance": ["Tu as cherché, et tu as trouvé. C'est ainsi qu'on apprend.", "Une erreur, puis la bonne réponse : celle-là, tu ne l'oublieras pas."],
     "indice": ["Pas encore. Relis la définition juste au-dessus.", "Une erreur ne coûte rien ici. Remonte un peu, puis réessaie."],
     "serie": ["Trois sans faute. Mes voyants passent au vert.", "Quelle série ! Je me réveille plus vite que prévu."]},
}
NOMS = {"premier": "première bonne réponse", "perseverance": "bonne réponse après une erreur", "indice": "deuxième erreur (une piste)", "serie": "trois bonnes réponses d'affilée"}
for etat, d in R00.items():
    for k, lst in d.items():
        for i, t in enumerate(lst): add(s, f"c00.reac.{etat}.{k}.{i+1}", "ora", etat, f"{'Protocoles 1 et 2' if etat == S else 'Protocoles 3 à 5'} · {NOMS[k]}", t)

s = "6. Le réveil de Forma Trisse : l'équipe se parle"
add(s, "scene.c00.1", "ora", E, "Scène de réveil, après sa réplique de réveil", "Mme Larchive ? Debout, on a du travail !")
add(s, "scene.c00.2", "c01", S, "Elle répond, sans se réveiller", "… encore cinq minutes…")
add(s, "scene.c00.3", "ora", E, "Pour finir la scène", "Elle dort profondément. À toi de la réveiller, au caisson 01.")

# ---------------------------------------------------------------- Mme Larchive
s = "7. Mme Larchive dans son caisson (01)"
add(s, "c01.role", "c01", E, "Sous-titre et fiche (affiché dès le début)",
    "Je suis Mme Larchive, l'archiviste. Je garde chaque version de ton produit, pour que tu puisses toujours revenir en arrière.")
add(s, "c01.dort", "c01", S, "Page du caisson, avant le premier protocole",
    "… qui a rangé la girafe dans le tiroir B ?… je ne jette rien… même pas la girafe…")
add(s, "c01.demi", "c01", S, "Page du caisson, après le premier protocole",
    "… mmh… je me souviens d'un album… chaque étape du chantier… encore un effort…")
add(s, "c01.reveil", "c01", E, "Scène de réveil",
    "Bonjour, chef. Me voilà réveillée. Plus aucune version de ton produit ne se perdra. Et si quelque chose casse, on reviendra en arrière, sans rien effacer.")

s = "8. Mme Larchive t'accompagne dans les protocoles (caisson 01)"
P = {
 "p1": (S, "Pourquoi garder les versions", {
   "debut": "… mmh… tu es là ?… je rêvais de photos… de chantier… parlons souvenirs…",
   "3": "… les photos du chantier… des milliers… toutes dans l'ordre… sauf la girafe…",
   "8": "… remonte le temps… vas-y… rien n'est jamais perdu…",
   "fin": "… je sens un courant… termine… branche la batterie… sur ma capsule…"}),
 "p2": (S, "Le commit", {
   "debut": "… aujourd'hui… une légende sous chaque photo… sinon je confonds tout…",
   "4": "… une légende courte… claire… pas « truc »… ni « bidule »…",
   "6": "… ton ancien projet… six photos seulement… je m'en souviens…",
   "fin": "… la batterie est presque pleine… termine… et branche-la…"}),
 "p3": (D, "Les branches", {
   "debut": "Mmh… une voie d'essai. On essaie à côté, sans rien casser. Pardon, je bâille.",
   "2": "Les trains d'essai ne gênent personne. C'est rassurant.",
   "8": "Ta première branche, à la main. Je regarde, les yeux mi-clos.",
   "fin": "Encore un peu de courant. Termine le protocole."}),
 "p4": (D, "La pull request en détail", {
   "debut": "Relire avant de fusionner : c'est ma règle la plus importante.",
   "6": "Relis ligne par ligne. Je t'attends.",
   "10": "Tu confies le travail, mais c'est toi qui relis. Toujours.",
   "fin": "Mes paupières bougent. Termine le protocole."}),
 "p5": (D, "Revenir en arrière", {
   "debut": "Revenir en arrière sans rien effacer : c'est mon métier.",
   "2": "À l'encre, jamais à la gomme. On corrige en dessous.",
   "8": "Deux versions qui se disputent : c'est toi qui tranches.",
   "fin": "Presque réveillée. Termine, répare la panne, et j'ouvre les yeux."}),
}
for p, (etat, titre, d) in P.items():
    for k, t in d.items(): add(s, f"c01.{p}.{k}", "c01", etat, f"{p.upper()} « {titre} » · {where(k)}", t)
add(s, "c01.panne", "c01", D, "Début de la panne", "Des alertes dans mes archives ! Réfléchis avant de toucher : les fusibles sont fragiles.")
add(s, "c01.panneFin", "c01", D, "Panne réparée, avant l'arc", "Le courant passe. Envoie l'arc, maintenant.")
add(s, "c01.livraison", "c01", E, "Page du caisson, une fois réveillée", "Je vérifie tes archives sur GitHub : cinq commits, une pull request fusionnée, et ton README.")

s = "9. Mme Larchive réagit à tes réponses (caisson 01)"
R01 = {
 S: {"premier": ["… mmh… bonne réponse… je la colle dans l'album…", "… exact… une cellule… ça chatouille…"],
     "perseverance": ["… raté… puis trouvé… je garde aussi les brouillons…", "… une erreur… puis la bonne… c'est l'ordre normal…"],
     "indice": ["… les chaussettes… mmh… relis la définition… juste au-dessus…", "… la réponse… elle est rangée… un peu plus haut…"],
     "serie": ["… trois d'affilée… je fais un très beau rêve…", "… encore une… mes paupières dansent…"]},
 D: {"premier": ["Exact. Je l'inscris au registre.", "Bonne réponse. Une cellule de plus."],
     "perseverance": ["Une erreur, puis la bonne réponse. Je garde les deux : c'est précieux.", "Tu as recommencé, et tu as trouvé. Bravo."],
     "indice": ["Pas tout à fait. Reprends la définition, puis réessaie.", "Doucement. Tout est noté un peu plus haut."],
     "serie": ["Trois d'affilée. Je suis presque réveillée.", "Encore une. Mes yeux s'ouvrent."]},
}
for etat, d in R01.items():
    for k, lst in d.items():
        for i, t in enumerate(lst): add(s, f"c01.reac.{etat}.{k}.{i+1}", "c01", etat, f"{'Protocoles 1 et 2' if etat == S else 'Protocoles 3 à 5'} · {NOMS[k]}", t)

s = "10. Le réveil de Mme Larchive : l'équipe se parle"
add(s, "scene.c01.1", "ora", E, "Scène de réveil, avant sa réplique de réveil", "Bienvenue parmi nous, Mme Larchive. Bien dormi ?")
add(s, "scene.c01.2", "c01", E, "Elle répond", "Comme une bûche. Merci, Forma Trisse.")
add(s, "scene.c01.3", "ora", E, "Après sa réplique de réveil", "Tu es entre de bonnes mains. Allons réveiller la suite.")

# ---------------------------------------------------------------- Les autres
s = "11. Les autres membres, encore endormis (présentation et sommeil)"
AUTRES = [
 ("c02", "Je suis le Général Calpin, le règlement de bord. J'écris les règles que toute l'équipe suit, à chaque séance de travail.",
  "… article douze… il est interdit… de ronfler en service… repos !…"),
 ("c03", "Je suis M. Laplume, le scribe. Avant de construire quoi que ce soit, je décris avec toi ce qu'il faut construire.",
  "… il était une fois… un bouton… qui rêvait de devenir… une fusée…"),
 ("c04", "Je suis Mme Bonna Bitude, la boucle ! Je demande, je relis, je corrige, et je recommence jusqu'à ce que ça marche.",
  "… encore un tour… et encore un… qui a mis un manège dans mon rêve ?…"),
 ("c05", "Nous sommes Dupond et Dupont, les inspecteurs. Nous vérifions que tout fonctionne, à chaque changement. Sans exception.",
  "… vérifié… revérifié… re-revérifié… ronfle moins fort, toi…"),
 ("c06", "Je suis Hermès Coursier, le messager ! Je mets ton produit en ligne, vite, et sans rien casser.",
  "… colis pour la lune… signez ici… attention, c'est fragile…"),
 ("c07", "Je suis Fabienne, la dame du CDI : la mémoire de l'équipe. Je garde les données et les comptes de tes utilisateurs.",
  "… chut… on est au CDI… rendez vos souvenirs… avant mardi…"),
 ("c08", "Je suis Senty Nell, la sentinelle. Je protège tes secrets, tes utilisateurs et ton budget.",
  "… halte… mot de passe ?… « pistache »… non… c'était hier…"),
 ("c09", "Je suis Lana Mageuse. Je mène l'escouade : mes drones travaillent en même temps, et mes réflexes veillent pour toi.",
  "… drone numéro trois… arrête de chanter… on est en formation…"),
 ("c10", "Je suis Alex Pédition, le lancement. Je présente ton produit au monde, et je t'aide à en faire ton métier.",
  "… dix… neuf… huit… j'ai oublié la suite… on recommence…"),
]
for r, role, dort in AUTRES:
    add(s, f"{r}.role", r, E, "Présentation (sous-titre et fiche)", role)
    add(s, f"{r}.dort", r, S, "Il dort (page du caisson, fiche de l'équipe)", dort)

# ---------------------------------------------------------------- Retours
s = "12. Quand tu reviens sur une page : une phrase très courte, différente à chaque fois"
RET = {
 ("ora", S): ["… te revoilà… zzz…", "… mmh… déjà ?…", "… on reprend… je crois…", "… c'est toi ?… bien…"],
 ("ora", E): ["Te revoilà.", "On reprend ?", "Contente de te revoir.", "La réserve t'attendait."],
 ("c01", S): ["… mmh… re-bonjour…", "… je t'ai gardé ta place…", "… zzz… on en était où ?…", "… tu reviens… je le note…"],
 ("c01", E): ["Te revoilà, chef.", "J'ai tout gardé en ordre.", "On reprend où on en était ?", "Rien ne s'est perdu en ton absence."],
}
for (qui, etat), lst in RET.items():
    for i, t in enumerate(lst): add(s, f"retour.{qui}.{etat}.{i+1}", qui, etat, "Retour sur la carte, le caisson ou un protocole déjà commencé", t)

# ---------------------------------------------------------------- Toucher
s = "13. Quand tu touches un personnage : il réagit"
TOU = {
 ("ora", S): ["… hein ?… qui me chatouille ?…", "… encore cinq minutes…", "… mes voyants… laisse mes voyants…", "… non… je ne suis pas un bouton…"],
 ("ora", E): ["Oui ? Je suis là.", "Ça chatouille les circuits.", "Une question ? Touche « Demander à Forma Trisse ».", "Toujours en service."],
 ("c01", S): ["… qui frappe au tiroir ?…", "… cinq minutes… encore cinq…", "… non… les mardis se classent par taille…", "… je rêve d'un historique tout propre…"],
 ("c01", E): ["Oui, chef ?", "Attention, mes tiroirs sont rangés.", "Je garde tout, même ce toucher.", "Un souvenir à retrouver ?"],
 ("c02", S): ["… qui a touché… au règlement ?…"],
 ("c03", S): ["… ne froisse pas… ma page…"],
 ("c04", S): ["… ça tourne… ça tourne… hop…"],
 ("c05", S): ["… suspect… très suspect…"],
 ("c06", S): ["… je pars… dans cinq minutes…"],
 ("c07", S): ["… chut… bibliothèque…"],
 ("c08", S): ["… halte… ah… c'est toi…"],
 ("c09", S): ["… drones… au repos…"],
 ("c10", S): ["… pas encore… le décollage…"],
}
for (qui, etat), lst in TOU.items():
    for i, t in enumerate(lst): add(s, f"toucher.{qui}.{etat}.{i+1}", qui, etat, "Toucher le personnage (capsule, hublot, fiche)", t)

# ---------------------------------------------------------------- Défi du jour
s = "14. Le défi du jour, sur la carte (le dernier membre réveillé te questionne)"
DEFIS = {
 "ora": [
  ("Défi du jour ! Où attendent les fichiers d'un site, avant que tu les demandes ?", ["Sur un serveur", "Dans ton navigateur", "Dans l'App Store"], 0, "Pense au magasin, pas au client."),
  ("Défi du jour ! Quelle langue décide des couleurs d'une page ?", ["HTML", "CSS", "JavaScript"], 1, "Pense à la peinture de la maison."),
  ("Défi du jour ! Qu'est-ce qu'un agent ?", ["Une IA qui agit, puis vérifie son travail", "Une IA qui répond, sans rien faire", "Une personne qui code à ta place"], 0, "Pense au chantier : qui fait le travail ?"),
  ("Défi du jour ! À quoi sert une pull request ?", ["À effacer un dépôt", "À publier la page", "À proposer un changement, à relire avant de l'accepter"], 2, "On propose d'abord, on accepte ensuite."),
 ],
 "c01": [
  ("Défi du jour ! À quoi sert le message d'un commit ?", ["À nommer le dépôt", "À dire ce qui a changé", "À publier la page"], 1, "Pense à la légende au dos de la photo."),
  ("Défi du jour ! Une branche, c'est…", ["Une copie de travail, pour essayer sans rien casser", "Une sauvegarde sur l'iPhone", "Un deuxième dépôt"], 0, "Pense aux trains d'essai."),
  ("Défi du jour ! Une erreur a été fusionnée. Que fais-tu ?", ["J'efface l'historique", "Je l'annule, sans rien effacer", "Je supprime le dépôt"], 1, "À l'encre, jamais à la gomme."),
  ("Défi du jour ! Un conflit, c'est…", ["Un dépôt en panne", "Une branche supprimée", "Deux changements différents au même endroit"], 2, "Deux versions qui se disputent."),
 ],
}
for qui, lst in DEFIS.items():
    for i, (q, ch, ok, piste) in enumerate(lst):
        add(s, f"defi.{qui}.{i+1}.q", qui, E, "Question (les réponses sont dans la bulle ; elles ne sont pas lues)", q, choix=ch, bonne=ok)
        add(s, f"defi.{qui}.{i+1}.piste", qui, E, "Après une mauvaise réponse (on peut réessayer)", f"Pas tout à fait. {piste}")
SUC = {"ora": ["Exact ! Quinze kilowatts pour toi. À demain.", "Bravo. Défi réussi : quinze kilowatts."],
       "c01": ["Exact ! Quinze kilowatts pour toi. À demain.", "Je l'inscris au registre : défi réussi."]}
for qui, lst in SUC.items():
    for i, t in enumerate(lst): add(s, f"defi.{qui}.bravo.{i+1}", qui, E, "Défi réussi (+15 kW)", t)
add(s, "defi.ora.fait", "ora", E, "Défi du jour déjà relevé", "Défi du jour relevé. Reviens demain.")
add(s, "defi.c01.fait", "c01", E, "Défi du jour déjà relevé", "Défi relevé. Je te garde le suivant pour demain.")

# ---------------------------------------------------------------- Questions à un membre
s = "15. Poser une question à un membre réveillé (réponse écrite par Claude, dite en babillage)"
add(s, "question.ora.cle", "ora", E, "Question sans clé Claude enregistrée", "Pour me poser une question, il me faut ta clé Claude. Ajoute-la dans Réglages.")
add(s, "question.c01.cle", "c01", E, "Question sans clé Claude enregistrée", "Pour me questionner, il faut ta clé Claude, dans Réglages. Je t'attends.")

# ---------------------------------------------------------------- Pages annexes
s = "16. Les autres pages (deux versions : Forma endormie, puis réveillée)"
ANNEXES = [
 ("atelier", "Atelier des consignes", "… l'atelier… on y écrit des ordres de mission… Claude les note… mmh…", "Ici, tu écris des ordres de mission. Claude les note sur cinq critères."),
 ("equipe", "Page de l'équipe", "… chaque dormeur… un vrai fichier de ton produit… touche-les… doucement…", "Chaque membre correspond à un vrai fichier de ton produit. Touche-le pour voir sa fiche."),
 ("maint.chaud", "Maintenance, des notions à réviser (leur nombre reste affiché à côté)", "… ça chauffe… quelques notions à refroidir… vite fait…", "Des notions surchauffent. Quelques minutes suffisent à les refroidir."),
 ("maint.calme", "Maintenance, rien à réviser aujourd'hui", "… rien ne chauffe… dors… euh… reviens demain…", "Aucune surchauffe aujourd'hui. Entraîne-toi, ou reviens demain."),
 ("maint.fin", "Maintenance terminée (le score reste affiché à côté)", "… bien refroidi… les ratées reviendront demain…", "Maintenance terminée. Les ratées reviendront demain : c'est ce rythme qui ancre."),
 ("verrou.caisson", "Caisson verrouillé", "… fermé… réveille d'abord… celui d'avant…", "Ce caisson est verrouillé. Réveille d'abord le membre précédent."),
 ("verrou.protocole", "Protocole pas encore ouvert", "… pas encore… termine le précédent… zzz…", "Pas encore ouvert. Termine le protocole précédent."),
 ("verrou.panne", "Panne ouverte trop tôt", "… la panne… après tous les protocoles…", "Termine d'abord tous les protocoles du caisson."),
 ("disjonction", "Les trois fusibles ont grillé", "… boum… trois fusibles… pas de panique… relis… puis réarme…", "Disjonction ! Trois fusibles grillés. Relis les explications, puis réarme le tableau."),
]
for k, ou, dort, eveil in ANNEXES:
    add(s, f"annexe.{k}.sommeil", "ora", S, ou, dort)
    add(s, f"annexe.{k}.eveil", "ora", E, ou, eveil)
add(s, "annexe.maint.vide.sommeil", "ora", S, "Maintenance, aucune notion encore apprise", "… rien à réviser… termine d'abord un protocole…")
add(s, "annexe.preparation.eveil", "ora", E, "Caisson dont les protocoles ne sont pas encore écrits", "Ses protocoles sont en préparation. Ils arriveront dans une prochaine version.")

json.dump(L, open("brouillon.json", "w"), ensure_ascii=False, indent=1)
print(len(L), "répliques,", sum(len(x["texte"]) for x in L), "caractères")

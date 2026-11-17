# Caisson 02 · Le Règlement de bord · « L'environnement de ton équipe » (sources ouvertes le 17/11/2026).
# Écrit à neuf (règle 9 : aucun contenu de FORMA-7). Rejouable : remplace steps, incident et delivery de c02.json.
import json

P = "./src/content/caissons/c02.json"
D = "2026-11-17"
DOC = "https://code.claude.com/docs/fr/"

def src(title, path, note=None, url=None):
    b = {"type": "source", "title": title, "url": url or DOC + path, "checked": D}
    if note: b["note"] = note
    return b

def qcm(q, opts):
    return {"type": "exercise", "ex": {"kind": "qcm", "q": q, "options": [{"t": t, "ok": ok, "why": w} for t, ok, w in opts]}}

def tf(q, items):
    return {"type": "exercise", "ex": {"kind": "truefalse", "q": q, "items": [{"s": s, "ok": ok, "why": w} for s, ok, w in items]}}

# =====================================================================================================
p1 = {
 "id": "p1", "title": "Une séance de travail dans le navigateur",
 "kicker": "Ton équipe travaille dans un atelier prêté, quelque part au loin.",
 "introduces": ["session", "environnement-cloud", "terminal", "commande"],
 "uses": ["claude-code", "depot", "github", "pull-request", "branche", "commit", "serveur", "git", "fichier"],
 "blocks": [
  {"type": "text", "md": "Au caisson 00, tu as ouvert ta première séance sur claude.ai/code. Avant d'écrire le règlement de ton équipe, le Général Calpin veut que tu saches **où** elle travaille, et avec quels outils."},
  {"type": "definition", "notion": "session"},
  {"type": "example", "title": "Une séance par tâche",
   "before": {"label": "Tout dans la même séance", "md": "« Crée la page »… puis « ajoute un bouton »… puis « corrige le titre »… puis « change les couleurs », le tout dans un seul fil qui n'en finit pas."},
   "after": {"label": "Une séance par tâche", "md": "« Ajouter le bouton Contact » : une séance. « Corriger le titre » : une autre. Chacune a un sujet clair et se termine par sa [[pull-request]]."},
   "note": "Un fil court et centré sur une tâche, c'est plus facile à relire pour toi, et plus clair pour [[claude-code]]. Tu comprendras au protocole suivant pourquoi c'est aussi plus efficace."},
  {"type": "definition", "notion": "environnement-cloud"},
  {"type": "callout", "tone": "info", "md": "**Ce qui n'est pas dans le dépôt n'existe pas pour ton équipe.** À chaque [[session]], la machine distante repart d'une copie toute neuve de ton [[depot]]. Une consigne que tu as donnée une fois, un réglage fait ailleurs : rien de tout cela n'y est. Ce que l'équipe doit savoir à chaque séance s'écrit **dans un fichier du dépôt**. C'est le sujet du protocole 3."},
  {"type": "definition", "notion": "terminal"},
  {"type": "definition", "notion": "commande"},
  {"type": "text", "md": "**Trois commandes que tu verras passer dans tes séances :**\n- `git status` : [[git]] dit quels fichiers ont changé depuis le dernier [[commit]] ;\n- `ls` : la liste des fichiers du dossier ;\n- `npm test` : lance les tests du projet, quand il en a.\n\nTu n'as pas besoin de les taper : [[claude-code]] le fait dans le [[terminal]] de sa machine. Mais savoir les lire, c'est savoir ce que fait ton équipe."},
  {"type": "procedure", "id": "c02-visiter-seance", "title": "Visiter une séance de travail",
   "intro": "Dans Safari, sur claude.ai/code. Tu ne modifies rien : tu observes une séance déjà terminée, par exemple celle du caisson 01.",
   "steps": [
    {"do": "Ouvre **claude.ai/code**.", "see": "La zone de saisie, et l'accès à la liste de tes séances passées.", "help": "Sur iPhone, la liste peut être cachée derrière le bouton de menu (trois traits) en haut à gauche."},
    {"do": "Ouvre une séance passée, par exemple celle où Claude a ajouté « Dernières nouveautés » à ta page.", "see": "La conversation : ta demande, puis le travail de Claude, étape par étape."},
    {"do": "Repère une ligne où Claude lance une [[commande]] (souvent une ligne en police de code, qu'on peut toucher pour la déplier).", "see": "Le nom d'un programme, comme `git`, et parfois son résultat.", "help": "Rien de tel ? Certaines séances courtes n'en montrent presque pas. Essaie une autre séance."},
    {"do": "Repère la carte des changements (**Changes** ou **Modifications**).", "see": "Les fichiers modifiés et le nombre de lignes ajoutées et retirées, par exemple `+12 -3`."},
    {"do": "Regarde sous la zone de saisie : un menu propose plusieurs modes (par exemple **Accept edits**, **Plan**, **Auto**). Ne change rien pour l'instant.", "see": "Le nom du mode choisi pour cette séance.", "help": "Dans l'application Claude sur iPhone, ce choix se trouve derrière le bouton **+** de la zone de saisie. Tu découvriras ces modes au protocole 4."}
   ]},
  {"type": "exercise", "ex": {"kind": "wiring", "q": "Relie chaque mot à ce qu'il désigne.",
   "pairs": [{"l": "Séance (session)", "r": "Une conversation de travail sur une tâche"},
             {"l": "Environnement cloud", "r": "La machine distante qui exécute la séance"},
             {"l": "Terminal", "r": "La fenêtre où l'on tape des ordres écrits"},
             {"l": "Commande", "r": "Un ordre écrit, comme git status"}],
   "why": "Une [[session]] tourne dans un [[environnement-cloud]] ; [[claude-code]] y tape des [[commande|commandes]] dans le [[terminal]] de la machine."}},
  qcm("Claude travaille dans une séance, et tu fermes Safari. Que se passe-t-il ?", [
   ("La séance continue sur la machine distante : tu la retrouves en rouvrant claude.ai/code", True, "Oui : la [[session]] s'exécute dans un [[environnement-cloud]], pas sur ton iPhone."),
   ("Le travail s'arrête et tout est perdu", False, "Non : ton iPhone n'est qu'une fenêtre sur la machine distante. Elle continue sans lui."),
   ("Claude attend que tu rouvres Safari pour reprendre", False, "Non : la machine distante n'a pas besoin que ta fenêtre reste ouverte."),
  ]),
  tf("Vrai ou faux ?", [
   ("Chaque séance repart d'une copie fraîche du dépôt.", True, "Oui : ce qui est dans le [[depot]] est là ; le reste, non."),
   ("Une consigne donnée dans une séance d'hier est connue dans la séance d'aujourd'hui.", False, "Non : chaque [[session]] a son propre fil. Ce qui doit durer s'écrit dans un fichier du dépôt."),
   ("`git status` modifie des fichiers.", False, "Non : cette [[commande]] ne fait que décrire l'état du projet. Elle ne change rien."),
  ]),
  src("Utiliser Claude Code dans le cloud (documentation Claude Code, en français)", "claude-code-on-the-web", "Une séance cloud s'exécute sur l'infrastructure d'Anthropic et continue après que tu as fermé ta fenêtre."),
  src("Configurer les environnements cloud (documentation Claude Code, en français)", "cloud-environments", "Une machine neuve par séance, avec le dépôt cloné ; ce qui n'existe que sur ton propre appareil n'y est pas."),
  {"type": "recap", "points": [
   "Une [[session]] est une conversation de travail ; une tâche, une séance.",
   "Elle s'exécute dans un [[environnement-cloud]] : une machine neuve, avec une copie de ton [[depot]].",
   "Claude y tape des [[commande|commandes]] dans un [[terminal]] ; tu peux les lire dans la conversation.",
   "Ce que l'équipe doit savoir à chaque séance s'écrit dans un fichier du dépôt.",
  ]},
 ]}

# =====================================================================================================
p2 = {
 "id": "p2", "title": "Ce que Claude voit",
 "kicker": "Une table de travail immense, mais pas infinie.",
 "introduces": ["token", "contexte", "fenetre-contexte", "compaction"],
 "uses": ["session", "claude-code", "modele-de-langage", "fichier", "commande", "depot"],
 "blocks": [
  {"type": "text", "md": "Pendant une [[session]], [[claude-code]] ne « sait » que ce qu'il a sous les yeux. Comprendre ce qu'il voit, c'est comprendre pourquoi il oublie parfois une consigne, et comment l'éviter."},
  {"type": "definition", "notion": "token"},
  {"type": "example", "title": "Tout se compte en tokens",
   "before": {"label": "Ta demande", "md": "« Ajoute un bouton Contact » : une poignée de [[token|tokens]]."},
   "after": {"label": "Un fichier lu", "md": "Une page de code : de l'ordre d'un à deux milliers de tokens (exemple de la documentation, chiffres indicatifs)."},
   "note": "Ce ne sont pas tes messages qui pèsent le plus : ce sont les [[fichier|fichiers]] que Claude lit, et les résultats de ses [[commande|commandes]]."},
  {"type": "definition", "notion": "contexte"},
  {"type": "text", "md": "**Avant même ton premier message**, le [[contexte]] contient déjà : des instructions de base, le fichier de règles du projet (s'il existe), et la description des outils installés. Puis chaque fichier lu, chaque résultat, chaque réponse s'y ajoutent."},
  {"type": "definition", "notion": "fenetre-contexte"},
  {"type": "definition", "notion": "compaction"},
  {"type": "interactive", "widget": "ContextView", "caption": "Fais lire des fichiers à Claude et regarde la fenêtre se remplir. Recommence en cochant la case : la consigne est cette fois écrite dans le fichier de règles."},
  {"type": "callout", "tone": "warn", "md": "**Une consigne qui ne doit jamais se perdre ne se dit pas, elle s'écrit.** Après une [[compaction]], le fichier de règles du projet est relu ; une consigne donnée seulement dans la conversation peut disparaître dans le résumé. Et une séance par tâche garde la [[fenetre-contexte]] légère."},
  {"type": "exercise", "ex": {"kind": "order", "q": "Remets la séance dans l'ordre.",
   "items": ["Les règles du projet se chargent", "Tu envoies ta demande", "Claude lit des fichiers et lance des commandes", "La fenêtre est presque pleine", "La conversation est résumée", "Les règles du projet sont relues"],
   "why": "Les règles arrivent avant toi et reviennent après la [[compaction]] ; tout le reste de la conversation n'est plus qu'un résumé."}},
  qcm("Au début de la séance, tu as écrit « réponds toujours en français ». Deux heures plus tard, Claude répond en anglais. Que s'est-il passé ?", [
   ("Une compaction a résumé la conversation, et la consigne s'est perdue dans le résumé", True, "Oui : elle n'était que dans la conversation. Écrite dans le fichier de règles, elle aurait été relue."),
   ("Claude a décidé de ne plus t'obéir", False, "Non : il ne voit simplement plus ta consigne. Ce qui n'est pas dans le [[contexte]] n'existe pas pour lui."),
   ("Le français ne tient pas dans la fenêtre de contexte", False, "Non : la langue n'a rien à voir. C'est la consigne elle-même qui a disparu au moment du résumé."),
  ]),
  {"type": "exercise", "ex": {"kind": "cloze", "q": "Complète la phrase.",
   "text": "Claude lit et écrit en {{tokens}}. Tout ce qu'il a sous les yeux forme son {{contexte}}. Quand la fenêtre est presque pleine, une {{compaction}} résume la conversation.",
   "distractors": ["commits", "branches"],
   "why": "[[token|Tokens]], [[contexte]], [[compaction]] : les trois mots qui expliquent pourquoi une longue séance finit par oublier."}},
  src("Explorez la fenêtre de contexte (documentation Claude Code, en français)", "context-window", "Ce qui se charge avant ton premier message, ce que coûte chaque lecture, et ce qui survit à la compaction (chiffres indicatifs)."),
  {"type": "recap", "points": [
   "Claude lit et écrit en [[token|tokens]] : un fichier long en fait des milliers.",
   "Son [[contexte]], c'est tout ce qu'il a sous les yeux ; ce qui n'y est pas n'existe pas pour lui.",
   "La [[fenetre-contexte]] a une taille fixe ; pleine, elle déclenche une [[compaction]].",
   "Une consigne importante s'écrit dans le fichier de règles, pas seulement dans la conversation.",
  ]},
 ]}

# =====================================================================================================
p3 = {
 "id": "p3", "title": "Le fichier de règles",
 "kicker": "Le règlement de bord, affiché à l'entrée de l'atelier.",
 "introduces": ["markdown", "claude-md", "memoire-projet"],
 "uses": ["depot", "session", "compaction", "contexte", "claude-code", "pull-request", "branche", "relecture", "fusion", "commit", "fichier"],
 "blocks": [
  {"type": "text", "md": "Le Général Calpin a une devise : « Ce qui n'est pas écrit n'existe pas. » Ton équipe va avoir son règlement de bord, écrit dans un fichier que Claude relit à chaque séance. Il s'écrit dans un format très simple."},
  {"type": "definition", "notion": "markdown"},
  {"type": "example", "title": "Ce que tu écris, ce que GitHub affiche",
   "before": {"label": "Tu écris", "md": "`# Carnet de chantier`\n`- Toujours tutoyer`\n`- Phrases courtes`"},
   "after": {"label": "GitHub affiche", "md": "Un grand titre « Carnet de chantier », puis une liste à puces de deux règles."},
   "note": "Ton fichier README.md est déjà écrit en [[markdown]]."},
  {"type": "definition", "notion": "claude-md"},
  {"type": "example", "title": "Une règle qu'on peut vérifier",
   "before": {"label": "Règle floue", "md": "« Écris bien. »\n« Fais attention au téléphone. »"},
   "after": {"label": "Règle vérifiable", "md": "« Tutoie l'utilisateur, en phrases de moins de 20 mots. »\n« Chaque page doit rester lisible sur un écran d'iPhone, sans défilement de côté. »"},
   "note": "La documentation le dit : plus une règle est concrète, plus Claude la suit. Une bonne règle permet de répondre par oui ou par non à « est-ce respecté ? »."},
  {"type": "callout", "tone": "info", "md": "**Quand ajouter une règle ?** Quand Claude refait la même erreur une deuxième fois, quand tu tapes la même correction qu'à la séance précédente, ou quand un nouveau membre aurait besoin de cette information. **Ce qu'il faut éviter :** un fichier de plus de 200 lignes, et deux règles qui se contredisent (Claude peut alors en choisir une au hasard)."},
  {"type": "definition", "notion": "memoire-projet"},
  qcm("Quelle règle a sa place dans le [[claude-md]] de ton produit ?", [
   ("« Garde une seule page, index.html, lisible sur iPhone. »", True, "Elle vaut pour chaque séance, et on peut vérifier si elle est respectée."),
   ("« Aujourd'hui, ajoute un bouton Contact. »", False, "C'est une demande ponctuelle : elle va dans la conversation de la séance, pas dans le règlement."),
   ("« Sois génial. »", False, "Impossible à vérifier : Claude ne sait pas ce que tu attends."),
  ]),
  tf("Vrai ou faux ?", [
   ("Claude relit le CLAUDE.md après une compaction.", True, "Oui : il est réinjecté depuis le [[depot]], contrairement à la conversation."),
   ("Plus le CLAUDE.md est long, mieux Claude le suit.", False, "Non : la documentation conseille moins de 200 lignes. Trop long, il prend de la place dans le [[contexte]] et il est moins bien suivi."),
   ("Une règle écrite dans le CLAUDE.md est connue dans toutes les séances suivantes.", True, "Oui : c'est la [[memoire-projet]]. Ce qui est écrit dure ; ce qui est dit s'oublie."),
  ]),
  {"type": "mission", "title": "Le règlement de bord de ton produit",
   "goal": "[[claude-code]] écrit le [[claude-md]] de ton produit, sur une [[branche]], puis ouvre une [[pull-request]]. Toi, tu relis chaque règle avant de fusionner.",
   "prompt": "Crée un fichier CLAUDE.md à la racine du dépôt de mon produit {produit}.\n\nMon produit, pour qui, pour quoi : {phrase}.\n\nLe fichier est écrit en Markdown, en français, en moins de 40 lignes, avec quatre titres :\n- « Le produit » : ce qu'il fait, pour qui, en deux phrases ;\n- « Ton des textes » : tutoiement, phrases courtes, aucun jargon ;\n- « Règles techniques » : une seule page index.html (et une feuille de style si besoin), lisible sur un écran d'iPhone, aucun service extérieur ;\n- « Avant chaque commit » : vérifier que la page reste lisible sur iPhone, et écrire un message de commit en français qui dit ce qui change.\n\nChaque règle doit être concrète et vérifiable. Aucune règle ne doit en contredire une autre.\n\nTravaille sur une nouvelle branche, fais un seul commit, puis crée une pull request vers main, sans la fusionner. Explique-moi ensuite en trois phrases simples ce que contient le fichier.",
   "verify": ["Dans **Files changed**, un seul fichier : CLAUDE.md, à la racine", "Quatre titres, des listes courtes, moins de 40 lignes", "Chaque règle permet de répondre par oui ou par non à « est-ce respecté ? »", "Aucune règle ne contredit une autre", "Tu as fusionné toi-même, après ta [[relecture]]"]},
  {"type": "procedure", "id": "c02-lire-reglement", "title": "Voir ton règlement sur GitHub",
   "intro": "Une fois la pull request fusionnée, dans Safari.",
   "steps": [
    {"do": "Ouvre le dépôt de ton produit sur **github.com**.", "see": "Le fichier **CLAUDE.md** dans la liste, à côté de README.md et index.html."},
    {"do": "Touche **CLAUDE.md**.", "see": "Tes titres en grand, et tes règles en listes à puces : GitHub affiche le [[markdown]] mis en forme.", "help": "Tu vois les signes # et - ? Tu es peut-être sur l'affichage brut (**Code** ou **Raw**) : touche **Preview** pour revenir à l'affichage mis en forme."},
    {"do": "Relis chaque règle en te demandant : un nouveau membre de l'équipe la comprendrait-il sans moi ?", "see": "Des règles courtes et claires.", "help": "Une règle te paraît floue ? Tu sauras la faire corriger avec la consigne ci-dessous."}
   ]},
  {"type": "consigne", "id": "c02-corriger-regle",
   "situation": "Dans ton CLAUDE.md, la règle « Écris des textes sympas » est floue, et Claude n'en tient pas compte. Rédige la consigne qui demande à Claude Code de la corriger.",
   "expected": ["Nommer le fichier à modifier : CLAUDE.md.", "Citer la règle actuelle.", "Demander une règle concrète et vérifiable (par exemple : tutoiement, phrases courtes, pas de jargon).", "Demander de vérifier qu'aucune autre règle ne la contredit.", "Demander une pull request, sans fusionner."]},
  src("Comment Claude se souvient de votre projet (documentation Claude Code, en français)", "memory", "Où placer le CLAUDE.md, comment écrire des règles efficaces (moins de 200 lignes, concrètes, sans contradiction), et la mémoire automatique."),
  {"type": "recap", "points": [
   "Le [[markdown]] met en forme un texte avec quelques signes : # pour un titre, - pour une liste.",
   "Le [[claude-md]] est le règlement de bord : Claude le relit à chaque séance, et après une [[compaction]].",
   "De bonnes règles sont courtes, concrètes, vérifiables, et ne se contredisent pas.",
   "La [[memoire-projet]] tient dans les fichiers : ce qui est écrit dure, ce qui est dit s'oublie.",
  ]},
 ]}

# =====================================================================================================
p4 = {
 "id": "p4", "title": "Les permissions",
 "kicker": "Le règlement conseille ; les permissions obligent.",
 "introduces": ["permission", "mode-permission", "mode-plan", "mode-auto"],
 "uses": ["claude-code", "commande", "claude-md", "session", "fichier", "depot", "compaction", "pull-request", "branche", "relecture"],
 "blocks": [
  {"type": "text", "md": "Ton [[claude-md]] dit à Claude ce qu'il **devrait** faire. Mais certaines choses ne doivent **jamais** arriver, même si une demande les suggère. Pour celles-là, le Général Calpin ne se contente pas d'un conseil : il pose une serrure."},
  {"type": "definition", "notion": "permission"},
  {"type": "example", "title": "Conseiller ou interdire",
   "before": {"label": "Dans CLAUDE.md (un conseil)", "md": "« Ne lis jamais le fichier .env. » Claude essaiera de respecter la consigne, mais rien ne l'en empêche vraiment."},
   "after": {"label": "Dans .claude/settings.json (une serrure)", "md": "Une règle **deny** sur la lecture de .env : [[claude-code]] refuse l'action, quoi qu'on lui demande."},
   "note": "La documentation le dit en toutes lettres : les règles de [[permission]] sont appliquées par Claude Code lui-même, pas par le modèle."},
  {"type": "diff", "title": "Un fichier de permissions", "file": ".claude/settings.json",
   "lines": [
    {"kind": "add", "t": "{"},
    {"kind": "add", "t": "  \"permissions\": {"},
    {"kind": "add", "t": "    \"deny\": ["},
    {"kind": "add", "t": "      \"Read(./.env)\","},
    {"kind": "add", "t": "      \"Read(./secrets/**)\""},
    {"kind": "add", "t": "    ]"},
    {"kind": "add", "t": "  }"},
    {"kind": "add", "t": "}"}],
   "note": "Deux règles **deny** : Claude ne peut lire ni le fichier .env, ni rien dans le dossier secrets. Ce sont les endroits où l'on range habituellement des mots de passe. Le fichier est au format JSON strict : une virgule en trop, et il ne se lit plus."},
  {"type": "definition", "notion": "mode-permission"},
  {"type": "definition", "notion": "mode-plan"},
  {"type": "definition", "notion": "mode-auto"},
  {"type": "callout", "tone": "warn", "md": "**Le mode auto ne garantit pas la sécurité.** Au caisson 00, tu as peut-être choisi **Auto** pour ta première séance : pour une petite page, c'est raisonnable. Mais un second modèle qui surveille ne voit pas tout. Pour une suppression, une mise en ligne ou des données personnelles, préfère le [[mode-plan]], puis relis avant de valider."},
  {"type": "exercise", "ex": {"kind": "wiring", "q": "Quel mode choisir pour chaque tâche ?",
   "pairs": [{"l": "Refondre toute la page, tu ne sais pas encore comment", "r": "Plan"},
             {"l": "Corriger une faute dans le titre", "r": "Accept edits"},
             {"l": "Renommer 40 titres selon le CLAUDE.md, tâche longue et claire", "r": "Auto"}],
   "why": "Tâche floue ou risquée : [[mode-plan]] d'abord. Petite modification que tu relis : Accept edits. Tâche longue et bien cadrée : [[mode-auto]], en relisant la [[pull-request]] à la fin."}},
  tf("Vrai ou faux ?", [
   ("Une règle deny l'emporte toujours sur une règle allow.", True, "Oui : les règles sont vérifiées dans l'ordre deny, puis ask, puis allow. Le refus gagne."),
   ("Écrire « ne fais jamais ça » dans CLAUDE.md empêche vraiment Claude de le faire.", False, "Non : CLAUDE.md oriente Claude. Seule une règle de [[permission]] l'en empêche."),
   ("En mode plan, Claude peut modifier tes fichiers sans ton accord.", False, "Non : il lit et propose, mais les modifications restent bloquées tant que tu n'as pas approuvé le plan."),
  ]),
  {"type": "procedure", "id": "c02-essayer-plan", "title": "Essayer le mode plan",
   "intro": "Dans Safari, sur claude.ai/code, avec le dépôt de ton produit.",
   "steps": [
    {"do": "Ouvre une nouvelle séance sur le dépôt de ton produit.", "see": "La zone de saisie, et ton dépôt sous la zone."},
    {"do": "Dans le menu des modes, sous la zone de saisie, choisis **Plan**.", "see": "Le mode Plan est indiqué sous la zone de saisie.", "help": "Dans l'application Claude sur iPhone : bouton **+** de la zone de saisie, puis **Permission**."},
    {"do": "Envoie : « Propose-moi un plan pour ajouter une petite foire aux questions en bas de ma page. Ne modifie rien. »", "see": "Claude lit tes fichiers, puis présente un plan : fichiers concernés, étapes, questions éventuelles."},
    {"do": "Lis le plan. N'approuve pas : tu voulais seulement voir comment il travaille.", "see": "Aucune carte de changements : rien n'a été modifié.", "help": "Si tu as approuvé par erreur, ce n'est pas grave : rien n'arrive dans main sans pull request fusionnée par toi. Tu peux fermer la pull request sans la fusionner."}
   ]},
  {"type": "mission", "title": "La serrure de ton produit",
   "goal": "[[claude-code]] crée le fichier de [[permission|permissions]] de ton produit. Il arrivera dans chaque séance avec ton dépôt.",
   "prompt": "Dans le dépôt de mon produit {produit}, crée le fichier .claude/settings.json avec exactement ce contenu :\n\n{\n  \"permissions\": {\n    \"deny\": [\n      \"Read(./.env)\",\n      \"Read(./secrets/**)\"\n    ]\n  }\n}\n\nPuis ajoute au CLAUDE.md, sous le titre « Règles techniques », une ligne : « Les mots de passe et les clés ne vont jamais dans le dépôt. »\n\nTravaille sur une nouvelle branche, fais un seul commit avec un message en français, puis crée une pull request vers main, sans la fusionner. Explique-moi en deux phrases ce que fait ce fichier.",
   "verify": ["Dans **Files changed** : .claude/settings.json (nouveau) et CLAUDE.md (une ligne ajoutée)", "Le fichier contient bien les deux règles **deny**", "Aucune virgule en trop à la fin d'une liste", "Tu as fusionné toi-même, après ta [[relecture]]"]},
  src("Configurer les permissions (documentation Claude Code, en français)", "permissions", "Règles allow, ask et deny, ordre de vérification, règles de lecture comme Read(./.env)."),
  src("Choisir un mode de permission (documentation Claude Code, en français)", "permission-modes", "Dans les séances cloud, le menu propose Accept edits, Plan et Auto. Le mode auto réduit les demandes mais ne garantit pas la sécurité."),
  {"type": "recap", "points": [
   "Une [[permission]] autorise, demande ou refuse une action ; le refus l'emporte toujours.",
   "Le [[claude-md]] conseille ; le fichier .claude/settings.json oblige.",
   "Le [[mode-permission]] règle toute la séance : Accept edits, Plan ou Auto.",
   "[[mode-plan]] pour une tâche floue ou risquée ; [[mode-auto]] pour une tâche longue et bien cadrée, jamais pour une action sensible.",
  ]},
 ]}

# =====================================================================================================
p5 = {
 "id": "p5", "title": "Les savoir-faire et les prises",
 "kicker": "Une boîte à outils qu'on n'ouvre que quand il faut.",
 "introduces": ["skill", "mcp", "connecteur", "plugin"],
 "uses": ["markdown", "claude-md", "contexte", "permission", "claude-code", "session", "depot", "compaction", "pull-request", "branche", "relecture", "fichier"],
 "blocks": [
  {"type": "text", "md": "Le règlement dit **comment** l'équipe se comporte, à chaque séance. Mais certaines tâches reviennent souvent et demandent une procédure en plusieurs étapes. Les mettre toutes dans le [[claude-md]] l'alourdirait. Le Général Calpin les range ailleurs : dans une boîte à outils."},
  {"type": "definition", "notion": "skill"},
  {"type": "interactive", "widget": "SkillToolbox", "caption": "Envoie des demandes à Claude. Puis rends une description vague, et recommence : le bon skill n'est plus choisi."},
  {"type": "callout", "tone": "info", "md": "**[[claude-md]] ou [[skill]] ?** Le CLAUDE.md contient ce que Claude doit savoir **à chaque séance** : il est toujours chargé. Une procédure en plusieurs étapes, qui ne sert que de temps en temps, va dans un skill : seule sa description occupe de la place dans le [[contexte]], jusqu'au moment où il sert."},
  {"type": "text", "md": "**La Forge de Skills.** À toi de forger le premier skill de ton équipe. Le fichier commence par un en-tête entre deux lignes `---` : le nom, et la description (ce que fait le skill, **et** quand l'utiliser). En dessous, les instructions, en [[markdown]]. Mets la règle la plus importante en premier : après une [[compaction]], seul le début du skill peut être gardé."},
  {"type": "interactive", "widget": "SkillForge", "caption": "Choisis un savoir-faire, réussis les quatre contrôles, essaie le skill, puis finalise-le et copie son fichier."},
  {"type": "mission", "title": "Le premier skill de ton équipe",
   "goal": "Le skill que tu viens de forger entre dans le dépôt de ton produit, dans le dossier .claude/skills. Les séances sur ce dépôt pourront s'en servir.",
   "prompt": "Dans le dépôt de mon produit {produit}, crée le fichier .claude/skills/NOM/SKILL.md, où NOM est la valeur de « name » dans le texte ci-dessous. Recopie ce texte exactement, sans rien changer :\n\n(colle ici le SKILL.md copié dans la Forge)\n\nTravaille sur une nouvelle branche, fais un seul commit avec un message en français, puis crée une pull request vers main, sans la fusionner.",
   "verify": ["Remplace la ligne « (colle ici…) » par ton SKILL.md avant d'envoyer", "Dans **Files changed** : un seul fichier, dans .claude/skills/, au nom de ton skill", "Le fichier commence par la ligne `---`, puis name et description", "Tu as fusionné toi-même, après ta [[relecture]]"]},
  {"type": "definition", "notion": "mcp"},
  {"type": "interactive", "widget": "McpPlugs", "caption": "Branche des prises sur Claude, puis règle la permission de chaque outil : autoriser, demander ou refuser."},
  {"type": "definition", "notion": "connecteur"},
  {"type": "definition", "notion": "plugin"},
  {"type": "callout", "tone": "warn", "md": "**On ne branche que ce qu'on connaît.** Un serveur [[mcp]] qui va chercher du contenu extérieur peut ramener un texte piégé qui tente de donner des ordres à Claude ; un [[plugin]] peut exécuter du code. Avant d'installer : qui l'a fait ? que pourra-t-il lire, et modifier ? Et dans tes séances sur claude.ai/code, les plugins déclarés dans le dépôt ne se chargent pas : pour un savoir-faire, le dossier .claude/skills est le bon endroit."},
  {"type": "exercise", "ex": {"kind": "wiring", "q": "Relie chaque besoin à l'outil qui y répond.",
   "pairs": [{"l": "Une règle valable à chaque séance", "r": "Le CLAUDE.md"},
             {"l": "Une procédure en plusieurs étapes, de temps en temps", "r": "Un skill"},
             {"l": "Lire ton agenda ou tes tickets", "r": "Un connecteur (MCP)"},
             {"l": "Interdire une action pour de bon", "r": "Une règle de permission"}],
   "why": "Le [[claude-md]] pour ce qui vaut toujours, le [[skill]] pour ce qui sert parfois, le [[connecteur]] pour atteindre un autre outil, la [[permission]] pour ce qui ne doit jamais arriver."}},
  qcm("Ton skill « verif-iphone » n'est jamais utilisé, même quand tu demandes « ma page s'affiche bien sur téléphone ? ». Pourquoi ?", [
   ("Sa description est trop vague : elle ne contient pas les mots que tu emploies", True, "Oui : Claude ne lit que la description. Elle doit dire ce que fait le skill et quand l'utiliser, avec tes mots."),
   ("Les skills ne fonctionnent que le week-end", False, "Non, évidemment : un [[skill]] se charge quand une demande correspond à sa description, à tout moment."),
   ("Il faut d'abord installer un plugin", False, "Non : un skill rangé dans .claude/skills du [[depot]] suffit."),
  ]),
  src("Étendre Claude avec des skills (documentation Claude Code, en français)", "skills", "Le fichier SKILL.md, son en-tête (name, description), où le ranger, et pourquoi il ne déclenche pas."),
  src("Connecter Claude Code aux outils via MCP (documentation Claude Code, en français)", "mcp", "Les serveurs MCP et les connecteurs du répertoire d'Anthropic ; ne brancher que des serveurs de confiance."),
  src("Aperçu des plugins (documentation Claude Code, en français)", "plugins/overview", "Un plugin regroupe skills, serveurs MCP et autres composants, installés en une fois."),
  {"type": "recap", "points": [
   "Un [[skill]] est un savoir-faire dans un fichier SKILL.md : une description claire, puis des instructions.",
   "Claude ne lit que la description, et charge le reste seulement quand il sert.",
   "Un serveur [[mcp]] ou un [[connecteur]] branche Claude sur d'autres outils ; un [[plugin]] en installe plusieurs d'un coup.",
   "On ne branche que ce qu'on connaît, et chaque outil a sa [[permission]].",
  ]},
 ]}

# =====================================================================================================
p6 = {
 "id": "p6", "title": "Le jeton d'accès",
 "kicker": "Une clé qui n'ouvre qu'une porte, et pas pour toujours.",
 "introduces": ["jeton-acces", "moindre-privilege"],
 "uses": ["github", "depot", "permission"],
 "blocks": [
  {"type": "text", "md": "Dernier point du règlement de bord : les clés. FORMA-8 peut ranger ta progression dans ton [[depot]] privé de données sur [[github]], pour la retrouver sur ton iPhone et ton iPad. Pour cela, il lui faut une clé. Le Général Calpin est formel : une clé, ça se fabrique au plus juste."},
  {"type": "definition", "notion": "jeton-acces"},
  {"type": "definition", "notion": "moindre-privilege"},
  {"type": "interactive", "widget": "TokenBuilder", "caption": "Fabrique le jeton de FORMA-8 : il doit pouvoir enregistrer ta progression, et rien d'autre. Regarde ce qu'un inconnu pourrait faire avec chaque droit en trop."},
  {"type": "callout", "tone": "warn", "md": "**Un jeton se garde comme un mot de passe.** Jamais dans un fichier du dépôt, jamais dans une conversation, ni avec Claude ni avec personne : seulement dans les Réglages de FORMA-8, sur ton appareil. S'il a fui : supprime-le sur GitHub, et crée-en un nouveau."},
  {"type": "procedure", "id": "c02-creer-jeton", "title": "Créer le jeton de FORMA-8",
   "intro": "Dans Safari, connecté à GitHub. Les menus sont souvent en anglais : les libellés exacts sont en **gras**, avec leur traduction.",
   "steps": [
    {"do": "Touche ta photo de profil, en haut à droite, puis **Settings** (paramètres).", "see": "La page de tes paramètres de compte."},
    {"do": "Tout en bas du menu, touche **Developer settings** (paramètres de développeur).", "see": "Un menu avec **Personal access tokens** (jetons d'accès personnels).", "help": "Sur iPhone, le menu peut s'ouvrir avec un bouton en haut de la page : fais défiler jusqu'en bas."},
    {"do": "Ouvre **Personal access tokens**, puis **Fine-grained tokens**, puis **Generate new token** (générer un nouveau jeton).", "see": "Le formulaire du nouveau jeton.", "help": "GitHub peut te redemander ton mot de passe ou un code : c'est normal."},
    {"do": "**Token name** (nom) : `FORMA-8`. **Expiration** : 90 jours.", "see": "La date d'expiration s'affiche.", "help": "Dans 90 jours, GitHub te préviendra : tu recréeras un jeton de la même façon."},
    {"do": "**Repository access** (accès au dépôt) : choisis **Only select repositories** (seulement certains dépôts), puis ton dépôt de données **FORMA-7-data**.", "see": "Un seul dépôt dans la liste."},
    {"do": "**Permissions**, puis **Repository permissions** : à la ligne **Contents** (contenu), choisis **Read and write** (lecture et écriture). Ne touche à rien d'autre.", "see": "**Metadata** passe tout seul en lecture seule : c'est normal, GitHub l'impose.", "help": "Rien d'autre n'est utile à FORMA-8 : c'est le [[moindre-privilege]]."},
    {"do": "Touche **Generate token** (générer), puis copie le jeton, qui commence par `github_pat_`.", "see": "Le jeton s'affiche une seule fois.", "help": "Tu as quitté la page sans copier ? Supprime ce jeton (**Delete**) et recommence : on ne peut plus le revoir."}
   ]},
  {"type": "procedure", "id": "c02-activer-synchro", "title": "Activer la synchronisation de FORMA-8",
   "intro": "Dans FORMA-8, juste après avoir copié ton jeton.",
   "steps": [
    {"do": "Ouvre les **Réglages** de FORMA-8, section **GitHub et dépôt de données**.", "see": "Ton compte GitHub et le dépôt de données, **FORMA-7-data**, déjà remplis."},
    {"do": "Colle le jeton dans **Jeton d'accès GitHub**, puis touche **Tester la connexion**.", "see": "Un message vert : la connexion fonctionne.", "help": "Message d'erreur ? Vérifie que le jeton donne accès à FORMA-7-data, avec **Contents : Read and write**."},
    {"do": "Dans la section **Synchronisation entre appareils**, active **Synchroniser ma progression**.", "see": "« Synchronisé le… » avec la date et l'heure."},
    {"do": "Plus tard, sur ton iPad : mêmes réglages, même jeton.", "see": "Ta progression apparaît sur les deux appareils."}
   ]},
  qcm("Quel jeton fabriques-tu pour FORMA-8 ?", [
   ("Un seul dépôt (FORMA-7-data), contenu en lecture et écriture, 90 jours", True, "Exactement ce qu'il faut, et rien de plus : le [[moindre-privilege]]."),
   ("Tous tes dépôts, tous les droits, sans expiration", False, "S'il fuyait, un inconnu pourrait modifier ou effacer tous tes projets, pour toujours."),
   ("Un seul dépôt, mais avec le droit d'administration", False, "FORMA-8 n'a pas besoin de changer les réglages du dépôt : ce droit ne servirait qu'à un voleur."),
  ]),
  tf("Vrai ou faux ?", [
   ("On peut écrire son jeton dans le CLAUDE.md pour que Claude s'en serve.", False, "Jamais : tout ce qui est dans le [[depot]] peut être lu. Un [[jeton-acces]] reste sur ton appareil."),
   ("GitHub supprime de lui-même un jeton inutilisé depuis un an.", True, "Oui, d'après sa documentation. Et il recommande une date d'expiration pour chaque jeton."),
   ("Si tu as besoin d'un autre dépôt plus tard, tu peux créer un second jeton.", True, "Oui : un jeton par usage, chacun au plus juste. Et tu supprimes ceux qui ne servent plus."),
  ]),
  src("Gestion de vos jetons d'accès personnels (documentation GitHub, en français)", "", "Créer un jeton fine-grained : dépôts sélectionnés, autorisations minimales, date d'expiration. Les menus de GitHub peuvent changer de nom.", url="https://docs.github.com/fr/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens"),
  {"type": "recap", "points": [
   "Un [[jeton-acces]] donne à une appli des droits précis sur GitHub : quels dépôts, quoi faire, jusqu'à quand.",
   "Le [[moindre-privilege]] : seulement ce qui est nécessaire, pour une durée limitée.",
   "Un jeton se garde comme un mot de passe : jamais dans le dépôt, jamais dans une conversation.",
   "Ta progression FORMA-8 peut maintenant voyager entre ton iPhone et ton iPad.",
  ]},
 ]}

# =====================================================================================================
incident = {
 "title": "Alerte au règlement de bord",
 "brief": "Trois alertes arrivent du dépôt de ton produit. Le Général Calpin te regarde faire, montre en main : trouve la bonne réponse avant de griller tes trois fusibles.",
 "scenarios": [
  {"alert": "Claude Code vouvoie l'utilisateur dans un nouveau texte. Pourtant, ton CLAUDE.md dit « Toujours tutoyer ». En le relisant, tu découvres qu'il fait 600 lignes, et qu'un peu plus bas une autre règle dit « Utiliser un ton formel ».",
   "q": "Quelle est la cause la plus probable ?",
   "options": [
    {"t": "Le fichier est trop long, et deux règles se contredisent : Claude en a suivi une au hasard", "ok": True, "why": "Oui : raccourcis le [[claude-md]] (moins de 200 lignes) et supprime la règle contradictoire. Puis demande la correction du texte."},
    {"t": "Claude ne lit jamais le CLAUDE.md", "ok": False, "why": "Si : il le lit au début de chaque [[session]]. Mais face à deux règles opposées, il ne peut pas les suivre toutes les deux."},
    {"t": "Il faut écrire la règle en majuscules", "ok": False, "why": "Crier ne change rien. Une règle courte, claire et sans contradiction, si."}]},
  {"alert": "Dans une séance, Claude écrit : « Permission to read .env was denied. » (la lecture de .env a été refusée), puis continue sans ce fichier.",
   "q": "Que se passe-t-il ?",
   "options": [
    {"t": "C'est voulu : la règle deny de ton .claude/settings.json a fonctionné", "ok": True, "why": "Oui : la serrure fait son travail. Le refus l'emporte toujours. Si un jour tu as vraiment besoin de ce fichier, c'est toi qui changes la règle, en connaissance de cause."},
    {"t": "GitHub est en panne", "ok": False, "why": "Non : le message vient de [[claude-code]] lui-même, qui applique tes règles de [[permission]]."},
    {"t": "Il faut passer en mode auto pour contourner le refus", "ok": False, "why": "Non : aucun mode ne contourne une règle deny. Et c'est tant mieux."}]},
  {"alert": "Une séance dure depuis le matin : trois tâches à la suite. Au début, tu avais écrit « Ne touche jamais au dossier archives ». Ce soir, Claude vient de modifier un fichier de ce dossier.",
   "q": "Comment l'éviter la prochaine fois ?",
   "options": [
    {"t": "Écrire la règle dans le CLAUDE.md, et ouvrir une séance par tâche", "ok": True, "why": "Oui : une [[compaction]] a résumé la conversation, et la consigne s'est perdue. Écrite dans le [[claude-md]], elle aurait été relue. Pour une interdiction absolue, ajoute même une règle de [[permission]]."},
    {"t": "Répéter la consigne toutes les heures", "ok": False, "why": "Ça peut marcher, mais c'est fragile et épuisant. Ce qui doit durer s'écrit."},
    {"t": "Choisir un modèle plus puissant", "ok": False, "why": "Le modèle n'y est pour rien : la consigne n'était plus dans le [[contexte]]."}]},
 ]}

delivery = {
 "title": "Le règlement de bord de ton produit",
 "goal": "Ton produit a son règlement, sa serrure et son premier savoir-faire, et ta progression voyage entre tes appareils : c'est la version 0.2.",
 "steps": ["Termine les ordres de mission des protocoles 3, 4 et 5, et les deux procédures du protocole 6.", "Reviens ici et touche **Vérifier ma livraison**."],
 "checks": [
  {"id": "claude-md", "kind": "file", "label": "Le fichier **CLAUDE.md** est à la racine de ton dépôt", "path": "CLAUDE.md"},
  {"id": "settings", "kind": "file", "label": "Le fichier **.claude/settings.json** contient tes règles de permission", "path": ".claude/settings.json"},
  {"id": "skill", "kind": "folder", "label": "Un skill est rangé dans **.claude/skills**", "path": ".claude/skills"},
  {"id": "synchro", "kind": "manual", "label": "La **synchronisation FORMA-8** est activée (Réglages : « Synchronisé le… »)"},
 ]}

room = json.load(open(P))
room["steps"] = [p1, p2, p3, p4, p5, p6]
room["incident"] = incident
room["delivery"] = delivery
order = ["id", "index", "code", "member", "metier", "genre", "name", "version", "tagline", "hue", "requires", "steps", "incident", "delivery", "teamFile"]
room = {k: room[k] for k in order if k in room}
json.dump(room, open(P, "w"), ensure_ascii=False, indent=1)
open(P, "a").write("\n")
print("c02 :", [len(s["blocks"]) for s in room["steps"]], "blocs")

# Notions du caisson 02 (sources ouvertes le 17/11/2026, voir c02/preparation.md). Ajout au glossaire, rejouable.
import json, sys
P = "./src/content/glossary.json"
N = [
 # ---------- Protocole 1 : une séance de travail dans le navigateur ----------
 {"id": "session", "term": "Session", "icon": "bubbles",
  "def": {
   "simple": "Une séance de travail avec [[claude-code]] : une conversation, du début à la fin, sur un projet.",
   "standard": "Une session est une conversation de travail avec [[claude-code]] : tu lui confies une tâche, il travaille, tu lui réponds, et ainsi de suite. Elle a son propre fil : ce qui s'y dit reste dans cette session. Tu peux en ouvrir une nouvelle à tout moment, pour une autre tâche.",
   "expert": "Une session regroupe une conversation, son historique et ses réglages (modèle, mode de permission). Sur claude.ai/code, chaque session s'exécute sur une machine distante qui continue de travailler même si tu fermes Safari. Démarrer une nouvelle session repart d'un fil vide : seuls les fichiers du dépôt et les règles écrites dedans sont relus."},
  "analogy": "Comme une réunion de chantier : on se retrouve, on avance sur une tâche, puis on referme le carnet. La réunion suivante repart d'une page blanche, mais le chantier, lui, est toujours là.",
  "example": "Sur claude.ai/code, la liste à gauche montre tes sessions : « Créer la page d'accueil », « Ajouter le bouton Contact »… une par tâche.",
  "prereq": ["claude-code"], "watch": ["session", "sessions"]},
 {"id": "environnement-cloud", "term": "Environnement cloud", "icon": "server",
  "def": {
   "simple": "L'ordinateur à distance, prêté par Anthropic, sur lequel ton équipe travaille pendant une session.",
   "standard": "Chaque [[session]] lancée depuis claude.ai/code s'exécute sur une machine distante toute neuve, avec ton [[depot]] copié dessus. L'environnement est la configuration enregistrée de cette machine : ce qu'elle a le droit d'atteindre sur Internet, ses réglages, ce qu'on installe au démarrage. Ce qui n'est pas dans le dépôt n'est pas sur la machine.",
   "expert": "Dans les environnements hébergés par Anthropic, chaque session obtient une machine virtuelle fraîche (Ubuntu 24.04) avec le dépôt cloné et les outils courants installés. L'environnement définit l'accès réseau (par défaut « Limited »), des variables, des secrets réseau et un script de configuration. Le fichier de règles du dépôt et ses réglages sont lus ; ce qui n'existe que sur ton propre ordinateur ne l'est pas."},
  "analogy": "Comme un atelier prêté pour la journée : on y apporte les plans (ton dépôt), on travaille, et le soir l'atelier est rendu. Tout ce qu'on veut retrouver demain doit repartir avec les plans.",
  "example": "Tu fermes Safari pendant que Claude Code travaille : la session continue sur la machine distante. Tu la retrouves en rouvrant claude.ai/code.",
  "prereq": ["session", "depot", "serveur"], "watch": ["environnement cloud"], "checked": "2026-11-17"},
 {"id": "terminal", "term": "Terminal", "icon": "terminal",
  "def": {
   "simple": "Une fenêtre où l'on parle à l'ordinateur en tapant des ordres écrits, au lieu de toucher des boutons.",
   "standard": "Le terminal est un outil texte : on y tape une ligne, l'ordinateur l'exécute et répond par écrit. Les développeurs s'en servent pour lancer des programmes, des tests ou [[git]]. Pendant une session, [[claude-code]] utilise le terminal de sa machine pour toi : tu vois passer ses lignes dans la conversation.",
   "expert": "Le terminal donne accès à un « shell » (sur la machine distante, bash), un programme qui lit des lignes de texte et les exécute. Tout ce qui se fait au doigt dans une interface a souvent son équivalent en ligne de texte, plus rapide à répéter et à automatiser."},
  "analogy": "Comme passer une commande par écrit au comptoir d'un atelier, plutôt que de montrer du doigt : c'est précis, et l'atelier peut refaire exactement la même chose demain.",
  "example": "Dans une session, tu vois passer des lignes comme `npm test` : c'est Claude Code qui tape dans le terminal de sa machine.",
  "prereq": ["claude-code", "git"], "watch": ["terminal", "terminaux"]},
 {"id": "commande", "term": "Commande", "icon": "keyboard",
  "def": {
   "simple": "Un ordre écrit qu'on tape dans le terminal, comme « lance les tests ».",
   "standard": "Une commande est une ligne tapée dans le [[terminal]] : le nom d'un programme, puis ce qu'on lui demande. `git status` demande à [[git]] l'état du projet ; `npm test` lance les tests. [[claude-code]] lance des commandes pour vérifier son travail, et certaines lui demandent ton autorisation.",
   "expert": "Une commande a un nom de programme, des arguments et des options, et renvoie un résultat (texte et code de sortie). Une commande en lecture seule (lister, afficher) ne change rien ; d'autres modifient ou suppriment des fichiers : c'est pour elles que les autorisations existent."},
  "analogy": "Comme un bon de commande écrit : il dit à qui on s'adresse et ce qu'on veut, et l'atelier rend un reçu (le résultat).",
  "example": "`git log` affiche l'historique ; `ls` liste les fichiers du dossier ; `npm test` lance les tests et dit s'ils passent.",
  "prereq": ["terminal"], "watch": ["ligne de commande"]},
 # ---------- Protocole 2 : ce que Claude voit ----------
 {"id": "token", "term": "Token", "icon": "tokens",
  "def": {
   "simple": "Un petit morceau de texte, l'unité avec laquelle Claude lit et écrit. Un mot fait souvent un ou deux tokens.",
   "standard": "Un [[modele-de-langage]] ne lit pas les lettres une à une : il découpe le texte en tokens, des morceaux de mots. Tout se compte en tokens : ce que Claude peut garder en tête à la fois, et ce que coûte un échange. Un fichier long fait beaucoup de tokens.",
   "expert": "Le découpage dépend du modèle ; en français, compter grossièrement un token pour 3 à 4 caractères, à titre d'ordre de grandeur. Dans l'exemple de la documentation, lire un fichier de code moyen coûte environ 1 000 à 2 500 tokens, et le fichier de règles d'un projet environ 1 800 (chiffres indicatifs)."},
  "analogy": "Comme les pièces d'un puzzle de texte : Claude ne voit pas des phrases, il voit des pièces, et sa table ne peut en contenir qu'un nombre limité.",
  "example": "« Réveille l'équipe » se découpe en quelques tokens ; une page entière de code, en plusieurs milliers.",
  "prereq": ["modele-de-langage"], "watch": ["token", "tokens"], "checked": "2026-11-17"},
 {"id": "contexte", "term": "Contexte", "icon": "layers",
  "def": {
   "simple": "Tout ce que Claude a sous les yeux pendant la session : tes messages, les fichiers lus, ses réponses, les règles.",
   "standard": "Le contexte est l'ensemble de ce que Claude « sait » à un instant de la [[session]] : les règles du projet chargées au départ, tes demandes, les fichiers qu'il a lus, les résultats de ses [[commande|commandes]] et ses propres réponses. Ce qui n'est pas dans le contexte, Claude ne le voit pas.",
   "expert": "Avant même ton premier message, le contexte contient déjà des instructions de base, le fichier de règles du projet, les descriptions des outils et des savoir-faire installés. Chaque lecture de fichier s'y ajoute. Le contexte se mesure en [[token|tokens]]."},
  "analogy": "Comme le plan de travail d'un artisan : il ne peut utiliser que ce qui est posé dessus. Ce qui est resté dans le tiroir n'existe pas pour lui.",
  "example": "Tu demandes « ajoute un bouton Contact ». Claude lit la page d'accueil : la page entre dans son contexte, il peut maintenant la modifier.",
  "prereq": ["token", "session"], "watch": []},
 {"id": "fenetre-contexte", "term": "Fenêtre de contexte", "icon": "window",
  "def": {
   "simple": "La place maximale du contexte : au-delà, Claude ne peut plus rien ajouter sans faire de la place.",
   "standard": "La fenêtre de contexte est la taille maximale du [[contexte]], comptée en [[token|tokens]]. Plus la session avance, plus elle se remplit : fichiers lus, résultats, échanges. Une fenêtre trop pleine ralentit le travail et oblige à résumer.",
   "expert": "La taille de la fenêtre dépend du modèle et peut évoluer. Une session qui lit beaucoup de gros fichiers la remplit vite. Bonnes pratiques : une session par tâche, des fichiers de règles courts, et laisser les savoir-faire se charger seulement quand ils servent."},
  "analogy": "Comme la table de travail elle-même : elle a une taille fixe. Quand elle est pleine, il faut ranger avant de poser autre chose.",
  "example": "Dans l'exemple de la documentation, une session de travail ordinaire occupe environ 22 000 tokens avant d'être résumée (chiffre indicatif).",
  "prereq": ["contexte"], "watch": ["fenêtre de contexte"], "checked": "2026-11-17"},
 {"id": "compaction", "term": "Compaction", "icon": "inbox-down",
  "def": {
   "simple": "Quand la fenêtre est presque pleine, la conversation est résumée pour faire de la place.",
   "standard": "La compaction remplace l'historique de la conversation par un résumé, pour libérer la [[fenetre-contexte]]. Elle se déclenche toute seule près de la limite, ou à ta demande. Les règles écrites dans les fichiers du projet sont relues après le résumé ; une consigne donnée seulement dans la conversation peut, elle, se perdre.",
   "expert": "Après compaction, Claude Code réinjecte depuis le disque le fichier de règles à la racine du projet et la mémoire automatique, et relit jusqu'à cinq fichiers récemment modifiés. Le détail des échanges, lui, n'existe plus que sous forme de résumé."},
  "analogy": "Comme un compte rendu de réunion : on garde l'essentiel en une page et on jette les brouillons. Ce qui était affiché au mur (les règles) reste au mur.",
  "example": "Au début, tu as dit « réponds toujours en français ». Après une compaction, Claude répond en anglais : la consigne était seulement dans la conversation.",
  "prereq": ["fenetre-contexte"], "watch": ["compaction", "compacté", "compactée"], "checked": "2026-11-17"},
 # ---------- Protocole 3 : le fichier de règles ----------
 {"id": "markdown", "term": "Markdown", "icon": "hash",
  "def": {
   "simple": "Une façon d'écrire du texte simple avec quelques signes : # pour un titre, - pour une liste.",
   "standard": "Markdown est un format de texte : on écrit normalement, et quelques signes donnent la mise en forme. `#` devant une ligne en fait un titre, `-` une puce de liste, `**mot**` met en gras. Les fichiers Markdown finissent par `.md`, comme ton README.md, et GitHub les affiche joliment.",
   "expert": "Markdown reste lisible même non mis en forme, ce qui le rend idéal pour des instructions lues à la fois par des humains et par Claude : fichier de règles, savoir-faire, documentation. Les titres et les listes aident Claude à suivre des règles regroupées par sujet."},
  "analogy": "Comme écrire une recette à la main avec des repères : un titre souligné, des tirets pour les ingrédients. Tout le monde la lit, sans logiciel spécial.",
  "example": "`# Mon produit` devient un grand titre ; `- Toujours tutoyer` devient une puce de liste.",
  "prereq": ["fichier"], "watch": ["markdown"]},
 {"id": "claude-md", "term": "CLAUDE.md", "icon": "file-md",
  "def": {
   "simple": "Le fichier de règles du projet : Claude le lit au début de chaque session.",
   "standard": "CLAUDE.md est un fichier [[markdown]] placé à la racine du [[depot]]. Tu y écris ce que tu aurais sinon à réexpliquer à chaque [[session]] : à quoi sert le produit, les règles de style, les vérifications à faire. [[claude-code]] le lit au démarrage, et le relit après une [[compaction]].",
   "expert": "La documentation conseille moins de 200 lignes, des règles concrètes et vérifiables (« lance npm test avant chaque commit » plutôt que « teste bien »), regroupées sous des titres, et sans contradiction : face à deux règles opposées, Claude peut en choisir une au hasard. Claude le traite comme du contexte, pas comme une obligation absolue : pour bloquer une action, il faut une règle d'autorisation."},
  "analogy": "Comme le règlement affiché à l'entrée de l'atelier : chaque personne qui arrive le lit avant de commencer, et il ne change pas d'une journée à l'autre.",
  "example": "« Toujours tutoyer l'utilisateur. Garder la page lisible sur iPhone. Ne jamais modifier le dossier archives/. »",
  "prereq": ["markdown", "compaction", "depot"], "watch": ["CLAUDE.md"], "checked": "2026-11-17"},
 {"id": "memoire-projet", "term": "Mémoire du projet", "icon": "ram",
  "def": {
   "simple": "Ce que Claude retrouve d'une session à l'autre : seulement ce qui est écrit dans des fichiers.",
   "standard": "Chaque [[session]] repart d'une conversation vide. Ce qui passe d'une session à la suivante, c'est ce qui est écrit : le [[claude-md]] (tes règles), et une mémoire automatique où Claude note de lui-même ce qu'il apprend de tes corrections. Une consigne dite une fois dans le chat est oubliée à la session suivante.",
   "expert": "Deux systèmes complémentaires, chargés au début de chaque session : les fichiers CLAUDE.md, écrits par toi, et la mémoire automatique, écrite par Claude (ses 200 premières lignes ou 25 Ko). Un autre fichier, AGENTS.md, joue le même rôle que CLAUDE.md pour plusieurs outils d'IA à la fois."},
  "analogy": "Comme le carnet de bord d'un navire : l'équipage change de quart, mais le carnet reste à bord et chacun le relit en prenant son poste.",
  "example": "Lundi, tu dis à Claude « pas de jargon ». Mardi, nouvelle session : il en remet. Tu l'écris dans CLAUDE.md : il ne l'oublie plus.",
  "prereq": ["claude-md"], "watch": ["mémoire automatique"], "checked": "2026-11-17"},
 # ---------- Protocole 4 : les permissions ----------
 {"id": "permission", "term": "Permission", "icon": "shield-check",
  "def": {
   "simple": "L'accord que Claude doit obtenir avant certaines actions, comme lancer une commande ou modifier un fichier.",
   "standard": "Une permission décide si [[claude-code]] peut faire une action seul, doit te demander, ou n'a pas le droit. Les règles s'écrivent dans un fichier de réglages du projet, `.claude/settings.json` : « allow » (autoriser), « ask » (demander), « deny » (refuser). Le refus l'emporte toujours.",
   "expert": "Les règles sont vérifiées dans l'ordre : deny, puis ask, puis allow, et la première qui correspond décide. Elles sont appliquées par Claude Code lui-même, pas par le modèle : écrire « ne fais pas ça » dans CLAUDE.md oriente Claude, alors qu'une règle deny l'en empêche vraiment."},
  "analogy": "Comme les badges d'un bâtiment : certaines portes s'ouvrent seules, d'autres demandent d'appeler l'accueil, d'autres restent fermées quoi qu'on dise.",
  "example": "Une règle « deny » sur la lecture du fichier .env empêche Claude d'y toucher, même si une demande le lui suggère.",
  "prereq": ["claude-code", "commande", "claude-md"], "watch": ["permission", "permissions", "settings.json"], "checked": "2026-11-17"},
 {"id": "mode-permission", "term": "Mode de permission", "icon": "fader",
  "def": {
   "simple": "Le réglage général de la session : combien Claude peut faire sans te demander.",
   "standard": "Le mode de permission règle toute une [[session]] d'un coup. Sur claude.ai/code, tu le choisis dans le menu sous la zone de saisie : **Accept edits** (modifier les fichiers sans demander), **Plan** (réfléchir sans rien modifier) ou **Auto** (agir seul, sous contrôle). Tu peux en changer pendant la session.",
   "expert": "Dans les sessions cloud, les modifications de fichiers sont toujours pré-approuvées : c'est pourquoi le menu affiche Accept edits au lieu du mode manuel du terminal. Les règles « ask » explicites forcent une demande dans tous les modes."},
  "analogy": "Comme le niveau d'autonomie donné à un apprenti : « demande-moi avant », « montre-moi d'abord ton plan », ou « vas-y, je te fais confiance, mais le chef de chantier surveille ».",
  "example": "Pour une grosse modification inconnue, tu choisis Plan d'abord ; une fois le plan validé, tu repasses en Accept edits.",
  "prereq": ["permission", "session"], "watch": ["mode de permission"], "checked": "2026-11-17"},
 {"id": "mode-plan", "term": "Mode plan", "icon": "think",
  "def": {
   "simple": "Claude lit, cherche et te propose un plan, mais ne modifie rien tant que tu n'as pas dit oui.",
   "standard": "En mode plan, [[claude-code]] étudie le projet (il lit des fichiers, lance des [[commande|commandes]] qui ne changent rien) et rédige un plan de ce qu'il compte faire. Les modifications restent bloquées jusqu'à ce que tu approuves le plan. C'est le bon mode pour une tâche floue ou risquée.",
   "expert": "Le plan approuvé est enregistré, et il est réinjecté après une compaction. Dans une session cloud, on peut planifier puis basculer vers un mode qui exécute, sans perdre le plan."},
  "analogy": "Comme demander un devis avant les travaux : l'artisan vient voir, mesure, écrit ce qu'il fera. Personne ne casse un mur avant ta signature.",
  "example": "« Je veux un formulaire de contact. » En mode plan, Claude répond : fichiers à modifier, étapes, points à décider. Tu corriges, puis tu valides.",
  "prereq": ["mode-permission"], "watch": ["mode plan"], "checked": "2026-11-17"},
 {"id": "mode-auto", "term": "Mode auto", "icon": "robot-arm",
  "def": {
   "simple": "Claude agit sans te demander, et un second modèle surveille chaque action pour bloquer ce qui est risqué.",
   "standard": "En mode auto, [[claude-code]] ne s'arrête plus pour demander : un autre modèle, le « classificateur », examine chaque action avant qu'elle parte et bloque ce qui dépasse ta demande ou paraît dangereux. Pratique pour une longue tâche bien cadrée. La documentation prévient : il réduit les demandes, il ne garantit pas la sécurité.",
   "expert": "Le classificateur bloque notamment ce qui sort du cadre de la demande, vise une infrastructure inconnue ou semble venir d'un contenu hostile lu en route. Les règles « ask » explicites forcent toujours une demande. À éviter pour les opérations sensibles : suppression, mise en ligne, données personnelles."},
  "analogy": "Comme un apprenti qui travaille seul pendant que le chef de chantier fait sa ronde : il avance vite, et le chef arrête tout geste dangereux. Mais le chef ne voit pas tout.",
  "example": "Tâche longue et claire (« renomme tous les titres selon CLAUDE.md ») : mode auto. Effacer des données ou publier : pas en mode auto.",
  "prereq": ["mode-permission"], "watch": ["mode auto", "classificateur"], "checked": "2026-11-17"},
 # ---------- Protocole 5 : les savoir-faire et les prises ----------
 {"id": "skill", "term": "Skill", "icon": "expansion-card",
  "def": {
   "simple": "Un savoir-faire rangé dans un fichier : Claude le sort de sa boîte à outils seulement quand il sert.",
   "standard": "Un skill est un dossier avec un fichier `SKILL.md` : en haut, une description (ce qu'il fait, et quand s'en servir) ; en dessous, des instructions en [[markdown]]. Au début d'une [[session]], Claude ne lit que les descriptions. Il charge le skill entier quand ta demande correspond, ou quand tu tapes `/` suivi de son nom.",
   "expert": "Dans un projet, un skill se range dans `.claude/skills/<nom>/SKILL.md`. Seul le champ `description` est recommandé ; il doit contenir les mots que tu dirais naturellement. Une procédure en plusieurs étapes a sa place dans un skill plutôt que dans CLAUDE.md : son contenu ne coûte de la place dans le contexte que lorsqu'il est utilisé."},
  "analogy": "Comme les fiches techniques rangées dans l'atelier : on ne les lit pas toutes chaque matin, on prend celle du jour quand le travail l'exige. L'étiquette sur la tranche doit être claire, sinon personne ne la trouve.",
  "example": "Un skill « journal-des-versions » : « Rédige l'entrée du journal quand on prépare une nouvelle version. » Tu dis « prépare la version 0.3 » : Claude le charge et suit ses étapes.",
  "prereq": ["markdown", "contexte", "claude-md"], "watch": ["skill", "skills", "SKILL.md"], "checked": "2026-11-17"},
 {"id": "mcp", "term": "MCP", "icon": "hub",
  "def": {
   "simple": "Une prise universelle qui branche Claude sur d'autres outils : agenda, tickets, base de données.",
   "standard": "MCP (Model Context Protocol) est une norme ouverte pour relier une IA à des outils. Un « serveur MCP » donne à [[claude-code]] de nouvelles actions, par exemple lire un ticket ou consulter un agenda. Chaque action reçoit une [[permission]], comme les autres. On ne branche que des serveurs de confiance.",
   "expert": "Un serveur qui va chercher du contenu extérieur peut exposer à une « injection de prompt » : un texte piégé qui tente de donner des ordres à Claude. Dans un projet, les serveurs MCP partagés se déclarent dans le fichier `.mcp.json` du dépôt."},
  "analogy": "Comme une multiprise universelle à l'atelier : n'importe quel appareil s'y branche avec la même fiche. Mais on ne branche pas un appareil trouvé dans la rue.",
  "example": "Branché sur l'outil de tickets de ton équipe, Claude lit le ticket « bouton Contact cassé » lui-même, au lieu que tu le recopies.",
  "prereq": ["claude-code", "permission"], "watch": ["MCP"], "checked": "2026-11-17"},
 {"id": "connecteur", "term": "Connecteur", "icon": "connector",
  "def": {
   "simple": "Une prise MCP toute prête, que tu branches depuis claude.ai en quelques touches.",
   "standard": "Un connecteur est un serveur [[mcp]] présenté dans le répertoire de claude.ai : tu l'actives avec ton compte, sans rien installer, et Claude peut s'en servir dans tes sessions (agenda, documents, etc.). Il suit les mêmes règles de [[permission]].",
   "expert": "Les connecteurs du répertoire d'Anthropic utilisent la même infrastructure MCP que Claude Code. Activés sur ton compte claude.ai, ils sont disponibles dans les sessions cloud. Avant d'en activer un, demande-toi ce qu'il permettra de lire et de modifier."},
  "analogy": "Comme un appareil vendu avec sa fiche déjà montée : on le branche sans tournevis.",
  "example": "Tu actives le connecteur de ton agenda : « Claude, quand ai-je un créneau pour tester l'appli cette semaine ? »",
  "prereq": ["mcp"], "watch": ["connecteur", "connecteurs"], "checked": "2026-11-17"},
 {"id": "plugin", "term": "Plugin", "icon": "toolbox",
  "def": {
   "simple": "Un paquet tout prêt qui ajoute d'un coup plusieurs skills, prises MCP et réglages à Claude Code.",
   "standard": "Un plugin regroupe plusieurs extensions de [[claude-code]] ([[skill|skills]], serveurs [[mcp]], automatismes) qu'on installe et désinstalle en une fois. Les plugins se trouvent dans des catalogues appelés « marketplaces ». Comme pour une appli, on vérifie qui l'a fait avant de l'installer.",
   "expert": "Un plugin peut exécuter du code sur la machine où il est installé : la documentation recommande de vérifier sa provenance. Les plugins déclarés dans les réglages du dépôt ne se chargent pas dans les sessions cloud ; pour celles-ci, on commite plutôt les skills dans `.claude/skills`."},
  "analogy": "Comme une mallette d'outils assortis, vendue complète, plutôt que des outils achetés un par un.",
  "example": "Un plugin de sécurité ajoute un skill qui relit le code de Claude à la recherche de failles, et le corrige dans la même session.",
  "prereq": ["skill", "mcp"], "watch": ["plugin", "plugins", "marketplace"], "checked": "2026-11-17"},
 # ---------- Protocole 6 : le jeton d'accès ----------
 {"id": "jeton-acces", "term": "Jeton d'accès", "icon": "key",
  "def": {
   "simple": "Un mot de passe spécial, limité, que tu donnes à une appli pour qu'elle agisse sur GitHub à ta place.",
   "standard": "Un jeton d'accès personnel est une longue suite de caractères créée sur [[github]]. Une appli qui le possède peut agir avec les droits que tu as choisis : sur quels [[depot|dépôts]], pour faire quoi, jusqu'à quelle date. Il se traite comme un mot de passe : jamais dans un fichier du dépôt, jamais partagé.",
   "expert": "GitHub propose des jetons « fine-grained » (précis) : on choisit les dépôts (« Sélectionner uniquement les dépôts »), chaque autorisation (lecture ou écriture du contenu, etc.) et une date d'expiration. GitHub supprime de lui-même un jeton inutilisé depuis un an, et recommande une expiration pour chacun."},
  "analogy": "Comme une clé de chantier remise à un sous-traitant : elle n'ouvre que la porte de son local, et elle cesse de marcher à la fin du contrat.",
  "example": "FORMA-8 a besoin d'écrire ta progression dans un seul dépôt de données : son jeton n'ouvre que ce dépôt, en lecture et écriture du contenu.",
  "prereq": ["github", "depot"], "watch": ["jeton", "jetons", "fine-grained"], "checked": "2026-11-17"},
 {"id": "moindre-privilege", "term": "Moindre privilège", "icon": "barrier",
  "def": {
   "simple": "Donner seulement les droits nécessaires, rien de plus : si ça fuit, les dégâts restent petits.",
   "standard": "Le moindre privilège est une règle de sécurité : chaque outil, chaque personne, chaque [[jeton-acces]] reçoit uniquement les droits dont il a besoin pour sa tâche, et pour la durée nécessaire. C'est aussi l'idée derrière les [[permission|permissions]] de Claude Code.",
   "expert": "Appliqué à un jeton : un seul dépôt plutôt que tous, lecture seule si l'écriture n'est pas utile, aucune autorisation d'administration, une date d'expiration. GitHub le demande en toutes lettres : choisir l'accès minimal et les autorisations minimales nécessaires."},
  "analogy": "Comme un badge visiteur : il ouvre la salle de réunion, pas le coffre-fort, et il expire le soir.",
  "example": "Le jeton de FORMA-8 n'a pas le droit de supprimer un dépôt : s'il fuyait, personne ne pourrait effacer tes projets avec.",
  "prereq": ["jeton-acces", "permission"], "watch": ["moindre privilège"], "checked": "2026-11-17"},
]
g = json.load(open(P))
have = {n["id"] for n in g}
g = [n for n in g if n["id"] not in {x["id"] for x in N}] + N
json.dump(g, open(P, "w"), ensure_ascii=False, indent=1)
open(P, "a").write("\n")
print(len(g), "notions")

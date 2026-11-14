# FORMA-8 · Programme détaillé des 11 caissons

> **Statut : proposition soumise à validation (14/11/2026).** Le contenu ne sera écrit qu'après accord.
> Complète `docs/CONCEPTION.md` (section 4, parcours).

## Principes communs

- **Un caisson = un membre de l'équipe = un niveau = une version du produit** (v0.0 à v1.0).
- **Un protocole de réveil** se fait en un ou deux « quarts » de 15 à 30 minutes. Déroulé d'un quart :
  1. une notion ;
  2. un exercice ;
  3. un ordre de mission confié à Claude Code ;
  4. au quart suivant, la vérification de la livraison.
- **Zéro zone de flou** : chaque notion est définie (3 niveaux, analogie, exemple) avant d'être utilisée. Le
  validateur bloque toute notion utilisée trop tôt.
- **Aucun contenu repris de FORMA-7** (décision du 14/11/2026) : toutes les fiches de notions, les leçons, les
  exercices et les simulateurs sont écrits à neuf, à partir de nouvelles sources (Anthropic, GitHub, MDN, CNIL,
  OWASP…). Seules la couche visuelle et la mécanique de jeu viennent de FORMA-7. Le projet FORMA-7 lui-même
  (son historique, ses bugs, ses choix) peut servir d'étude de cas : ce sont des faits de ton propre projet,
  pas des leçons recopiées.
- **Tout depuis Safari** : chaque manipulation est faite sur claude.ai/code et sur github.com dans le
  navigateur, sans ordinateur. Chaque consigne sera vérifiée dans ces conditions au moment de l'écriture.
- **Sources** : la documentation officielle de Claude Code, en français (`code.claude.com/docs/fr/...`), celle de
  GitHub en français (`docs.github.com/fr/...`), MDN en français pour le web, la CNIL et l'OWASP. Chaque
  source est citée avec sa date de vérification.
- **Sujets des cours Anthropic Academy** : Claude Code 101 et Claude Code in Action servent de liste de contrôle.
  Leurs sujets sont couverts aux caissons 02, 03, 04, 05 et 09, rédigés en français avec mes propres mots,
  sans copie ni traduction.
- **Technique du produit** : HTML, CSS et JavaScript simples jusqu'au caisson 03. Au caisson 04, Claude Code
  propose une pile technique plus solide, et tu apprends à évaluer sa proposition. Au caisson 07, le service
  de base de données et de comptes est choisi à partir de sources vérifiées à ce moment-là.

Légende des livraisons : **[fichier]** = fichier présent dans le dépôt du produit, **[commits]**,
**[PR]** = pull requests fusionnées, **[robot]** = workflow réussi, **[en ligne]** = page publiée,
**[main]** = à cocher toi-même.

---

## CAISSON 00 · ORA · Les bases du logiciel, sans coder · v0.0

| Protocole | Notions introduites | Activités |
|---|---|---|
| 1. Ce qu'est une application | `application`, `site-web`, `navigateur`, `serveur`, `fichier` | Simulateur « trajet d'une requête » (site statique) |
| 2. Les trois langues d'une page | `html`, `css`, `javascript`, `code-source` | Lecture d'une première modification (un titre qui change) |
| 3. Créer avec une IA | `ia`, `modele-de-langage`, `prompt`, `agent`, `vibe-coding`, `claude-code` | Origine du terme (popularisé par Andrej Karpathy en février 2025, d'après plusieurs sources secondaires : source primaire à vérifier), ce que l'IA fait et ne fait pas |
| 4. Choisir ton produit | `probleme-utilisateur`, `proposition-de-valeur`, `produit-minimum` | Atelier guidé : 3 idées, critères (utilité, faisable depuis un iPhone, coût, potentiel métier), choix et fiche produit |
| 5. Ta première mise en ligne | `github`, `depot`, `github-pages`, `adresse-web` | Créer le dépôt dans Safari, première session Claude Code, ordre de mission « page de présentation », activer GitHub Pages |

- **Panne** : « Ma page ne s'affiche pas » (mauvaise adresse, dépôt privé, fichier mal nommé, page encore en cache).
- **Livraison v0.0** : `index.html` [fichier] · page [en ligne] · « J'ai ouvert ma page sur mon iPhone » [main].
- **Sources** : MDN « Comment fonctionne le Web » ; GitHub Docs « Démarrage rapide pour GitHub Pages » ;
  Claude Code « Aperçu » et « Démarrer avec Claude Code dans le cloud ».

## CAISSON 01 · L'Archiviste · Garder chaque version (Git et GitHub) · v0.1

| Protocole | Notions introduites | Activités |
|---|---|---|
| 1. Pourquoi garder les versions | `version`, `git`, `historique` | Analogie des photos d'un chantier |
| 2. Le commit | `commit`, `message-de-commit` | Simulateur « branches », lecture d'un vrai commit de FORMA-7 |
| 3. Les branches | `branche`, `branche-principale` | Simulateur « branches » |
| 4. La pull request | `pull-request`, `fusion`, `relecture` | Ordre de mission : changement sur une branche, pull request, relecture et fusion depuis Safari |
| 5. Revenir en arrière | `annulation`, `conflit` | Panne simulée : un conflit, une fusion à annuler |

- **Panne** : « J'ai fusionné un bug » (annuler), « Conflit de fusion », « Message de commit illisible ».
- **Livraison v0.1** : 5 [commits] · 1 [PR] · `README.md` [fichier] · page [en ligne].
- **Atelier** : la situation « Faire relire avant de fusionner » s'ouvre.
- **Sources** : GitHub Docs « Flux GitHub », « À propos des pull requests » ; Claude Code « Flux de travail courants ».
- **Cas d'étude** : les 6 commits de FORMA-7, tous envoyés directement sur `main`. Pourquoi FORMA-8 passe par des pull requests.

## CAISSON 02 · Le Règlement de bord · L'environnement de ton équipe (Claude Code) · v0.2

| Protocole | Notions introduites | Activités |
|---|---|---|
| 1. Une séance de travail dans le navigateur | `session`, `environnement-cloud`, `terminal`, `commande` | Visite guidée d'une session sur claude.ai/code |
| 2. Ce que Claude voit | `token`, `contexte`, `fenetre-contexte`, `compaction` | Nouveau simulateur « ce que Claude voit » : fichiers lus, conversation et règles qui remplissent la fenêtre, puis compaction |
| 3. Le fichier de règles | `claude-md`, `memoire-projet` | Ordre de mission : écrire le `CLAUDE.md` du produit ; atelier « Écrire les règles » |
| 4. Les permissions | `permission`, `mode-permission`, `mode-plan` | Choisir le bon mode selon la tâche |
| 5. Les savoir-faire et les prises | `markdown`, `skill`, `mcp`, `connecteur`, `plugin` | Nouveaux simulateurs « boîte à outils de l'équipe » (un Skill chargé seulement quand il sert) et « prises MCP » ; nouvelle Forge de Skills écrite d'après la documentation d'Anthropic |
| 6. Le jeton d'accès | `jeton-acces`, `moindre-privilege` | Simulateur « constructeur de jeton », puis création du vrai jeton FORMA-8 et activation de la synchronisation |

- **Panne** : « Claude ignore une règle » (fichier trop long ou contradictoire), « Permission refusée », « Contexte saturé ».
- **Livraison v0.2** : `CLAUDE.md` [fichier] · `.claude/settings.json` [fichier] · un Skill dans `.claude/skills` [fichier] ·
  « Synchronisation FORMA-8 activée » [main].
- **Sources** : Claude Code « Comment Claude se souvient de votre projet », « Explorez la fenêtre de contexte »,
  « Configurer les autorisations », « Choisir un mode d'autorisation », « Étendre Claude avec des skills »,
  « Connecter Claude Code à des outils via MCP », « Configurer les environnements cloud » ; GitHub Docs « Jetons
  d'accès personnel ».

## CAISSON 03 · Le Scribe · Décrire et découper · v0.3

| Protocole | Notions introduites | Activités |
|---|---|---|
| 1. Écrire avant de construire | `specification`, `besoin` | Comparaison d'une demande floue et d'une demande précise |
| 2. Le parcours de l'utilisateur | `persona`, `parcours-utilisateur` | Dessiner le parcours de ton utilisateur principal |
| 3. Savoir quand c'est fini | `critere-acceptation`, `definition-de-termine` | Exercices : critères vérifiables ou non |
| 4. Découper en tâches | `user-story`, `decoupage` | Découper ta spécification en 5 à 8 tâches |
| 5. Planifier avec Claude | `plan` | Ordre de mission en mode plan : Claude propose, tu valides, puis il construit |

- **Panne** : « Claude a construit autre chose » (spécification ambiguë).
- **Livraison v0.3** : `docs/SPEC.md` [fichier] · maquette cliquable [en ligne] · 2 [PR].
- **Atelier** : consignes notées par Claude sur chaque tâche.
- **Sources** : Claude Code « Bonnes pratiques » (explorer, planifier, coder), « Flux de travail courants » (mode plan).

## CAISSON 04 · La Boucle · Demander, relire, corriger · v0.4

| Protocole | Notions introduites | Activités |
|---|---|---|
| 1. La boucle de travail | `iteration`, `boucle-agent` | Nouveau simulateur « la boucle de l'agent » : lire, agir, vérifier, recommencer |
| 2. Relire ce que Claude a fait | `diff` | Lecture guidée de vraies modifications, de plus en plus longues |
| 3. Quand ça casse | `bug`, `reproduire`, `message-erreur` | Trouver un message d'erreur depuis Safari |
| 4. Le rapport de bug | `rapport-de-bug`, `hypothese` | Pannes à diagnostiquer, notées par Claude |
| 5. Revenir à un point sûr | `point-de-controle` | Revenir en arrière dans une session (« Rewind ») ou dans Git |
| 6. Faire grandir le produit | `bibliotheque`, `framework`, `dependance` | Évaluer la pile technique proposée par Claude, et choisir |

- **Panne** : trois pannes réalistes du produit (bouton inactif, affichage cassé sur iPhone, donnée perdue au rechargement).
- **Livraison v0.4** : première vraie fonctionnalité · `docs/JOURNAL.md` [fichier] · 3 [PR] · page [en ligne] ·
  « Testé sur mon iPhone » [main].
- **Sources** : Claude Code « Bonnes pratiques », « Flux de travail courants » (corriger un bug), « Points de contrôle ».

## CAISSON 05 · L'Inspecteur · Qualité et vérifications · v0.5

| Protocole | Notions introduites | Activités |
|---|---|---|
| 1. Pourquoi tester automatiquement | `test-automatique`, `regression` | Cas d'étude : la reprise des leçons de FORMA-7, cassée puis réparée |
| 2. Les sortes de tests | `test-unitaire`, `test-bout-en-bout` | Lire un vrai test de FORMA-8 |
| 3. L'intégration continue | `integration-continue`, `github-actions`, `workflow` | Simulateur « chaîne de vérifications » |
| 4. La revue de code | `revue-de-code` | Demander une revue à Claude (commande de revue), puis la relire |
| 5. Les garde-fous du projet | `garde-fou`, `dette-technique` | Cas d'étude : les validateurs « zéro emoji » et « zéro zone de flou » |

- **Panne** : « Le robot est rouge », « Un test passe alors que c'est cassé », « Un test trop fragile ».
- **Livraison v0.5** : dossier `tests` [fichier] · workflow de vérification [robot] · 4 [PR].
- **Sources** : GitHub Docs « Comprendre GitHub Actions » ; Claude Code « GitHub Actions », « Revue de code » ;
  documentation de l'outil de test choisi (souvent en anglais : un résumé sera rédigé en français).

## CAISSON 06 · Le Messager · La mise en ligne · v0.6 (bêta publique)

| Protocole | Notions introduites | Activités |
|---|---|---|
| 1. Construire puis publier | `construction`, `deploiement`, `hebergement` | Suivre le trajet d'un commit jusqu'à la page en ligne |
| 2. Essayer avant de publier | `production`, `preproduction` | Mettre en place une version d'essai |
| 3. Les secrets de la mise en ligne | `variable-environnement`, `secret` | Ranger un secret dans GitHub, jamais dans le code |
| 4. Ton nom de domaine (optionnel) | `nom-de-domaine`, `dns`, `https` | Prix et démarches, à vérifier au moment de l'écriture |
| 5. Revenir en arrière en ligne | `retour-arriere` | Exercice : publier une erreur et revenir à la version précédente |
| 6. Tes premiers utilisateurs | `beta`, `retour-utilisateur` | Inviter 3 personnes, recueillir et trier leurs retours |

- **Panne** : « La mise en ligne a échoué », « Le site en ligne est cassé ».
- **Livraison v0.6** : workflow de mise en ligne [robot] · page [en ligne] · `docs/BETA.md` [fichier] ·
  « 3 personnes ont essayé mon produit » [main].
- **Sources** : GitHub Docs « GitHub Pages », « Secrets dans GitHub Actions », « Gérer un domaine personnalisé ».

## CAISSON 07 · La Mémoire · Données et comptes · v0.7

| Protocole | Notions introduites | Activités |
|---|---|---|
| 1. Où vivent les données | `donnees`, `stockage-local`, `base-de-donnees` | Cas d'étude : le stockage et la synchronisation de FORMA-7 |
| 2. Le serveur et l'API | `api`, `backend`, `requete` | Simulateur « trajet d'une requête » (appli avec serveur) |
| 3. Les comptes | `authentification`, `autorisation-acces` | Qui a le droit de voir quoi |
| 4. Choisir un service | `service-backend`, `offre-gratuite` | Comparatif vérifié à la date d'écriture, puis décision |
| 5. L'IA dans ton produit | `cle-api`, `appel-api` | Pourquoi la clé reste sur un serveur ; simulateur « calculateur de coûts » |

- **Panne** : « Tout le monde voit les données de tout le monde », « Une clé visible dans le code ».
- **Livraison v0.7** : `docs/DONNEES.md` [fichier] · « Un compte de test fonctionne » [main] · page [en ligne] · 6 [PR].
- **Sources** : documentation du service choisi (vérifiée à la date d'écriture) ; documentation de l'API Claude.

## CAISSON 08 · La Sentinelle · Sécurité et coûts · v0.8

| Protocole | Notions introduites | Activités |
|---|---|---|
| 1. Garder les secrets | `fuite-de-secret`, `rotation` | Que faire si une clé a fuité |
| 2. Les failles les plus courantes | `owasp`, `controle-acces`, `injection` | Les 10 risques de l'OWASP (édition 2025), en mots simples |
| 3. L'injection de prompt | `injection-de-prompt` | Cas d'étude : les règles du pipeline de mails de FORMA-7 |
| 4. Le RGPD | `rgpd`, `donnee-personnelle`, `politique-de-confidentialite` | Fiches de la CNIL pour les développeurs |
| 5. Maîtriser les coûts | `budget`, `plafond-de-depense`, `quota` | Simulateur « calculateur de coûts » |
| 6. L'audit de sécurité | `audit-securite` | Ordre de mission : audit de sécurité par Claude, puis correction |

- **Panne** : « Un secret envoyé sur GitHub », « Des données exposées », « Une facture qui explose ».
- **Livraison v0.8** : `SECURITY.md` [fichier] · page de confidentialité [fichier] · vérifications [robot] ·
  « Plafond de dépense configuré » [main].
- **Sources** : OWASP Top 10:2025 ; CNIL « Guide RGPD de l'équipe de développement » (vérifier la version la plus
  récente) ; Claude Code « Sécurité », « Gérer les coûts efficacement ».

## CAISSON 09 · Les Escouades et les Réflexes · Le niveau expert · v0.9

| Protocole | Notions introduites | Activités |
|---|---|---|
| 1. Les sous-agents | `sous-agent`, `delegation` | Confier une recherche à un sous-agent |
| 2. Plusieurs sessions en parallèle | `parallelisme` | Trois tâches lancées en même temps, puis fusion |
| 3. Les réflexes | `hook`, `evenement` | Un hook qui vérifie avant chaque fin de tâche |
| 4. Les tâches planifiées | `tache-planifiee` | Cas d'étude : la tâche du matin de FORMA-7 ; création d'une tâche d'entretien |
| 5. Claude dans GitHub | `correction-automatique` | Correction automatique des pull requests, revue par robot |
| 6. Aller plus loin | `plugin`, `agent-sdk` | Panorama, sans obligation |

- **Panne** : « Un hook bloque tout », « Deux agents modifient le même fichier ».
- **Livraison v0.9** : dossier `.claude` [fichier] · un sous-agent dans `.claude/agents` [fichier] · revue automatique [robot] ·
  « Tâche planifiée créée » [main].
- **Sources** : Claude Code « Créer des sous-agents », « Exécuter des agents en parallèle », « Automatiser des actions
  avec des hooks », « Automatiser le travail avec des tâches planifiées », « GitHub Actions », « Plugins ».

## CAISSON 10 · Le Lancement · Produit et métier · v1.0

| Protocole | Notions introduites | Activités |
|---|---|---|
| 1. Lancer la version 1.0 | `lancement`, `journal-des-versions` | Liste de contrôle du lancement |
| 2. Mesurer sans espionner | `mesure-audience`, `cookie`, `consentement` | Choisir un outil respectueux, en accord avec le RGPD |
| 3. Faire payer (optionnel) | `paiement-en-ligne`, `abonnement` | Panorama, frais et obligations, à vérifier au moment de l'écriture |
| 4. En faire un métier | `portfolio`, `devis`, `estimation` | Exporter ton portfolio, rédiger un devis à partir d'une spécification |
| 5. Rester expert | `veille` | Suivre le journal des modifications de Claude Code |

- **Panne** : « Le jour du lancement, tout plante ».
- **Livraison v1.0** : `CHANGELOG.md` [fichier] · page [en ligne] · vérifications [robot] · « J'ai partagé mon portfolio » [main].
- **Sources** : CNIL (mesure d'audience exemptée de consentement) ; Claude Code « Journal des modifications ».

---

## Volume et rythme

- **Environ 60 protocoles** et **environ 140 notions**, toutes rédigées à neuf.
- **Simulateurs** : les 5 du lot 2, plus 4 nouveaux à écrire avec le contenu (ce que Claude voit, boîte à outils
  de l'équipe, prises MCP, boucle de l'agent). Aucun simulateur de FORMA-7 n'est utilisé.
- À raison d'un à deux quarts par protocole, plus les livraisons : **environ 6 à 10 mois** à 15-30 minutes par jour.
  C'est une estimation, qui affine celle du document de conception.

## Points à vérifier pendant l'écriture

- Que chaque manipulation sur github.com et claude.ai/code se fasse bien dans Safari sur iPhone : création de dépôt,
  activation de Pages, relecture et fusion d'une pull request, création d'un jeton.
- Le service de données et de comptes du caisson 07, ainsi que les offres et tarifs cités aux caissons 06, 07, 08 et 10 :
  à choisir et dater au moment de l'écriture.
- Les titres exacts des pages de documentation en français, et la version la plus récente du guide RGPD de la CNIL.

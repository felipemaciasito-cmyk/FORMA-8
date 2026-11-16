# FORMA-8 · Réveille l'équipe : document de conception

> **Statut : version complète, soumise à validation.** Aucune construction (aucune ligne de code)
> avant la validation de ce document par le propriétaire du projet.
> Dernière mise à jour : 14/11/2026.

Ce document rassemble les décisions prises pendant la phase de conception : diagnostic, programme source,
parcours, game design et plan technique.

---

## 1. Objectif

Une application d'apprentissage ludique (PWA), suite de FORMA-7, pour **apprendre à vibe coder comme un
expert**, par la pratique, depuis un iPhone et un iPad. Le vibe coding consiste à créer des applications en
décrivant à une IA ce que l'on veut. Le parcours mène d'un niveau débutant au niveau expert, et chaque
niveau se termine par une nouvelle version d'un vrai produit publiée en ligne.

Le prompt fondateur de FORMA-7 s'applique ici aussi : interface très élaborée, animations et esthétique
soignées, navigation agréable, exercices, idées de projets, exemples, outils graphiques, éléments
interactifs, présentation en aventure, et **aucune zone de flou** : chaque notion est définie et assimilée
avant d'être utilisée.

## 2. Diagnostic (14/11/2026)

### Questionnaire

| Sujet | Réponse |
|---|---|
| Matériel | iPhone et iPad uniquement, claude.ai dans Safari (Claude Code dans le navigateur) |
| Lecture du code | Survole les modifications (« diffs ») sans tout comprendre ; ne lit ni n'écrit de code |
| Git | Sait expliquer 1 ou 2 notions sur 4 (commit, branche, push, pull request) |
| Déploiement | Ne sait pas ce qui se passe quand un commit arrive sur `main` |
| Jeton GitHub | Pas encore créé |
| FORMA-7 | Pas encore utilisée : ses notions ne sont pas considérées comme acquises |
| Anglais | Ne le lit pas : tout doit être en français |
| Temps disponible | 15 à 30 minutes par jour |
| Objectif | En faire un métier et lancer un produit |
| Type de produit visé | Grand public, outil pour les pros, avec IA intégrée |

### Analyse du projet FORMA-7 (historique Git)

- Construit en environ 20 heures (13/11/2026 06:45 au 14/11/2026 02:17 UTC), en 6 commits.
- Le premier commit contient presque tout (66 fichiers, environ 6 300 lignes hors `package-lock.json`).
- **Déjà au niveau professionnel** : validateurs qui bloquent le build (« zéro zone de flou », « zéro
  emoji ») ; déploiement automatique par GitHub Actions vers GitHub Pages ; jeton limité à un dépôt et
  stocké sur l'appareil ; `PIPELINE.md` avec des règles contre l'injection de prompt ; messages de commit
  explicites.
- **À apprendre** : tout a été poussé directement sur `main` (ni branche, ni pull request, ni relecture) ;
  aucun test automatique conservé dans le dépôt ; pas de `CLAUDE.md` ; des défauts découverts après la
  mise en ligne (reprise des leçons ; synchronisation jamais active, faute de jeton).

### Conclusion

Profil de **pilote débutant** : sait mener un projet de bout en bout avec Claude Code, mais sans les bases
(Git, déploiement, secrets, lecture du code, tests). Le parcours part de là.

## 3. Décisions validées

| Sujet | Décision |
|---|---|
| Programme source | Parcours sur mesure, construit sur la documentation officielle de Claude Code **en français**. Les programmes des cours Anthropic Academy (Claude Code 101, Claude Code in Action) servent de liste de contrôle : chaque sujet est couvert en français, réécrit (jamais traduit mot pour mot), source citée. |
| Autonomie | FORMA-8 enseigne elle-même toutes les notions qu'elle utilise. **Aucun contenu de FORMA-7 n'est repris** (décision du 14/11/2026) : fiches, leçons, exercices et simulateurs sont écrits à neuf à partir de nouvelles sources (Anthropic et autres). Seules la couche visuelle et la mécanique de jeu viennent de FORMA-7. |
| Lien avec FORMA-7 | Clin d'œil seulement : si une progression FORMA-7 est trouvée, reprise du prénom et affichage des badges FORMA-7 en souvenir, sans effet sur l'apprentissage. Lecture seule, jamais d'écriture. |
| Univers | **L'Équipe** : le datacenter rallumé réveille des automates ; chacun incarne un vrai outil de Claude Code ; le joueur passe d'apprenti à chef d'orchestre d'agents. Dans l'appli, on parle toujours d'« équipe », jamais d'« équipage ». |
| Nom | « FORMA-8 · Réveille l'équipe » (confirmé). |
| Vérification des livrables | Automatique, par l'API GitHub, avec un jeton en lecture limité aux dépôts concernés ; liste à cocher en secours si la vérification est impossible. |
| Nouvelles mécaniques | Atelier des consignes, pannes à diagnostiquer, livraisons vérifiées ; plus les fiches de l'équipe, les simulateurs et le portfolio. La revue de code n'a pas de mécanique dédiée mais reste une notion du niveau 5. |
| Claude intégré | **Indispensable** : l'appli utilise l'API Claude (clé fournie par le joueur, facturée à l'usage, séparément de l'abonnement). |
| Abonnement du joueur | Claude **Pro** : pas de crédits API inclus ; l'API est payée à part (crédits achetés dans la Console Claude), avec un plafond de dépense mensuel. |
| Modèle par défaut | **Claude Opus 5.5** (modifiable dans Réglages : Sonnet 5.5, Haiku 5.5). |
| Ordre de construction | **Tout le parcours d'un coup** : socle, mécaniques et 11 niveaux construits avant le premier test complet. |
| Méthode de travail sur FORMA-8 | **Exemplaire** : `CLAUDE.md`, tests automatiques, intégration continue, et une pull request par lot, relue et fusionnée par le propriétaire (demande explicite de pull requests). |
| Projets | Un **produit fil rouge**, du niveau 0 au niveau 10, choisi dans l'appli grâce à un atelier guidé au niveau 0. |
| Premiers vrais utilisateurs | Au **niveau 6** : produit fonctionnel, testé, publié, sans comptes ni données personnelles. |
| Missions du jour | **Aucune** : pas de lecture de mails. FORMA-7-data ne sert qu'à la synchronisation. |
| Langue | Tout en français. |
| Identité visuelle | Jusqu'au 15/11/2026 : strictement identique à FORMA-7. **Depuis le 15/11/2026 (option B, choisie par le propriétaire après des maquettes jouables) : même palette et mêmes polices que FORMA-7**, écrans et animations propres à FORMA-8 ; tout nouveau changement visuel important est montré au propriétaire avant d'être fait. |
| Stockage | Clés propres à FORMA-8 (préfixe différent de `forma7:`) ; synchronisation dans `progress/forma-8.json` de FORMA-7-data ; `progress/progress.json` n'est jamais modifié. |
| Voix de l'équipe | **Depuis le 16/11/2026** (choix du propriétaire) : chaque personnage a un sexe, une personnalité, des traits et une voix robotique qui lui ressemble ; il lit **ses** répliques (bulles des membres et d'ORA, pas les leçons), à la première personne, en tutoyant le joueur. Lecture automatique à l'apparition de la bulle, bouton « Réécouter », interrupteur dans le menu du son. Voix enregistrées une fois avec ElevenLabs (offre Starter, licence commerciale), touche robotique ajoutée par l'appli. Détail : `src/content/voix.json`. |

## 4. Parcours (proposition à détailler)

Un membre de l'équipe se réveille à chaque niveau ; le produit passe à la version suivante (v0.0 à v1.0).

| Niveau | Membre de l'équipe | Ce qu'on apprend | Livrable publié |
|---|---|---|---|
| 0 | Réveil (ORA) | Bases du logiciel sans coder : fichiers, navigateur, serveur, HTML, CSS, JavaScript ; lire une modification simple ; choisir son produit | Page de présentation du produit |
| 1 | L'Archiviste | Git et GitHub : commit, branche, push, pull request, fusion, retour arrière | La page évolue par des pull requests relues et fusionnées |
| 2 | Le Règlement de bord | Environnement Claude Code : sessions dans le navigateur, environnements, `CLAUDE.md`, permissions, contexte, Skills, MCP et connecteurs, jeton GitHub | Dépôt équipé (`CLAUDE.md`, réglages, premier Skill) |
| 3 | Le Scribe | Spécifier et découper : cahier des charges, parcours utilisateur, critères d'acceptation, tâches, mode plan | Maquette cliquable |
| 4 | La Boucle | Demander, relire, tester, itérer, déboguer : reproduire, lire une erreur, formuler une hypothèse, revenir en arrière | Première vraie fonctionnalité |
| 5 | L'Inspecteur | Qualité et tests : tests automatiques, revue de code, intégration continue | Produit protégé par ses tests |
| 6 | Le Messager | Déploiement : préproduction et production, variables d'environnement, domaine, retour arrière | Bêta publique, premiers vrais utilisateurs |
| 7 | La Mémoire | Données et authentification : base de données, comptes, serveur, IA intégrée | Comptes et données réelles |
| 8 | La Sentinelle | Sécurité et coûts : secrets, OWASP Top 10:2025, injection de prompt, RGPD, budget | Audit de sécurité, page de confidentialité, budget maîtrisé |
| 9 | Les Escouades et les Réflexes | Niveau expert : agents en parallèle, hooks, tâches planifiées, GitHub Actions, correction automatique des pull requests, plugins | Entretien du produit en partie automatisé |
| 10 | Le Lancement | Produit et métier : utilisateurs, mesure d'audience respectueuse, retours, paiement éventuel, portfolio, devis | v1.0 lancée publiquement et portfolio |

**Rythme** : séances de 15 à 30 minutes. **Durée estimée** : environ 3 à 5 semaines par niveau, soit 8 à
13 mois au total. Il s'agit d'une estimation de conception, à affiner, et non d'une donnée vérifiée.

## 5. Game design

### Vocabulaire

On parle d'**équipe**, jamais d'« équipage ». Les membres de l'équipe sont des automates endormis dans des
**caissons** (un caisson par niveau) ; chacun incarne un vrai outil de Claude Code. Les leçons sont des
**protocoles de réveil**. ORA reste le guide : c'est elle qui réveille l'équipe et confie le commandement
au joueur.

### Mécaniques reprises de FORMA-7

| FORMA-7 | FORMA-8 |
|---|---|
| Salles et baies | Caissons (niveaux) et protocoles de réveil (leçons) |
| Énergie en kW, 8 grades d'accréditation | Même énergie ; grades : Recrue, Apprenti, Opérateur, Pilote, Chef d'atelier, Chef d'équipe, Commandant, Chef d'orchestre (noms ajustables) |
| Incidents à 3 fusibles | Pannes : page blanche, déploiement en échec, secret exposé, etc. |
| Maintenance (Leitner, 5 boîtes), Uptime, badges octogonaux, fiches de notions à 3 niveaux, exercices, reprise des leçons | Identiques |
| ORA | Identique |

### Nouvelles mécaniques retenues

1. **Atelier des consignes** : l'appli aide à rédiger l'ordre de mission à coller dans Claude Code et le
   fait noter par Claude (contexte, objectif, critères de réussite, contraintes, vérification). Une
   meilleure consigne fait progresser l'équipe plus vite.
2. **Pannes à diagnostiquer** : un dépôt d'entraînement contient des bugs plantés exprès ; le joueur fait
   le diagnostic, rédige le rapport de bug et pilote la correction.
3. **Livraisons vérifiées** : l'appli vérifie les livrables sur GitHub (page en ligne, pull request
   fusionnée, tests réussis). Preuves réelles ; liste à cocher en secours.

Prévus dans tous les cas :

- **Fiches de l'équipe** : chaque membre est relié à un vrai fichier du produit (`CLAUDE.md`, Skills,
  réglages, tests, workflows…).
- **Simulateurs** : branches Git animées, trajet d'une requête entre navigateur et serveur, chaîne de
  tests et de mise en ligne avec voyants, constructeur de jeton, calculateur de coûts.
- **Portfolio** : construit automatiquement à partir des livraisons vérifiées.

### Séance type : le « quart » (15 à 30 minutes)

1. Une notion.
2. Un exercice.
3. Un ordre de mission envoyé à Claude Code, qui travaille pendant l'absence du joueur.
4. Au quart suivant, la vérification de la livraison.

### Claude intégré (indispensable)

L'appli appelle l'API Claude avec la clé du joueur, stockée sur l'appareil et jamais dans le code :
correction des réponses libres, notation des consignes, réexplication d'une notion, accompagnement dans le
diagnostic des pannes. La création de la clé, son plafond de dépense et sa protection font l'objet d'un
protocole guidé dès le démarrage, avec les notions nécessaires définies avant (« zéro zone de flou »).
Modèles, tarifs et coût mensuel estimé : à établir dans le plan technique, à partir de sources vérifiées.

## 6. Plan technique

### Identité

- Nom : **FORMA-8 · Réveille l'équipe** (nom court : FORMA-8).
- Dépôt : `felipemaciasito-cmyk/FORMA-8`. Adresse : `https://felipemaciasito-cmyk.github.io/FORMA-8/`
  (GitHub Pages, base `/FORMA-8/`, même origine que FORMA-7).

### Pile (identique à FORMA-7, mêmes versions)

Vite 8, React 19, TypeScript, motion 14 (import depuis `motion/react`), idb-keyval, @fontsource Space
Grotesk et JetBrains Mono, vite-plugin-pwa, @anthropic-ai/sdk chargé à la demande. Le `package.json` de
FORMA-7 sert de base. Seul ajout : `@playwright/test` en dépendance de développement, pour les tests.

### Couche visuelle copiée de FORMA-7, sans retouche

> **Mise à jour du 15/11/2026.** Cette section décrit le départ du projet. Depuis l'option B, seules la palette
> (variables de `:root`) et les polices restent identiques à FORMA-7 ; le contrôle `check:parity` vérifie ces
> seuls points, plus les glyphes (ajout seulement) et la couleur de thème. `Art.tsx` a été retiré.

- `src/styles/app.css` (variables de `:root`, grille, balayage, HUD, onglets, panneaux, boutons, pastilles,
  feuille du bas, toasts, animations, règles « animations réduites ») ;
- `src/components/` : `Icon.tsx`, `glyphs.ts`, `Emblems.tsx`, `Chrome.tsx`, `Ora.tsx`, `Art.tsx`, `Boot.tsx`,
  `TermSheet.tsx`, `Exercises.tsx` ;
- `src/content/icon-ids.json` et `glyphs.ts` : **seulement enrichis** de nouveaux glyphes dans le même style
  (grille de 24, trait de 1,8, coins arrondis) ;
- `src/lib/sound.ts`, `src/lib/motion.ts` (`MotionConfig`, `useReduceMotion`) ;
- PWA : `theme-color` `#04060c`, barre d'état `black-translucent`, icônes générées par
  `scripts/gen-icons.mjs` ; réglages son et animations (complètes ou réduites).

**Substitutions indispensables, validées par le propriétaire le 14/11/2026** (textes et clés, aucun
changement visuel ; aucune autre retouche n'est autorisée) :

| Fichier | Substitution | Raison |
|---|---|---|
| `Boot.tsx` | Lignes du BIOS (« FORMA-7 · BIOS v7.0.26 », « Salles détectées », « Datacenter hors tension ») et texte d'accueil d'ORA, réécrits pour FORMA-8 et l'équipe | Récit de FORMA-8 |
| `Exercises.tsx` | Clé de brouillon `forma7:brouillon:` remplacée par `forma8:brouillon:` | Ne jamais écrire dans les données de FORMA-7 |
| `index.html`, `vite.config.ts` | Nom, description, titre, base `/FORMA-8/` | Identité de l'appli |
| Commentaires de code | Mentions de FORMA-7 adaptées | Exactitude |
| `public/icons/icon.svg` | Chiffre « 7 » remplacé par « 8 » (même dessin, mêmes couleurs) ; validé le 14/11/2026 | Identité de l'appli |

Nouvel élément visuel validé le 14/11/2026 : sur la carte, chaque caisson est dessiné sur la même dalle
isométrique que les salles de FORMA-7 (mêmes couleurs, mêmes voyants), avec une capsule et une
silhouette à la place des baies de serveurs.

Ces substitutions sont décrites dans `scripts/design-parity.json`. Le script
**`scripts/check-design-parity.mjs`** compare, quand les deux dépôts sont présents : les variables de
`:root` (à l'identique) et chaque fichier de la couche visuelle (identique à celui de FORMA-7 après
application des seules substitutions autorisées). Tout autre écart est signalé et fait échouer le
contrôle. Il tourne en local et dans l'intégration continue (qui récupère FORMA-7, dépôt public).

### Repris de FORMA-7 et adapté

- **Stockage** : IndexedDB « keyval-store », clés préfixées `forma8:` (`forma8:progress`,
  `forma8:settings`, `forma8:sync`…). Aucune écriture sous `forma7:`.
- **Synchronisation** : même mécanisme de fusion sans perte (`merge.ts`, `sync.ts`), vers
  `progress/forma-8.json` dans FORMA-7-data. `progress/progress.json` n'est jamais modifié.
- **Clin d'œil FORMA-7** : sur iOS, les applis de l'écran d'accueil ont un stockage isolé (comportement
  voulu par WebKit). La progression FORMA-7 est donc lue, en lecture seule, dans
  `progress/progress.json` de FORMA-7-data quand il existe ; sinon, rien n'est affiché.
- **Claude** : module de FORMA-7 (`claude.ts`) repris : appel direct depuis le navigateur, clé stockée sur
  l'appareil, modèles Opus 5.5 (défaut), Sonnet 5.5, Haiku 5.5, repli serveur en cas de refus, réponses
  structurées, nettoyage des emoji. Nouvelles fonctions : noter une consigne, accompagner un diagnostic.
- **Validateurs** : « zéro zone de flou » (`validate-content.mjs`) et « zéro emoji »
  (`emoji-rules.js`, `check-no-emoji.mjs`), adaptés au nouveau modèle de contenu.
- **Moteur de jeu** : énergie, grades, Uptime, badges, Leitner, reprise des leçons (`game.ts`,
  `progress.ts`), avec le vocabulaire de l'équipe.

### Nouveau

- **Modèle de contenu** : notions (comme FORMA-7, avec source et date de vérification pour ce qui évolue
  vite), caissons (niveaux), protocoles de réveil (leçons), pannes, livraisons. Nouveaux blocs : ordre de
  mission à copier dans Claude Code, atelier des consignes, vérification de livraison, lecture d'une
  modification de code.
- **Livraisons vérifiées** : module qui interroge l'API GitHub (page en ligne, fichier présent, pull
  request fusionnée, workflow réussi), avec liste à cocher en secours.
- **Atelier des consignes**, **pannes à diagnostiquer** (dépôt d'entraînement créé par le joueur au moment
  voulu, comme exercice), **fiches de l'équipe**, **simulateurs**, **portfolio**.
- **Glossaire** : toutes les notions rédigées à neuf, à partir de nouvelles sources. Les simulateurs et la
  forge de Skills de FORMA-7 ne sont pas repris ; une nouvelle forge sera écrite au caisson 02.

### Jeton GitHub (un seul, « fine-grained »)

Limité aux dépôts nécessaires : FORMA-7-data (Contents : lecture et écriture, pour la synchronisation) et
le dépôt du produit (lecture : contenu, pull requests, Actions), ajouté quand ce dépôt existe. Stocké sur
l'appareil, jamais dans le code. Sa création est une leçon guidée. À vérifier : la possibilité d'ajouter un
dépôt à un jeton existant (sinon, on en crée un nouveau).

### Clé API Claude

Plan Pro : crédits achetés dans la Console Claude (montant minimal d'achat à vérifier). Recommandation :
un espace de travail dédié à FORMA-8 avec un plafond de dépense mensuel (impossible sur l'espace par
défaut), et une clé créée dans cet espace.

| Modèle | Entrée / million de tokens | Sortie / million de tokens | Estimation mensuelle |
|---|---|---|---|
| Opus 5.5 (défaut) | 4 $ | 20 $ | environ 8 $ |
| Sonnet 5.5 | 2 $ | 10 $ | environ 4 $ |
| Haiku 5.5 | 0,10 $ | 0,50 $ | moins de 0,50 $ |

Tarifs officiels vérifiés le 14/11/2026. L'estimation est une hypothèse de conception (6 appels par
séance, 30 séances par mois, environ 3 000 tokens envoyés et 1 500 reçus par appel) ; le coût réel peut
varier du simple au double. L'appli affichera la consommation réelle mesurée (champ `usage` des réponses).

### Technique du produit fil rouge (niveaux 7 et suivants)

Base de données, comptes, serveur et IA intégrée : choix reporté au moment d'écrire ces niveaux, à partir
de sources vérifiées à cette date (les offres gratuites évoluent vite). Contraintes connues : tout se fait
depuis Safari via Claude Code dans le navigateur ; une clé d'IA ne doit jamais être exposée dans une appli
publique (passage obligé par un serveur).

### Qualité du dépôt FORMA-8 (méthode exemplaire)

- `CLAUDE.md` : règles du projet (zéro emoji, zéro zone de flou, parité visuelle, préfixe `forma8:`,
  messages de commit en français, interdiction de modifier `progress/progress.json`).
- Tests : tests de bout en bout Playwright (démarrage, navigation, protocole complet, aucune écriture sous
  `forma7:`) et tests de la fusion et du validateur.
- Intégration continue sur chaque pull request : validation du contenu, zéro emoji, parité visuelle,
  vérification des types, build, tests. Déploiement sur GitHub Pages à chaque fusion sur `main`.
- Réglage manuel à faire par le propriétaire : Settings › Pages › Source : GitHub Actions. Le dépôt est
  public (vérifié le 14/11/2026), condition de GitHub Pages gratuit.

## 7. Plan de construction

Après validation de ce document, tout est construit avant le premier test complet, en pull requests
successives, chacune relue et fusionnée par le propriétaire :

1. **Socle** : couche visuelle copiée, contrôle de parité, `CLAUDE.md`, stockage, synchronisation, Claude,
   carte des caissons, réglages, tests, intégration continue.
2. **Mécaniques** : modèle de contenu et validateur, livraisons vérifiées, atelier des consignes, pannes,
   fiches de l'équipe, simulateurs, portfolio.
3. **Contenu des niveaux 0 à 10** : une pull request par niveau.

Le premier envoi sur `main` n'a lieu qu'avec l'accord explicite du propriétaire.

## 8. Risques et points de vigilance

- **Volume** : 11 niveaux de contenu « zéro zone de flou » représentent un travail long, réparti sur
  plusieurs sessions ; chaque pull request reste relisible.
- **Évolution rapide** : Claude Code, les tarifs et les services changent souvent ; chaque notion
  susceptible d'évoluer porte sa source et sa date de vérification.
- **Safari sur iPhone** : non cité explicitement par la documentation de Claude Code dans le navigateur ;
  chaque manipulation du parcours est vérifiée dans cette configuration.
- **Coût de l'API** : plafond de dépense recommandé dès le départ ; consommation affichée dans l'appli.
- **Droits d'auteur** : aucun contenu de cours tiers copié ou traduit intégralement ; reformulation et
  citation des sources.

## 9. Sources (consultées le 14/11/2026)

Ces informations évoluent vite : chaque leçon indiquera la date de sa source.

- Documentation Claude Code en français : https://code.claude.com/docs/fr/overview
  (index des pages : https://code.claude.com/docs/_llms/fr.txt)
- Bonnes pratiques Claude Code : https://code.claude.com/docs/fr/best-practices
- Claude Code dans le cloud : https://code.claude.com/docs/en/claude-code-on-the-web
- Anthropic Academy, Claude Code 101 : https://anthropic.skilljar.com/claude-code-101
- Anthropic Academy, Claude Code in Action : https://anthropic.skilljar.com/claude-code-in-action
- Flux GitHub (documentation GitHub en français) : https://docs.github.com/fr/get-started/using-github/github-flow
- OWASP Top 10:2025 : https://owasp.org/Top10/2025/
- CNIL, développer en conformité avec le RGPD : https://www.cnil.fr/fr/developper-en-conformite-avec-le-rgpd
- Tarifs de l'API Claude : https://platform.claude.com/docs/en/about-claude/pricing
- Crédits API des plans Max, Ultra et Team : https://support.claude.com/en/articles/17154008-monthly-api-credits-for-max-ultra-and-team-plans
- Plafonds de dépense et limites : https://platform.claude.com/docs/en/api/rate-limits
- Espaces de travail de la Console : https://support.claude.com/en/articles/9796807-create-and-manage-workspaces-in-the-claude-console
- Stockage des applis de l'écran d'accueil sur iOS (WebKit, bug 181849) : https://bugs.webkit.org/show_bug.cgi?id=181849

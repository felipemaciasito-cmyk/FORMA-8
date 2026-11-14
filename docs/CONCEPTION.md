# FORMA-8 · Réveille l'équipe : document de conception

> **Statut : brouillon en cours de rédaction, non validé.** Aucune construction (aucune ligne de code)
> avant la validation de ce document par le propriétaire du projet.
> Dernière mise à jour : 14/11/2026.

Ce document rassemble les décisions prises pendant la phase de conception. Il sera complété section par
section (game design, plan technique), puis soumis à validation.

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
| Autonomie | FORMA-8 enseigne elle-même toutes les notions qu'elle utilise, y compris celles de FORMA-7 (fiches réutilisées et adaptées). |
| Lien avec FORMA-7 | Clin d'œil seulement : si une progression FORMA-7 est trouvée, reprise du prénom et affichage des badges FORMA-7 en souvenir, sans effet sur l'apprentissage. Lecture seule, jamais d'écriture. |
| Univers | **L'Équipage** : le datacenter rallumé réveille des automates ; chacun incarne un vrai outil de Claude Code ; le joueur passe d'apprenti à chef d'orchestre d'agents. |
| Nom | « FORMA-8 · Réveille l'équipe » (orthographe à confirmer : « équipe » ou « équipage »). |
| Projets | Un **produit fil rouge**, du niveau 0 au niveau 10, choisi dans l'appli grâce à un atelier guidé au niveau 0. |
| Premiers vrais utilisateurs | Au **niveau 6** : produit fonctionnel, testé, publié, sans comptes ni données personnelles. |
| Missions du jour | **Aucune** : pas de lecture de mails. FORMA-7-data ne sert qu'à la synchronisation. |
| Langue | Tout en français. |
| Identité visuelle | Strictement identique à FORMA-7 (voir le brief) ; tout écart validé explicitement avant d'être fait. |
| Stockage | Clés propres à FORMA-8 (préfixe différent de `forma7:`) ; synchronisation dans `progress/forma-8.json` de FORMA-7-data ; `progress/progress.json` n'est jamais modifié. |

## 4. Parcours (proposition à détailler)

Un membre d'équipage se réveille à chaque niveau ; le produit passe à la version suivante (v0.0 à v1.0).

| Niveau | Membre d'équipage | Ce qu'on apprend | Livrable publié |
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

À rédiger : mécaniques reprises de FORMA-7 et nouvelles mécaniques propres au code.

## 6. Plan technique

À rédiger. Points déjà identifiés à vérifier :

- Sur iOS, une appli web ajoutée à l'écran d'accueil a peut-être un stockage isolé de Safari et des autres
  applis : la lecture locale de la progression FORMA-7 pourrait être impossible ; repli possible sur
  `progress/progress.json` (lecture seule), qui suppose un jeton créé.
- Hébergement et services des niveaux 7 et suivants (base de données, comptes, IA intégrée) : choix à
  faire en tenant compte de l'usage exclusif de Safari et de l'accès réseau des environnements cloud de
  Claude Code.
- Contrôle de conformité visuelle `scripts/check-design-parity.mjs` (exigence du brief).

## 7. Sources (consultées le 14/11/2026)

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

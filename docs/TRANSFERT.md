# FORMA-8 · Réveille l'équipe : document de transfert (état au 17/11/2026 : lot « compagnon et règles de parole » validé par le propriétaire sur maquette jouable, PR ouverte depuis la branche claude/ecstatic-keller-i9o3gk)

> À lire en entier au démarrage de chaque nouvelle session (renvoi dans `CLAUDE.md`), **en commençant par la
> section 0**. Ce document complète `CLAUDE.md`, `docs/CONCEPTION.md` et `docs/PROGRAMME.md`. En cas d'écart, le
> code du dépôt fait foi : signaler l'écart au propriétaire. Mettre ce document à jour à la fin de chaque lot, dans
> la même PR.

---

## 0. Démarrage d'une nouvelle session : à faire tout de suite

Le propriétaire ouvre une nouvelle conversation Claude Code et envoie le prompt court de la section 0.3, qui renvoie
ici. Ce document doit donc suffire seul : tout ce qu'il faut savoir est dans les sections 1 à 5, tout ce qu'il faut
faire est ci-dessous.

### 0.1 Dans l'ordre (mis à jour le 17/11/2026 : un lot est EN COURS, pas encore fusionné)
**Le lot du compagnon et des règles de parole (section 3.19) n'est pas fusionné dans `main`.** Tout le travail est sur la
branche `claude/ecstatic-keller-i9o3gk` (partie de `claude/beautiful-cori-sz6dxq`, qu'elle contient en entier), poussée
sur GitHub. Ce document-ci est la version de cette branche. Partir de `origin/claude/ecstatic-keller-i9o3gk`.
1. Lire en entier, dans cet ordre : `CLAUDE.md`, ce document (sections 0 à 5, **surtout 3.19**), `docs/CONCEPTION.md`,
   `docs/PROGRAMME.md`. Ne rien écrire avant.
2. Préparer le poste : `git fetch origin` ; créer la branche imposée par la session **à partir de
   `origin/claude/beautiful-cori-sz6dxq`** (pas de `main`) ; vérifier que `main` n'a pas bougé depuis `d8f624e` (sinon
   fusionner `main` dans la branche et le dire au propriétaire) ; cloner FORMA-7 à côté (`../forma-7`, en entier) ;
   `npm ci` ; commande complète de vérification. Résumer au propriétaire, en quelques lignes, l'état et le résultat.
   Ne pas supprimer `claude/beautiful-cori-sz6dxq` : c'est le propriétaire qui la supprimera après la fusion.
3. Lui poser **la question en attente** (QCM), restée sans réponse à la fin de la session du 17/11/2026 :
   « Comment veux-tu que je mène la construction de ce lot ? »
   - **Textes d'abord (recommandé)** : écrire toutes les nouvelles répliques (Forma Trisse endormie au début, endormis
     absurdes, répliques raccourcies, interactions) et les lui montrer sur une page à lire avant tout enregistrement ;
     il corrige, puis enregistrement (environ 130 répliques, environ 9 000 crédits, estimation) et construction ;
   - **Tout d'un coup** : écrire, enregistrer, construire, puis maquette jouable complète ;
   - **Caisson 00 d'abord** : tout pour Forma Trisse et le caisson 00, maquette, puis le caisson 01.
   Vérifier les crédits avec `account_get_usage` avant tout enregistrement (environ 20 500 restants au 17/11/2026).
   **Réponse du 17/11/2026 (2e session) : « Textes d'abord ».** Brouillon dans `outils/textes-lot/` (207 répliques,
   environ 11 400 caractères), page de lecture https://claude.ai/artifact/Ujhw3XDdoT2oN83ttjKfky ; en attente de ses
   corrections avant tout enregistrement. Banc du compagnon rendu stable (clic normal sur la bonne réponse).
   **Textes validés par le propriétaire (« Valide, enregistre ») et les 207 répliques enregistrées le 17/11/2026**
   (14 630 crédits, il en reste environ 6 000 jusqu'au 16/12/2026). Prises dans `public/voix`, inscrites dans
   `voix-enregistrements.json` ; suivi dans `outils/textes-lot/prises.json` (toutes présentes). Indications de ton :
   `[sleepy] [mumbling] [slowly]` pour « sommeil », `[sleepy]` pour « demi », rien pour « éveil » (comptées dans les
   crédits). Senty Nell : présentation « Senty Nell, la sentinelle » ; le surnom « Agent Nell » reviendra en jeu de mots
   au caisson 08 (choix du propriétaire). **Prochaine étape : construire le lot dans l'appli** (textes de
   `outils/textes-lot/brouillon.json` vers `src/content/`, règles de parole, Forma Trisse, interactions), retirer les
   anciennes prises inutilisées, maquette jouable, puis PR.
   **Construit le 17/11/2026 (3e session)**, commande complète verte (15 tests de bout en bout en Chromium ; WebKit voir
   3.19). Maquette jouable : https://claude.ai/artifact/EKesPUvJczHo36aYU5cbJx (cinq départs). **Accord du propriétaire
   le 17/11/2026 (« Valide, fais la PR »)** ; commande complète verte, PR ouverte vers `main`. Prochaine session :
   vérifier si la PR est fusionnée ; si oui, passer à l'étape 6 (caisson 02) depuis `origin/main`.
4. Construire le lot 3.19 selon sa réponse ; **maquette jouable** (vraie appli dans un cadre, méthode 3.3) et son accord
   avant la PR. Penser à renommer ORA en Forma Trisse partout, et les membres (noms en 3.19).
5. Fin de lot : commande complète verte, ce document mis à jour (section 0 comprise), **une seule PR** de la branche de
   la session vers `main` (elle contient tous les commits du lot), attendre le robot vert, annoncer, ne plus rien
   pousser.
6. Ensuite seulement : le caisson 02 (section 5.2), avec les nouvelles règles de parole et le nom « Général Calpin ».
   Ce qu'il attend : « Sois extrêmement ambitieux et rigoureux » ; un apprentissage très ludique, guidé pas à pas,
   cohérent et très esthétique ; chaque outil doit fonctionner parfaitement sur iPhone.

### 0.2 Ses règles non négociables (détail en section 2)
- Français, tutoiement, explications simples. Les questions se posent en **QCM**.
- Honnêteté avant tout : signaler toute incertitude. Ne jamais inventer une source, une URL, un chiffre ou une
  citation. Chaque source est ouverte, vérifiée et datée. Si une URL est introuvable, le dire.
- Aucun contenu repris de FORMA-7 : seule l'étude de cas de son historique est permise (section 4.1).
- Même palette et mêmes polices que FORMA-7. Tout nouveau changement visuel important se montre d'abord (maquette ou
  captures) et attend son accord.
- Aucune action destructive ou difficile à annuler sans son accord : supprimer une branche, fusionner, envoyer sur
  `main`, réécrire un historique déjà envoyé, contourner une règle de sécurité.
- Toutes les vérifications doivent passer avant la pull request.
- Une seule PR par lot, vers `main`, qui met aussi à jour ce document. L'annoncer clairement quand le robot de
  vérification de GitHub est vert : c'est lui qui fusionne, et seulement après l'annonce. Ne plus rien pousser après.

### 0.3 Le prompt de reprise (à lui redonner tel quel à chaque changement de conversation)

Paramètres à lui rappeler : dépôt `felipemaciasito-cmyk/FORMA-8` ; environnement « Par défaut »
(accès réseau illimité, nécessaire pour les sources officielles et FORMA-7) ; mode Auto ; une nouvelle conversation.
Lui dire de fusionner la dernière PR **avant** d'envoyer le prompt, s'il y en a une. **Si un lot est en cours sur une
branche non fusionnée** (cas du 17/11/2026), le prompt nomme cette branche à la place de `main`.

```text
Tu reprends le projet FORMA-8 · « Réveille l'équipe ». Je ne suis pas développeur et je travaille uniquement depuis Safari sur iPhone.

Lis en entier le fichier docs/TRANSFERT.md de la branche claude/beautiful-cori-sz6dxq (un lot est en cours, pas encore fusionné dans main), puis suis à la lettre sa section 0 « Démarrage d'une nouvelle session ». Ce fichier contient tout : l'état exact du projet, mes règles non négociables, les décisions prises et la prochaine action.
```

---

## 1. Objectif et contexte

### 1.1 Le propriétaire
- Il n'est pas développeur et travaille uniquement dans Safari sur iPhone et iPad : ni ordinateur, ni appli Claude
  installée. Il pilote Claude Code depuis claude.ai/code et fusionne les PR sur github.com.
- Lui répondre en **français**, en le **tutoyant**, simplement. Les questions se posent en **QCM** (outil de questions),
  et chaque question doit se comprendre seule. Il ne lit pas l'anglais : traduire chaque libellé anglais de GitHub.
- Ses objectifs : **en faire un métier** et **lancer un produit**. Il a 15 à 30 minutes par jour.
- Abonnement Claude **Pro**, donc sans crédits API inclus.
- Diagnostic du 14/11/2026, profil « pilote débutant » : il survolait les diffs sans les lire ; Git : 1 ou 2 notions
  sur 4 ; jamais mis un site en ligne seul ; jamais créé de jeton GitHub ; jamais utilisé d'outil de débogage.
- Préférences permanentes d'honnêteté : signaler toute incertitude (« je ne suis pas certain », « à vérifier ») ;
  ne jamais inventer une source, une URL, un chiffre ou une citation ; signaler ce qui a pu évoluer depuis la
  dernière vérification ; citer des sources réelles, ouvertes, avec leur date de vérification.
- Ce qu'il attend, dans ses mots :
  - « Sois ambitieux ! » ; « Sois extrêmement ambitieux et rigoureux » ;
  - « Je veux adorer utiliser cette appli et avoir le sentiment de vivre une vraie aventure/expérience prenante avec
    une vraie impression de progression » ;
  - « Fais-en un outil pédagogique stimulant, ludique et interactif » ; « Rends le tout cohérent et très esthétique ».
- Comment il aime décider : il veut **voir avant de choisir**. Pour un changement visuel, il a demandé des
  « maquettes d'abord », puis « un nouvel aperçu » des propositions : lui montrer une page jouable ou des captures,
  puis lui poser un QCM.

### 1.2 FORMA-7, le projet précédent (référence et étude de cas)
- PWA ludique pour apprendre l'IA : un « datacenter » à rallumer (7 salles plus 1 bonus), avec un guide, ORA, et
  53 notions.
- Dépôt public `felipemaciasito-cmyk/forma-7` (attacher en lecture seule, cloner à côté de FORMA-8 sous le nom
  `forma-7`). Sa base Vite est `/FORMA-7/` ; l'adresse probable est https://felipemaciasito-cmyk.github.io/FORMA-7/
  (à confirmer).
- Construit en 20 h environ, en 6 commits envoyés directement sur `main`, sans tests ni CLAUDE.md. Étude de cas
  seulement : on n'en reprend jamais le contenu pédagogique.
- Dépôt privé `felipemaciasito-cmyk/forma-7-data` : `PIPELINE.md`, `README.md`, `config.json`, `index.json`,
  `missions/j1-2026-11-13.json`, `processed.json`. **Pas de dossier `progress/`** : le jeton de synchronisation de
  FORMA-7 n'a jamais été créé.

### 1.3 FORMA-8 · « Réveille l'équipe »
- PWA pour apprendre le vibe coding (créer des applications avec l'IA, avec Claude Code), de débutant à expert.
- Exigences pédagogiques : très ludique, très guidée, animée, interface soignée, zéro zone de flou, outils interactifs.
- Univers : le datacenter de FORMA-7 est rallumé ; dans sa réserve dorment **11 membres de l'équipe**, un par caisson,
  chacun incarnant un vrai savoir-faire de Claude Code ; le joueur passe d'apprenti à chef d'orchestre d'agents.
- **Un caisson = un membre = un niveau = une version du produit fil rouge** (v0.0 à v1.0). Chaque niveau se termine
  par une **vraie livraison en ligne**, vérifiée automatiquement sur GitHub.
- Produit fil rouge : choisi dans l'appli (atelier guidé du caisson 00). Exemple utilisé dans le contenu et les tests :
  « Carnet de chantier ».
- Dépôt : `felipemaciasito-cmyk/FORMA-8` (public).
- En ligne : **https://felipemaciasito-cmyk.github.io/FORMA-8/**. Caissons 00 et 01 jouables, avec la refonte de
  l'interface (15/11/2026) ; le lot « son et lumière » (voir 3.15) y arrive à la fusion de sa PR. Caissons 02 à 10
  « en préparation ».
- Volume prévu : environ 60 protocoles et 140 notions, soit environ 6 à 10 mois à 15-30 min par jour (estimation).

---

## 2. Règles et contraintes strictes

### 2.1 Règles du propriétaire (toujours en vigueur)
- « Ne fais jamais d'action destructive ou difficile à annuler sans mon accord explicite : supprimer une branche,
  fusionner des branches, contourner une règle de sécurité. » **Jamais d'envoi direct sur `main`.** C'est lui qui
  fusionne.
- Une seule PR par lot, vers `main`, qui met aussi à jour ce document. **L'annoncer clairement ; il ne fusionne
  qu'après l'annonce.** Ne plus rien pousser après l'annonce (le 14/11, il a fusionné la PR #8 pendant que la CI
  vérifiait un dernier petit commit).
- Commits en français, qui expliquent le pourquoi, avec les lignes d'attribution fournies par le système de la session.
- **Ne jamais modifier `progress/progress.json`** de FORMA-7-data : il appartient à FORMA-7.
- Jeton GitHub et clé API : sur les appareils du joueur uniquement. Jamais dans le code, les commits ou les journaux.
- **Changements visuels** : la palette et les polices de FORMA-7 ne changent pas ; tout nouveau changement visuel
  important se montre d'abord (maquette jouable ou captures) et attend son accord.
- Pas de logos de marques.
- **Aucun contenu de FORMA-7** : « Je ne veux reprendre aucun contenu de FORMA-7, tout doit reposer sur de nouvelles
  sources (anthropic et autres) ». Exception validée : l'étude de cas de l'historique de FORMA-7 (voir 4.1).
- Toute procédure destinée au joueur doit être faisable **dans Safari sur iPhone** (github.com et claude.ai/code).

### 2.2 Règles du dépôt (`CLAUDE.md`, résumé)
1. **Zéro emoji** dans l'appli et le contenu ; uniquement les icônes maison (`src/components/glyphs.ts`, identifiants
   dans `src/content/icon-ids.json`). Contrôle : `npm run check:emoji` et le validateur.
2. **Zéro zone de flou** : toute notion a une fiche à 3 niveaux, une analogie, un exemple et des prérequis, et elle est
   définie avant d'être utilisée. Termes écrits `[[id]]` ou `[[id|texte]]`. Contrôle : `npm run validate`.
3. **Identité visuelle : même palette, mêmes polices que FORMA-7** (option B, 15/11/2026). Les 30 variables `:root` de
   `src/styles/app.css` restent identiques à FORMA-7 ; écrans, composants et animations peuvent évoluer. Glyphes et
   identifiants d'icônes : ajout seulement, même style (grille de 24, trait de 1,8, coins arrondis).
   Contrôle : `npm run check:parity`.
4. **Stockage** : clés `forma8:` uniquement. Jamais d'écriture sous `forma7:` (lecture seule, `src/lib/forma7.ts`).
5. **Synchronisation** dans `progress/forma-8.json` de FORMA-7-data. Ne jamais toucher `progress/progress.json`.
6. **Secrets** : uniquement sur l'appareil du joueur.
7. **Vocabulaire** : « équipe », jamais « équipage ». Dans le code : caisson = `Room`, protocole de réveil (leçon) =
   `Step`, panne = `Incident`.
8. **Sources** : documentation officielle, en français quand elle existe (`https://code.claude.com/docs/fr/`), citée
   avec sa date de vérification. Aucun cours tiers copié ou traduit mot pour mot.
9. **Aucun contenu de FORMA-7** : fiches, leçons, exercices, simulateurs et modèles écrits à neuf. Seules la palette,
   les polices et la mécanique de jeu viennent de FORMA-7. Illustrations : uniquement `src/components/Illustrations.tsx`
   et les personnages de `src/components/Crew.tsx`. Les répliques de l'équipe (`src/content/equipe.json`) passent par
   le validateur. Chaque caisson passe son banc d'essai de bout en bout (modèle : `tests/e2e/caisson01.spec.ts`).

### 2.3 Méthode de travail établie
- Une **branche par lot**, créée depuis `origin/main`, et une **PR par lot, qui cible directement `main`**. Jamais de
  PR empilées (erreur des PR #2 et #3). Pousser uniquement sur la branche imposée par l'environnement de la session.
  Si cette branche a déjà été fusionnée, la recréer depuis `origin/main` (l'envoi reste alors une simple avance).
- **Ne jamais réécrire un historique déjà poussé** (`--force`) : le 15/11/2026, un envoi forcé a été refusé par la
  sécurité de la session. Ajouter des commits par-dessus.
- **La session ne peut pas supprimer une branche distante** : le 15/11/2026, `git push origin --delete` a reçu un
  refus 403, à ne pas contourner. C'est le propriétaire qui la supprime, avec le bouton « Delete branch » (« Supprimer
  la branche ») en bas de la PR fusionnée, ou depuis la page des branches du dépôt (icône poubelle).
- Avant toute PR, cette commande doit passer entièrement :

```bash
npm run validate && npm run check:emoji && npm run check:parity && npm run typecheck && npm test && npm run build && npx playwright test --trace off
```

  `check:parity` a besoin de FORMA-7 cloné à côté (`../forma-7` ou `../FORMA-7`), ou de l'option `--forma7 <dossier>`.
- Après l'ouverture d'une PR : s'abonner à son activité (`subscribe_pr_activity`), attendre le robot « verifier »
  (environ 2 min 30), annoncer « prête, tu peux fusionner » seulement quand il est vert, puis vérifier la mise en
  ligne (workflow « Déployer FORMA-8 sur GitHub Pages », moins d'une minute).
- Outils GitHub de la session : les outils `mcp__github__*` (créer la PR, lire ses vérifications, lister les
  workflows). Pas de `gh` sauf pour la recherche.
- Aucun identifiant de modèle dans les commits, les PR ou le code, sauf dans les lignes d'attribution du système.
- Dans le conteneur cloud, Chromium et Playwright sont préinstallés : ne pas lancer `playwright install` (la CI
  GitHub l'installe elle-même).
- Pour tout changement visuel : regarder chaque écran en capture (Playwright, `devices['iPhone 13']`) avant la
  commande complète, et montrer une maquette au propriétaire avant de construire (voir 3.3).
- **Tester aussi dans WebKit (le moteur de Safari)** dès qu'on touche au son, aux animations ou aux toiles : Chromium ne
  voit pas les plantages de Safari. Méthode du 15/11/2026 (rien n'est dans le dépôt) : télécharger WebKit hors du
  dossier partagé (`PLAYWRIGHT_BROWSERS_PATH=<scratchpad>/pw node node_modules/playwright/cli.js install webkit`, puis
  `node node_modules/playwright/cli.js install-deps webkit`, et des liens vers `/opt/pw-browsers/chromium*` dans ce
  dossier) ; une copie locale de `playwright.config.ts` avec `browserName: "webkit"` (ne pas la committer : nom en
  `zz-*`, exclu par `.git/info/exclude`) ; `E2E_TIMEOUT=900000` pour le banc du caisson 01, très lent dans WebKit.
  Dans WebKit, le contrôle « 6 commits trouvés » de la livraison échoue (GitHub simulé par `page.route`) : limite du
  banc, constatée aussi sur `main`, pas de l'appli.
- Pour faire jouer une version avant la PR : une page privée (outil Artifact) qui charge l'appli construite en
  chemins relatifs dans un cadre, avec plusieurs départs (voir 3.3, méthode des maquettes) ; la recharger après chaque
  correction.
- **Le propriétaire fusionne parfois la PR dès sa création** (PR #13 : fusionnée 15 s après, avant la fin du robot et
  sans ce document à jour). Donc : mettre ce document à jour **avant** d'annoncer la fin d'un lot, et lui dire de ne
  fusionner qu'après l'annonce « robot vert ».
- Avant de lancer la commande complète, retirer de `tests/e2e/` tout fichier `zz-*` de capture (sinon un dossier
  `undefined/` de captures apparaît à la racine).
- Outils de design disponibles : 21st.dev (catalogue de composants, pour l'inspiration seulement : son code est payant
  et prévu pour Tailwind/shadcn). Higgsfield et Adobe (génération d'images) n'ont **pas** été utilisés : règle 9
  (illustrations maison uniquement), poids sur iPhone, et ils consomment les crédits du propriétaire. Lui demander
  avant tout usage.

---

## 3. État actuel et éléments validés

### 3.1 Git, PR et mise en ligne
- `origin/main` = **`7415ce3`** (« Merge pull request #16 », les voix de l'équipe), vérifié le 16/11/2026, puis la
  petite PR de mise à jour de ce document (voir ci-dessous). Avant : `bbbab68` (PR #15), `43928ea` (PR #14), `5f3f318` (PR #13, la centrale et l'arc), `1769e85` (PR #12, son et lumière), `ef21f29` (PR #11),
  `f2af5ff` (PR #10), `b96f074` (PR #9, refonte de l'interface), `ccb28cf` (PR #8, caisson 01), `79c1061` (PR #7).
- PR, toutes fusionnées par le propriétaire :
  - #1 socle ; #2 et #3 lots 2 et 3 (fusionnés par erreur dans des branches intermédiaires) ; #4 lots 2 et 3 vers
    `main` (fermée automatiquement) ; #5 outils d'apprentissage ; #6 contenu du caisson 00 ; #7 document de transfert ;
  - #8 caisson 01 (14/11/2026) ;
  - #9 refonte de l'interface, option B (15/11/2026, 5 commits : 3 de prototype, puis la nouvelle règle visuelle et
    la fin de la refonte).
  - #10 document de transfert complet (15/11/2026) ;
  - #11 section 0 « Démarrage » de ce document (15/11/2026) ;
  - #12 son et lumière (15/11/2026, voir 3.15) ;
  - #13 la centrale et l'arc (15/11/2026, branche `claude/hopeful-bohr-241xx8`, voir 3.16) : créée depuis l'interface
    de Claude Code par le propriétaire et fusionnée tout de suite, avant la fin du robot de vérification ;
  - #14 mise à jour de ce document après « la centrale et l'arc » (15/11/2026, même branche repartie de `main`) ;
  - #15 correctif « remise en ordre au doigt » (15/11/2026, branche `claude/stoic-rubin-2cd33c`, voir 3.17) ;
  - #16 « Les voix de l'équipe » (16/11/2026, même branche repartie de `main`, voir 3.18) : ouverte par le
    propriétaire depuis Claude Code, titre et description remplis ensuite ; **fusionnée avant la fin du robot**
    (robot vert ensuite, et déjà vert sur le commit précédent) ;
  - la PR suivante (même branche, repartie de `main`) : mise à jour de ce document pour le changement de conversation.
- Branches distantes au 16/11/2026, 04:45 UTC : `main` seulement (le propriétaire a supprimé les branches fusionnées) ;
  plus `claude/stoic-rubin-2cd33c` tant que la PR de mise à jour de ce document est ouverte.
- Workflows :
  - `.github/workflows/ci.yml` (« Vérifications FORMA-8 », job `verifier`, sur chaque PR, Node 22) : récupère FORMA-7
    dans `forma-7`, puis lance toutes les vérifications et les tests de bout en bout ;
  - `.github/workflows/deploy.yml` (sur envoi vers `main`) : construit l'appli et la publie sur GitHub Pages.
- GitHub Pages : Source « GitHub Actions ». Dernière mise en ligne de l'appli : n° 13, réussie (16/11/2026, 04:25 UTC,
  après la fusion de la #16) : **les voix de l'équipe sont en ligne**. La n° 12 (00:05 UTC) a mis en ligne le correctif
  « remise en ordre au doigt ».

### 3.2 Pile technique
- Vite 8, React 19, TypeScript 6, motion 14 (`motion/react`), idb-keyval 6, vite-plugin-pwa 2.
- Polices : @fontsource Space Grotesk et JetBrains Mono (importées dans `src/main.tsx`).
- `@anthropic-ai/sdk` ^1.8, chargé à la demande, avec `dangerouslyAllowBrowser`.
- `@playwright/test` 1.63.0. Node 22 dans la CI ; les tests unitaires importent des `.ts` directement
  (`tsconfig.json` : `allowImportingTsExtensions: true`).
- Base `/FORMA-8/`. Routage par le fragment d'adresse : `#/caisson/c01`, `#/caisson/c01/p2`, `#/panne/c01`,
  `#/equipe`, `#/base`, `#/maintenance`, `#/atelier`, `#/reglages`, `#/icones`.
- Scripts npm : `dev`, `validate`, `check:emoji`, `check:parity`, `typecheck`, `test` (`node --test
  tests/unit/*.test.mjs`), `test:e2e`, `build` (validate, emoji, puis vite build), `preview`.

### 3.3 Identité visuelle et maquettes
- Règle depuis le 15/11/2026 (option B) : voir 2.2, règle 3. `scripts/design-parity.json` n'a plus de fichier
  « exact » ni de substitution. `scripts/check-design-parity.mjs` vérifie :
  - les 30 variables `:root` de `src/styles/app.css` : identiques à FORMA-7 (palette, rayons, polices) ;
  - `glyphs.ts` et `icon-ids.json` : ajout seulement (10 glyphes ajoutés par FORMA-8 : rocket, search, branch, bug,
    server, globe, coins, code, team, capsule) ;
  - les réglages obligatoires : couleur de thème `#04060c`, barre d'état `black-translucent`, polices dans
    `src/main.tsx`.
- Couleurs utilisées (variables de FORMA-7) : fond `#04060c`, cyan `--cyan` `#3be8ff`, vert `--led` `#4dffa0`,
  violet `--violet` `#a78bfa`, ambre `--amber` `#ffb547`, rouge `--red` `#ff4d6d`. Chaque caisson a une teinte
  (`hue`, voir 3.11), utilisée en `hsl(<hue> 100% 64%)` pour son membre et ses écrans.
- `Art.tsx` (illustrations de FORMA-7) est retiré ; un garde-fou empêche son retour.
- Éléments repris de FORMA-7 et adaptés pour FORMA-8 (validés le 14/11/2026) : lignes du BIOS de `Boot.tsx`
  (« FORMA-8 · BIOS v8.0.26 », « Caissons détectés ........... 11 », etc.), accueil d'ORA, préfixe
  `forma8:brouillon:` dans `Exercises.tsx`, noms et descriptions dans `index.html` et `vite.config.ts`, icône avec le
  chiffre 8, tuiles « caissons » sur la dalle isométrique.
- **Maquettes** (pages privées du propriétaire, sur claude.ai) :
  - https://claude.ai/artifact/XfDNr2NXi6gKk3aVtrMNww : onglets « Actuelle » (avant la refonte, `ccb28cf`) et
    « Nouvelle » (la refonte), avec une progression de démonstration et un guide ;
  - https://claude.ai/artifact/MnHHKo1GFejYPRgL63UZwF : les quatre propositions de kW gagnés (voir 4.2) ;
  - https://claude.ai/artifact/HRYs5aXgi56Yq66DmVaWzo : « Labo son et lumière » (5 versions : sons, clavier, batterie
    et capsule, propositions de grade et de réveil) ;
  - https://claude.ai/artifact/VjoKcxVJsFEmEVua1SC3Wg : « FORMA-8 son et lumière », la vraie appli du lot dans un
    cadre, avec deux départs (« Premier lancement », « Caisson 01, dernier protocole ») ;
  - https://claude.ai/artifact/HLiTu4fVoJsfZMXsCZtgm4 : « La centrale, l'arc et le son », onglets « Actuelle »
    (`1769e85`) et « Nouvelle » (la PR #13), quatre départs (« Caisson 01 · protocole 04 », « Dernier protocole »,
    « Après la panne », « Premier lancement ») ;
  - https://claude.ai/artifact/1mCpnKWgBcQifpDL91DYpv : « Labo du branchement », cinq pistes jouables (câble de la
    jauge, cartouche, sectionneur, arc à maintenir, défibrillateur) ;
  - https://claude.ai/artifact/236ZRw3zxTueGb4z8HbZVq : « Labo de la centrale », trois présentations (tour, réacteur,
    cornes) avec **les vrais sons et éclairs de l'appli** : `src/lib/sound.ts` et `src/components/Bolts.tsx` empaquetés
    en un script (`vite build` en mode bibliothèque, format `iife`, `define: { "process.env.NODE_ENV": "\"production\"" }`,
    configuration placée à la racine du dépôt sous un nom `zz-*`, puis supprimée).
  - Méthode pour en refaire (les scripts de cette session ne sont pas dans le dépôt) :
    1. construire chaque version : `npx vite build --base ./ --outDir <dossier>` (une copie de travail par version,
       par exemple `git worktree add`, avec `node_modules` en lien symbolique) ;
    2. dans chaque dossier : supprimer `sw.js`, `workbox-*.js`, `registerSW.js`, `manifest.webmanifest` et leurs
       balises dans `index.html` (un service worker est refusé dans une page privée) ; ne garder que les polices
       `.woff2` latin et latin-ext ;
    3. remplacer dans `assets/claude-*.js` le caractère U+FFFD littéral (dans un gabarit `` `…` ``) par son échappement
       `�` : sinon la publication est refusée ;
    4. la page hôte (`index.html` de la maquette), à chaque départ : vide l'`iframe`, supprime la base IndexedDB
       `keyval-store` et les clés `forma8:` (même origine que les versions), dépose la progression de démonstration du
       départ dans `localStorage["forma8:progress-secours"]`, puis charge `<version>/index.html#<route>` ;
    5. publier avec l'outil Artifact en passant chaque fichier dans `files` (avec `root`) ; pour une mise à jour,
       n'envoyer que les fichiers changés et mettre `null` pour ceux qui ont disparu (les noms changent à chaque
       construction).

### 3.4 Données, stockage et synchronisation
- Stockage local : IndexedDB `keyval-store` / `keyval`, partagé avec FORMA-7 (même origine
  `felipemaciasito-cmyk.github.io`) ; clés `forma8:progress`, `forma8:settings`, `forma8:sync`, `forma8:heritage`,
  `forma8:brouillon:*` ; plus une copie de secours synchrone `forma8:progress-secours` dans localStorage.
- `src/lib/store.ts` : la progression contient notamment `steps`, `lessons` (position dans un protocole), `exercises`,
  `incidents`, `notions` (boîte Leitner), `badges`, `product{name,pitch,owner,repo,at}`, `deliveryChecks`,
  `deliveries`, `consignes`, `reports`, et des compteurs par appareil (`counters`) ; enregistrement différé de 250 ms ;
  `flush()` à la fermeture écrit la copie de secours ; `initStore` la fusionne puis la supprime.
- `src/lib/merge.ts`, fusion sans perte : une vérification réelle l'emporte sur une case cochée ; livraisons : date la
  plus ancienne ; consignes et rapports : meilleure note ; produit : version la plus récente (`at`).
- `src/lib/sync.ts` : fichier `progress/forma-8.json` de FORMA-7-data, via l'API GitHub, jeton « fine-grained ».
- `src/lib/forma7.ts` : lit `forma7:progress` en local, sinon `progress/progress.json` (lecture seule) ; affiche grades
  et badges de FORMA-7 en souvenir.
- Sur iOS, une appli ajoutée à l'écran d'accueil a un stockage séparé de celui de Safari (WebKit).

### 3.5 GitHub et livraisons
- `src/lib/gh-core.ts` (`repoUrl`, `apiHeaders`, `ghError`), `src/lib/github.ts` (`ghHeaders`, `testGithub`).
- `src/lib/checks.ts`, `evaluateCheck(check, product, deps)` : `file` (`contents/<path>`), `commits`
  (`commits?per_page=100`), `pullsMerged` (`pulls?state=closed&per_page=100`), `workflow`, `pages`
  (`https://{owner en minuscules}.github.io/{repo}/`, même origine que FORMA-8, donc pas de CORS), `manual`.
- `src/lib/delivery.ts` : `verifyDelivery`, `toggleManual`, `deliveryState`, `checkKey`. Une livraison complète
  rapporte `REWARD.delivery`. Un dépôt public se vérifie sans jeton.

### 3.6 Claude dans l'appli (indispensable)
- Clé API saisie dans Réglages, gardée sur l'appareil.
- Modèles (`src/lib/models.ts`) : `claude-opus-5-5` (par défaut), `claude-sonnet-5-5`, `claude-haiku-5-5`.
- `src/lib/claude.ts` : `ask()` avec sorties structurées et repli ; `testKey`, `gradeFeynman`, `reexplain`,
  `gradeConsigne` (5 critères et une version améliorée), `gradeBugReport`, `suggestIdeas`,
  `askOra(question, lesson, known)`.

### 3.7 Mécanique de jeu (`src/lib/game.ts`, `src/lib/progress.ts`)
- Énergie en kW. Grades : Recrue 0, Apprenti 150, Opérateur 400, Pilote 800, Chef d'atelier 1300, Chef d'équipe 1900,
  Commandant 2600, Chef d'orchestre 3400.
- `REWARD` : step 40, exerciseFirst 10, exerciseRetry 4, incident 120, mission 60, review 5, skill 80, feynman 20,
  delivery 150, consigne 15, report 25.
- `addEnergy(amount, label?, { quiet? })` : émet `gain` ; une montée de grade émet `levelup`, **sans son** (la
  cérémonie joue elle-même « levelup » ; le son en double couvrait la cellule de batterie, remarque du propriétaire).
- Événements `fx()` : `toast`, `burst`, `badge` (repris de FORMA-7) ; `gain` (avec `quiet`), `levelup`, `awaken`
  (FORMA-8). `payout` (son et lumière) et `stepdone` (centrale) ont été retirés. Les confettis (`burst`) sont toujours
  blancs et bleus, quelle que soit la couleur demandée (choix du propriétaire).
- Maintenance : Leitner à 5 boîtes (1, 2, 4, 8, 16 jours). Uptime en jours. 3 fusibles par panne.
- Badges : boot, room1, half (6 caissons), all (11), nofuse, up3, up7, maint, base20, feyn, skill, livraison1, plume
  (consigne 85 ou plus), detective (rapport 80 ou plus). Le badge « signal » de FORMA-7 est retiré. Le badge « skill »
  n'est pas encore obtenable (il attend la Forge de Skills du caisson 02).
- `roomReady` (un caisson sans protocole est « en préparation »), `roomComplete` (protocoles et panne), `roomPower`,
  `totalPower` (moyenne sur 11), `stepMinutes(step)` (durée estimée : 0,85 min par bloc, 5 min au moins).

### 3.8 Écrans
- `MapView.tsx` : anneau d'énergie de l'équipe ; frise du produit (`ProductTimeline`, une version par membre, de v0.0 à
  v1.0) ; ORA ; **Quart du jour** (`QuartPanel`, `quartActions`) ; carte des 11 caissons sur dalle isométrique, visage
  du membre dans le hublot (endormi, réveillé, silhouette si verrouillé), étiquette « Prochain réveil », câbles.
- `RoomView.tsx` :
  - caisson : `CaissonHero` (le membre dans sa capsule, son métier, sa réplique, la jauge de réveil), chemin des
    protocoles (`QuestNode`, durée, +40 kW), panne, livraison (`DeliveryCard`), export de la fiche ;
  - protocole : `StepMeter` (le membre sourit à chaque réussite ; jauge par blocs), `StepBriefing` (au programme),
    blocs révélés un par un avec « Continuer », **barre d'énergie** (`EnergyBar`), bouton « Demander à ORA » ;
    cérémonie de fin plein écran **sous la barre du haut** : le membre, onde de choc, éclats, rayons, jauge de réveil
    avant/après, réplique `demi`, **total qui jaillit** (`EnergyPayout`) puis file vers le compteur, nouveau grade
    éventuel, notions gagnées, boutons (protocole suivant, panne, caisson) et « Relire le protocole » ;
  - panne : 3 alertes, 3 fusibles ; la réparation déclenche la scène de réveil si le caisson est terminé.
- `Views.tsx` : **Base** (notions rangées par membre, avancement par caisson, voyants de la boîte de révision,
  badges et grades, statistiques, portfolio exportable en Markdown, héritage FORMA-7) ; **Maintenance** ; **Atelier**
  des consignes ; **Équipe** (galerie des 11 membres ; fiche en feuille du bas : capsule, réplique, vrai fichier à
  vérifier dans le dépôt du produit, « Revoir son réveil », « Aller à son caisson » ; formulaire du produit).
- `Chrome.tsx` : barre du haut (grade, **jauge vers le prochain grade**, compteur d'énergie qui **défile** et
  **attend la fin du protocole**, puis s'illumine ; flamme qui bat ; notions à réviser ; **haut-parleur** qui déroule
  un petit menu : effets et fond sonore, chacun avec interrupteur et volume), onglets, toasts, éclats, feuille du bas,
  `TopBar`, `Toggle` et `SoundControls` (partagés avec Réglages). Glyphe ajouté : `speaker-off`. Réglage ajouté :
  `settings.sfxVolume` (0 à 1, appliqué par `syncSfxVolume`).
- L'écran de fin de protocole couvre **tout** l'écran (fond `finish-bg`, le même quadrillage que l'appli) ; la barre du
  haut passe au-dessus (classe `finish-open` sur `body`). Avant, une bande du protocole restait visible sous la barre
  (captures du propriétaire sur iPad).
- `Exercises.tsx` : six types d'exercices ; tampon « RÉUSSI », **série de bonnes réponses**.
- `SettingsView.tsx` : Claude, GitHub et dépôt de données, synchronisation, héritage FORMA-7, sauvegarde,
  installation, à propos. `Boot.tsx` : BIOS, accueil d'ORA, levier ; écran de reprise à chaque ouverture.

### 3.9 Personnages, récompenses et cérémonies (refonte du 15/11/2026 ; sons, kW et cérémonies revus en 3.15)
- `src/components/Crew.tsx` : 11 membres en SVG (repère 120 x 140), dans le style d'ORA (ORA garde son dessin
  `OraDrone`). Chacun porte l'outil de son métier : Archiviste (meuble à tiroirs, œil-objectif, bande de photos),
  Règlement de bord (casquette, registre), Scribe (plume, rouleau), Boucle (sphère et anneau qui tourne), Inspecteur
  (loupe, liste de contrôle), Messager (ailerons, sacoche, antenne qui émet), Mémoire (disques empilés), Sentinelle
  (visière fente, bouclier à cadenas), Escouades (un meneur, deux drones, un éclair), Lancement (fusée, hublot,
  flamme). États `locked` (silhouette), `asleep` (yeux fermés, respiration, lettres « z »), `awake` (yeux allumés,
  clignements) ; humeur `happy`. Exports : `CrewFigure` (option `crop="head"`), `CrewCapsule` (vitre givrée qui se
  lève au réveil), `MemberSays` (bulle), `crewState`.
- `src/content/equipe.json` : pour chaque caisson, `role` et `dort` (affichés dès le début du jeu), `demi` (après le
  premier protocole), `reveil` (caisson terminé). Le validateur (règle 10) vérifie chaque réplique au moment où elle
  s'affiche. Pour c02 à c10, `demi` et `reveil` sont provisoires : les réécrire avec le vocabulaire du caisson quand il
  est écrit. Depuis le 16/11/2026, toutes les répliques sont à la première personne et chaque personnage les lit avec
  sa voix (voir 3.18) : une réplique réécrite doit être réenregistrée.
- `src/components/Rewards.tsx` (`RewardLayer`, monté dans `App.tsx`) :
  - jaillissements de kW (`JetView`) : pendant un protocole, un petit « +10 kW » jaillit du doigt et file dans la
    barre d'énergie ; en fin de protocole, le total jaillit en grand (`payout`) et rejoint le compteur ; ailleurs
    (maintenance, atelier, livraison, panne), les kW rejoignent directement le compteur ;
  - cérémonie de montée de grade plein écran (hors protocole) ; scène de réveil (5 phases : endormi, courant,
    vitre qui se lève avec éclair, réplique écrite lettre à lettre, récompense ; passable d'un toucher ; rejouable
    depuis la fiche du membre) ;
  - langage visuel commun : `Shockwave` (onde de choc), `Sparks` (éclats), `Rays` (rayons) ;
  - file d'attente : le réveil passe en premier ; jamais de cérémonie au milieu d'une leçon, d'une panne ou d'une
    maintenance (`busyRoute`) ; plusieurs grades d'un coup : une seule cérémonie. **Un grade gagné pendant un écran
    occupé s'annonce dès que le joueur quitte cet écran** (« Retour », « Protocole suivant »…), choix du propriétaire ;
    l'encadré « Nouvelle accréditation » de l'écran de fin est retiré ;
  - les cérémonies de grade et de réveil sont opaques et ne coupent jamais leur haut quand elles dépassent l'écran.
- `src/lib/energy.ts` : barre d'énergie d'un protocole (`held` : kW pas encore montrés dans le compteur ; `landed` :
  kW arrivés dans la barre ; `max`). Présentation seulement : la progression enregistre chaque kW tout de suite.
- Animations réduites : `MotionConfig` et la classe `reduce-motion` coupent les mouvements ; les jaillissements sont
  alors remplacés par la mise à jour directe du compteur.

### 3.10 Outils d'apprentissage
- Exercices : `qcm`, `truefalse`, `cloze`, `order`, `wiring`, `feynman`.
- Blocs de leçon (`src/content/types.ts`, rendus par `Blocks.tsx` et `Mechanics.tsx`) : `text`, `definition`,
  `analogy` (avec illustration), `interactive{widget,caption?,mode?}`, `example`, `callout` (info, warn, volatile,
  ora), `exercise`, `recap` ; propres à FORMA-8 : `mission{title,goal,prompt,verify}` (remplace `{produit}`,
  `{phrase}`, `{depot}`), `consigne{id,situation,expected}` et `bugreport{id,symptom,context,expected}` (notés par
  Claude), `diff{title,file,lines,note}`, `procedure{id,title,intro?,steps[{do,see?,help?}]}` (cases persistantes,
  aide « Je suis bloqué »), `source{title,url,checked,note?}`.
- 12 simulateurs (`src/components/widgets/`, tous écrits à neuf) : GitBranches (c01 ; modes `commits`, `branches`,
  complet ; défis), TimeMachine (c01 p1), ConflictLab (c01 p5), RequestTrip (c00, c07), AgentCycle (c00 p3, c04),
  ProductLab (c00 p4), PipelineLights (c05), TokenBuilder (c02 p6), CostCalc (c07, c08), ContextView (c02 p2),
  SkillToolbox (c02 p5), McpPlugs (c02 p5). Reste à écrire : la Forge de Skills (c02).
- Illustrations (`Illustrations.tsx`, `illustration-ids.json`, 9) : web-magasin, trois-couches, chef-equipe,
  serrure-cle, vitrine, photos-chantier, voie-essai, relecture, correction.
- Atelier des consignes (`src/content/atelier.ts`), 6 situations : contact, texte-deborde, a-propos, relecture (après
  c01), regles (après c02), mise-en-ligne-auto (après c06).

### 3.11 Contenu
- `src/content/glossary.json` : **34 notions** (23 du caisson 00, 11 du caisson 01). 10 protocoles au total.

| Id | Membre | Nom | Version | Teinte | Fichier de l'équipe | État |
|---|---|---|---|---|---|---|
| c00 | ORA | Les bases du logiciel, sans coder | v0.0 | 190 | index.html | complet |
| c01 | L'Archiviste | Garder chaque version | v0.1 | 150 | commits | complet |
| c02 | Le Règlement de bord | L'environnement de ton équipe | v0.2 | 210 | CLAUDE.md | à écrire |
| c03 | Le Scribe | Décrire et découper | v0.3 | 260 | docs/SPEC.md | à écrire |
| c04 | La Boucle | Demander, relire, corriger | v0.4 | 30 | docs/JOURNAL.md | à écrire |
| c05 | L'Inspecteur | Qualité et vérifications | v0.5 | 120 | tests | à écrire |
| c06 | Le Messager | La mise en ligne | v0.6 | 175 | .github/workflows | à écrire |
| c07 | La Mémoire | Données et comptes | v0.7 | 280 | docs/DONNEES.md | à écrire |
| c08 | La Sentinelle | Sécurité et coûts | v0.8 | 350 | SECURITY.md | à écrire |
| c09 | Les Escouades et les Réflexes | Le niveau expert | v0.9 | 45 | .claude | à écrire |
| c10 | Le Lancement | Produit et métier | v1.0 | 320 | CHANGELOG.md | à écrire |

- **Caisson 00** (ORA, v0.0) : p1 « Ce qu'est une application » (fichier, application, navigateur, serveur, site-web ;
  RequestTrip) ; p2 « Les trois langues d'une page » (code-source, html, css, javascript) ; p3 « Créer avec une IA »
  (ia, modele-de-langage, prompt, agent, claude-code, vibe-coding ; AgentCycle) ; p4 « Choisir ton produit »
  (probleme-utilisateur, proposition-de-valeur, produit-minimum ; ProductLab) ; p5 « Ta première mise en ligne »
  (github, depot, pull-request en version simple, github-pages, adresse-web ; procédures `c00-creer-depot`,
  `c00-ouvrir-claude-code`, `c00-fusionner`, `c00-activer-pages`). Panne « Ma page ne s'affiche pas » (3 alertes).
  Livraison v0.0 : `index.html`, page en ligne, case « J'ai ouvert ma page sur mon iPhone ».
- **Caisson 01** (L'Archiviste, v0.1) : p1 « Pourquoi garder les versions » (version, git, historique ; TimeMachine) ;
  p2 « Le commit » (commit, message-de-commit ; GitBranches mode commits ; lecture du commit `4c83563` de FORMA-7 ;
  étude de cas des 6 commits ; procédure `c01-lire-historique`) ; p3 « Les branches » (branche, branche-principale ;
  GitBranches mode branches ; procédure `c01-creer-branche`, branche `essai-readme`) ; p4 « La pull request en
  détail » (fusion, relecture ; procédures `c01-ouvrir-pr` et `c01-relire-fusionner` ; diff piégé ; ordre de mission
  « Un changement relu de bout en bout » ; consigne `c01-aide-relecture`) ; p5 « Revenir en arrière » (annulation,
  conflit ; GitBranches complet ; procédure `c01-annuler-fusion` ; ConflictLab). Mots surveillés avant leur définition :
  « Git », « commit », « conflit ». Panne « Alerte aux archives » (3 alertes). Livraison v0.1 : 5 commits, 1 PR
  fusionnée, `README.md`, page en ligne.
- Sources vérifiées le 14/11/2026 (adresses finales ; GitHub a réorganisé sa documentation) :
  - caisson 00 : MDN « Comment fonctionne le Web »
    (https://developer.mozilla.org/fr/docs/Learn_web_development/Getting_started/Web_standards/How_the_web_works),
    glossaire MDN HTML, CSS, JavaScript (https://developer.mozilla.org/fr/docs/Glossary/HTML, /CSS, /JavaScript),
    https://code.claude.com/docs/fr/how-claude-code-works, https://code.claude.com/docs/fr/web-quickstart,
    https://docs.github.com/fr/pages/quickstart, « vibe coding » mot de l'année 2025 de Collins (AFP via Dawn,
    https://www.dawn.com/news/1953511) ;
  - caisson 01 : https://docs.github.com/fr/get-started/using-git/about-git ,
    https://docs.github.com/fr/get-started/using-github/github-flow ,
    https://docs.github.com/fr/pull-requests/reference/commits ,
    https://docs.github.com/fr/pull-requests/how-tos/commit-changes/managing-branches-within-your-repository ,
    https://docs.github.com/fr/repositories/working-with-files/managing-files/editing-files ,
    https://docs.github.com/fr/pull-requests/reference/pull-requests ,
    https://docs.github.com/fr/pull-requests/how-tos/create-pull-requests/creating-a-pull-request ,
    https://docs.github.com/fr/pull-requests/how-tos/merge-and-close-pull-requests/merging-a-pull-request ,
    https://docs.github.com/fr/pull-requests/how-tos/merge-and-close-pull-requests/reverting-a-pull-request ,
    https://docs.github.com/fr/pull-requests/reference/merge-conflicts ,
    https://docs.github.com/fr/pull-requests/how-tos/merge-and-close-pull-requests/resolving-a-merge-conflict-on-github ,
    https://code.claude.com/docs/fr/common-workflows , https://code.claude.com/docs/fr/claude-code-on-the-web .
- Plan détaillé des caissons 02 à 10 : `docs/PROGRAMME.md` (validé).

### 3.12 Tests et contrôles
- `scripts/validate-content.mjs` (variable `FORMA8_CONTENT_DIR` pour les tests) : notions complètes ; ordre
  d'introduction et références `[[id]]` ; mots surveillés (`watch`) ; exercices ; champs des caissons ; blocs FORMA-8 ;
  simulateur existant et mode reconnu (`GitBranches` : `commits`, `branches`) ; illustrations connues ; livraisons et
  `teamFile` ; **règle 10 : répliques de l'équipe** ; **règle 11 : voix de l'équipe** (voir 3.18) ; zéro emoji. Un caisson vide donne un avertissement.
- Tests unitaires : **40** (`merge` 8, `garde-fous` 8, `livraisons` 9, `validateur` 7, `energie` 2 : la batterie,
  `voix` 6 : clés des répliques et contrôle des enregistrements). Garde-fous :
  aucune écriture sous `forma7:`, `progress.json` jamais touché, clés `forma8:` uniquement, substitutions documentées,
  aucun simulateur de FORMA-7, aucun usage de `Art`.
- Tests de bout en bout : **14**, écran d'iPhone 13 (et iPad en paysage pour `affichage.spec.ts`), `vite preview` sur
  `http://localhost:4173/FORMA-8/`. `affichage.spec.ts` (2) : l'écran de fin ne laisse rien apparaître en haut (iPhone,
  iPad). Les autres :
  `socle.spec.ts` (5), `mecaniques.spec.ts` (2), `voix.spec.ts` (2 : ORA lit sa première bulle après le premier
  toucher, le bouton « Réécouter » la relance ; l'interrupteur « Voix » du menu du son retire les boutons ; indicateur
  `window.__forma8Voice`), `tactile.spec.ts` (1 : la remise en ordre glissée **au doigt**, avec
  de vrais touchers envoyés à Chromium par son protocole de débogage, `Input.dispatchTouchEvent` ; l'écran ne défile
  pas pendant le geste, mais défile toujours ailleurs), `caisson00.spec.ts` (banc complet, environ 1,2 min),
  `caisson01.spec.ts` (banc complet, environ 2 min ; part d'un caisson 00 réveillé déposé dans
  `forma8:progress-secours` ; `E2E_TIMEOUT` règle sa durée maximale). `helpers.ts` : `boot()` (bouton « Mettre sous
  tension », « Non merci » au fond sonore), `solve()`, `playStep(page, caisson, protocole, numéro, onBlock?)` (branche
  la batterie à la fin, vérifie qu'aucune cérémonie de grade n'apparaît pendant le protocole), `plugBattery()` (vérifie
  aussi `expectCoversTop`), `closeGradeCeremony()` (après chaque `page.goto`, compte les cérémonies dans
  `ceremonies.grade`), `holdCentrale(page, ms)`, `sendArc()` (maintient le doigt 3,2 s sur la centrale),
  `expectCoversTop(page, dialogue)`, `playMaintenance()`, `dismissCeremonies()`. Depuis le 16/11/2026, `playStep`
  vérifie après chaque « Continuer » que le compteur « BLOC n / N » a avancé, et reclique sinon : juste après une
  remise en ordre, les lignes finissent leur animation et un clic du robot pouvait se perdre (banc du caisson 00
  bloqué deux fois au bloc 14 du protocole 5 en local ; le même protocole isolé passait 4 fois sur 4, et la version
  d'avant les voix passait aussi). Un vrai joueur peut aussi perdre un toucher dans ce court instant : à surveiller. Le banc du caisson 00 vérifie aussi
  qu'une tentative d'arc avant la réparation de la panne échoue.
- Dernier passage complet : 16/11/2026 (lot « Les voix de l'équipe »), tout vert en local (Chromium). WebKit, même jour :
  6 relectures d'ORA d'affilée puis 5 membres (dont l'Inspecteur à deux voix et le Messager à effets superposés), sans
  plantage ni erreur (test temporaire `zz-*`, non gardé).
  **Limite** : les tests cliquent ; jusqu'au 15/11/2026, aucun ne glissait au doigt, d'où le défaut vu seulement par le
  propriétaire. Playwright ne sait pas simuler un glisser au doigt dans WebKit ; `Input.synthesizeScrollGesture` ne
  fait rien sans écran (essayé). WebKit (passage précédent) : le caisson 00 passe la centrale, la
  tentative refusée et l'arc, puis s'arrête à la livraison (GitHub simulé, limite connue du banc) ; le dernier protocole
  et la surcharge de l'arc passent sans plantage.

### 3.13 Tarifs et coûts (vérifiés le 14/11/2026, à revérifier)
- API, en dollars par million de tokens (envoyés / reçus) : Opus 5.5 : 4 / 20 ; Sonnet 5.5 : 2 / 10 ;
  Haiku 5.5 : 0,10 / 0,50. Usage estimé du joueur : environ 8 $ par mois avec Opus, 4 $ avec Sonnet, moins de 0,50 $
  avec Haiku (estimation).
- Max et Ultra incluent 100 $ et 200 $ de crédits API ; Pro n'en inclut pas (peut avoir évolué).
- ElevenLabs (voix de l'équipe, payé par le propriétaire) : offre **Starter**, lue le 16/11/2026 sur la page des tarifs
  d'ElevenLabs : 6 $ par mois (1 $ le premier mois selon une bannière), 30 000 crédits par mois (le compte affichait
  38 472 ce mois-ci), licence commerciale. Environ 1 crédit par caractère avec `eleven_v4` (estimation de l'outil).
  Utilisés au 16/11/2026 : 8 500 (auditions et enregistrements). Les écoutes dans l'appli ne coûtent rien.

### 3.14 Dettes et incertitudes connues
- Refonte de l'interface jouée par le propriétaire sur iPhone le 15/11/2026 : animations fluides, textes et
  personnages bien dosés (ses réponses). « Son et lumière » joué sur iPad dans la page d'essai : « C'est ok ».
  **À confirmer sur la version en ligne** : le son avec le bouton silencieux de l'iPhone, le glisser de la prise, la
  fluidité des éclairs sur un ancien modèle, la mémoire prise par les sons préparés (environ 12 Mo, estimation).
- Le son ne démarre qu'après un toucher (règle de Safari). À la reprise quotidienne, le BIOS rapide s'écrit donc
  sans bruit de clavier tant que le joueur n'a pas touché l'écran.
- Un protocole déjà terminé et relancé n'a ni batterie ni branchement (pas de kW à gagner) : il garde l'ancienne fin.
- Si le joueur quitte la scène du branchement sans brancher, ses kW sont tout de même comptés (le compteur reprend
  sa vraie valeur) ; la prise apparaîtra branchée à la prochaine visite.
- Si le joueur quitte l'écran de la panne réparée sans réarmer le disjoncteur, la scène de réveil ne se joue pas ;
  elle reste visible depuis la fiche du membre (« Revoir son réveil »).
- **Voix de l'équipe, à confirmer sur iPhone** (version en ligne) : volume face aux effets et au fond sonore, mémoire
  prise par les voix préparées (6 répliques gardées au plus), délai avant la première parole (préparation hors temps
  réel, environ une demi-seconde à une seconde dans Chromium, non mesuré sur iPhone). WebKit sur serveur n'est pas un
  vrai iPhone.
- Durées des protocoles : estimation à 0,85 min par bloc, à ajuster avec l'usage réel.
- **Remise en ordre au doigt, à confirmer sur iPhone** après la fusion du correctif (voir 3.17) : la cause retenue
  (Safari qui prend le glisser pour un défilement de l'écran) est probable, pas prouvée ; non reproduite ici.
- **Centrale** : jouée en ligne sur iPhone par le propriétaire le 15/11/2026, « Ça marche bien ». Restait **à
  confirmer sur iPhone** (version en ligne) : fluidité du plasma et de la surcharge sur un ancien
  modèle, geste de la fiche jusqu'à la prise la plus éloignée, hauteur de la scène sur un petit écran (iPhone SE :
  elle dépasse probablement un peu et se fait défiler ; non vérifié).
- Le tonnerre en fin de protocole, écarté le matin du 15/11, est revenu le soir à la demande du propriétaire (« un son
  de tonnerre et d'éclairs frappants ») : à confirmer à l'écoute.
- Les sons « crack » et « thunder » ont été écrits pour ce lot : le propriétaire ne les a entendus que dans les
  maquettes.
- **Compteurs de notions dans les tests** : `caisson00.spec.ts` attend « 23 / 34 notions collectées » ;
  `caisson01.spec.ts` suppose toutes les notions collectées. À adapter dès que le caisson 02 ajoute des notions.
- **Libellés de GitHub non vérifiés en étant connecté** : vérifiés sans connexion sur un écran d'iPhone (horloge de
  l'historique, page « Commits », détail d'un commit, onglets d'une PR, menu « Switch branches/tags ») ; tirés de la
  documentation seulement (« Find or create a branch… », « Create branch », « Commit changes... », « Compare & pull
  request », « Create pull request », « Merge pull request », « Confirm merge », « Revert », « Resolve conflicts »,
  « Mark as resolved », « Commit merge ») ; de mémoire, à confirmer (« Commit directly to the … branch », « Able to
  merge », « Delete branch », « Restore branch », « This branch has conflicts that must be resolved », emplacement du
  crayon sur iPhone ; une adresse directe `…/edit/<branche>/<fichier>` est donnée en secours).
- Incertitudes : libellés exacts de claude.ai/code et github.com dans Safari mobile ; possibilité de modifier après coup
  les dépôts d'un jeton « fine-grained » ; montant minimum de crédits dans la Console Claude ; version la plus récente
  du guide RGPD de la CNIL ; source primaire de « vibe coding » (attribuée à Andrej Karpathy, février 2025, d'après
  des sources secondaires).

### 3.15 Son et lumière (lot du 15/11/2026, choisi par le propriétaire sur maquettes jouables)
- **Sons** (`src/lib/sound.ts`) : sons électriques fabriqués par le téléphone (relais, contacteurs, arcs,
  transformateurs à 100 Hz, réverbération d'une salle de machines). Chaque son est fabriqué **une fois**, hors temps
  réel (`OfflineAudioContext`, 32 kHz), juste après le premier toucher, avec des variantes pour les sons fréquents ;
  ensuite un effet n'est qu'un lecteur et un volume. Avant cette version, la synthèse en direct faisait planter Safari
  (WebKit) en moins d'une minute de jeu. Garde-fous : rien avant un geste reconnu par Safari (`pointerup`, `touchend`,
  `click`, `keydown` : pas `pointerdown`), un même son pas avant 180 ms, au plus 6 effets par demi-seconde.
  Choix du propriétaire : clavier « Feutré » (plus sourd, plus aigu) ; levier en sectionneur (impact, puis rangées de
  lumières du fond de la salle jusqu'au joueur) ; montée de grade « Accréditation » (faisceau qui scanne, quatre
  verrous, accord grave) ; réveil « Défibrillateur », renforcé (charge, bip « chargé », silence, décharge lourde,
  quatre battements, démarrage des systèmes) ; deux notes jouées par un arc (« bobine Tesla ») pour les petites
  victoires (batterie pleine, livraison, badge). Sons écartés : voir 4.2.
- **Fond sonore** : réglage `settings.ambience` et `ambienceVolume` (coupé par défaut). ORA le propose au premier
  lancement, juste avant le levier ; il se règle ensuite dans Réglages. Ronronnement et ventilation en direct,
  événements au loin préparés à l'avance ; il s'anime avec l'énergie de l'équipe (`setAmbienceLevel`).
- **Premier lancement** (`Boot.tsx`) : écran « hors tension » avec un bouton (il débloque le son), BIOS avec le
  clavier, question d'ORA sur le fond sonore, levier ; puis la salle en perspective dont les rangées s'allument, et un
  orage (trois éclairs, tonnerre, grésillements) qui amène l'accueil dans le flash du dernier éclair.
- **Éclairs** (`src/components/Bolts.tsx`) : moteur écrit d'après le déroulé d'un vrai coup de foudre (traceur
  ramifié qui progresse par bonds, arc en retour qui éclaire la scène, re-frappes du même canal, extinction), canal
  fractal, halo flouté (« bloom » à basse résolution). Blanc et cyan seulement. La toile n'existe que pendant un
  éclair (une toile plein écran permanente faisait aussi tomber Safari). Fonctions : `strike`, `bigStrike`,
  `skyStrike`, `arcs`, `sparks`, `flash`, `centerOf`.
- **Batterie du protocole** (`energy.ts` : `cells`, `lit`, `fillBattery`) : une cellule par vérification, plus une
  pour la fin. Chaque bonne réponse lance un éclair du doigt vers la cellule suivante (« +10 kW ») ; « Terminer le
  protocole » charge la dernière par un grand éclair. Les cellules restent allumées à la reprise d'un protocole.
- **Scène du branchement** (`src/components/PlugScene.tsx`) : la batterie pleine se branche sur la capsule du
  membre, une prise par protocole (glisser la prise, ou la toucher). Les câbles relient chaque prise au socle de la
  capsule, qui s'éclaire un peu plus à chaque câble (`ChargedCapsule` dans `Crew.tsx`). Les kW rejoignent le compteur
  au branchement. Dernier câble : si la panne n'est pas réparée, le disjoncteur saute ; sinon le membre se réveille.
- **Panne** : une fois réparée, « Réarmer le disjoncteur » fait passer le courant et lance le réveil.
- **Cérémonies** (`Rewards.tsx`) : grade « Accréditation validée » (scan, verrous, numéro) et réveil
  « Défibrillateur » synchronisés sur leurs sons ; confettis des bonnes réponses en blanc et cyan.

### 3.16 La centrale et l'arc (lot du 15/11/2026, PR #13, choisi sur maquettes jouables)
- **Remarques du propriétaire sur « son et lumière »** joué en ligne : son correct (bouton silencieux compris), aucun
  plantage ; éclairs « trop lents, grossiers » ; batterie et prises « mal faites » ; un bouton pour régler le son
  depuis le jeu ; le bruit de la première cellule différent au dernier protocole (c'était le son de grade en double).
- **Éclairs** (`Bolts.tsx`) : cœur d'un pixel, halo serré (toile du halo à demi-résolution), canal jusqu'à 8 niveaux
  de détail, ramifications qui s'effilent ; trois canaux par petit éclair, quatre par grand ; durées environ deux fois
  plus courtes. `strike` joue « crack » à l'impact, `bigStrike` joue « thunder ». `channel` est exporté (plasma).
- **Sons ajoutés** (`sound.ts`, préparés à l'avance comme les autres) : `crack` (3 variantes), `thunder` (2).
- **La centrale** (`Centrale.tsx`, `Plasma.ts`, `PlugScene.tsx`) : un anneau sous la capsule, une prise par protocole
  (angles `socketAngle`, le haut reste libre pour l'électrode).
  - Fin de protocole : la fiche sort de la borne « + » de la jauge (corde simulée, classe `Rope`, dessinée hors de
    React) ; le câble est assez long pour la prise la plus éloignée ; glisser ou toucher la fiche la branche. La
    batterie se vide dans la centrale, qui réagit plus fort à chaque prise (`react(index)`) ; les kW partent du cœur
    vers le compteur.
  - Électricité permanente dès la première prise (`Plasma.ts`) : filaments fractals le long de l'anneau, décharges
    du cœur, aigrettes des fiches, couronne qui tremble ; plus dense à chaque prise. Toile limitée à la centrale,
    30 images par seconde, arrêtée en arrière-plan.
  - Toucher la centrale tente d'envoyer l'arc : la tentative échoue (son « circuit-fail », message en ambre) tant
    qu'une prise est libre ou que la panne n'est pas réparée. Charge d'environ 2,4 s, comptée en temps réel.
  - Après la panne réparée, `ArcScene` remplace « Réarmer le disjoncteur » : maintenir le doigt envoie l'arc ; la
    centrale passe en **surcharge** 2,6 s (arcs de plus en plus nombreux vers la capsule, flashs) et finit sur une
    image saturée d'éclairs ; puis la scène de réveil. Le réveil ne vient plus du dernier branchement.
  - Habillage : graduations, anneau de mesure qui tourne, mires, repères P1 à P5, télémétrie (prises, charge,
    circuit) ; capsule de 140 px (le membre du caisson bien visible), centrale de 206 px ; fond quadrillé de l'appli.
- **Retirés** : le banc de batteries et le socle à prises de la version du matin (`.socle`, `.bank`, `.vbatt`) ;
  `rearmBreaker` dans les tests (remplacé par `sendArc`).

### 3.17 Correctif « remise en ordre au doigt » (15/11/2026)
- **Signalé par le propriétaire** sur iPhone : « avec la souris pas de problème pour replacer les lignes, mais au doigt
  ça ne fonctionne pas » (exercices `order`, `Exercises.tsx`, fonction `Order`, `Reorder` de motion).
- **Cause probable** (non reproduite : le même geste marche au doigt dans Chromium) : l'exercice est dans `.screen`,
  une zone qui défile (`overflow-y: auto`) ; dans ce cas, Safari sur iPhone peut prendre le glisser pour un défilement
  et annuler le geste, malgré `touch-action: none`.
- **Correctif** : un écouteur `touchmove` non passif (`preventDefault`) sur la liste (`.order-list`, espaces entre les
  lignes compris : le doigt n'y fait pas défiler l'écran), tant que l'exercice n'est pas réussi ; classe `.order-item` (ni sélection de texte, ni loupe de Safari à l'appui). Les flèches restent.
- Les autres glisser de l'appli (levier du démarrage, fiche de la centrale) sont hors de `.screen` : le propriétaire
  les a utilisés sans problème.

### 3.18 Les voix de l'équipe (lot du 16/11/2026, choisi par le propriétaire sur trois tours d'audition)
- **Demande** : « donner une voix à chaque personnage » : un sexe, une personnalité cohérente, des traits de caractère,
  une voix, une élocution et un rythme qui collent à son identité, « en gardant toujours un aspect robotique » ; chacun
  lit ses textes ; textes à la première personne (« je »), le joueur tutoyé ; connecteur ElevenLabs.
- **Fait** :
  - `src/content/equipe.json` : les 44 répliques réécrites à la première personne (accords selon le sexe) ; quelques
    bulles fixes d'ORA aussi (`Boot.tsx`, `MapView.tsx`, `RoomView.tsx`, `Views.tsx`) ; encadré ORA de `c01.json`.
  - `src/content/voix.json` : pour ORA et les 10 membres, `sexe`, `personnalite`, `traits`, `elocution`, `voix`
    (identifiant ElevenLabs), `candidates` (voix auditionnées), `filtre` (touche robotique), `dose` (densité de
    l'effet, 0 à 1), et selon le cas `effets` + `variantes` (effets superposés) ou `voixDuo` (deux voix mêlées).
  - Enregistrements : 44 mp3 (environ 5,8 Mo) dans `public/voix`, listés dans `src/content/voix-enregistrements.json`
    sous la clé `personnage:empreinte du texte dit` (`src/lib/voice-key.js`). Requises : les 4 répliques des caissons
    jouables (00 et 01), `role` et `dort` des autres ; plus 18 bulles fixes d'ORA. Bulles à texte variable (prénom,
    scores) : pas de voix ; l'accueil du démarrage est dit **sans** le prénom (champ `envoye` distinct de `texte`).
    Répliques des membres endormis dites avec la balise `[whispering]` d'`eleven_v4`.
  - `src/lib/robot.ts` : touche robotique calculée **hors temps réel** (`OfflineAudioContext`, comme les sons de
    3.15) : passe-haut et passe-bas, saturation, modulation en anneau, peigne, chœur, salle, grain, `hache` (petites
    coupures régulières), `glitch` (petites répétitions) ; `robotize(source, filtre, dose)` ; `mixReady` mélange
    plusieurs versions (effets superposés, voix en duo). Corrigé le 16/11/2026 : `hache` ignorait la densité (la page
    du 3e tour d'audition avait donc des coupures à fond).
  - `src/lib/voice.ts` : une seule voix à la fois ; lecture automatique **une fois par séance** pour chaque réplique,
    350 ms après l'apparition de la bulle, si le son est débloqué ; file d'attente d'une réplique ; le fond sonore
    baisse pendant qu'un personnage parle ; 6 répliques préparées gardées en mémoire ; arrêt au changement d'écran.
  - Interface : `VoiceButton.tsx` (`useVoiceLine`, `ReplayButton` : haut-parleur et trois barres, « Réécouter » ou
    « Arrêter ») dans `OraSays` et `MemberSays` ; ORA et les membres s'animent pendant qu'ils parlent ; la scène de
    réveil écrit la réplique au rythme de la voix ; réglages « Voix » (interrupteur et volume) dans le menu du son de la
    barre du haut et dans Réglages ; mention ElevenLabs dans Réglages › À propos.
  - PWA : les mp3 ne sont pas préchargés ; mis en cache à la première écoute (`CacheFirst`, cache `forma8:voix`).
  - Contrôles : validateur, règle 11 (`scripts/voix-lib.mjs`) : une prise doit correspondre au texte, à la voix du
    personnage et à un fichier présent ; une réplique requise sans voix donne un avertissement. Outil :
    `node scripts/voix.mjs manquantes` et `node scripts/voix.mjs ajouter <personnage> <url-ou-fichier> --texte "…"
    [--envoye "…"] [--duo <url-ou-fichier>]`.
- **Méthode d'enregistrement** (connecteur ElevenLabs de Claude Code, jamais depuis l'appli, aucune clé dans le
  dépôt) : `creative_generate_speech` avec `eleven_v4`, la voix de `voix.json`, `generations_count: 1` ; attendre
  avec `creative_get_flow_run_status` ; télécharger l'adresse donnée ; `scripts/voix.mjs ajouter` ; écouter ; vérifier
  les crédits avec `account_get_usage` avant une série. Ne jamais relancer une génération pour « réessayer » (chaque
  appel est facturé).
- **Choix finaux du propriétaire** (QCM avec notes, pages d'audition privées ; densité = force de la touche robotique) :

| Personnage | Sexe | Voix ElevenLabs | Densité | Particularité |
|---|---|---|---|---|
| ORA | femme | Clara (voix modulée) | 45 % | effets Vocodeur + Hologramme superposés |
| L'Archiviste | femme | Grandma Clo | 0 % | |
| Le Règlement de bord | homme | Paul K | 15 % | |
| Le Scribe | homme | Julien (conteur) | 25 % | moins d'écho, plus feutré |
| La Boucle | femme | Lea | 75 % | |
| L'Inspecteur | homme | Julien + Olivier | 30 % | deux voix superposées (`voixDuo`) |
| Le Messager | homme | Tristan | 10 % | effets Radio + Transmission rapide superposés |
| La Mémoire | femme | Camille Martin | 80 % | |
| La Sentinelle | femme | voix conçue sur mesure (n° 3) | 0 % | autoritaire, ferme |
| Les Escouades et les Réflexes | meneuse | voix conçue sur mesure (n° 2) | 80 % | « voix de leader » |
| Le Lancement | homme | Lucas | 70 % | plus feutré |

- Les deux voix conçues sont enregistrées dans la bibliothèque du compte ElevenLabs du propriétaire (2 emplacements
  sur 10). Pages d'audition et page d'essai : privées, adresses dans la conversation du 16/11/2026 (non reprises ici).
- **Écouté par le propriétaire** : les trois tours d'audition. La page d'essai de la vraie appli lui a été donnée avant
  la PR ; il a demandé d'ouvrir la PR sans autre retour. **Pas encore écouté sur la version en ligne** (première
  question de la prochaine session).
- **Abonnement ElevenLabs, question du propriétaire** (« j'ai besoin de garder l'abonnement pour que les voix
  continuent de fonctionner ? ») : non. L'appli lit ses mp3 et ne contacte jamais ElevenLabs. D'après l'aide
  d'ElevenLabs (lue le 16/11/2026 : « What happens to my content after my subscription ends? » et « Can I publish the
  content I generate on the platform? », help.elevenlabs.io), ce qui est généré pendant un abonnement payant garde sa
  licence commerciale après la résiliation, sans limite de durée ; résilier prend effet à la fin du mois payé, le
  compte passe à l'offre gratuite et les crédits restants sont perdus ; ElevenLabs ne garantit pas que le contenu reste
  accessible sur l'offre gratuite. L'abonnement ne sert donc qu'à **enregistrer de nouvelles répliques**. Risques
  sans lui : l'offre gratuite du compte est désactivée (aucune génération possible) ; les 2 voix conçues sur mesure
  (Sentinelle, Escouades) pourraient ne plus être utilisables (non vérifié). Conseil donné : résilier puis se
  réabonner le temps d'enregistrer plusieurs caissons, ou garder l'abonnement pour la tranquillité. **Décision du
  propriétaire : pas encore prise.** Avant toute génération, vérifier l'offre et les crédits avec `account_get_usage` ;
  si l'abonnement est résilié, le lui dire et attendre son accord avant d'enregistrer.

---

### 3.19 Lot en cours (16-17/11/2026) : le compagnon et les règles de parole, PAS ENCORE FUSIONNÉ
Branche `claude/beautiful-cori-sz6dxq` (poussée). Pages d'essai privées : labo des voix d'ORA
https://claude.ai/artifact/SoBrMYqEUKgW96svoba1rp ; maquette du compagnon https://claude.ai/artifact/UmHohA7Kc2ykEZsUAFC3jm ;
labo des personnages https://claude.ai/artifact/Fj3TcAq1S3v6QvicnrAzr5 (source : `outils/labo-personnages/`).
- **Déjà fait et poussé** : banc du caisson 00 réparé (« Continuer » ramené en vue après une vérification) ; aucune voix
  derrière une cérémonie (`holdVoices`) ; ORA en « IA de bord » à 150 % ; toucher une bulle coupe la parole ; effets à
  10 % pendant qu'un personnage parle ; compagnon de protocole (`Companion.tsx`, `companion.ts`, `compagnon.json`, 76 voix,
  voix endormie « A2 » `[sleepy] [mumbling] [slowly]`) ; validateur des répliques du compagnon au bloc près ; banc
  `compagnon.spec.ts`. Commande complète verte au 16/11/2026 (15 tests de bout en bout).
- **Règles de parole décidées (à construire)** :
  - un personnage n'apparaît jamais en double ; une seule file de parole : les bulles s'ouvrent l'une après l'autre,
    dans un ordre cohérent ; quand un personnage questionne un autre, celui-ci lui répond avant de s'adresser à quelqu'un
    d'autre ; peu de temps entre deux répliques d'un échange ;
  - texte écrit lettre par lettre au rythme de la voix ; toute bulle est lue à voix haute ; bulles au premier plan,
    fermées une fois lues ; toucher le personnage (pas de survol sur iPhone) rouvre la bulle et relit ;
  - au retour sur une page : une phrase très courte, différente à chaque fois ; la réplique complète seulement s'il y a
    du nouveau ;
  - répliques plus courtes, surtout quand elles n'aident pas à avancer ;
  - membre endormi : « parle en dormant » discret, texte en italique, discours absurde et bafouillé ; il se réveille peu
    à peu (protocole 1 très absurde, pistes glissées dans le demi-sommeil sans changer de ton, de plus en plus clair) ;
  - **grésillement commun à tous les endormis**, réglé à 35 %, discret (souffle et petits craquements sous la voix), qui
    baisse quand le personnage se réveille (0 une fois réveillé) ;
  - textes écrits sur le moment par Claude (reformulation, questions aux membres) : **babillage robotique**.
- **ORA → renommée « Forma Trisse »** (17/11/2026, « tant pis s'il n'y a pas de rapport avec FORMA-7 »). Choix B :
  elle est **endormie au début**, comme les autres, et se réveille au fil du caisson 00 ; elle devient ensuite la guide.
  À renommer partout (bulles, bouton « Demander à ORA », réglages, scènes) et à réenregistrer chaque réplique qui
  dit « ORA ». L'identifiant interne `ora` peut rester.
- **Noms des membres** (17/11/2026) : Mme Larchive (Archiviste) ; Général Calpin (Règlement de bord) ; M. Laplume
  (Scribe) ; Mme Bonna Bitude (La Boucle) ; Dupond et Dupont, frères (Inspecteur, deux voix ; **risque signalé** :
  personnages de Tintin protégés, gardés par choix du propriétaire, à revoir avant un lancement public) ; Hermès
  Coursier (Messager ; Hermès est aussi une marque, risque jugé faible, non vérifié) ; Fabienne du CDI, « la dame CDI »
  (Mémoire) ; Senty Nell, « Agent Nell » (Sentinelle) ; Lana Mageuse (Escouades et Réflexes) ; Alex Pédition
  (Lancement). Le métier reste en sous-titre (« Mme Larchive · l'Archiviste »).
- **Interactions retenues** (aperçus validés dans le labo) : toucher un personnage (il réagit) ; dialogues à choix
  (réponses dans la bulle, bulle fermée quand il n'y a plus de question) ; défi du jour sur la carte (pareil) ; l'équipe
  qui se parle (réveil) ; poser une question à un membre (Claude, clé API ; babillage).
- **Crédits ElevenLabs** : environ 20 500 restants au 17/11/2026 (offre Starter, gardée par le propriétaire).
- **Construit le 17/11/2026** (branche `claude/ecstatic-keller-i9o3gk`) :
  - `src/lib/eveil.ts` : qui dort, niveau de réveil (protocoles faits / (protocoles + 1)), grésillement
    `0,35 × (1 − réveil)`, phrases de retour et réactions au toucher tirées sans répétition, pages annexes, accords
    (féminin, masculin, pluriel pour Dupond et Dupont). Textes : `src/content/interactions.json`.
  - `src/lib/voice.ts` : une seule file de parole ; son coupé, la bulle s'écrit quand même au rythme de lecture
    (55 ms par caractère) ; une bulle qui disparaît fait taire sa voix ; babillage pour les textes de Claude
    (`src/lib/robot.ts`) ; mémoire des répliques entendues (`forma8:entendu`).
  - `src/components/Bulle.tsx` : la bulle unique (nom, « parle en dormant », italique, texte au rythme de la voix,
    choix dans la bulle). Premier toucher du personnage : il relit ; les suivants : il réagit. Le bouton « Réécouter »
    (`VoiceButton.tsx`) est retiré.
  - `src/components/Defi.tsx` : défi du jour sur la carte (dernier membre réveillé, +15 kW, `forma8:defi`).
  - Scène du réveil (`Rewards.tsx`) : l'équipe se parle (`interactions.json` → `scenes`) ; « Revoir son réveil » ne
    rejoue que la réplique du membre.
  - Fiche d'un membre (`Views.tsx`) : toucher sa capsule le fait parler ; un membre réveillé accepte une question
    (`askMember` dans `claude.ts`, réponse en babillage ; sans clé, sa réplique enregistrée le dit).
  - Maintenance, Atelier, Équipe : répliques fixes enregistrées ; chiffres affichés à part.
  - 98 anciennes prises remplacées retirées de `public/voix` (dans l'historique git).
  - WebKit (17/11/2026) : socle, voix, compagnon, mécaniques verts ; scène du réveil du caisson 00 vérifiée par un test
    temporaire (`zz-*`, non gardé) sans erreur. Le banc complet du caisson 00 dépasse ses 5 minutes dans WebKit
    (lenteur connue), il passe en Chromium.
- **Accord du propriétaire** sur la maquette (https://claude.ai/artifact/EKesPUvJczHo36aYU5cbJx) le 17/11/2026 ;
  PR ouverte vers `main`. Le caisson 02 attend sa fusion.

---

## 4. Décisions prises et pistes écartées

### 4.1 Décisions du propriétaire
- Programme sur mesure, sur la documentation officielle de Claude Code en français ; les cours Anthropic Academy
  (Claude Code 101, Claude Code in Action) servent seulement de liste de contrôle (sujets couverts aux caissons 02, 03,
  04, 05 et 09, réécrits).
- Matériel : iPhone et iPad, Safari. Temps : 15 à 30 minutes par jour, en « quarts ».
- FORMA-8 autonome ; clin d'œil à FORMA-7 seulement (prénom repris, badges affichés en lecture seule).
- Un produit fil rouge, choisi dans l'appli au caisson 00. Premiers vrais utilisateurs au niveau 6.
- Univers « l'Équipe », nom « FORMA-8 · Réveille l'équipe ». Missions du jour : aucune.
- Livraisons vérifiées automatiquement par l'API GitHub, case à cocher en secours.
- Mécaniques : Atelier des consignes, pannes à diagnostiquer, livraisons vérifiées, fiches de l'équipe, simulateurs,
  portfolio, Quart du jour, Demander à ORA.
- Claude dans l'appli : **indispensable** ; modèle par défaut : Opus 5.5.
- Construction de **tout le parcours** avant le premier test complet ; méthode exemplaire (CLAUDE.md, tests, CI, une PR
  par lot relue et fusionnée par lui).
- Contenu : plan d'abord (`PROGRAMME.md`, validé), puis caisson par caisson. Aucun contenu de FORMA-7 (14/11/2026).
- Étude de cas FORMA-7 (14/11/2026) : citer **mot pour mot** des faits de son historique (messages de commit, dates,
  nombres de fichiers, courts extraits d'un commit) est permis. Contrôle fait au caisson 01 : aucune suite de 5 mots du
  texte pédagogique commune avec FORMA-7, hors citations et tournures courantes.
- Refonte de l'interface (15/11/2026), après des maquettes jouables :
  - **option B** : même palette, mêmes polices ; le reste peut évoluer (règle 3 réécrite) ;
  - **11 personnages avec répliques**, scène de réveil, frise du produit, chemin des protocoles, Base par membre ;
  - **cérémonies plus spectaculaires** (onde de choc, éclats, rayons) ;
  - **kW** : barre d'énergie discrète aux couleurs de l'appli pendant le protocole ; petit jaillissement de 10 kW par
    bonne réponse vers la barre ; total qui jaillit en grand en fin de protocole et rejoint le compteur ; « rends le
    tout cohérent et très esthétique ».

- « Son et lumière » (15/11/2026), après cinq maquettes jouables puis des essais de la vraie appli : voir 3.15.
- « La centrale et l'arc » (15/11/2026, soir), après deux labos et plusieurs versions jouables : voir 3.16. Ses mots :
  « les prises qui se connectent à une même centrale », « l'arc électrique peut ensuite être envoyé une fois que toutes
  les prises sont branchées » ; « à chaque fois que je branche une prise, elle réagit avec un effet électrique un peu
  plus puissant » ; « on doit voir de l'électricité circuler de façon constante à partir du premier branchement » ;
  « toucher la centrale doit simuler une tentative de connexion à la capsule, qui échouera si toutes les prises ne
  sont pas branchées » ; arc après la panne à la place du disjoncteur (recommandation acceptée) ; confettis « blancs et
  bleus » ; une fin « très chargée en arcs électriques » ; la page ne doit pas « dénoter » du reste de l'appli.
- Grades : annoncés en quittant l'écran du protocole, sans encadré sur l'écran de fin.
- Bouton du son dans la barre du haut, en petit menu discret.
- **Voix de l'équipe (16/11/2026)** : sexes proposés acceptés (5 femmes, 5 hommes, une meneuse pour les Escouades) ;
  seules leurs répliques sont lues (pas les leçons) ; lecture automatique plus bouton « Réécouter », interrupteur dans
  le menu du son ; offre ElevenLabs Starter (après la désactivation de l'offre gratuite par ElevenLabs) ; « plus
  robotique » pour tous puis « un peu trop » : densité réglée personnage par personnage ; « trop d'écho/réverbe en
  règle générale » : salle divisée par deux ; voix et densités du tableau de 3.18.
  Ses mots : des sons « plus réalistes, plus stimulants », « sur le thème de l'électricité » ; pour les kW, « moins de
  couleurs », « un gros éclair » ; la batterie « se charge à chaque bonne réponse », « je dois la brancher à la
  capsule moi-même », le membre « se réveille quand tous les câbles ont été branchés et que le courant passe » ;
  « l'autre bout des prises » relié au personnage ; des éclairs « extrêmement réalistes » ; un orage pour passer du
  levier à l'accueil. Conseil accepté : fond sonore proposé par ORA, coupé par défaut.

### 4.2 Pistes écartées, et pourquoi
- Traduire les cours Anthropic Academy : droits d'auteur, connexion requise.
- Reprendre du contenu de FORMA-7 (53 notions, 8 simulateurs, SkillWorkshop, illustrations de `Art`) : refusé.
- Missions du jour par mail et mécanique « Signaux » de FORMA-7 : écartées.
- PR empilées sur des branches intermédiaires : abandonnées après les PR #2 et #3.
- Le mot « équipage » ; la revue de code comme mécanique dédiée (reste une notion du caisson 05) ; Claude optionnel ;
  construire et faire tester lot par lot.
- Le composant `Art` de FORMA-7 : remplacé par `Illustrations.tsx`, puis retiré du dépôt (15/11/2026).
- Option A de la refonte (enrichir sans toucher au socle, parité stricte) : écartée pour l'option B.
- Propositions de kW écartées (15/11/2026) : « pièces d'énergie » aspirées une à une ; jauge orange qui se vide sans
  jaillissement ; compteur seul.
- Une cérémonie de grade au milieu d'un protocole : elle bloquait la lecture ; le grade s'annonce dans la fin de
  protocole.
- Réécrire un historique déjà poussé : refusé par la sécurité de la session ; on ajoute des commits.
- « Son et lumière », propositions écartées : kW en « rampe de néons », « capsule qui s'éclaire » ou « salle qui
  s'allume » seules (remplacées par la batterie à brancher) ; sons de grade et de réveil trop « enfantins » (mélodie
  de notes électriques), puis « Échelle de Jacob », « Turbine », « Réacteur », « Démarrage » ; clavier mécanique trop
  fort ; tonnerre en fin de protocole ; barres lumineuses posées sur le texte du BIOS (remplacées par la salle en
  perspective) ; câbles qui partaient sur les côtés.
- Une bibliothèque d'effets pour les éclairs : trop lourde à charger sur iPhone ; moteur écrit pour FORMA-8.
- Fabriquer les sons en direct à chaque effet, et une toile d'éclairs plein écran permanente : plantages de Safari.
- Branchement, version du matin (banc d'une batterie par protocole sous un socle à prises) : « pas encore ça ».
- Labo du branchement : câble seul, cartouche, sectionneur, arc à maintenir seul (« présentation différente »),
  défibrillateur. Labo de la centrale : la tour et les cornes (choix : le réacteur).
- Électricité de la centrale en petits zigzags SVG : « très simple, voire enfantine ».
- Habillage très « HUD » (coins biseautés, grille de points, puces) : « la page dénote trop du reste de l'application ».
- Feuille du bas pour régler le son : trop voyante.

---

## 5. Prochaine action immédiate

### 5.1 Au démarrage de la nouvelle session (avant toute écriture)
1. Lire en entier `CLAUDE.md`, ce document, `docs/CONCEPTION.md` et `docs/PROGRAMME.md`.
2. `git fetch origin`. Vérifier que `origin/main` contient `bbbab68` (PR #15) et la PR « Les voix de l'équipe »
   (3.18) ; si autre chose a changé, le dire au propriétaire.
3. Attacher `felipemaciasito-cmyk/forma-7` (public, lecture seule) et le cloner **à côté** de FORMA-8, sous le nom
   `forma-7`, **en entier** (sans `--depth`), pour `check:parity` et l'étude de cas.
4. `npm ci`, puis la commande complète de vérification. Annoncer le résultat en quelques lignes : l'état de départ
   doit être entièrement vert.
5. Demander au propriétaire, en QCM avec possibilité de notes : les voix de l'équipe sur son iPhone (version en
   ligne : se lancent-elles, volume, rythme, touche robotique, personnage par personnage) ; à retoucher : `dose` ou
   `filtre` dans `voix.json` (sans régénérer), ou une nouvelle prise (crédits). Puis : la remise en ordre se
   glisse-t-elle maintenant au doigt sur son iPhone ? Puis : garde-t-il l'abonnement ElevenLabs (voir fin de 3.18) ? Si non, passer à une poignée dédiée au glisser (`useDragControls` de
   motion) et le faire essayer dans une page privée avant la PR. Puis lui demander ses autres remarques : le 15/11/2026,
   il a répondu « Pas encore » au feu vert du caisson 02, ce qui laisse penser qu'il en a d'autres. La centrale et
   l'arc : « Ça marche bien » (15/11/2026). Corriger d'abord ce qu'il signale ; pour un changement visuel ou sonore
   important, maquette d'abord, et test dans WebKit (2.3).
6. Attendre son **feu vert explicite** (QCM) pour le caisson 02.

### 5.2 Caisson 02 · Le Règlement de bord · « L'environnement de ton équipe » · v0.2 (après le feu vert)
- **Branche** : celle qu'impose l'environnement, créée depuis `origin/main`.
- **Plan** (`docs/PROGRAMME.md`) : 6 protocoles, environ 20 notions :
  1. Une séance de travail dans le navigateur : `session`, `environnement-cloud`, `terminal`, `commande` ;
  2. Ce que Claude voit : `token`, `contexte`, `fenetre-contexte`, `compaction` (ContextView) ;
  3. Le fichier de règles : `claude-md`, `memoire-projet` (ordre de mission : écrire le `CLAUDE.md` du produit) ;
  4. Les permissions : `permission`, `mode-permission`, `mode-plan` ;
  5. Les savoir-faire et les prises : `markdown`, `skill`, `mcp`, `connecteur`, `plugin` (SkillToolbox, McpPlugs,
     et une **nouvelle Forge de Skills** à écrire d'après la documentation officielle d'Anthropic sur les Skills, en
     français : URL à trouver et à vérifier ; elle rendra le badge « skill » obtenable) ;
  6. Le jeton d'accès : `jeton-acces`, `moindre-privilege` (TokenBuilder, puis création du vrai jeton
     « fine-grained » et activation de la synchronisation ; vérifier d'abord si l'on peut modifier après coup la liste
     des dépôts d'un jeton).
- Panne : « Claude ignore une règle », « Permission refusée », « Contexte saturé ».
- Livraison v0.2 : `CLAUDE.md`, `.claude/settings.json`, un Skill dans `.claude/skills`, case « Synchronisation
  FORMA-8 activée ».
- Sources à ouvrir et dater (titres attendus en français, adresses exactes à trouver, ne jamais les deviner) : Claude
  Code « Comment Claude se souvient de votre projet », « Explorez la fenêtre de contexte », « Configurer les
  autorisations », « Choisir un mode d'autorisation », « Étendre Claude avec des skills », « Connecter Claude Code à
  des outils via MCP », « Configurer les environnements cloud » ; GitHub Docs « Jetons d'accès personnel ».
  L'index des pages en français : https://code.claude.com/docs/_llms/fr.txt.
- **Centrale** : le caisson 02 a 6 protocoles, donc 6 prises sur sa centrale (angles calculés par `socketAngle`) ;
  vérifier la scène avec 6 prises sur un écran d'iPhone (prise la plus éloignée de la jauge, repères P1 à P6).
- **Répliques** : réécrire `demi` et `reveil` du Règlement de bord dans `src/content/equipe.json` avec le vocabulaire
  du caisson 02 (première personne, « tu ») ; ajouter au champ `watch` les mots techniques nouveaux que le caisson 01
  n'emploie pas. **Puis les enregistrer** avec la voix de Paul K (3.18, méthode d'enregistrement ; `demi` et `dort`
  chuchotés) : dès que le caisson a des protocoles, le validateur les demande. Vérifier les crédits avant.
- **Méthode qui a marché** : ouvrir chaque source (`curl -L`) pour relever l'adresse finale et le titre exact, puis la
  lire ; libellés anglais dans les pages `/en/` ; captures à la taille d'un iPhone ; donner un mode aux simulateurs
  pour ne jamais montrer un geste avant sa notion ; regarder chaque écran en capture.
- **Banc d'essai** : `tests/e2e/caisson02.spec.ts`, sur le modèle de `caisson01.spec.ts` (caissons 00 et 01 déposés
  au démarrage ; `dismissCeremonies()` après la panne) ; mettre à jour les compteurs de notions des bancs 00 et 01.
- Mettre à jour ce document dans la même PR ; commande complète verte ; commit en français ; **une PR vers `main`** ;
  attendre le robot vert ; annoncer ; ne plus rien pousser ensuite.

### 5.3 À faire côté propriétaire (à lui rappeler, sans urgence)
- **Essayer la remise en ordre au doigt** sur https://felipemaciasito-cmyk.github.io/FORMA-8/ après la fusion du
  correctif (par exemple caisson 00, protocole 2, ou caisson 01) ; si rien ne change, fermer complètement l'appli et la
  rouvrir. Le fond sonore se règle avec le haut-parleur de la barre du haut.
- **Écouter les voix de l'équipe** sur la version en ligne (bouton silencieux coupé ou écouteurs) et noter ce qui ne
  va pas, personnage par personnage.
- **Abonnement ElevenLabs Starter** : facturé chaque mois tant qu'il n'est pas résilié. Il ne sert qu'à enregistrer de
  nouvelles répliques (environ 2 par caisson écrit) ; les voix déjà enregistrées restent dans l'appli et gardent leur
  licence commerciale (aide d'ElevenLabs, voir fin de 3.18). Sa décision (garder ou résilier) est attendue.
- **Ne fusionner une PR qu'après l'annonce « robot vert »** dans la conversation (la PR #13 a été fusionnée avant).
- Noter tout libellé de GitHub du caisson 01 qui ne correspond pas à l'appli.
- **Créer la clé API Claude** : Console Claude, espace de travail dédié avec plafond de dépense mensuel, achat de
  crédits (montant minimum à vérifier), clé collée dans Réglages. Elle sert à « Demander à ORA », à la notation
  « avec tes mots », aux consignes et aux rapports de bug.
- Le jeton GitHub « fine-grained » sera enseigné au caisson 02, protocole 6 ; il n'est pas obligatoire pour vérifier un
  dépôt public.
- Après la fusion de chaque PR, supprimer la branche de la session (bouton « Delete branch » en bas de la PR
  fusionnée) : la session ne peut pas le faire elle-même.

### 5.4 Ensuite
- Caissons 03 à 10, dans l'ordre de `docs/PROGRAMME.md`, une PR par caisson, chacun avec son banc d'essai.
- Caisson 07 : choisir le service de données et de comptes à partir de sources vérifiées à ce moment-là.
- Caissons 06, 07, 08 et 10 : vérifier et dater les tarifs et les offres au moment de l'écriture.

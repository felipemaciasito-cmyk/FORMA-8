# FORMA-8 · Réveille l'équipe : document de transfert (état au 15/11/2026, après la refonte)

> À lire en entier au démarrage de chaque nouvelle session (renvoi dans `CLAUDE.md`). Ce document complète
> `CLAUDE.md`, `docs/CONCEPTION.md` et `docs/PROGRAMME.md`. En cas d'écart, le code du dépôt fait foi :
> signaler l'écart au propriétaire. Mettre ce document à jour à la fin de chaque lot, dans la même PR.

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
  l'interface (mise en ligne n° 6 réussie le 15/11/2026 à 02:27 UTC). Caissons 02 à 10 « en préparation ».
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

---

## 3. État actuel et éléments validés

### 3.1 Git, PR et mise en ligne
- `origin/main` = **`b96f074`** (« Merge pull request #9 », la refonte de l'interface), vérifié le 15/11/2026.
  Avant : `ccb28cf` (PR #8, caisson 01), `79c1061` (PR #7, premier document de transfert), `9ac4f20` (PR #6).
- PR, toutes fusionnées par le propriétaire :
  - #1 socle ; #2 et #3 lots 2 et 3 (fusionnés par erreur dans des branches intermédiaires) ; #4 lots 2 et 3 vers
    `main` (fermée automatiquement) ; #5 outils d'apprentissage ; #6 contenu du caisson 00 ; #7 document de transfert ;
  - #8 caisson 01 (14/11/2026) ;
  - #9 refonte de l'interface, option B (15/11/2026, 5 commits : 3 de prototype, puis la nouvelle règle visuelle et
    la fin de la refonte).
  - La PR qui ajoute la présente version de ce document suit la #9.
- Branches distantes au 15/11/2026 : `main` et `claude/charming-darwin-rxq6b5` (branche de cette session, entièrement
  fusionnée ; le propriétaire peut la supprimer). Les anciennes branches fusionnées ont été supprimées par lui.
- Workflows :
  - `.github/workflows/ci.yml` (« Vérifications FORMA-8 », job `verifier`, sur chaque PR, Node 22) : récupère FORMA-7
    dans `forma-7`, puis lance toutes les vérifications et les tests de bout en bout ;
  - `.github/workflows/deploy.yml` (sur envoi vers `main`) : construit l'appli et la publie sur GitHub Pages.
- GitHub Pages : Source « GitHub Actions ». Dernière mise en ligne : n° 6, réussie (15/11/2026, 02:27 UTC).

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
  - https://claude.ai/artifact/MnHHKo1GFejYPRgL63UZwF : les quatre propositions de kW gagnés (voir 4.2).
  - Méthode pour en refaire (les scripts de cette session ne sont pas dans le dépôt) :
    1. construire chaque version : `npx vite build --base ./ --outDir <dossier>` (une copie de travail par version,
       par exemple `git worktree add`, avec `node_modules` en lien symbolique) ;
    2. dans chaque dossier : supprimer `sw.js`, `workbox-*.js`, `registerSW.js`, `manifest.webmanifest` et leurs
       balises dans `index.html` (un service worker est refusé dans une page privée) ; ne garder que les polices
       `.woff2` latin et latin-ext ;
    3. remplacer dans `assets/claude-*.js` le caractère U+FFFD littéral (dans un gabarit `` `…` ``) par son échappement
       `�` : sinon la publication est refusée ;
    4. injecter avant `<title>` un script qui dépose une progression de démonstration dans
       `localStorage["forma8:progress-secours"]` si `localStorage["forma8:demo-v1"]` est absent (l'appli la fusionne au
       démarrage) ;
    5. publier une page à onglets (un `iframe` par version) avec l'outil Artifact, en passant chaque fichier dans
       `files` ; ajouter un bouton qui efface les clés `forma8:` et la base IndexedDB `keyval-store` pour rejouer.

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
- `addEnergy(amount, label?, { quiet? })` : émet `gain` ; une montée de grade émet `levelup` (plus de bandeau
  « Accréditation » : la cérémonie l'annonce).
- Événements `fx()` : `toast`, `burst`, `badge` (repris de FORMA-7) ; `gain` (avec `quiet`), `levelup`, `awaken`,
  `stepdone`, `payout` (FORMA-8).
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
  **attend la fin du protocole**, puis s'illumine ; flamme qui bat ; notions à réviser), onglets, toasts, éclats,
  feuille du bas, `TopBar`.
- `Exercises.tsx` : six types d'exercices ; tampon « RÉUSSI », **série de bonnes réponses**.
- `SettingsView.tsx` : Claude, GitHub et dépôt de données, synchronisation, héritage FORMA-7, sauvegarde,
  installation, à propos. `Boot.tsx` : BIOS, accueil d'ORA, levier ; écran de reprise à chaque ouverture.

### 3.9 Personnages, récompenses et cérémonies (refonte du 15/11/2026)
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
  est écrit.
- `src/components/Rewards.tsx` (`RewardLayer`, monté dans `App.tsx`) :
  - jaillissements de kW (`JetView`) : pendant un protocole, un petit « +10 kW » jaillit du doigt et file dans la
    barre d'énergie ; en fin de protocole, le total jaillit en grand (`payout`) et rejoint le compteur ; ailleurs
    (maintenance, atelier, livraison, panne), les kW rejoignent directement le compteur ;
  - cérémonie de montée de grade plein écran (hors protocole) ; scène de réveil (5 phases : endormi, courant,
    vitre qui se lève avec éclair, réplique écrite lettre à lettre, récompense ; passable d'un toucher ; rejouable
    depuis la fiche du membre) ;
  - langage visuel commun : `Shockwave` (onde de choc), `Sparks` (éclats), `Rays` (rayons) ;
  - file d'attente : le réveil passe en premier ; jamais de cérémonie au milieu d'une leçon, d'une panne ou d'une
    maintenance (`busyRoute`) ; plusieurs grades d'un coup : une seule cérémonie.
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
  `teamFile` ; **règle 10 : répliques de l'équipe** ; zéro emoji. Un caisson vide donne un avertissement.
- Tests unitaires : **34** (`merge` 8, `garde-fous` 8, `livraisons` 9, `validateur` 7, `energie` 2). Garde-fous :
  aucune écriture sous `forma7:`, `progress.json` jamais touché, clés `forma8:` uniquement, substitutions documentées,
  aucun simulateur de FORMA-7, aucun usage de `Art`.
- Tests de bout en bout : **9**, écran d'iPhone 13, `vite preview` sur `http://localhost:4173/FORMA-8/` :
  `socle.spec.ts` (5), `mecaniques.spec.ts` (2), `caisson00.spec.ts` (banc complet, environ 1,2 min),
  `caisson01.spec.ts` (banc complet, environ 1,5 min ; part d'un caisson 00 réveillé déposé dans
  `forma8:progress-secours`). `helpers.ts` : `boot()`, `solve()`, `playStep(page, caisson, protocole, numéro,
  onBlock?)`, `playMaintenance()`, `dismissCeremonies()`.
- Dernier passage complet : 15/11/2026, tout vert, en local et dans la CI de la PR #9.

### 3.13 Tarifs et coûts (vérifiés le 14/11/2026, à revérifier)
- API, en dollars par million de tokens (envoyés / reçus) : Opus 5.5 : 4 / 20 ; Sonnet 5.5 : 2 / 10 ;
  Haiku 5.5 : 0,10 / 0,50. Usage estimé du joueur : environ 8 $ par mois avec Opus, 4 $ avec Sonnet, moins de 0,50 $
  avec Haiku (estimation).
- Max et Ultra incluent 100 $ et 200 $ de crédits API ; Pro n'en inclut pas (peut avoir évolué).

### 3.14 Dettes et incertitudes connues
- **Refonte pas encore jouée par le propriétaire sur un vrai iPhone** (tests sur un iPhone 13 simulé seulement) :
  fluidité des animations sur un iPhone ancien, son, taille des personnages, lisibilité. Lui demander son retour.
- La barre d'énergie ne compte que les kW gagnés depuis l'ouverture du protocole : un protocole repris après fermeture
  repart d'une barre vide (le compteur du haut, lui, a tout).
- Durées des protocoles : estimation à 0,85 min par bloc, à ajuster avec l'usage réel.
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

---

## 5. Prochaine action immédiate

### 5.1 Au démarrage de la nouvelle session (avant toute écriture)
1. Lire en entier `CLAUDE.md`, ce document, `docs/CONCEPTION.md` et `docs/PROGRAMME.md`.
2. `git fetch origin`. Vérifier que `origin/main` contient `b96f074` (refonte, PR #9) et la PR de ce document ; si
   autre chose a changé, le dire au propriétaire.
3. Attacher `felipemaciasito-cmyk/forma-7` (public, lecture seule) et le cloner **à côté** de FORMA-8, sous le nom
   `forma-7`, **en entier** (sans `--depth`), pour `check:parity` et l'étude de cas.
4. `npm ci`, puis la commande complète de vérification. Annoncer le résultat en quelques lignes : l'état de départ
   doit être entièrement vert.
5. Demander au propriétaire, en QCM, son retour sur la refonte jouée sur son iPhone (fluidité, son, lisibilité,
   personnages, kW). Corriger d'abord ce qu'il signale ; pour un changement visuel important, maquette d'abord.
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
- **Répliques** : réécrire `demi` et `reveil` du Règlement de bord dans `src/content/equipe.json` avec le vocabulaire
  du caisson 02 ; ajouter au champ `watch` les mots techniques nouveaux que le caisson 01 n'emploie pas.
- **Méthode qui a marché** : ouvrir chaque source (`curl -L`) pour relever l'adresse finale et le titre exact, puis la
  lire ; libellés anglais dans les pages `/en/` ; captures à la taille d'un iPhone ; donner un mode aux simulateurs
  pour ne jamais montrer un geste avant sa notion ; regarder chaque écran en capture.
- **Banc d'essai** : `tests/e2e/caisson02.spec.ts`, sur le modèle de `caisson01.spec.ts` (caissons 00 et 01 déposés
  au démarrage ; `dismissCeremonies()` après la panne) ; mettre à jour les compteurs de notions des bancs 00 et 01.
- Mettre à jour ce document dans la même PR ; commande complète verte ; commit en français ; **une PR vers `main`** ;
  attendre le robot vert ; annoncer ; ne plus rien pousser ensuite.

### 5.3 À faire côté propriétaire (à lui rappeler, sans urgence)
- **Jouer la nouvelle version** sur https://felipemaciasito-cmyk.github.io/FORMA-8/ (Safari ou écran d'accueil ; si
  rien ne change, fermer complètement l'appli et la rouvrir) et dire ce qui rame ou gêne.
- Noter tout libellé de GitHub du caisson 01 qui ne correspond pas à l'appli.
- **Créer la clé API Claude** : Console Claude, espace de travail dédié avec plafond de dépense mensuel, achat de
  crédits (montant minimum à vérifier), clé collée dans Réglages. Elle sert à « Demander à ORA », à la notation
  « avec tes mots », aux consignes et aux rapports de bug.
- Le jeton GitHub « fine-grained » sera enseigné au caisson 02, protocole 6 ; il n'est pas obligatoire pour vérifier un
  dépôt public.
- Il peut supprimer la branche fusionnée `claude/charming-darwin-rxq6b5` sur GitHub.

### 5.4 Ensuite
- Caissons 03 à 10, dans l'ordre de `docs/PROGRAMME.md`, une PR par caisson, chacun avec son banc d'essai.
- Caisson 07 : choisir le service de données et de comptes à partir de sources vérifiées à ce moment-là.
- Caissons 06, 07, 08 et 10 : vérifier et dater les tarifs et les offres au moment de l'écriture.

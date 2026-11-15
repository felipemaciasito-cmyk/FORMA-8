# FORMA-8 · Réveille l'équipe : document de transfert (état au 15/11/2026)

> À lire au démarrage de chaque nouvelle session (renvoi dans `CLAUDE.md`). Ce document complète
> `CLAUDE.md`, `docs/CONCEPTION.md` et `docs/PROGRAMME.md`. En cas d'écart, le code du dépôt fait foi :
> signaler l'écart au propriétaire. Mettre ce document à jour à la fin de chaque lot.

---

## 1. Objectif et contexte

### 1.1 Le propriétaire
- Il n'est pas développeur et travaille uniquement dans Safari sur iPhone et iPad : ni ordinateur, ni appli Claude.
- Lui répondre en français, en le tutoyant, simplement. Les questions se posent en QCM (outil de questions),
  et chaque question doit se comprendre seule.
- Ses objectifs : **en faire un métier** et **lancer un produit**. Il a 15 à 30 minutes par jour. Il ne lit pas l'anglais.
- Abonnement Claude **Pro**, donc sans crédits API inclus.
- Diagnostic du 14/11/2026, profil « pilote débutant » :
  - il survolait les diffs sans les lire ;
  - Git : 1 ou 2 sur 4 ;
  - il n'a jamais mis un site en ligne seul ;
  - il n'a jamais créé de jeton GitHub ;
  - il n'a jamais utilisé d'outil de débogage.
- Préférences permanentes d'honnêteté :
  - signaler toute incertitude (« je ne suis pas certain », « à vérifier ») ;
  - ne jamais inventer une source, une URL, un chiffre ou une citation ;
  - signaler ce qui a pu évoluer depuis la dernière vérification ;
  - citer des sources réelles avec leur date de vérification.

### 1.2 FORMA-7, le projet précédent (référence et étude de cas)
- PWA ludique pour apprendre l'IA : un « datacenter » à rallumer (7 salles plus 1 bonus), avec un guide, ORA, et 53 notions.
- Dépôt public `felipemaciasito-cmyk/forma-7`. Sa base Vite est `/FORMA-7/`, donc l'adresse probable est
  https://felipemaciasito-cmyk.github.io/FORMA-7/ (à confirmer).
- Construit en 20 h environ, en 6 commits envoyés directement sur `main`, sans tests ni CLAUDE.md.
  C'est une étude de cas : on n'en reprend jamais le contenu.
- Dépôt privé `felipemaciasito-cmyk/forma-7-data`. Il contient `PIPELINE.md`, `README.md`, `config.json`, `index.json`,
  `missions/j1-2026-11-13.json` et `processed.json`. Il n'a **pas de dossier `progress/`**, car le jeton de
  synchronisation de FORMA-7 n'a jamais été créé.

### 1.3 FORMA-8 · « Réveille l'équipe »
- PWA pour apprendre le vibe coding (créer des applications avec l'IA, avec Claude Code), de débutant à expert.
- Exigences pédagogiques : très ludique, très guidée, animée, interface soignée, zéro zone de flou, outils interactifs.
- Univers :
  - le datacenter de FORMA-7 est rallumé ;
  - dans sa réserve dorment **11 membres de l'équipe**, un par caisson, et chacun incarne un vrai savoir-faire de Claude Code ;
  - le joueur passe d'apprenti à chef d'orchestre d'agents.
- **Un caisson = un membre = un niveau = une version du produit fil rouge** (v0.0 à v1.0). Chaque niveau se termine
  par une **vraie livraison en ligne**, vérifiée automatiquement sur GitHub.
- Produit fil rouge : choisi dans l'appli, grâce à l'atelier guidé du caisson 00. Pistes : appli grand public,
  outil pour les pros, appli avec IA intégrée.
- Dépôt : `felipemaciasito-cmyk/FORMA-8` (public, vérifié).
- En ligne : **https://felipemaciasito-cmyk.github.io/FORMA-8/**. Les caissons 00 et 01 sont jouables ; les caissons
  02 à 10 sont affichés « en préparation ». La refonte de l'interface (option B, voir 3.3 et 3.15) arrive par sa PR.
- Volume prévu : environ 60 protocoles et 140 notions, soit environ 6 à 10 mois à 15-30 min par jour (estimation).

---

## 2. Règles et contraintes strictes

### 2.1 Règles du propriétaire (brief initial, toujours en vigueur)
- « Ne fais jamais d'action destructive ou difficile à annuler sans mon accord explicite : supprimer une branche,
  fusionner des branches, contourner une règle de sécurité. » Pas d'envoi direct sur `main` sans son accord.
- Commits en français, avec les lignes d'attribution fournies par le système.
- Pull requests : une par lot (demande générale du propriétaire, voir 2.3).
- **Ne jamais modifier `progress/progress.json`** de FORMA-7-data : il appartient à FORMA-7.
- Jeton GitHub et clé API : sur les appareils du joueur uniquement. Jamais dans le code, les commits ou les journaux.
- **Tout écart visuel par rapport à FORMA-7 doit être validé explicitement AVANT d'être fait.**
- Pas de logos de marques.
- **Aucun contenu de FORMA-7** : « Je ne veux reprendre aucun contenu de FORMA-7, tout doit reposer sur de nouvelles
  sources (anthropic et autres) ». FORMA-8 enseigne tout elle-même, indépendamment de FORMA-7.
- Ambition : « vérifies que tous les meilleurs outils prévus pour l'apprentissage soient disponibles et parfaitement
  fonctionnels afin de délivrer un apprentissage extrêmement ludique et guidé de façon précise. Sois ambitieux ! »

### 2.2 Règles du dépôt (`CLAUDE.md`)
1. **Zéro emoji** dans l'appli et le contenu. Uniquement les icônes maison : `src/components/glyphs.ts`, identifiants
   dans `src/content/icon-ids.json`. Contrôle : `npm run check:emoji`.
2. **Zéro zone de flou.** Toute notion a une fiche à 3 niveaux, une analogie, un exemple et des prérequis, et elle est
   définie avant d'être utilisée. Les termes s'écrivent `[[id]]` ou `[[id|texte]]`. Contrôle : `npm run validate`.
3. **Identité visuelle : même palette, mêmes polices que FORMA-7** (option B, choisie le 15/11/2026).
   - Les variables de `:root` de `src/styles/app.css` (couleurs, rayons, polices) restent identiques à FORMA-7.
   - Écrans, composants et animations peuvent évoluer ; tout nouveau changement visuel important se montre d'abord
     au propriétaire (maquette ou captures) et attend son accord.
   - Glyphes et identifiants d'icônes : ajout seulement, dans le même style (grille de 24, trait de 1,8, coins arrondis).
   - Contrôle : `npm run check:parity` (variables de `:root`, glyphes, couleur de thème, polices).
4. **Stockage** : toutes les clés commencent par `forma8:`. Ne jamais écrire sous `forma7:` (lecture seule, dans `src/lib/forma7.ts`).
5. **Synchronisation** dans `progress/forma-8.json` de FORMA-7-data. Ne jamais toucher `progress/progress.json`.
6. **Secrets** : uniquement sur l'appareil du joueur.
7. **Vocabulaire** :
   - « équipe », jamais « équipage » ;
   - dans le code, un caisson (niveau) est un `Room`, un protocole de réveil (leçon) un `Step`, une panne un `Incident`.
8. **Sources** : documentation officielle, en français quand elle existe (`https://code.claude.com/docs/fr/`), citée
   avec sa date de vérification. Aucun cours tiers copié ou traduit mot pour mot.
9. **Aucun contenu de FORMA-7.**
   - Seules la palette, les polices et la mécanique de jeu viennent de FORMA-7.
   - Illustrations : uniquement `src/components/Illustrations.tsx` et les personnages de `src/components/Crew.tsx`.
     `Art.tsx` (illustrations de FORMA-7) a été retiré le 15/11/2026 ; un test garde-fou vérifie qu'il ne revient pas.
   - Chaque caisson doit passer son banc d'essai de bout en bout (modèle : `tests/e2e/caisson01.spec.ts`).

### 2.3 Méthode de travail établie
- Une **branche par lot**, créée depuis `origin/main`, et une **PR par lot, qui cible directement `main`**.
  Jamais de PR empilées (erreur commise avec les PR #2 et #3).
- Pousser uniquement sur la branche autorisée par l'environnement de la session. Si l'environnement impose un nom, l'utiliser.
- Avant toute PR, cette commande doit passer entièrement :

```bash
npm run validate && npm run check:emoji && npm run check:parity && npm run typecheck && npm test && npm run build && npx playwright test --trace off
```

  `check:parity` a besoin de FORMA-7 cloné à côté (`../forma-7` ou `../FORMA-7`), ou de l'option `--forma7 <dossier>`.
- **Annoncer clairement au propriétaire quand une PR est prête, et lui demander de ne fusionner qu'après cette annonce.**
  La PR #5 avait été fusionnée trop tôt, ce qui a obligé à ouvrir la PR #6.
- Après une PR, proposer de la surveiller. Se désabonner une fois la PR fusionnée.
- Aucun identifiant de modèle dans les commits, les PR ou le code, sauf dans les lignes d'attribution du système.
- Lignes d'attribution : celles de la nouvelle session. Pour mémoire, l'ancienne session terminait ses commits par :
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` et `Claude-Session: https://claude.ai/code/session_012Fxm7ytQCzYDiyoRfZtKUA`.
  Ses PR se terminaient par le pied fourni par le système (lien Claude Code et lien de session).
- Toute procédure destinée au joueur doit être faisable **dans Safari sur iPhone** (github.com et claude.ai/code).
- Dans le conteneur cloud, Chromium et Playwright sont préinstallés : ne pas lancer `playwright install`.
  La CI GitHub l'installe elle-même.

---

## 3. État actuel et éléments validés

### 3.1 Git, PR et mise en ligne
- `origin/main` = `ccb28cf` (« Merge pull request #8 », le caisson 01), vérifié le 15/11/2026.
  Avant : `79c1061` (PR #7, ce document), puis `9ac4f20` (« Merge pull request #6 »). Les commits avant lui :
  - `e12fc8c` : contenu du caisson 00 et banc d'essai ;
  - `c882962` : fusion de la PR #5 ;
  - `f14df24` et `58e0879` : outils ;
  - `e18dca5` : fusion de la PR #3 ;
  - `2601276` : fusion de la PR #1.
- Les PR, toutes fusionnées par le propriétaire :
  - #1 : socle ;
  - #2 et #3 : lots 2 et 3, fusionnés par erreur dans des branches intermédiaires ;
  - #4 : lots 2 et 3 vers `main`, fermée automatiquement ;
  - #5 : outils d'apprentissage ;
  - #6 : contenu du caisson 00 ;
  - #7 : ce document de transfert ;
  - #8 : caisson 01 (fusionnée le 14/11/2026, vérifications vertes).
- **PR de la refonte de l'interface (option B)** : depuis la branche `claude/charming-darwin-rxq6b5` (nom imposé par
  l'environnement de la session), vers `main`.
- Le 15/11/2026, le propriétaire a été invité à supprimer les branches déjà fusionnées (`claude/forma8-c00`,
  `claude/forma8-lot2-mecaniques`, `claude/forma8-programme`, `claude/new-session-wuj1q9`, `claude/forma8-transfert`) ;
  vérifier lesquelles restent. **Ne jamais en supprimer soi-même sans accord.**
- Workflows :
  - `.github/workflows/ci.yml` (« Vérifications FORMA-8 », sur chaque PR, Node 22) : récupère FORMA-7 dans `forma-7`,
    puis lance toutes les vérifications et les tests de bout en bout ;
  - `.github/workflows/deploy.yml` (sur envoi vers `main`) : construit l'appli et la publie sur GitHub Pages.
- GitHub Pages : Source « GitHub Actions », activée par le propriétaire. La mise en ligne n°3 a réussi.

### 3.2 Pile technique
- Vite 8, React 19, TypeScript 6, motion 14 (`motion/react`), idb-keyval.
- Polices : @fontsource Space Grotesk et JetBrains Mono.
- vite-plugin-pwa 2.
- `@anthropic-ai/sdk` ^1.8, chargé à la demande, avec `dangerouslyAllowBrowser`.
- `@playwright/test` 1.63.0.
- Base `/FORMA-8/`. `tsconfig.json` contient `allowImportingTsExtensions: true`, pour que Node importe `./gh-core.ts`.
- Scripts npm :
  - `dev`, `validate`, `check:emoji`, `check:parity`, `typecheck` ;
  - `test` (`node --test tests/unit/*.test.mjs`), `test:e2e` ;
  - `build` (validate, emoji, puis vite build), `preview`.

### 3.3 Identité visuelle (règle depuis le 15/11/2026)
- Choix du propriétaire, après des maquettes jouables comparant trois versions (actuelle, option A « enrichir sans
  toucher au socle », option B « tout libérer ») : **option B**.
- `scripts/design-parity.json` : plus aucun fichier « exact » ni substitution. Le contrôle vérifie :
  - les 30 variables `:root` de `src/styles/app.css` : identiques à FORMA-7 (palette, rayons, polices) ;
  - `glyphs.ts` et `icon-ids.json` : ajout seulement ;
  - les réglages obligatoires : couleur de thème `#04060c`, `black-translucent`, polices Space Grotesk et
    JetBrains Mono importées dans `src/main.tsx`.
- Fichiers autrefois figés, désormais modifiés : `Chrome.tsx` (barre du haut : jauge vers le prochain grade, compteur
  qui défile et attend la fin du protocole, flamme qui bat) et `Exercises.tsx` (tampon « Réussi », série de bonnes
  réponses). `Art.tsx` est retiré.
- Historique, pour mémoire : jusqu'au 15/11/2026, les fichiers suivants étaient identiques à FORMA-7, avec les seules
  substitutions ci-dessous.
- Fichiers « ajout seulement » : `glyphs.ts` et `icon-ids.json`. 10 glyphes ajoutés : rocket, search, branch, bug,
  server, globe, coins, code, team, capsule.
- Substitutions validées le 14/11/2026 :
  - `Boot.tsx` : lignes du BIOS (« FORMA-8 · BIOS v8.0.26 », « Datacenter FORMA-7 .......... EN LIGNE »,
    « Caissons détectés ........... 11 », « Équipe réveillée ............ 0 % », « [ALERTE] Équipe en sommeil. »),
    écran de reprise, accueil d'ORA (11 membres d'équipe, ton propre produit) et phrase du levier ;
  - `Exercises.tsx` : préfixe `forma8:brouillon:` ;
  - noms et descriptions dans `index.html` et `vite.config.ts` ;
  - icône de l'appli avec le chiffre 8.
- Écart visuel validé le 14/11/2026 : les tuiles « caissons » (capsules) posées sur la même dalle isométrique que FORMA-7.
- Maquettes (pages privées, à jour au 15/11/2026, pour le propriétaire) :
  - comparaison des trois versions : https://claude.ai/artifact/XfDNr2NXi6gKk3aVtrMNww ;
  - quatre propositions pour les kW gagnés : https://claude.ai/artifact/MnHHKo1GFejYPRgL63UZwF.
  Méthode, à réutiliser pour tout nouveau changement visuel : construire chaque version avec
  `npx vite build --base ./ --outDir <dossier>`, retirer le service worker (refusé dans une page privée), réduire les
  polices aux sous-ensembles latin et latin-ext, déposer une progression de démonstration dans
  `forma8:progress-secours`, puis publier les dossiers dans une page à onglets (un `iframe` par version).
  Attention : le module du SDK Claude contient un caractère U+FFFD littéral, refusé à la publication ; le remplacer par
  son échappement `\uFFFD` (même texte).

### 3.4 Données, stockage et synchronisation
- Stockage local :
  - IndexedDB `keyval-store` / `keyval`, partagé avec FORMA-7 (même origine `felipemaciasito-cmyk.github.io`) ;
  - clés `forma8:progress`, `forma8:settings`, `forma8:sync`, `forma8:heritage`, `forma8:brouillon:*` ;
  - plus une copie de secours synchrone `forma8:progress-secours` dans localStorage.
- `src/lib/store.ts` :
  - la progression contient `product{name,pitch,owner,repo,at}`, `deliveryChecks`, `deliveries`, `consignes`, `reports` ;
  - enregistrement différé de 250 ms ;
  - `flush()` à la fermeture (pagehide, ou page masquée) écrit la copie de secours ;
  - `initStore` fusionne cette copie, puis la supprime. C'est le correctif du produit perdu au rechargement.
- `src/lib/merge.ts`, fusion sans perte :
  - une vérification réelle l'emporte sur une case cochée à la main ;
  - pour les livraisons, la date la plus ancienne est gardée ;
  - pour les consignes et les rapports, la meilleure note est gardée ;
  - pour le produit, la version la plus récente (`at`) est gardée.
- `src/lib/sync.ts` : fichier `progress/forma-8.json` de FORMA-7-data, via l'API GitHub, avec un jeton « fine-grained ».
- `src/lib/forma7.ts`, héritage en lecture seule :
  - lit `forma7:progress` en local, sinon `progress/progress.json` par une simple lecture (GET) ;
  - affiche les grades et badges de FORMA-7 en souvenir, sans effet sur l'apprentissage.
- Sur iOS, une appli ajoutée à l'écran d'accueil a un stockage séparé de celui de Safari (comportement de WebKit).

### 3.5 GitHub et livraisons
- `src/lib/gh-core.ts` : `repoUrl`, `apiHeaders(token)`, `ghError`.
- `src/lib/github.ts` : `ghHeaders()`, `testGithub()`.
- `src/lib/checks.ts` : fonction pure `evaluateCheck(check, product, deps)`. Les points d'accès appelés :
  - `file` : `contents/<path>` ;
  - `commits` : `commits?per_page=100` ;
  - `pullsMerged` : `pulls?state=closed&per_page=100` ;
  - `workflow` ;
  - `pages` : `pagesUrl` = `https://{owner en minuscules}.github.io/{repo}/` (même origine que FORMA-8, donc pas de CORS) ;
  - `manual` : case à cocher par le joueur.
- `src/lib/delivery.ts` : `verifyDelivery`, `toggleManual`, `deliveryState`, `checkKey`. Une livraison complète rapporte `REWARD.delivery`.
- Un dépôt public se vérifie sans jeton : le banc d'essai le fait.

### 3.6 Claude dans l'appli (indispensable)
- La clé API est saisie dans Réglages et reste sur l'appareil.
- Modèles (`src/lib/models.ts`) : `claude-opus-5-5` par défaut, `claude-sonnet-5-5`, `claude-haiku-5-5`.
- `src/lib/claude.ts` : une fonction `ask()` avec sorties structurées et repli. Fonctions :
  - `testKey` ;
  - `gradeFeynman`, `reexplain` ;
  - `gradeConsigne` : 5 critères et une version améliorée ;
  - `gradeBugReport` ;
  - `suggestIdeas` ;
  - `askOra(question, lesson, known)` : répond à partir de la leçon et des notions déjà connues.

### 3.7 Mécanique de jeu (`src/lib/game.ts`, `src/lib/progress.ts`)
- Énergie en kW.
- Grades : Recrue 0, Apprenti 150, Opérateur 400, Pilote 800, Chef d'atelier 1300, Chef d'équipe 1900, Commandant 2600,
  Chef d'orchestre 3400.
- Récompenses ajoutées : livraison 150, consigne 15, rapport 25.
- Maintenance : Leitner à 5 boîtes. Uptime en jours. 3 fusibles par panne.
- Badges :
  - boot, room1, half (6 caissons), all (11 caissons), nofuse ;
  - up3, up7, maint, base20, feyn ;
  - skill, livraison1, plume (consigne notée 85 ou plus), detective (rapport noté 80 ou plus).
  - Le badge « signal » de FORMA-7 a été retiré.
- Réglages de progression :
  - `roomReady` : un caisson sans protocole est « en préparation » ;
  - `roomComplete` exige `roomReady` ;
  - `totalPower` fait la moyenne sur les 11 caissons.

### 3.8 Écrans
- `MapView.tsx` :
  - frise du produit (`ProductTimeline`) : une version par membre, de v0.0 à v1.0, livrées en vert ;
  - carte des 11 capsules, avec le visage du membre dans le hublot (endormi, réveillé, silhouette si verrouillé)
    et l'étiquette « Prochain réveil » ;
  - bouton « Ton équipe » ;
  - **Quart du jour** (`QuartPanel`, `quartActions`) : maintenance, reprise, panne, livraison, avec durées estimées.
- `RoomView.tsx` :
  - écrans caisson, protocole et panne (routes `#/caisson/<id>`, `#/caisson/<id>/<step>`, `#/panne/<id>`) ;
  - caisson : héros (`CaissonHero` : le membre dans sa capsule, son métier, ce qu'il dit) et chemin des protocoles
    (`QuestNode`, durée estimée `stepMinutes`, énergie à gagner) ;
  - protocole : bandeau du membre qui sourit à chaque réussite et jauge par blocs (`StepMeter`), programme du
    protocole (`StepBriefing`), barre d'énergie (`EnergyBar`), cérémonie de fin plein écran (sous la barre du haut)
    avec jaillissement du total (`EnergyPayout`), nouveau grade, notions gagnées et bouton « Relire le protocole » ;
  - `DeliveryCard` ;
  - bouton **Demander à ORA** dans la barre du protocole.
- `Views.tsx` :
  - Base : notions, portfolio exportable en Markdown, panneau Héritage FORMA-7 ;
  - Maintenance ;
  - Atelier des consignes ;
  - Équipe : galerie des 11 membres et fiche en feuille du bas (capsule, réplique, vrai fichier à vérifier dans le
    dépôt du produit, « Revoir son réveil ») ;
  - Base : notions rangées par membre (avancement par caisson) et voyants de la boîte de révision.
- `SettingsView.tsx` : Claude (indispensable), GitHub et dépôt de données, synchronisation, Héritage FORMA-7,
  sauvegarde, installation, à propos.

### 3.9 bis Personnages, récompenses et cérémonies (refonte du 15/11/2026)
- `src/components/Crew.tsx` : les 11 membres en SVG, dans le style d'ORA (ORA reprend son propre dessin pour c00).
  États `locked` (silhouette), `asleep` (yeux fermés, respiration, « z »), `awake` (yeux allumés, clignements),
  humeur `happy`. `CrewCapsule` : le membre dans sa capsule (vitre givrée qui se lève au réveil). `MemberSays` : bulle
  de réplique.
- `src/content/equipe.json` : pour chaque caisson, `role`, `dort` (affichés dès le début du jeu), `demi` (après le premier
  protocole), `reveil` (caisson terminé). Le validateur vérifie qu'elles n'emploient aucune notion inconnue à ce moment.
- `src/components/Rewards.tsx` (`RewardLayer`, monté dans `App.tsx`) :
  - jaillissements de kW (`JetView`) : pendant un protocole, un petit « +10 kW » jaillit du doigt et file dans la barre
    d'énergie ; en fin de protocole, le total jaillit en grand (`payout`) et rejoint le compteur du haut, qui
    s'illumine ; ailleurs, les kW rejoignent directement le compteur ;
  - cérémonie de montée de grade plein écran (hors protocole ; pendant un protocole, le grade s'annonce dans sa
    cérémonie de fin) ; scène de réveil d'un membre (5 phases, passable d'un toucher) ;
  - langage visuel commun : `Shockwave` (onde de choc), `Sparks` (éclats), `Rays` (rayons).
  - Les cérémonies ne s'ouvrent jamais au milieu d'une leçon, d'une panne ou d'une maintenance (`busyRoute`).
- `src/lib/energy.ts` : la barre d'énergie d'un protocole (`held` : kW pas encore montrés dans le compteur,
  `landed` : kW arrivés dans la barre). Présentation seulement : la progression enregistre chaque kW tout de suite.
- Événements ajoutés à `fx()` (`src/lib/game.ts`) : `gain` (avec `quiet`), `levelup`, `awaken`, `stepdone`, `payout`.

### 3.9 Outils d'apprentissage disponibles
- Exercices (mécanique de FORMA-7) : `qcm`, `truefalse`, `cloze`, `order`, `wiring`, `feynman`.
- Blocs propres à FORMA-8 (`src/content/types.ts`, rendus par `Blocks.tsx` et `Mechanics.tsx`) :
  - `mission{title,goal,prompt,verify}` : ordre de mission ; cases de vérification persistantes ; remplacement de
    `{produit}`, `{phrase}` et `{depot}` ;
  - `consigne{id,situation,expected}`, noté par Claude ;
  - `bugreport{id,symptom,context,expected}`, noté par Claude ;
  - `diff{title,file,lines[{kind:add|del|ctx,t}],note}` : lecture guidée d'une modification ;
  - `interactive{widget,caption?,mode?}` : le champ `mode` (ajouté au caisson 01) limite un simulateur aux gestes
    déjà appris ; le validateur refuse un simulateur ou un mode inconnu ;
  - `procedure{id,title,intro?,steps[{do,see?,help?}]}` : pas à pas avec cases persistantes `proc:{id}:{i}` et une aide
    « Je suis bloqué » ;
  - `source{title,url,checked,note?}` : source datée.
- Les blocs de leçon hérités de la mécanique (texte, analogie illustrée, exercice, simulateur) sont décrits dans `types.ts`.
- Simulateurs (`src/components/widgets/`, tous écrits à neuf), avec leur usage prévu :
  - GitBranches : c01, protocoles 2, 3 et 5. Trois niveaux : `mode: "commits"` (enregistrer et relire),
    `mode: "branches"` (plus branche et fusion), sans mode (plus « Revenir en arrière »). Défis cochés
    automatiquement ; un rond se touche pour relire son message ;
  - TimeMachine (« machine à remonter les versions ») : c01, protocole 1. Restaurer une version en ajoute une ;
  - ConflictLab (« atelier des conflits ») : c01, protocole 5. Lire les 3 marqueurs, choisir, « Mark as resolved »,
    « Commit merge » ;
  - RequestTrip : c00 et c07 ;
  - PipelineLights : c05 ;
  - TokenBuilder : c02, protocole 6 ;
  - CostCalc : c07 et c08, tarifs vérifiés le 14/11/2026 ;
  - ContextView : c02, protocole 2 ;
  - SkillToolbox : c02, protocole 5 ;
  - McpPlugs : c02, protocole 5 ;
  - AgentCycle : c00, protocole 3, puis c04 ;
  - ProductLab : c00, protocole 4. Il note 3 idées sur 5 critères (Utile, Faisable, Peu coûteux, Potentiel, Envie),
    et son brouillon est sous `forma8:brouillon:laboratoire-produit`.
- Les 8 simulateurs de FORMA-7 et son SkillWorkshop ont été retirés.
- Illustrations FORMA-8 (`Illustrations.tsx`, identifiants dans `illustration-ids.json`) : web-magasin, trois-couches,
  chef-equipe, serrure-cle, vitrine ; ajoutées au caisson 01 : photos-chantier, voie-essai, relecture, correction.
- Atelier des consignes (`src/content/atelier.ts`), 6 situations :
  - contact, texte-deborde, a-propos ;
  - relecture (après c01), regles (après c02), mise-en-ligne-auto (après c06).

### 3.10 Contenu : le caisson 00 est complet (`src/content/caissons/c00.json`)
- **ORA · « Les bases du logiciel, sans coder » · v0.0** (teinte 190).
- Les 5 protocoles et leurs notions :
  - p1 « Ce qu'est une application » : fichier, application, navigateur, serveur, site-web. Simulateur RequestTrip.
  - p2 « Les trois langues d'une page » : code-source, html, css, javascript.
  - p3 « Créer avec une IA » : ia, modele-de-langage, prompt, agent, claude-code, vibe-coding. Simulateur AgentCycle.
  - p4 « Choisir ton produit » : probleme-utilisateur, proposition-de-valeur, produit-minimum. Simulateur ProductLab.
  - p5 « Ta première mise en ligne » : github, depot, pull-request (version simple), github-pages, adresse-web.
- Les 4 procédures du protocole 5 :
  - `c00-creer-depot` (6 étapes) ;
  - `c00-ouvrir-claude-code` (4 étapes) ;
  - `c00-fusionner` (3 étapes) ;
  - `c00-activer-pages` (6 étapes : Deploy from a branch, `main`, `/ (root)`).
- Panne « Ma page ne s'affiche pas » : 3 scénarios.
- Livraison v0.0 « Ta page de présentation en ligne » : `index.html` présent (fichier), page en ligne, et une
  case à cocher (« J'ai ouvert ma page sur mon iPhone »).
- Fiche d'équipe : `index.html`.
- `src/content/glossary.json` contient **34 notions** : 23 du caisson 00 et 11 du caisson 01.
- Sources du caisson 00, vérifiées le 14/11/2026 :
  - MDN « Comment fonctionne le Web » :
    https://developer.mozilla.org/fr/docs/Learn_web_development/Getting_started/Web_standards/How_the_web_works
  - glossaire MDN, en français :
    - HTML : https://developer.mozilla.org/fr/docs/Glossary/HTML
    - CSS : https://developer.mozilla.org/fr/docs/Glossary/CSS
    - JavaScript : https://developer.mozilla.org/fr/docs/Glossary/JavaScript
  - Claude Code :
    - « Comment fonctionne Claude Code » : https://code.claude.com/docs/fr/how-claude-code-works
    - « Démarrer avec Claude Code dans le cloud » : https://code.claude.com/docs/fr/web-quickstart
  - GitHub « Démarrage rapide pour GitHub Pages » : https://docs.github.com/fr/pages/quickstart
  - « Vibe coding », mot de l'année 2025 du dictionnaire Collins (AFP, via Dawn) : https://www.dawn.com/news/1953511

### 3.10 bis Contenu : le caisson 01 est complet (`src/content/caissons/c01.json`)
- **L'Archiviste · « Garder chaque version » · v0.1** (teinte 150). Écrit le 14/11/2026.
- Les 5 protocoles et leurs notions :
  - p1 « Pourquoi garder les versions » : version, git, historique. Simulateur TimeMachine.
  - p2 « Le commit » : commit, message-de-commit. GitBranches (mode commits), lecture d'un vrai commit de FORMA-7
    (`4c83563`, extrait du README), étude de cas des 6 commits, procédure `c01-lire-historique` (5 étapes).
  - p3 « Les branches » : branche, branche-principale. GitBranches (mode branches), procédure `c01-creer-branche`
    (7 étapes : branche `essai-readme`, modification du README, commit à la main).
  - p4 « La pull request en détail » : fusion, relecture. Procédures `c01-ouvrir-pr` (4 étapes) et
    `c01-relire-fusionner` (5 étapes), lecture d'une pull request piégée (bloc `diff`), ordre de mission
    « Un changement relu de bout en bout », consigne `c01-aide-relecture`.
  - p5 « Revenir en arrière » : annulation, conflit. GitBranches complet, procédure `c01-annuler-fusion`
    (7 étapes : casser le titre exprès, fusionner, Revert, fusionner l'annulation), ConflictLab.
- Notions surveillées par le validateur (mot interdit avant sa définition) : « Git », « commit », « conflit ».
  « branche », « fusion », « version » et « historique » ne peuvent pas l'être : le caisson 00 les emploie déjà
  comme des mots courants.
- Panne « Alerte aux archives » : 3 scénarios (bug fusionné, conflit, messages illisibles).
- Livraison v0.1 « Un historique propre, par pull requests » : `commits` min 5, `pullsMerged` min 1, fichier
  `README.md`, `pages`.
- Études de cas (faits vérifiés dans le dépôt cloné de FORMA-7, heures UTC) : les 6 commits (13/11 06:45, 07:26,
  07:32, 20:51 ; 14/11 01:43, 02:17 ; 66, 4, 1, 9, 40 et 6 fichiers), tous directement sur `main` ; et la PR de
  FORMA-8 fusionnée trop tôt.
- Sources du caisson 01, toutes ouvertes le 14/11/2026. GitHub a réorganisé sa documentation : les anciennes
  adresses redirigent vers celles-ci.
  - À propos de Git : https://docs.github.com/fr/get-started/using-git/about-git
  - flux de GitHub : https://docs.github.com/fr/get-started/using-github/github-flow
  - Engagements (à propos des commits) : https://docs.github.com/fr/pull-requests/reference/commits
  - Gestion des branches au sein de votre référentiel :
    https://docs.github.com/fr/pull-requests/how-tos/commit-changes/managing-branches-within-your-repository
  - Modification de fichiers : https://docs.github.com/fr/repositories/working-with-files/managing-files/editing-files
  - Requêtes de tirage (à propos des pull requests) : https://docs.github.com/fr/pull-requests/reference/pull-requests
  - Création d'une pull request :
    https://docs.github.com/fr/pull-requests/how-tos/create-pull-requests/creating-a-pull-request
  - Fusion d'une pull request :
    https://docs.github.com/fr/pull-requests/how-tos/merge-and-close-pull-requests/merging-a-pull-request
  - Réinitialisation d'une pull request (Revert) :
    https://docs.github.com/fr/pull-requests/how-tos/merge-and-close-pull-requests/reverting-a-pull-request
  - Conflits de fusion : https://docs.github.com/fr/pull-requests/reference/merge-conflicts
  - Résolution d'un conflit de fusion sur GitHub :
    https://docs.github.com/fr/pull-requests/how-tos/merge-and-close-pull-requests/resolving-a-merge-conflict-on-github
  - Claude Code, Flux de travail courants : https://code.claude.com/docs/fr/common-workflows
  - Claude Code, Utiliser Claude Code dans le cloud : https://code.claude.com/docs/fr/claude-code-on-the-web
- Libellés des boutons : github.com s'affiche en anglais. Les libellés viennent de la version anglaise des mêmes
  pages et de captures de github.com à la taille d'un iPhone, **sans être connecté** (voir les limites en 3.14).

### 3.11 Les 11 caissons (`c02.json` à `c10.json` : squelettes sans protocole)

| Id | Membre | Nom | Version | Teinte | Fichier de l'équipe |
|---|---|---|---|---|---|
| c00 | ORA | Les bases du logiciel, sans coder | v0.0 | 190 | index.html |
| c01 | L'Archiviste | Garder chaque version | v0.1 | 150 | commits |
| c02 | Le Règlement de bord | L'environnement de ton équipe | v0.2 | 210 | CLAUDE.md |
| c03 | Le Scribe | Décrire et découper | v0.3 | 260 | docs/SPEC.md |
| c04 | La Boucle | Demander, relire, corriger | v0.4 | 30 | docs/JOURNAL.md |
| c05 | L'Inspecteur | Qualité et vérifications | v0.5 | 120 | tests |
| c06 | Le Messager | La mise en ligne | v0.6 | 175 | .github/workflows |
| c07 | La Mémoire | Données et comptes | v0.7 | 280 | docs/DONNEES.md |
| c08 | La Sentinelle | Sécurité et coûts | v0.8 | 350 | SECURITY.md |
| c09 | Les Escouades et les Réflexes | Le niveau expert | v0.9 | 45 | .claude |
| c10 | Le Lancement | Produit et métier | v1.0 | 320 | CHANGELOG.md |

Le plan détaillé de chaque caisson (protocoles, notions, simulateurs, pannes, livraisons, sources) est dans
`docs/PROGRAMME.md`, validé par le propriétaire.

### 3.12 Tests et contrôles
- `scripts/validate-content.mjs` (variable `FORMA8_CONTENT_DIR` pour les tests) vérifie :
  - les notions : 3 niveaux, analogie, exemple, prérequis ;
  - l'ordre d'introduction des notions et les références `[[id]]` ;
  - les exercices ;
  - les champs des caissons ;
  - chaque bloc : mission ; consigne et rapport de bug (au moins 3 attendus, identifiants uniques) ; diff ;
    source (https, date AAAA-MM-JJ) ; procédure (au moins 2 étapes) ;
  - les analogies, dont l'illustration doit être dans `illustration-ids.json` ;
  - les livraisons et `teamFile`.
  - Un caisson vide déclenche un simple avertissement « en préparation ».
- Tests unitaires : 34 tests, répartis dans `merge.test.mjs`, `garde-fous.test.mjs`, `livraisons.test.mjs` (fetch simulé),
  `validateur.test.mjs` (dont les répliques de l'équipe et les simulateurs inconnus) et `energie.test.mjs` (barre
  d'énergie). Ce que vérifie `garde-fous.test.mjs` :
  - aucune écriture sous `forma7:` ;
  - `progress.json` jamais touché ;
  - clés `forma8:` uniquement ;
  - substitutions de parité documentées ;
  - aucun simulateur de FORMA-7 ;
  - aucun usage de `Art` (retiré).
- Tests de bout en bout : 9 tests, sur un écran d'iPhone 13 (`playwright.config.ts`, adresse
  `http://localhost:4173/FORMA-8/`, `vite preview`, trace désactivée) :
  - `socle.spec.ts` ;
  - `mecaniques.spec.ts` ;
  - `caisson00.spec.ts` : banc complet, environ 1,3 min, GitHub simulé ;
  - `caisson01.spec.ts` : banc complet, environ 1,4 min. Il part d'un caisson 00 déjà réveillé (progression déposée
    dans `forma8:progress-secours`, que l'appli fusionne au démarrage), joue les 5 protocoles, les 3 simulateurs
    dans tous leurs modes, une procédure, l'ordre de mission, la panne, la livraison, l'atelier et la maintenance ;
  - `helpers.ts` contient `boot()` et les outils communs aux bancs : `solve()`, `playStep(page, caisson, protocole,
    numéro, onBlock?)`, `playMaintenance()`, `dismissCeremonies()` (ferme une scène de réveil ou une montée de
    grade). **Modèle pour le caisson 02 : `caisson01.spec.ts`.**

### 3.13 Tarifs et coûts (vérifiés le 14/11/2026, à revérifier)
- Tarifs de l'API, en dollars par million de tokens (envoyés / reçus) :
  - Opus 5.5 : 4 / 20 ;
  - Sonnet 5.5 : 2 / 10 ;
  - Haiku 5.5 : 0,10 / 0,50.
- Coût estimé de l'usage du joueur : environ 8 $ par mois avec Opus, 4 $ avec Sonnet, moins de 0,50 $ avec Haiku.
  C'est une estimation.
- Les abonnements Max et Ultra incluent 100 $ et 200 $ de crédits API. Pro n'en inclut pas. Information vérifiée le
  14/11/2026, qui peut avoir évolué.

### 3.14 Petites dettes et incertitudes connues
- Le badge « skill » (« Forgeron de Skills ») ne peut pas encore être obtenu : il attend la Forge de Skills du caisson 02.
- **Dès qu'on ajoute des notions, `caisson00.spec.ts` cassera.** Il attend « 23 / 34 notions collectées », et le
  dénominateur est le total du glossaire : à mettre à jour après chaque caisson. `caisson01.spec.ts`, lui, lit le
  total dans le glossaire, mais suppose que toutes les notions sont collectées : à adapter aussi au caisson 02.
- **Libellés de GitHub non vérifiés en étant connecté** (impossible depuis la session, qui n'a pas de compte GitHub
  dans un navigateur). Vérifiés sans connexion, sur un écran d'iPhone : l'horloge de l'historique, la page
  « Commits », le détail d'un commit, les onglets d'une pull request, le menu « Switch branches/tags ». Tirés de la
  documentation seulement : « Find or create a branch… », « Create branch », « Commit changes... », « Compare & pull
  request », « Create pull request », « Merge pull request », « Confirm merge », « Revert », « Resolve conflicts »,
  « Mark as resolved », « Commit merge ». De mémoire, à confirmer par le propriétaire en jouant : « Commit directly
  to the … branch », « Able to merge », « Delete branch », « Restore branch », « This branch has conflicts that must
  be resolved », l'emplacement du crayon sur iPhone (une adresse directe `…/edit/branche/fichier` est donnée en
  secours). Corriger le caisson 01 si le propriétaire signale un écart.
- **Refonte de l'interface, non vérifiée sur un vrai iPhone** (seulement sur un iPhone 13 simulé dans Chromium) :
  fluidité des animations (ondes de choc, éclats, rayons, personnages animés) sur un iPhone ancien, son, et taille
  des personnages. À faire confirmer par le propriétaire après la mise en ligne.
- La barre d'énergie ne compte que les kW gagnés depuis l'ouverture du protocole : un protocole repris après
  fermeture de l'appli repart d'une barre vide (les kW déjà gagnés sont bien comptés dans le compteur du haut).
- Durées des protocoles (`stepMinutes`) : estimation à environ 50 secondes par bloc, à ajuster avec l'usage réel.
- Incertitudes à vérifier :
  - l'affichage exact de claude.ai/code et de github.com dans Safari mobile (libellés des boutons) ;
  - si on peut modifier après coup la liste des dépôts d'un jeton « fine-grained » ;
  - le montant minimum d'achat de crédits dans la Console Claude ;
  - la version la plus récente du guide RGPD de la CNIL ;
  - la source primaire de l'expression « vibe coding » (attribuée à Andrej Karpathy, février 2025, d'après des sources
    secondaires ; Collins cité via l'AFP et Dawn).

---

## 4. Décisions prises et pistes écartées

### 4.1 Décisions du propriétaire
- Programme : sur mesure, construit sur la documentation officielle de Claude Code en français.
  - Les cours Anthropic Academy (Claude Code 101, Claude Code in Action) servent seulement de **liste de contrôle**.
  - Leurs sujets sont réécrits en français, sans traduction mot pour mot.
  - Leurs sujets sont couverts aux caissons 02, 03, 04, 05 et 09.
- Matériel : iPhone et iPad seulement, dans Safari.
- Lien avec FORMA-7 : FORMA-8 est autonome, avec un simple clin d'œil (prénom repris, badges de FORMA-7 affichés en lecture seule).
- Temps : 15 à 30 minutes par jour, en « quarts ».
- Projets : un produit fil rouge, choisi dans l'appli au caisson 00.
- Univers : l'Équipe. Le mot « équipage » est banni.
- Nom : « FORMA-8 · Réveille l'équipe ».
- Premiers vrais utilisateurs : au niveau 6.
- Missions du jour : **aucune** (pas de lecture de mails). FORMA-7-data sert seulement à la synchronisation.
- Vérification des livraisons : automatique par l'API GitHub, avec une case à cocher en secours.
- Nouvelles mécaniques : Atelier des consignes, pannes à diagnostiquer, livraisons vérifiées.
  En plus : fiches de l'équipe, simulateurs, portfolio, Quart du jour, Demander à ORA.
- Claude dans l'appli : **indispensable**. Modèle par défaut : **Opus 5.5**.
- Ordre de construction : **tout le parcours d'un coup**, avant le premier test complet par le propriétaire.
  Le caisson 00 est quand même déjà jouable en ligne.
- Méthode : **exemplaire** (CLAUDE.md, tests, CI, une PR par lot relue et fusionnée par le propriétaire),
  avec une branche par lot.
- Visuel : 4 substitutions validées, plus l'icône « 8 » et les tuiles des caissons (validées le 14/11/2026).
- Contenu : d'abord le plan (`PROGRAMME.md`, validé), puis l'écriture caisson par caisson.
  Aucun contenu de FORMA-7 (décision du 14/11/2026).
- Étude de cas FORMA-7 (décision du 14/11/2026, après vérification du caisson 01) : citer **mot pour mot** des faits
  de l'historique de FORMA-7 (messages de commit, dates, nombre de fichiers, courts extraits d'un commit) est permis,
  comme étude de cas de son propre projet. Les leçons, fiches, exercices, simulateurs et illustrations de FORMA-7
  restent interdits. Contrôle fait au caisson 01 : aucune suite de 5 mots du texte pédagogique n'est commune avec
  FORMA-7, en dehors de ces citations et de tournures courantes.
- Refonte de l'interface (15/11/2026), après des maquettes jouables :
  - **option B** : même palette et mêmes polices que FORMA-7, le reste peut évoluer (règle 3 réécrite) ;
  - **11 personnages avec répliques**, scène de réveil, frise du produit, chemin des protocoles, Base par membre :
    gardés ;
  - **cérémonies plus spectaculaires** (onde de choc, éclats, rayons) ;
  - **kW** : une barre d'énergie discrète, aux couleurs de l'appli, pendant le protocole ; un petit jaillissement de
    10 kW par bonne réponse, vers la barre ; le total qui jaillit en grand en fin de protocole et rejoint le compteur.
    Demande du propriétaire : « rends le tout cohérent et très esthétique ».

### 4.2 Pistes écartées, et pourquoi
- **Traduire intégralement les cours Anthropic Academy** : droits d'auteur, et ces cours demandent une connexion.
  Ils restent une liste de contrôle.
- **Reprendre du contenu de FORMA-7** (ses 53 notions, ses 8 simulateurs, son SkillWorkshop, les illustrations de `Art`) :
  refusé par le propriétaire. Tout est réécrit.
- **Missions du jour par mail** (comme le pipeline de FORMA-7) et la mécanique « Signaux » de FORMA-7 : écartées.
- **PR empilées sur des branches intermédiaires** : abandonnées après les PR #2 et #3. Les PR ciblent toujours `main`.
- **Le mot « équipage »** : remplacé par « équipe ».
- **La revue de code comme mécanique dédiée** : elle reste une notion du caisson 05.
- **Claude optionnel** : écarté, Claude est indispensable.
- **Construire et faire tester lot par lot** : remplacé par « tout d'un coup ».
- **Le composant `Art` de FORMA-7** : remplacé par `Illustrations.tsx`, car les dessins de `Art` contiennent des textes
  des leçons de FORMA-7. Retiré du dépôt le 15/11/2026.
- **Option A de la refonte** (« enrichir sans toucher au socle », parité stricte) : écartée au profit de l'option B.
- **kW** : les « pièces d'énergie » (pièces aspirées une à une), la jauge orange qui ne se vide qu'à la fin sans
  jaillissement, et le compteur seul (« discret ») : écartés le 15/11/2026.
- **Une cérémonie de grade qui s'ouvre au milieu d'un protocole** : elle bloquait la lecture ; le grade s'annonce
  désormais dans la cérémonie de fin de protocole.

---

## 5. Prochaine action immédiate

### 5.1 Au démarrage de chaque nouvelle session (avant toute écriture)
1. Lire `CLAUDE.md`, ce document, `docs/CONCEPTION.md` et `docs/PROGRAMME.md`.
2. `git fetch origin`. Vérifier que `origin/main` contient `ccb28cf` (caisson 01) et, si elle a été fusionnée, la PR
   de la refonte de l'interface ; si quelque chose d'autre a changé, le dire au propriétaire.
3. Attacher `felipemaciasito-cmyk/forma-7` (public, lecture seule) et le cloner **à côté** de FORMA-8, sous le nom
   `forma-7`, pour `check:parity`. Le cloner en entier (sans `--depth`) si l'historique sert d'étude de cas.
4. `npm ci`, puis lancer la commande complète de vérification. Annoncer le résultat au propriétaire :
   l'état de départ doit être entièrement vert.
5. Attendre le **feu vert explicite** du propriétaire pour le caisson suivant. Le lui demander en QCM s'il ne l'a pas déjà donné.

### 5.2 Caisson 01 et refonte : faits. Prochaine étape : caisson 02 · Le Règlement de bord · v0.2 (après le feu vert)
- **Avant tout** : vérifier que la PR de la refonte de l'interface a été fusionnée par le propriétaire. Sinon, le lui
  rappeler, et ne pas empiler une nouvelle PR dessus. Lui demander s'il a joué la nouvelle version sur son iPhone
  (fluidité, son, lisibilité), et corriger d'abord ce qu'il signale.
- **Répliques** : écrire `demi` et `reveil` du Règlement de bord (`src/content/equipe.json`) avec le vocabulaire du
  caisson 02, une fois ses notions définies ; le validateur vérifie le moment où chaque réplique s'affiche.
- **Branche** : une nouvelle branche depuis `origin/main` (ou celle qu'impose l'environnement).
- **Plan** : `docs/PROGRAMME.md`, caisson 02. 6 protocoles, environ 20 notions (`session`, `environnement-cloud`,
  `terminal`, `commande`, `token`, `contexte`, `fenetre-contexte`, `compaction`, `claude-md`, `memoire-projet`,
  `permission`, `mode-permission`, `mode-plan`, `markdown`, `skill`, `mcp`, `connecteur`, `plugin`, `jeton-acces`,
  `moindre-privilege`).
- **Simulateurs déjà faits** : ContextView (p2), SkillToolbox et McpPlugs (p5), TokenBuilder (p6). **À écrire** : la
  Forge de Skills, d'après la documentation officielle d'Anthropic sur les Skills, en français (URL à trouver et à
  vérifier ; elle rendra le badge « skill » obtenable).
- **Méthode qui a marché au caisson 01**, à reprendre :
  - ouvrir chaque source avec `curl -L` pour relever l'adresse finale et le titre exact, puis lire le texte ;
  - relever les libellés anglais dans la version `/en/` des pages de GitHub, et capturer github.com et
    claude.ai/code à la taille d'un iPhone (Playwright, `devices['iPhone 13']`) quand la page est publique ;
  - donner un mode aux simulateurs pour ne jamais montrer un geste avant sa notion ;
  - ajouter les mots techniques nouveaux au champ `watch` des notions, quand le caisson précédent ne les emploie pas ;
  - regarder chaque nouvel écran en capture avant de lancer la commande complète.
- **Livraison v0.2** : `CLAUDE.md`, `.claude/settings.json`, un Skill dans `.claude/skills`, et la case
  « Synchronisation FORMA-8 activée ». Le protocole 6 crée le vrai jeton « fine-grained » : vérifier d'abord si l'on
  peut modifier après coup la liste des dépôts d'un jeton (incertitude de 3.14).
- **Banc d'essai** : `tests/e2e/caisson02.spec.ts`, sur le modèle de `caisson01.spec.ts` (progression des caissons 00
  et 01 déposée au démarrage). Mettre à jour le compteur de notions de `caisson00.spec.ts` et de `caisson01.spec.ts`.
- **Ce document** : le mettre à jour dans la même PR.
- Ensuite : commande complète (tout vert), commit en français, envoi, **une PR vers `main`**, annonce au
  propriétaire (« ne fusionne qu'après mon annonce »), proposition de la surveiller.
- Aucun changement visuel sans validation préalable. Nouveaux glyphes ou illustrations : ajout seulement, dans le même style.

### 5.3 À faire côté propriétaire (sans urgence, à lui rappeler)
- **Jouer aux caissons 00 et 01** sur https://felipemaciasito-cmyk.github.io/FORMA-8/, dans Safari ou depuis l'écran
  d'accueil. Le stockage de l'écran d'accueil est séparé de celui de Safari. En jouant le caisson 01, **noter tout
  libellé de GitHub qui ne correspond pas** à ce que dit l'appli (voir 3.14) et le signaler.
- **Créer la clé API Claude** :
  - dans la Console Claude, avec un espace de travail dédié et un plafond de dépense mensuel ;
  - acheter des crédits (montant minimum à vérifier) ;
  - coller la clé dans Réglages.
  - Elle sert à « Demander à ORA », à la notation « avec tes mots », aux consignes et aux rapports de bug.
- **Jeton GitHub « fine-grained »** : il sera enseigné au caisson 02, protocole 6, et sert à la synchronisation.
  Il n'est pas obligatoire pour vérifier un dépôt public.

### 5.4 Ensuite
- Caissons 03 à 10, dans l'ordre de `docs/PROGRAMME.md`, une PR par caisson.
- Caisson 07 : choisir le service de données et de comptes à partir de sources vérifiées à ce moment-là.
- Caissons 06, 07, 08 et 10 : vérifier et dater les tarifs et les offres cités au moment de l'écriture.

# FORMA-8 · Réveille l'équipe : règles du projet

Application d'apprentissage ludique (PWA) pour apprendre à créer des applications avec l'IA
(« vibe coding »), de débutant à expert. Suite de FORMA-7. La conception validée est dans
`docs/CONCEPTION.md` : la lire avant toute modification importante.

Le propriétaire n'est pas développeur et travaille uniquement depuis Safari sur iPhone et iPad.
Lui répondre en français, en le tutoyant, simplement, en signalant toute incertitude.

**Reprise du travail** : lire `docs/TRANSFERT.md` au début de chaque session (état du projet, décisions,
prochaine action), et le mettre à jour à la fin de chaque lot.

## Règles impératives

1. **Zéro emoji** dans l'appli et le contenu : uniquement les icônes maison (`src/components/glyphs.ts`,
   identifiants dans `src/content/icon-ids.json`). Contrôle : `npm run check:emoji` et le validateur.
2. **Zéro zone de flou** : toute notion est définie (fiche à 3 niveaux, analogie, exemple, prérequis)
   avant d'être utilisée. Les termes s'écrivent `[[id]]` ou `[[id|texte]]`. Contrôle : `npm run validate`.
3. **Identité visuelle : même palette, mêmes polices que FORMA-7** (règle choisie par le propriétaire le
   15/11/2026, option B). Les variables de `:root` de `src/styles/app.css` (couleurs, rayons, polices Space
   Grotesk et JetBrains Mono) restent identiques à celles de FORMA-7 ; les écrans, composants et animations
   peuvent évoluer. Tout **nouveau changement visuel important** se montre d'abord au propriétaire (maquette ou
   captures) et attend son accord. Glyphes et identifiants d'icônes : ajout seulement, dans le même style
   (grille de 24, trait de 1,8, coins arrondis). Contrôle : `npm run check:parity`.
4. **Stockage** : toutes les clés locales commencent par `forma8:`. Ne jamais écrire sous `forma7:`
   (la progression de FORMA-7 se lit uniquement, dans `src/lib/forma7.ts`).
5. **Dépôt de données FORMA-7-data** : FORMA-8 synchronise dans `progress/forma-8.json`. Ne jamais
   modifier `progress/progress.json`, qui appartient à FORMA-7.
6. **Secrets** : clé API Claude et jeton GitHub restent sur l'appareil du joueur, jamais dans le code,
   les commits ou les journaux.
7. **Vocabulaire** : on parle d'« équipe », jamais d'« équipage ». Dans le code, un caisson (niveau) est
   un `Room`, un protocole de réveil (leçon) un `Step`, une panne un `Incident`.
8. **Sources** : le contenu s'appuie sur la documentation officielle (en français quand elle existe :
   `https://code.claude.com/docs/fr/`), citée avec sa date de vérification. Aucun cours tiers copié ou
   traduit mot pour mot.
9. **Aucun contenu de FORMA-7** : fiches de notions, leçons, exercices, simulateurs et modèles sont écrits à
   neuf à partir de nouvelles sources. Seules la palette, les polices et la mécanique de jeu viennent de FORMA-7.
   Le projet FORMA-7 (historique, bugs, choix) peut servir d'étude de cas. Le plan validé du contenu est dans
   `docs/PROGRAMME.md`.
   Illustrations : uniquement celles de `src/components/Illustrations.tsx` et les personnages de
   `src/components/Crew.tsx` (le composant `Art` de FORMA-7 a été retiré).
   Les répliques de l'équipe (`src/content/equipe.json`) suivent la même règle et passent par le validateur.
   Chaque caisson doit passer le banc d'essai de bout en bout (`tests/e2e/caisson01.spec.ts` en est le modèle).
10. **Voix de l'équipe** : chaque personnage lit ses répliques avec sa voix (`src/content/voix.json` : sexe, personnalité,
   voix ElevenLabs, filtre robotique et densité choisis par le propriétaire). Les voix sont des mp3 enregistrés une fois
   (`public/voix`, liste dans `src/content/voix-enregistrements.json`), jamais générés dans l'appli. **Toute réplique
   modifiée ou nouvelle se réenregistre** avec le connecteur ElevenLabs, puis `node scripts/voix.mjs ajouter …`
   (`node scripts/voix.mjs manquantes` liste ce qui manque ; le validateur bloque une prise qui ne correspond plus au
   texte). Les répliques restent à la première personne et tutoient le joueur. Aucun changement de voix ou de filtre
   sans écoute et accord du propriétaire.

## Méthode de travail

- Messages de commit en français, qui expliquent le pourquoi.
- Une pull request par lot, relue et fusionnée par le propriétaire. Jamais d'envoi direct sur `main`
  sans son accord explicite.
- Avant de proposer une pull request, toutes les vérifications doivent passer :

```bash
npm run validate && npm run check:emoji && npm run check:parity && npm run typecheck && npm test && npm run build && npx playwright test --trace off
```

`check:parity` a besoin du dépôt FORMA-7 à côté (`../FORMA-7`, `../forma-7`, ou `--forma7 <dossier>`).

## Structure

- `src/content/caissons/c00.json` à `c10.json` : les 11 caissons (un par niveau).
- `src/content/glossary.json` : les notions ; `src/content/equipe.json` : les répliques des 11 membres.
- `src/lib/` : stockage (`store.ts`), fusion (`merge.ts`), synchronisation (`sync.ts`), GitHub
  (`github.ts`), héritage FORMA-7 en lecture seule (`forma7.ts`), Claude (`claude.ts`), jeu (`game.ts`),
  barre d'énergie d'un protocole (`energy.ts`), voix de l'équipe (`voice.ts`, `voice-key.js`) et touche robotique
  (`robot.ts`).
- `src/components/` : écrans et couche visuelle (voir règle 3) ; personnages (`Crew.tsx`) ; jaillissements de kW,
  cérémonies de grade et scènes de réveil (`Rewards.tsx`).
- `scripts/` : validateur, contrôle zéro emoji, contrôle de l'identité visuelle (`check:parity`), génération des icônes.
- `tests/unit/` (Node) et `tests/e2e/` (Playwright, écran d'iPhone).

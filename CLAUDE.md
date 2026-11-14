# FORMA-8 · Réveille l'équipe : règles du projet

Application d'apprentissage ludique (PWA) pour apprendre à créer des applications avec l'IA
(« vibe coding »), de débutant à expert. Suite de FORMA-7. La conception validée est dans
`docs/CONCEPTION.md` : la lire avant toute modification importante.

Le propriétaire n'est pas développeur et travaille uniquement depuis Safari sur iPhone et iPad.
Lui répondre en français, en le tutoyant, simplement, en signalant toute incertitude.

## Règles impératives

1. **Zéro emoji** dans l'appli et le contenu : uniquement les icônes maison (`src/components/glyphs.ts`,
   identifiants dans `src/content/icon-ids.json`). Contrôle : `npm run check:emoji` et le validateur.
2. **Zéro zone de flou** : toute notion est définie (fiche à 3 niveaux, analogie, exemple, prérequis)
   avant d'être utilisée. Les termes s'écrivent `[[id]]` ou `[[id|texte]]`. Contrôle : `npm run validate`.
3. **Parité visuelle avec FORMA-7** : la couche visuelle (liste dans `scripts/design-parity.json`) est
   identique à celle de FORMA-7. Ne jamais la modifier. Seules les substitutions listées dans ce fichier
   sont tolérées ; toute nouvelle substitution ou tout écart visuel doit être **validé explicitement par
   le propriétaire avant** d'être fait. Glyphes et identifiants d'icônes : ajout seulement, dans le même
   style (grille de 24, trait de 1,8, coins arrondis). Contrôle : `npm run check:parity`.
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
   neuf à partir de nouvelles sources. Seules la couche visuelle et la mécanique de jeu viennent de FORMA-7.
   Le projet FORMA-7 (historique, bugs, choix) peut servir d'étude de cas. Le plan validé du contenu est dans
   `docs/PROGRAMME.md`.

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
- `src/content/glossary.json` : les notions.
- `src/lib/` : stockage (`store.ts`), fusion (`merge.ts`), synchronisation (`sync.ts`), GitHub
  (`github.ts`), héritage FORMA-7 en lecture seule (`forma7.ts`), Claude (`claude.ts`), jeu (`game.ts`).
- `src/components/` : écrans et couche visuelle (voir règle 3).
- `scripts/` : validateur, contrôle zéro emoji, contrôle de parité, génération des icônes.
- `tests/unit/` (Node) et `tests/e2e/` (Playwright, écran d'iPhone).

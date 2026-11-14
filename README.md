# FORMA-8 · Réveille l'équipe

Application d'apprentissage ludique (PWA) pour apprendre à **créer des applications avec l'IA**, de
débutant à expert, par la pratique. Suite de [FORMA-7](https://github.com/felipemaciasito-cmyk/FORMA-7),
avec la même esthétique.

Le datacenter de FORMA-7 est rallumé. Dans sa réserve dorment **11 membres d'équipe**, un par niveau :
chacun incarne un vrai outil du métier. En les réveillant, le joueur construit **son propre produit**,
publié en ligne à chaque niveau, de la version 0.0 à la version 1.0.

> Application personnelle et indépendante, non affiliée à Anthropic, GitHub ou Humains Augmentés.

La conception complète est dans [`docs/CONCEPTION.md`](docs/CONCEPTION.md).

## État

Socle et mécaniques en place : démarrage, carte des 11 caissons, réglages, stockage, synchronisation,
clin d'oeil à FORMA-7, livraisons vérifiées sur GitHub, atelier des consignes, pannes à diagnostiquer,
fiches de l'équipe, portfolio et simulateurs. Le contenu des 11 niveaux arrive dans les pull requests suivantes.

## Développer

```bash
npm install
npm run dev            # serveur de développement
npm run validate       # validateur « zéro zone de flou » (+ zéro emoji dans le contenu)
npm run check:emoji    # contrôle « zéro emoji » du code
npm run check:parity   # parité visuelle avec FORMA-7 (dépôt FORMA-7 à côté)
npm run typecheck      # vérification des types
npm test               # tests unitaires
npm run build          # validations + build de production (dist/)
npx playwright test --trace off   # tests de bout en bout (après le build)
```

Règles du projet : [`CLAUDE.md`](CLAUDE.md).

## Déploiement

- **Pull request** : `.github/workflows/ci.yml` lance toutes les vérifications, y compris la parité
  visuelle avec FORMA-7 et les tests de bout en bout.
- **Fusion sur `main`** : `.github/workflows/deploy.yml` construit et publie sur GitHub Pages
  (Settings › Pages › Source : **GitHub Actions**). Adresse : `https://<compte>.github.io/FORMA-8/`.

## Données

- Progression stockée sur l'appareil (IndexedDB, clés `forma8:`) et synchronisée entre l'iPhone et
  l'iPad dans `progress/forma-8.json` du dépôt privé FORMA-7-data (jeton GitHub stocké sur l'appareil).
- La progression de FORMA-7 est seulement lue, jamais modifiée.
- La clé API Claude reste sur l'appareil et n'est envoyée qu'à l'API d'Anthropic.

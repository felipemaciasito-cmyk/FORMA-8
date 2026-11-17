# Brouillon des répliques du lot « compagnon et règles de parole »

Le propriétaire a choisi « textes d'abord » le 17/11/2026 : toutes les nouvelles répliques sont écrites et relues
avant le moindre enregistrement ElevenLabs.

- `brouillon.py` : la source unique des textes (personnage, état de sommeil, endroit où la bulle s'affiche, choix).
  `python3 brouillon.py` produit `brouillon.json`.
- `verifier.py` (lancé depuis la racine du dépôt) : aucun mot technique avant sa notion, zéro emoji.
- `page.py <fichier.html>` : la page de lecture numérotée, publiée en page privée
  (https://claude.ai/artifact/Ujhw3XDdoT2oN83ttjKfky).

Une fois les textes validés, ils passent dans `src/content/` (equipe.json, compagnon.json et les nouveaux fichiers),
puis sont enregistrés. Ce dossier pourra alors être supprimé.

# Labo des personnages (page d'essai, hors de l'appli)

Source de la page privée https://claude.ai/artifact/Fj3TcAq1S3v6QvicnrAzr5 (aperçus des règles de parole et des
interactions, 16-17/11/2026). Elle importe les vrais personnages et la touche robotique de `src/`.

Construire : `LABO_OUT=<dossier> npx vite build --config outils/labo-personnages/vite.config.ts`, puis ajouter un
dossier `voix/` avec les prises d'essai (elles ne sont pas dans le dépôt : régénérer avec ElevenLabs si besoin),
retirer les polices autres que latin et latin-ext, et publier avec l'outil Artifact (méthode : docs/TRANSFERT.md, 3.3).

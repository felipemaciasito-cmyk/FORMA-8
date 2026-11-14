// Situations d'entraînement de l'Atelier des consignes (onglet Atelier).
// Une situation peut attendre qu'un caisson soit terminé (« after ») : ses mots
// ont alors tous été définis (règle « zéro zone de flou »).

export interface Situation {
  id: string;
  title: string;
  situation: string;
  expected: string[];
  after?: string;
}

export const SITUATIONS: Situation[] = [
  {
    id: "contact",
    title: "Un bouton pour être contacté",
    situation: "Tu veux ajouter, en bas de la page d'accueil de ton produit, un bouton « Nous contacter » qui ouvre un mail déjà adressé.",
    expected: [
      "Dire précisément où placer le bouton (page d'accueil, en bas).",
      "Dire ce que fait le bouton (ouvrir un mail adressé à la bonne adresse).",
      "Demander le même style que les autres boutons.",
      "Préciser de ne rien modifier d'autre sur la page.",
      "Demander une vérification sur un écran de téléphone.",
    ],
  },
  {
    id: "texte-deborde",
    title: "Un texte qui déborde",
    situation: "Sur iPhone, le titre de ta page d'accueil est trop long : il dépasse du bord de l'écran. Sur ordinateur, tout va bien.",
    expected: [
      "Décrire le problème observé et sur quel appareil.",
      "Dire ce qui est attendu (le titre reste entier et lisible sur un petit écran).",
      "Demander de ne pas casser l'affichage sur grand écran.",
      "Demander d'expliquer la cause avant de corriger.",
      "Demander une preuve que c'est corrigé (une capture ou une vérification à l'écran).",
    ],
  },
  {
    id: "a-propos",
    title: "Une page « À propos »",
    situation: "Tu veux une page « À propos » qui présente ton produit en trois courts paragraphes : le problème, la solution, qui tu es.",
    expected: [
      "Donner le contexte du produit (pour qui, pour quoi).",
      "Décrire le contenu attendu des trois paragraphes.",
      "Dire comment y accéder (un lien depuis la page d'accueil).",
      "Fixer le ton (simple, chaleureux) et la longueur.",
      "Demander de garder le style visuel existant.",
    ],
  },
  {
    id: "relecture",
    title: "Faire relire avant de fusionner",
    situation: "Claude Code a terminé une fonctionnalité sur une branche. Avant de la fusionner, tu veux qu'il relise ses propres changements et te signale les risques.",
    expected: [
      "Dire quelle branche ou quelle pull request relire.",
      "Demander une liste des fichiers modifiés, expliquée simplement.",
      "Demander de signaler les risques (ce qui pourrait casser).",
      "Interdire de fusionner sans ton accord.",
      "Demander de lancer les vérifications automatiques et d'en donner le résultat.",
    ],
    after: "c01",
  },
  {
    id: "regles",
    title: "Écrire les règles de ton équipe",
    situation: "Tu veux que Claude Code rédige le fichier de règles de ton produit : la langue, le style, ce qu'il ne doit jamais faire, et comment vérifier son travail.",
    expected: [
      "Lister les règles qui comptent pour toi (langue, ton, zéro emoji, etc.).",
      "Dire ce qu'il ne faut jamais faire (par exemple publier sans relecture).",
      "Demander des règles courtes et vérifiables.",
      "Indiquer comment vérifier le travail avant de le livrer.",
      "Demander de te montrer le fichier avant de l'enregistrer.",
    ],
    after: "c02",
  },
  {
    id: "mise-en-ligne-auto",
    title: "Publier automatiquement",
    situation: "Tu veux que ton site soit publié automatiquement à chaque fusion sur la branche principale, mais seulement si les vérifications passent.",
    expected: [
      "Dire quand la publication doit se déclencher (fusion sur la branche principale).",
      "Poser la condition : seulement si les vérifications réussissent.",
      "Préciser où publier (GitHub Pages).",
      "Demander que la version en ligne reste intacte en cas d'échec.",
      "Demander comment vérifier que tout fonctionne (un premier essai).",
    ],
    after: "c06",
  },
];

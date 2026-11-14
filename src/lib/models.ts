export const MODELS = [
  { id: "claude-opus-5-5", label: "Claude Opus 5.5 (recommandé)" },
  { id: "claude-sonnet-5-5", label: "Claude Sonnet 5.5 (moins cher)" },
  { id: "claude-haiku-5-5", label: "Claude Haiku 5.5 (le moins cher)" },
];

/** Charge le module Claude (et son SDK) seulement quand on en a besoin. */
export const loadClaude = () => import("./claude");

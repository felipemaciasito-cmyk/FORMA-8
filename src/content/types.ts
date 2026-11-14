// Modèle de contenu de FORMA-8.
// Vocabulaire du jeu : un « caisson » (type Room) est un niveau du parcours, où dort un membre de
// l'équipe ; un « protocole de réveil » (type Step) est une leçon ; une « panne » (type Incident)
// est le défi de fin de caisson. Les noms de types restent ceux de FORMA-7 pour réutiliser son code.
// Toute notion utilisée dans un texte s'écrit [[id]] ou [[id|texte affiché]] :
// le validateur (scripts/validate-content.mjs) refuse le build si elle n'a pas été définie avant.

export type Level = "simple" | "standard" | "expert";

export interface Notion {
  id: string;
  term: string;
  /** Identifiant d'icône maison, à choisir dans src/content/icon-ids.json (jamais d'emoji). Inconnu : glyphe générique. */
  icon: string;
  def: Record<Level, string>;
  analogy: string;
  example: string;
  prereq: string[];
  /** Info susceptible d'évoluer (produits, prix) : date de vérification. */
  checked?: string;
}

export type Exercise =
  | { kind: "qcm"; q: string; options: { t: string; ok: boolean; why: string }[] }
  | { kind: "truefalse"; q?: string; items: { s: string; ok: boolean; why: string }[] }
  | { kind: "cloze"; q?: string; text: string; distractors: string[]; why: string }
  | { kind: "order"; q: string; items: string[]; why: string }
  | { kind: "wiring"; q: string; pairs: { l: string; r: string }[]; why: string }
  | { kind: "feynman"; q: string; model: string; criteria: string[] };

// Simulateurs de FORMA-8 (aucun simulateur de FORMA-7 n'est repris).
export type WidgetId =
  | "GitBranches"
  | "RequestTrip"
  | "PipelineLights"
  | "TokenBuilder"
  | "CostCalc"
  | "ContextView"
  | "SkillToolbox"
  | "McpPlugs"
  | "AgentCycle"
  | "ProductLab"
  | "TimeMachine"
  | "ConflictLab";

export type Block =
  | { type: "text"; md: string }
  | { type: "definition"; notion: string }
  | { type: "analogy"; title: string; md: string; art?: string }
  /** Simulateur. « mode » (optionnel) limite le simulateur aux gestes déjà appris (ex. GitBranches : « commits », « branches »). */
  | { type: "interactive"; widget: WidgetId; caption?: string; mode?: string }
  | { type: "example"; title: string; before?: { label: string; md: string }; after: { label: string; md: string }; note?: string }
  | { type: "callout"; tone: "info" | "warn" | "volatile" | "ora"; md: string }
  | { type: "exercise"; ex: Exercise }
  | { type: "recap"; points: string[] }
  // ----- Blocs propres à FORMA-8 -----
  /** Ordre de mission à copier dans Claude Code, puis points à vérifier dans sa livraison. */
  | { type: "mission"; title: string; goal: string; prompt: string; verify: string[] }
  /** Atelier des consignes : le joueur rédige une consigne pour une situation, Claude la note. */
  | { type: "consigne"; id: string; situation: string; expected: string[] }
  /** Panne à diagnostiquer : le joueur rédige un rapport de bug, Claude le note. */
  | { type: "bugreport"; id: string; symptom: string; context: string; expected: string[] }
  /** Lecture d'une modification de code (« diff ») : lignes ajoutées, retirées ou inchangées. */
  | { type: "diff"; title: string; file: string; lines: { kind: "add" | "del" | "ctx"; t: string }[]; note?: string }
  /** Procédure pas à pas (manipulation dans Safari) : étapes à cocher, ce qu'on doit voir, aide si bloqué. */
  | { type: "procedure"; id: string; title: string; intro?: string; steps: { do: string; see?: string; help?: string }[] }
  /** Source officielle citée, avec sa date de vérification (AAAA-MM-JJ). */
  | { type: "source"; title: string; url: string; checked: string; note?: string };

export interface Step {
  id: string;
  title: string;
  kicker: string; // une phrase d'accroche
  introduces: string[];
  uses: string[];
  blocks: Block[];
}

export interface IncidentScenario {
  alert: string; // le message d'alerte affiché
  q: string;
  options: { t: string; ok: boolean; why: string }[];
}

export interface Incident {
  title: string;
  brief: string;
  scenarios: IncidentScenario[];
}

export interface Room {
  id: string; // ex. "c01"
  index: number;
  code: string; // ex. "CAISSON 01"
  /** Membre de l'équipe qui dort dans ce caisson (ex. « L'Archiviste »). */
  member: string;
  /** Sujet du niveau (ex. « Git et GitHub »). */
  name: string;
  /** Version du produit fil rouge livrée à la fin du caisson (ex. « v0.1 »). */
  version: string;
  tagline: string;
  hue: number; // teinte d'accent du caisson (0-360)
  requires: string[];
  /** Protocoles de réveil (leçons). Vide tant que le caisson est en préparation. */
  steps: Step[];
  /** Panne de fin de caisson. */
  incident?: Incident;
  project?: Project;
  /** Livraison vérifiée : nouvelle version du produit fil rouge. */
  delivery?: Delivery;
  /** Fichier du produit qui incarne ce membre de l'équipe (fiche de l'équipe). */
  teamFile?: TeamFile;
}

/** Contrôle d'une livraison, vérifié sur GitHub dans le dépôt du produit (ou coché à la main). */
export type DeliveryCheck =
  | { id: string; kind: "manual"; label: string }
  | { id: string; kind: "file"; label: string; path: string }
  | { id: string; kind: "commits"; label: string; min: number }
  | { id: string; kind: "pullsMerged"; label: string; min: number }
  | { id: string; kind: "workflow"; label: string; file?: string }
  | { id: string; kind: "pages"; label: string };

export interface Delivery {
  title: string;
  goal: string;
  steps: string[];
  checks: DeliveryCheck[];
}

export interface TeamFile {
  /** Ce que le joueur doit voir dans son dépôt (ex. « Le fichier CLAUDE.md »). */
  label: string;
  /** Chemin vérifié dans le dépôt du produit ; « commits » pour l'historique. */
  path: string;
  role: string;
}

export interface Project {
  title: string;
  goal: string;
  steps: string[];
  success: string[];
}

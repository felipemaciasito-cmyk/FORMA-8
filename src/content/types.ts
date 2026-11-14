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

export type WidgetId =
  | "NextWord"
  | "CoreCompare"
  | "ContextRam"
  | "PromptLab"
  | "ProjectSim"
  | "SkillAnatomy"
  | "PatchBay"
  | "AgentLoop"
  | "SkillWorkshop";

export type Block =
  | { type: "text"; md: string }
  | { type: "definition"; notion: string }
  | { type: "analogy"; title: string; md: string; art?: string }
  | { type: "interactive"; widget: WidgetId; caption?: string }
  | { type: "example"; title: string; before?: { label: string; md: string }; after: { label: string; md: string }; note?: string }
  | { type: "callout"; tone: "info" | "warn" | "volatile" | "ora"; md: string }
  | { type: "exercise"; ex: Exercise }
  | { type: "recap"; points: string[] };

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
}

export interface Project {
  title: string;
  goal: string;
  steps: string[];
  success: string[];
}

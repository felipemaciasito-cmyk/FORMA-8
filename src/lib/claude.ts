import Anthropic from "@anthropic-ai/sdk";
import { stripEmoji } from "./emoji-rules";
import { getState } from "./store";

// ---------------------------------------------------------------
// Fonctions Claude de FORMA-8 (clé API saisie dans Réglages,
// stockée uniquement sur l'appareil). Chargé à la demande.
// ---------------------------------------------------------------

function client() {
  const { apiKey } = getState().settings;
  if (!apiKey) throw new ClaudeError("nokey", "Aucune clé API Claude n'est configurée (Réglages).");
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true, maxRetries: 1 });
}

export class ClaudeError extends Error {
  code: string;
  constructor(code: string, message: string) { super(message); this.code = code; }
}

function friendly(e: unknown): ClaudeError {
  if (e instanceof ClaudeError) return e;
  if (e instanceof Anthropic.AuthenticationError) return new ClaudeError("auth", "Clé API refusée : vérifie-la dans Réglages.");
  if (e instanceof Anthropic.PermissionDeniedError) return new ClaudeError("perm", "Cette clé n'a pas accès à ce modèle.");
  if (e instanceof Anthropic.RateLimitError) return new ClaudeError("rate", "Trop de demandes d'un coup : réessaie dans une minute.");
  if (e instanceof Anthropic.NotFoundError) return new ClaudeError("model", "Modèle introuvable : choisis-en un autre dans Réglages.");
  if (e instanceof Anthropic.APIConnectionError) return new ClaudeError("net", "Connexion impossible : es-tu hors ligne ?");
  if (e instanceof Anthropic.APIError) return new ClaudeError("api", `Erreur de l'API Claude (${e.status ?? "?"}).`);
  return new ClaudeError("unknown", e instanceof Error ? e.message : "Erreur inconnue.");
}

/** Repli serveur en cas de refus (Opus et Sonnet uniquement). */
function fallbackParams(model: string) {
  return model.startsWith("claude-haiku") ? {} : { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const };
}

async function ask(opts: { system: string; user: string; maxTokens?: number; effort?: "low" | "medium" | "high"; schema?: Record<string, unknown> }) {
  const model = getState().settings.model;
  try {
    const res = await client().beta.messages.create({
      model,
      max_tokens: opts.maxTokens ?? 4000,
      system: `${opts.system}\n\nN'utilise jamais d'emoji ni de pictogramme décoratif dans ta réponse.`,
      messages: [{ role: "user", content: opts.user }],
      output_config: {
        effort: opts.effort ?? "low",
        ...(opts.schema ? { format: { type: "json_schema", schema: opts.schema } } : {}),
      },
      ...fallbackParams(model),
    } as Parameters<ReturnType<typeof client>["beta"]["messages"]["create"]>[0] & { stream?: false });
    if (res.stop_reason === "refusal") throw new ClaudeError("refusal", "Claude a refusé de traiter cette demande.");
    const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
    if (!text) throw new ClaudeError("empty", "Réponse vide.");
    return stripEmoji(text);
  } catch (e) {
    throw friendly(e);
  }
}

export async function testKey() {
  const t = await ask({ system: "Réponds en français, en une phrase très courte.", user: "Dis bonjour au nouveau chef d'équipe de FORMA-8.", maxTokens: 300 });
  return t;
}

export interface FeynmanGrade { score: number; verdict: string; strengths: string[]; fixes: string[]; tip: string }

export async function gradeFeynman(question: string, model: string, criteria: string[], answer: string): Promise<FeynmanGrade> {
  const schema = {
    type: "object", additionalProperties: false,
    required: ["score", "verdict", "strengths", "fixes", "tip"],
    properties: {
      score: { type: "integer", description: "Note de 0 à 100" },
      verdict: { type: "string", enum: ["maîtrisé", "presque", "à revoir"] },
      strengths: { type: "array", items: { type: "string" } },
      fixes: { type: "array", items: { type: "string" } },
      tip: { type: "string" },
    },
  };
  const text = await ask({
    system: "Tu es un formateur bienveillant et exigeant qui évalue l'explication d'un apprenant débutant qui apprend à créer des applications avec l'IA. Tu réponds en français, en tutoyant. Tu notes la justesse et la clarté, pas le style ni l'orthographe. Si une notion est fausse, dis-le clairement et simplement.",
    user: `Question posée : ${question}\n\nRéponse de référence : ${model}\n\nCritères de réussite :\n${criteria.map((c) => `- ${c}`).join("\n")}\n\nRéponse de l'apprenant :\n"""${answer}"""\n\nÉvalue selon les critères. strengths : 1 à 3 points forts. fixes : 0 à 3 corrections précises. tip : un conseil court pour progresser.`,
    schema,
    maxTokens: 2000,
  });
  return JSON.parse(text) as FeynmanGrade;
}

export async function reexplain(term: string, definition: string, analogy: string, level: string) {
  return ask({
    system: "Tu es ORA, guide pédagogique d'une appli qui apprend aux débutants à créer des applications avec l'IA. Tu réponds en français, en tutoyant, en 120 mots maximum. Tu n'utilises AUCUN terme technique sans l'expliquer immédiatement en mots simples. Pas de titre, pas de liste longue.",
    user: `L'apprenant n'a pas compris la notion « ${term} ».\nDéfinition actuelle (${level}) : ${definition}\nAnalogie actuelle : ${analogy}\n\nRéexplique autrement : une autre image du quotidien, puis un exemple concret tiré d'une petite entreprise ou d'un freelance.`,
    maxTokens: 1500,
  });
}

export async function runPrompt(prompt: string) {
  return ask({ system: "Réponds en français.", user: prompt, maxTokens: 2500, effort: "low" });
}

export interface SkillTest { output: string; followed: boolean; notes: string[] }

export async function testSkill(skillMd: string, input: string): Promise<SkillTest> {
  const output = await ask({
    system: `Tu appliques STRICTEMENT le Skill suivant pour répondre à l'utilisateur. Réponds en français.\n\n${skillMd}`,
    user: input,
    maxTokens: 3000,
  });
  const schema = {
    type: "object", additionalProperties: false, required: ["followed", "notes"],
    properties: { followed: { type: "boolean" }, notes: { type: "array", items: { type: "string" } } },
  };
  const verdict = JSON.parse(await ask({
    system: "Tu vérifies si une réponse respecte les instructions d'un Skill. Réponds en français, de façon concise et concrète.",
    user: `SKILL :\n${skillMd}\n\nDEMANDE :\n${input}\n\nRÉPONSE PRODUITE :\n${output}\n\nLa réponse respecte-t-elle les étapes, le format et les points à éviter ? notes : 1 à 4 remarques pour améliorer le Skill lui-même (pas la réponse).`,
    schema,
    maxTokens: 1500,
  })) as { followed: boolean; notes: string[] };
  return { output, ...verdict };
}

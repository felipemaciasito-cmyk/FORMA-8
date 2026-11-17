import { motion } from "motion/react";
import { useState } from "react";
import type { Block, DeliveryCheck, Room } from "../content/types";
import type { BugReportGrade, ConsigneGrade } from "../lib/claude";
import { checkKey, deliveryState, pagesUrl, toggleManual, verifyDelivery, type CheckResult } from "../lib/delivery";
import { addEnergy, checkBadges, fx, REWARD } from "../lib/game";
import { loadClaude } from "../lib/models";
import { RichText } from "../lib/richtext";
import { go } from "../lib/router";
import { copyText } from "../lib/share";
import { sfx } from "../lib/sound";
import { getState, updateProgress, useProgress, useSettings } from "../lib/store";
import { ReponseBabil } from "./Bulle";
import { Sheet } from "./Chrome";
import { Icon } from "./Icon";

// ---------------------------------------------------------------
// Mécaniques propres à FORMA-8 : ordre de mission, atelier des consignes,
// rapport de bug, lecture d'une modification, source datée, livraison.
// ---------------------------------------------------------------

// Brouillons : même convention que les réponses « avec tes mots » (clés forma8:brouillon:…).
const draftKey = (id: string) => `forma8:brouillon:${id}`;
function readDraft(id: string) { try { return localStorage.getItem(draftKey(id)) ?? ""; } catch { return ""; } }
function writeDraft(id: string, text: string) {
  try { if (text.trim()) localStorage.setItem(draftKey(id), text); else localStorage.removeItem(draftKey(id)); } catch { /* stockage indisponible */ }
}

function NeedKey() {
  return (
    <div className="feedback info">
      <span className="tag">Clé API nécessaire</span>
      Claude corrige ce travail. Ajoute ta clé API dans les Réglages.
      <button className="btn small subtle block" style={{ marginTop: 8 }} onClick={() => go("reglages")}><Icon name="gear" size={16} /> Ouvrir les Réglages</button>
    </div>
  );
}

// ======================= Ordre de mission =======================
export function MissionBlock({ block, exKey }: { block: Extract<Block, { type: "mission" }>; exKey?: string }) {
  const [copied, setCopied] = useState(false);
  const p = useProgress();
  // La liste de vérification est gardée (et synchronisée) : on la complète au retour de Claude Code.
  const vkey = (i: number) => `mission:${exKey || block.title}:${i}`;
  const ticks = block.verify.map((_v, i) => !!p.checks[vkey(i)]);
  const setTick = (i: number) => updateProgress((d) => { d.checks = { ...d.checks, [vkey(i)]: !ticks[i] }; });
  // L'ordre de mission est personnalisé avec ton produit : {produit}, {phrase}, {depot}.
  const pr = p.product;
  const prompt = block.prompt
    .replaceAll("{produit}", pr.name || "[le nom de ton produit]")
    .replaceAll("{phrase}", pr.pitch || "[pour qui, pour quoi]")
    .replaceAll("{depot}", pr.repo ? `${pr.owner}/${pr.repo}` : "[ton compte/ton dépôt]");
  const missing = /\[(le nom de ton produit|pour qui, pour quoi|ton compte\/ton dépôt)\]/.test(prompt);
  return (
    <div className="panel" style={{ borderColor: "rgba(59,232,255,.35)", background: "linear-gradient(160deg, rgba(59,232,255,.07), rgba(12,19,34,.88) 45%)" }}>
      <div className="panel-title" style={{ color: "var(--cyan)" }}><Icon name="rocket" size={16} /> Ordre de mission</div>
      <div className="h3">{block.title}</div>
      <div className="small muted" style={{ marginBottom: 10 }}><RichText md={block.goal} /></div>
      <pre className="mono" style={{ margin: 0, padding: 12, borderRadius: 10, background: "#050912", border: "1px solid var(--line)", whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.55, color: "#cfefff" }}>{prompt}</pre>
      {missing && <div className="small" style={{ color: "var(--amber)", marginTop: 6 }}>Remplace les passages entre crochets, ou renseigne ton produit dans l'écran de l'équipe : ils se rempliront tout seuls.</div>}
      <button className="btn block" style={{ marginTop: 10 }} onClick={async () => { await copyText(prompt); sfx("ok"); setCopied(true); fx({ type: "toast", icon: "clipboard", text: "Ordre de mission copié", tone: "cyan" }); }}>
        <Icon name={copied ? "check" : "copy"} size={18} /> {copied ? "Copié : colle-le dans Claude Code" : "Copier l'ordre de mission"}
      </button>
      <div className="small dim" style={{ marginTop: 6 }}>Ouvre une session sur claude.ai/code, choisis le dépôt de ton produit, colle l'ordre, puis reviens ici.</div>
      {block.verify.length > 0 && (
        <>
          <div className="panel-title" style={{ marginTop: 14 }}>À vérifier dans sa livraison</div>
          {block.verify.map((v, i) => (
            <button key={i} className={`choice ${ticks[i] ? "ok" : ""}`} onClick={() => { sfx(ticks[i] ? "tap" : "ok"); setTick(i); }}>
              <span className="key">{ticks[i] ? <Icon name="check" size={14} stroke={2.4} /> : i + 1}</span><span><RichText md={v} /></span>
            </button>
          ))}
        </>
      )}
    </div>
  );
}

// ======================= Atelier des consignes =======================
export function ConsigneBlock({ id, situation, expected }: { id: string; situation: string; expected: string[] }) {
  const settings = useSettings();
  const p = useProgress();
  const [text, setTextState] = useState(() => readDraft(`consigne:${id}`));
  const setText = (t: string) => { setTextState(t); writeDraft(`consigne:${id}`, t); };
  const [grade, setGrade] = useState<ConsigneGrade | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const best = p.consignes[id];

  const ask = async () => {
    setLoading(true); setError("");
    try {
      const { gradeConsigne } = await loadClaude();
      const g = await gradeConsigne(situation, expected, text);
      setGrade(g);
      const before = getState().progress.consignes[id] ?? 0;
      updateProgress((d) => { d.consignes[id] = Math.max(g.score, d.consignes[id] ?? 0); });
      if (g.score >= 70 && before < 70) addEnergy(REWARD.consigne, "consigne solide");
      sfx(g.score >= 70 ? "ok" : "tap"); if (g.score >= 70) fx({ type: "burst", color: "#3be8ff" });
      checkBadges();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  };

  return (
    <div className="panel" style={{ borderColor: "rgba(255,181,71,.35)", background: "linear-gradient(160deg, rgba(255,181,71,.07), rgba(12,19,34,.88) 45%)" }}>
      <div className="panel-title" style={{ color: "var(--amber)" }}><Icon name="pencil" size={16} /> Atelier des consignes{best !== undefined ? ` · meilleure note ${best}/100` : ""}</div>
      <div style={{ fontSize: 16, marginBottom: 10 }}><RichText md={situation} /></div>
      <div className="small muted" style={{ marginBottom: 8 }}>Rédige l'ordre de mission que tu donnerais à Claude Code. Pense à : contexte, objectif, critères de réussite, contraintes, vérification.</div>
      <textarea className="input" rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder="Ta consigne…" />
      {!settings.apiKey ? <div style={{ marginTop: 10 }}><NeedKey /></div> : (
        <button className="btn block" style={{ marginTop: 10 }} disabled={text.trim().length < 40 || loading} onClick={ask}>{loading ? "Claude lit ta consigne…" : "Faire noter par Claude"}</button>
      )}
      {text.trim().length < 40 && <div className="small dim" style={{ marginTop: 6 }}>Écris au moins quelques phrases.</div>}
      {error && <div className="feedback ko"><span className="tag">Erreur</span>{error}</div>}
      {grade && (
        <motion.div className={`feedback ${grade.score >= 70 ? "ok" : "info"}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <span className="tag">Claude · {grade.score}/100 · {grade.verdict}</span>
          {grade.criteria.map((c, i) => (
            <div key={i} className="small" style={{ display: "flex", gap: 8, margin: "6px 0" }}>
              <Icon name={c.ok ? "check" : "close"} size={14} stroke={2.4} style={{ color: c.ok ? "var(--led)" : "var(--red)", marginTop: 3, flex: "none" }} />
              <span><b>{c.name}</b> : {c.comment}</span>
            </div>
          ))}
          <div className="small" style={{ display: "flex", gap: 8, marginTop: 8 }}><Icon name="bulb" size={16} style={{ color: "var(--amber)", marginTop: 2 }} /><span>{grade.tip}</span></div>
          <details style={{ marginTop: 8 }}>
            <summary className="small muted">Voir une version améliorée</summary>
            <pre className="mono small" style={{ whiteSpace: "pre-wrap", margin: "8px 0" }}>{grade.improved}</pre>
            <button className="btn small subtle" onClick={async () => { await copyText(grade.improved); sfx("ok"); }}><Icon name="copy" size={14} /> Copier</button>
          </details>
        </motion.div>
      )}
    </div>
  );
}

// ======================= Rapport de bug (panne à diagnostiquer) =======================
export function BugReportBlock({ id, symptom, context, expected }: { id: string; symptom: string; context: string; expected: string[] }) {
  const settings = useSettings();
  const p = useProgress();
  const [text, setTextState] = useState(() => readDraft(`rapport:${id}`));
  const setText = (t: string) => { setTextState(t); writeDraft(`rapport:${id}`, t); };
  const [grade, setGrade] = useState<BugReportGrade | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const best = p.reports[id];

  const ask = async () => {
    setLoading(true); setError("");
    try {
      const { gradeBugReport } = await loadClaude();
      const g = await gradeBugReport(symptom, context, expected, text);
      setGrade(g);
      const before = getState().progress.reports[id] ?? 0;
      updateProgress((d) => { d.reports[id] = Math.max(g.score, d.reports[id] ?? 0); });
      if (g.score >= 70 && before < 70) addEnergy(REWARD.report, "rapport de bug précis");
      sfx(g.score >= 70 ? "ok" : "tap");
      checkBadges();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  };

  return (
    <div className="panel" style={{ borderColor: "rgba(255,77,109,.4)", background: "linear-gradient(140deg, rgba(255,77,109,.10), rgba(12,19,34,.9) 50%)" }}>
      <div className="panel-title" style={{ color: "var(--red)" }}><Icon name="bug" size={16} /> Panne à diagnostiquer{best !== undefined ? ` · meilleure note ${best}/100` : ""}</div>
      <div style={{ fontSize: 16 }}><b>Symptôme :</b> <RichText md={symptom} /></div>
      <div className="small muted" style={{ margin: "6px 0 10px" }}><RichText md={context} /></div>
      <div className="small muted" style={{ marginBottom: 8 }}>Rédige le rapport de bug que tu enverrais à Claude Code : étapes pour reproduire, résultat attendu, résultat obtenu, appareil, indices, et demande de chercher la cause avant de corriger.</div>
      <textarea className="input" rows={7} value={text} onChange={(e) => setText(e.target.value)} placeholder="Ton rapport de bug…" />
      {!settings.apiKey ? <div style={{ marginTop: 10 }}><NeedKey /></div> : (
        <button className="btn block danger" style={{ marginTop: 10 }} disabled={text.trim().length < 40 || loading} onClick={ask}>{loading ? "Claude lit ton rapport…" : "Faire noter par Claude"}</button>
      )}
      {error && <div className="feedback ko"><span className="tag">Erreur</span>{error}</div>}
      {grade && (
        <motion.div className={`feedback ${grade.score >= 70 ? "ok" : "info"}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <span className="tag">Claude · {grade.score}/100 · {grade.verdict}</span>
          {grade.strengths.length > 0 && <><b>Points forts</b><ul style={{ margin: "4px 0 8px", paddingLeft: 18 }}>{grade.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul></>}
          {grade.missing.length > 0 && <><b>Il manque</b><ul style={{ margin: "4px 0 8px", paddingLeft: 18 }}>{grade.missing.map((s, i) => <li key={i}>{s}</li>)}</ul></>}
          <div className="small" style={{ display: "flex", gap: 8 }}><Icon name="bulb" size={16} style={{ color: "var(--amber)", marginTop: 2 }} /><span>{grade.tip}</span></div>
        </motion.div>
      )}
    </div>
  );
}

// ======================= Lecture d'une modification =======================
export function DiffBlock({ block }: { block: Extract<Block, { type: "diff" }> }) {
  const added = block.lines.filter((l) => l.kind === "add").length;
  const removed = block.lines.filter((l) => l.kind === "del").length;
  return (
    <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
      <div className="row" style={{ padding: "10px 12px", borderBottom: "1px solid var(--line)" }}>
        <Icon name="code" size={16} style={{ color: "var(--cyan)" }} />
        <span className="grow"><b>{block.title}</b><br /><span className="mono small dim">{block.file}</span></span>
        <span className="mono small" style={{ color: "var(--led)" }}>+{added}</span><span className="mono small" style={{ color: "var(--red)" }}>-{removed}</span>
      </div>
      <div style={{ background: "#050912", overflowX: "auto" }}>
        {block.lines.map((l, i) => (
          <div key={i} className="mono" style={{ display: "flex", fontSize: 12.5, lineHeight: 1.7, whiteSpace: "pre",
            background: l.kind === "add" ? "rgba(77,255,160,.10)" : l.kind === "del" ? "rgba(255,77,109,.12)" : undefined,
            color: l.kind === "add" ? "#b8ffd9" : l.kind === "del" ? "#ffc2cd" : "var(--text-2)" }}>
            <span style={{ width: 22, textAlign: "center", flex: "none", color: l.kind === "add" ? "var(--led)" : l.kind === "del" ? "var(--red)" : "var(--text-3)" }}>{l.kind === "add" ? "+" : l.kind === "del" ? "-" : " "}</span>
            <span style={{ paddingRight: 12 }}>{l.t}</span>
          </div>
        ))}
      </div>
      {block.note && <div className="small muted" style={{ padding: "10px 12px" }}><RichText md={block.note} /></div>}
    </div>
  );
}

// ======================= Source officielle datée =======================
export function SourceBlock({ block }: { block: Extract<Block, { type: "source" }> }) {
  return (
    <a className="choice" href={block.url} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: "inherit", alignItems: "center" }}>
      <Icon name="book" size={22} style={{ color: "var(--cyan)" }} />
      <span className="grow">
        <span className="kicker" style={{ color: "var(--cyan)" }}>Source officielle · vérifiée le {new Date(block.checked + "T12:00:00").toLocaleDateString("fr-FR")}</span>
        <b style={{ display: "block" }}>{block.title}</b>
        {block.note && <span className="small muted"><RichText md={block.note} /></span>}
      </span>
      <Icon name="external" size={16} />
    </a>
  );
}

// ======================= Produit fil rouge =======================
export function ProductForm({ compact }: { compact?: boolean }) {
  const p = useProgress();
  const pr = p.product;
  const set = (patch: Partial<typeof pr>) => updateProgress((d) => { d.product = { ...d.product, ...patch }; });
  return (
    <div>
      {!compact && (
        <>
          <label className="field"><span>Nom de ton produit</span><input className="input" value={pr.name} maxLength={40} onChange={(e) => set({ name: e.target.value })} placeholder="Par exemple : Carnet de chantier" /></label>
          <label className="field"><span>En une phrase : pour qui, pour quoi ?</span><input className="input" value={pr.pitch} maxLength={140} onChange={(e) => set({ pitch: e.target.value })} placeholder="Aider les artisans à suivre leurs chantiers depuis leur téléphone" /></label>
        </>
      )}
      <div className="row">
        <label className="field grow"><span>Compte GitHub</span><input className="input mono" value={pr.owner} onChange={(e) => set({ owner: e.target.value.trim() })} autoCapitalize="off" autoCorrect="off" /></label>
        <label className="field grow"><span>Dépôt du produit</span><input className="input mono" value={pr.repo} onChange={(e) => set({ repo: e.target.value.trim() })} placeholder="mon-produit" autoCapitalize="off" autoCorrect="off" /></label>
      </div>
      {pr.repo && <div className="small dim">Page publiée attendue : {pagesUrl(pr)}</div>}
    </div>
  );
}

// ======================= Livraison vérifiée =======================
const KIND_LABEL: Record<DeliveryCheck["kind"], string> = {
  manual: "à cocher", file: "fichier", commits: "historique", pullsMerged: "pull requests", workflow: "robot", pages: "en ligne",
};

export function DeliveryCard({ r }: { r: Room }) {
  const p = useProgress();
  const s = useSettings();
  const d = r.delivery!;
  const st = deliveryState(p, r);
  const [results, setResults] = useState<Record<string, CheckResult>>({});
  const [loading, setLoading] = useState(false);
  const verify = async () => { setLoading(true); sfx("relay"); try { setResults(await verifyDelivery(r)); } finally { setLoading(false); } };

  return (
    <div className="panel" style={{ marginTop: 20, borderColor: st.validated ? "rgba(77,255,160,.45)" : "rgba(167,139,250,.35)", background: st.validated ? "rgba(77,255,160,.06)" : "rgba(167,139,250,.06)" }}>
      <div className="panel-title" style={{ color: st.validated ? "var(--led)" : "var(--violet)" }}><Icon name="rocket" size={16} /> Livraison {r.version} · {st.done}/{st.total}</div>
      <div className="h3">{d.title}</div>
      <div className="small muted" style={{ marginBottom: 10 }}><RichText md={d.goal} /></div>
      {d.steps.length > 0 && <ol className="small" style={{ margin: "0 0 10px", paddingLeft: 20, lineHeight: 1.6 }}>{d.steps.map((x, i) => <li key={i}><RichText md={x} /></li>)}</ol>}
      {!p.product.repo && d.checks.some((c) => c.kind !== "manual" && c.kind !== "pages") && (
        <div className="feedback info"><span className="tag">Dépôt du produit</span>Indique le dépôt GitHub de ton produit pour que l'appli vérifie ta livraison.<div style={{ marginTop: 8 }}><ProductForm compact /></div></div>
      )}
      <div className="stack" style={{ marginTop: 6 }}>
        {d.checks.map((c) => {
          const state = p.deliveryChecks[checkKey(r.id, c.id)];
          const res = results[c.id];
          return (
            <div key={c.id} className={`choice ${state ? "ok" : ""}`} style={{ cursor: "default", alignItems: "flex-start" }}>
              <span className="key">{state ? <Icon name="check" size={14} stroke={2.4} /> : <Icon name={c.kind === "manual" ? "pencil" : "search"} size={14} />}</span>
              <span className="grow">
                <span style={{ display: "block" }}><RichText md={c.label} /></span>
                <span className="mono" style={{ fontSize: 10.5, color: "var(--text-3)" }}>{KIND_LABEL[c.kind].toUpperCase()}</span>
                {res && !state && <span className="small" style={{ display: "block", color: "var(--red)", marginTop: 2 }}>{res.detail}</span>}
                {res && state?.state === "verified" && <span className="small" style={{ display: "block", color: "var(--led)", marginTop: 2 }}>{res.detail}</span>}
              </span>
              {state?.state === "verified" ? <span className="pill led">Vérifié</span>
                : state?.state === "manual" ? <button className="pill amber" onClick={() => { sfx("tap"); toggleManual(r, c.id); }}>Déclaré</button>
                : <button className="pill" onClick={() => { sfx("tap"); toggleManual(r, c.id); }}>{c.kind === "manual" ? "Cocher" : "Cocher à la main"}</button>}
            </div>
          );
        })}
      </div>
      {!st.validated && d.checks.some((c) => c.kind !== "manual") && (
        <button className="btn block" style={{ marginTop: 12 }} disabled={loading} onClick={verify}><Icon name="search" size={18} /> {loading ? "Vérification sur GitHub…" : "Vérifier ma livraison"}</button>
      )}
      {!s.ghToken && !st.validated && d.checks.some((c) => c.kind !== "manual" && c.kind !== "pages") && <div className="small dim" style={{ marginTop: 6 }}>Sans jeton GitHub, seuls les dépôts publics peuvent être vérifiés.</div>}
      {st.validated && <div className="feedback ok"><span className="tag">Livraison validée</span>Le {new Date(p.deliveries[r.id] + "T12:00:00").toLocaleDateString("fr-FR")} · {st.verified} contrôle{st.verified > 1 ? "s" : ""} vérifié{st.verified > 1 ? "s" : ""} sur GitHub. Elle figure dans ton portfolio.</div>}
    </div>
  );
}

// ======================= Procédure pas à pas =======================
/** Manipulation guidée (souvent dans Safari) : chaque étape se coche, la position est gardée et synchronisée. */
export function ProcedureBlock({ block }: { block: Extract<Block, { type: "procedure" }> }) {
  const p = useProgress();
  const key = (i: number) => `proc:${block.id}:${i}`;
  const done = block.steps.map((_s, i) => !!p.checks[key(i)]);
  const count = done.filter(Boolean).length;
  const current = done.indexOf(false);
  const [help, setHelp] = useState<number | null>(null);
  const toggle = (i: number) => {
    const on = !done[i];
    sfx(on ? "ok" : "tap");
    updateProgress((d) => { d.checks = { ...d.checks, [key(i)]: on }; });
    if (on && i === block.steps.length - 1 && done.slice(0, -1).every(Boolean)) fx({ type: "burst", color: "#4dffa0" });
  };
  return (
    <div className="panel" style={{ borderColor: "rgba(77,255,160,.35)", background: "linear-gradient(160deg, rgba(77,255,160,.06), rgba(12,19,34,.88) 45%)" }}>
      <div className="panel-title" style={{ color: "var(--led)" }}><Icon name="checklist" size={16} /> Procédure · {count}/{block.steps.length}</div>
      <div className="h3">{block.title}</div>
      {block.intro && <div className="small muted" style={{ marginBottom: 10 }}><RichText md={block.intro} /></div>}
      <div className="progress" style={{ margin: "6px 0 12px" }}><motion.i animate={{ width: `${(count / block.steps.length) * 100}%` }} style={{ background: "var(--led)" }} /></div>
      <div className="stack">
        {block.steps.map((st, i) => (
          <div key={i} className={`choice ${done[i] ? "ok" : i === current ? "sel" : ""}`} style={{ cursor: "default", flexDirection: "column", alignItems: "stretch", gap: 8 }}>
            <div className="row" style={{ alignItems: "flex-start" }}>
              <button className="key" style={{ flex: "none" }} onClick={() => toggle(i)} aria-label={done[i] ? `Étape ${i + 1} faite, toucher pour décocher` : `Marquer l'étape ${i + 1} comme faite`}>
                {done[i] ? <Icon name="check" size={14} stroke={2.4} /> : i + 1}
              </button>
              <span className="grow"><RichText md={st.do} /></span>
            </div>
            {st.see && (i === current || done[i]) && <div className="small" style={{ color: "var(--text-2)", paddingLeft: 40 }}><Icon name="eye" size={13} /> <RichText md={st.see} /></div>}
            {st.help && !done[i] && (
              <div style={{ paddingLeft: 40 }}>
                {help === i
                  ? <div className="feedback info" style={{ marginTop: 0 }}><span className="tag">Si tu es bloqué</span><RichText md={st.help} /></div>
                  : <button className="btn small ghost" onClick={() => { sfx("tap"); setHelp(i); }}><Icon name="help" size={14} /> Je suis bloqué</button>}
              </div>
            )}
          </div>
        ))}
      </div>
      {count === block.steps.length && <div className="feedback ok"><span className="tag">Procédure terminée</span>Bravo : tout est fait. Tu peux continuer.</div>}
    </div>
  );
}

// ======================= Demander à Forma Trisse =======================
/** Question libre pendant un protocole : Claude (Forma Trisse) répond avec la leçon en cours et les notions déjà connues. */
export function AskOra({ lesson, known }: { lesson: string; known: string[] }) {
  const s = useSettings();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [log, setLog] = useState<{ q: string; a: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const send = async () => {
    const question = q.trim();
    if (question.length < 5) return;
    setLoading(true); setError("");
    try {
      const { askOra } = await loadClaude();
      const a = await askOra(question, lesson, known);
      setLog((l) => [...l, { q: question, a }]); setQ(""); sfx("ok");
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); sfx("ko"); }
    finally { setLoading(false); }
  };
  return (
    <>
      <button className="icon-btn" onClick={() => { sfx("open"); setOpen(true); }} aria-label="Demander à Forma Trisse"><Icon name="chat" size={20} /></button>
      <Sheet open={open} onClose={() => setOpen(false)} label="Demander à Forma Trisse">
        <div className="panel-title" style={{ color: "var(--cyan)" }}><Icon name="chat" size={16} /> Demander à Forma Trisse</div>
        <div className="small muted" style={{ marginBottom: 10 }}>Une question sur ce protocole ? Forma Trisse te répond avec des mots simples, en partant de ce que tu sais déjà.</div>
        <div className="stack" style={{ maxHeight: "45vh", overflowY: "auto" }}>
          {log.map((m, i) => (
            <div key={i}>
              <div className="choice sel" style={{ cursor: "default" }}><span className="grow">{m.q}</span></div>
              {/* La dernière réponse est « dite » en babillage, au rythme de son écriture ; les précédentes restent écrites. */}
              <div style={{ marginTop: 6 }}>{i === log.length - 1 ? <ReponseBabil speaker="ora" md={m.a} /> : <div className="feedback info"><span className="tag">Forma Trisse</span><RichText md={m.a} /></div>}</div>
            </div>
          ))}
        </div>
        {!s.apiKey ? <NeedKey /> : (
          <>
            <textarea className="input" rows={3} style={{ marginTop: 10 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Par exemple : à quoi sert le navigateur, exactement ?" />
            <button className="btn block" style={{ marginTop: 8 }} disabled={q.trim().length < 5 || loading} onClick={send}>{loading ? "Forma Trisse réfléchit…" : "Envoyer ma question"}</button>
          </>
        )}
        {error && <div className="feedback ko"><span className="tag">Erreur</span>{error}</div>}
      </Sheet>
    </>
  );
}

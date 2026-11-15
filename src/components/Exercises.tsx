import { motion, Reorder } from "motion/react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Exercise } from "../content/types";
import { fx, recordAnswer, REWARD, addEnergy } from "../lib/game";
import { RichText, inline } from "../lib/richtext";
import { sfx } from "../lib/sound";
import { updateProgress, useSettings } from "../lib/store";
import { loadClaude } from "../lib/models";
import type { FeynmanGrade } from "../lib/claude";
import { Icon } from "./Icon";

export interface ExProps { ex: Exercise; exKey: string; solvedBefore: boolean; onSolved: (attempts: number) => void }

const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const LETTERS = "ABCDEFG";

// Série de bonnes réponses (variante B) : chaque réussite l'allonge, une erreur la remet à zéro.
let streak = 0;
const streakSubs = new Set<(n: number) => void>();
function setStreak(n: number) { streak = n; streakSubs.forEach((f) => f(n)); }
function good(e?: { clientX: number; clientY: number }) {
  sfx("ok");
  fx({ type: "burst", x: e?.clientX, y: e?.clientY, color: "#3be8ff" });
  setStreak(streak + 1);
}
function bad() { sfx("ko"); setStreak(0); }

export function ExerciseView(outer: ExProps) {
  const { ex } = outer;
  const label = { qcm: "QCM", truefalse: "Vrai ou faux", cloze: "Texte à trous", order: "Remise en ordre", wiring: "Câblage", feynman: "Avec tes mots" }[ex.kind];
  const [won, setWon] = useState(false);
  const [serie, setSerie] = useState(streak);
  useLayoutEffect(() => { const f = (n: number) => setSerie(n); streakSubs.add(f); return () => { streakSubs.delete(f); }; }, []);
  const props: ExProps = { ...outer, onSolved: (a) => { setWon(true); outer.onSolved(a); } };
  return (
    <motion.div className="panel" animate={won ? { boxShadow: ["0 0 0 rgba(77,255,160,0)", "0 0 34px rgba(77,255,160,.45)", "0 0 14px rgba(77,255,160,.2)"] } : {}} transition={{ duration: 0.9 }}
      style={{ position: "relative", borderColor: won ? "rgba(77,255,160,.55)" : "rgba(59,232,255,.25)" }}>
      <div className="panel-title" style={{ justifyContent: "space-between" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><span className="led" style={{ background: won ? "var(--led)" : "var(--cyan)", boxShadow: `0 0 8px ${won ? "var(--led)" : "var(--cyan)"}` }} />Vérification · {label}</span>
        {serie >= 2 && (
          <motion.span key={serie} initial={{ scale: 1.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 380, damping: 16 }}
            className="pill amber" style={{ gap: 4 }}><Icon name="flame" size={12} /> Série de {serie}</motion.span>
        )}
      </div>
      {won && (
        <motion.span aria-hidden="true" initial={{ scale: 2.4, opacity: 0, rotate: -18 }} animate={{ scale: 1, opacity: 1, rotate: -8 }} transition={{ type: "spring", stiffness: 300, damping: 14 }}
          className="mono" style={{ position: "absolute", right: 14, top: -13, padding: "3px 10px", background: "#04060c", border: "2px solid var(--led)", borderRadius: 8, color: "var(--led)", font: "700 13px var(--mono)", letterSpacing: ".14em", textShadow: "0 0 8px rgba(77,255,160,.7)", pointerEvents: "none" }}>
          RÉUSSI
        </motion.span>
      )}
      {props.solvedBefore && (
        <div className="row wrap-row" style={{ gap: 8, margin: "-2px 0 12px" }}>
          <span className="pill led" style={{ flex: "none" }}><Icon name="check" size={12} stroke={2.4} /> Déjà réussie</span>
          <span className="small dim">Tu peux passer à la suite, ou la refaire pour réviser.</span>
        </div>
      )}
      {ex.kind === "qcm" && <Qcm {...props} ex={ex} />}
      {ex.kind === "truefalse" && <TrueFalse {...props} ex={ex} />}
      {ex.kind === "cloze" && <Cloze {...props} ex={ex} />}
      {ex.kind === "order" && <Order {...props} ex={ex} />}
      {ex.kind === "wiring" && <Wiring {...props} ex={ex} />}
      {ex.kind === "feynman" && <Feynman {...props} ex={ex} />}
    </motion.div>
  );
}

// ---------------- QCM ----------------
export function Qcm({ ex, onSolved }: ExProps & { ex: Extract<Exercise, { kind: "qcm" }> }) {
  const options = useMemo(() => shuffle(ex.options), [ex]);
  const [tried, setTried] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const [shakeI, setShakeI] = useState(-1);
  const pick = (i: number, e: React.MouseEvent) => {
    if (done || tried.includes(i)) return;
    const o = options[i];
    const t = [...tried, i];
    setTried(t);
    recordAnswer(o.ok);
    if (o.ok) { setDone(true); good(e); onSolved(t.length); }
    else { bad(); setShakeI(i); setTimeout(() => setShakeI(-1), 450); }
  };
  const last = tried[tried.length - 1];
  return (
    <div>
      <div className="h3" style={{ fontSize: 17 }}>{inline(ex.q)}</div>
      <div style={{ marginTop: 12 }}>
        {options.map((o, i) => {
          const state = tried.includes(i) ? (o.ok ? "ok" : "ko") : "";
          return (
            <button key={i} className={`choice ${state} ${shakeI === i ? "shake" : ""}`} onClick={(e) => pick(i, e)} disabled={done && !tried.includes(i)} aria-pressed={tried.includes(i)}>
              <span className="key">{state === "ok" ? <Icon name="check" size={14} stroke={2.4} /> : state === "ko" ? <Icon name="close" size={13} stroke={2.4} /> : LETTERS[i]}</span>
              <span className="grow">{inline(o.t, `o${i}`)}</span>
            </button>
          );
        })}
      </div>
      {last !== undefined && (
        <motion.div key={last} className={`feedback ${options[last].ok ? "ok" : "ko"}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          <span className="tag">{options[last].ok ? "Correct" : "Pas tout à fait"}</span>
          <RichText md={options[last].why} />
          {!options[last].ok && <div className="small muted" style={{ marginTop: 6 }}>Réessaie : une autre réponse est la bonne.</div>}
        </motion.div>
      )}
    </div>
  );
}

// ---------------- Vrai / faux ----------------
function TrueFalse({ ex, onSolved }: ExProps & { ex: Extract<Exercise, { kind: "truefalse" }> }) {
  const [ans, setAns] = useState<Record<number, boolean>>({});
  const [wrong, setWrong] = useState<Record<number, boolean>>({});
  const [attempts, setAttempts] = useState(0);
  const answer = (i: number, v: boolean, e: React.MouseEvent) => {
    if (ans[i] !== undefined && ans[i] === ex.items[i].ok) return;
    const ok = v === ex.items[i].ok;
    recordAnswer(ok);
    const a = attempts + 1; setAttempts(a);
    if (ok) {
      const next = { ...ans, [i]: v };
      setAns(next); setWrong((w) => ({ ...w, [i]: false }));
      sfx("ok");
      if (ex.items.every((it, k) => next[k] === it.ok)) { good(e); onSolved(Math.max(1, a - ex.items.length + 1)); }
    } else { setWrong((w) => ({ ...w, [i]: true })); bad(); }
  };
  return (
    <div>
      {ex.q && <div className="h3" style={{ fontSize: 17 }}>{ex.q}</div>}
      <div className="stack" style={{ marginTop: 10 }}>
        {ex.items.map((it, i) => {
          const solved = ans[i] === it.ok;
          return (
            <div key={i} className={`choice ${solved ? "ok" : wrong[i] ? "ko" : ""}`} style={{ flexDirection: "column", gap: 10 }}>
              <div>{inline(it.s, `s${i}`)}</div>
              <div className="row">
                {[true, false].map((v) => (
                  <button key={String(v)} className={`btn small ${solved && it.ok === v ? "led" : "subtle"}`} style={{ flex: 1 }} onClick={(e) => answer(i, v, e)} disabled={solved}>
                    {v ? "Vrai" : "Faux"}
                  </button>
                ))}
              </div>
              {(solved || wrong[i]) && <div className="small" style={{ color: solved ? "var(--text)" : "var(--text-2)" }}>{solved ? <RichText md={it.why} /> : "Ce voyant reste rouge : retente."}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------- Texte à trous ----------------
function Cloze({ ex, onSolved }: ExProps & { ex: Extract<Exercise, { kind: "cloze" }> }) {
  const parts = useMemo(() => ex.text.split(/(\{\{[^}]+\}\})/g), [ex]);
  const answers = useMemo(() => parts.filter((p) => p.startsWith("{{")).map((p) => p.slice(2, -2)), [parts]);
  const pool = useMemo(() => shuffle([...answers, ...ex.distractors]), [answers, ex]);
  const [fill, setFill] = useState<(number | null)[]>(answers.map(() => null));
  const [checked, setChecked] = useState<boolean[] | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [done, setDone] = useState(false);
  const put = (pi: number) => {
    if (done) return;
    sfx("tap"); setChecked(null);
    const empty = fill.indexOf(null);
    if (empty === -1) return;
    const f = [...fill]; f[empty] = pi; setFill(f);
  };
  const clear = (bi: number) => { if (done) return; const f = [...fill]; f[bi] = null; setFill(f); setChecked(null); };
  const verify = (e: React.MouseEvent) => {
    const res = fill.map((pi, i) => pi !== null && pool[pi] === answers[i]);
    const a = attempts + 1; setAttempts(a); setChecked(res);
    const ok = res.every(Boolean);
    recordAnswer(ok);
    if (ok) { setDone(true); good(e); onSolved(a); }
    else { bad(); setTimeout(() => { setFill((f) => f.map((v, i) => (res[i] ? v : null))); setChecked(null); }, 1100); }
  };
  let bi = -1;
  return (
    <div>
      {ex.q && <div className="h3" style={{ fontSize: 17 }}>{ex.q}</div>}
      <div style={{ fontSize: 17, lineHeight: 2.1, margin: "8px 0 14px" }}>
        {parts.map((p, i) => {
          if (!p.startsWith("{{")) return <span key={i}>{inline(p, `c${i}`)}</span>;
          bi++;
          const idx = bi;
          const v = fill[idx];
          const st = checked ? (checked[idx] ? "ok" : "ko") : v !== null ? "filled" : "";
          return <button key={i} className={`blank ${st}`} onClick={() => clear(idx)} aria-label={v !== null ? `Trou ${idx + 1} : ${pool[v]}, toucher pour vider` : `Trou ${idx + 1} vide`}>{v !== null ? pool[v] : "…"}</button>;
        })}
      </div>
      <div className="row wrap-row" style={{ gap: 8 }}>
        {pool.map((w, pi) => <button key={pi} className={`chip ${fill.includes(pi) ? "used" : ""}`} disabled={fill.includes(pi) || done} onClick={() => put(pi)}>{w}</button>)}
      </div>
      {!done && <button className="btn block" style={{ marginTop: 14 }} disabled={fill.includes(null)} onClick={verify}>Vérifier</button>}
      {done && <div className="feedback ok"><span className="tag">Journal validé</span><RichText md={ex.why} /></div>}
    </div>
  );
}

// ---------------- Remise en ordre ----------------
function Order({ ex, onSolved }: ExProps & { ex: Extract<Exercise, { kind: "order" }> }) {
  const [items, setItems] = useState(() => { let s = shuffle(ex.items); while (s.every((x, i) => x === ex.items[i])) s = shuffle(ex.items); return s; });
  const [checked, setChecked] = useState<boolean[] | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [done, setDone] = useState(false);
  // Sur iPhone, l'écran du protocole défile : Safari prenait le glisser d'une ligne pour un défilement de la page et
  // annulait le geste (remarque du propriétaire, 15/11/2026 : « au doigt ça ne fonctionne pas »). Un écouteur
  // « touchmove » non passif bloque ce défilement quand le doigt part de la liste.
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = list.current;
    if (!el || done) return;
    const hold = (e: TouchEvent) => { if (e.cancelable) e.preventDefault(); };
    el.addEventListener("touchmove", hold, { passive: false });
    return () => el.removeEventListener("touchmove", hold);
  }, [done]);
  const move = (i: number, d: number) => {
    const j = i + d; if (j < 0 || j >= items.length) return;
    const n = [...items]; [n[i], n[j]] = [n[j], n[i]]; setItems(n); setChecked(null); sfx("tap");
  };
  const verify = (e: React.MouseEvent) => {
    const res = items.map((x, i) => x === ex.items[i]);
    const a = attempts + 1; setAttempts(a); setChecked(res);
    const ok = res.every(Boolean); recordAnswer(ok);
    if (ok) { setDone(true); good(e); onSolved(a); } else bad();
  };
  return (
    <div>
      <div className="h3" style={{ fontSize: 17 }}>{inline(ex.q)}</div>
      <div className="small muted" style={{ marginBottom: 10 }}>Fais glisser les modules, ou utilise les flèches.</div>
      <div ref={list} className="order-list">
      <Reorder.Group axis="y" values={items} onReorder={(v) => { if (!done) { setItems(v); setChecked(null); } }} style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {items.map((it, i) => (
          <Reorder.Item key={it} value={it} dragListener={!done} className="order-item"
            style={{ marginBottom: 8, touchAction: done ? "auto" : "none" }}>
            <div className={`choice ${checked ? (checked[i] ? "ok" : "ko") : done ? "ok" : ""}`} style={{ alignItems: "center", cursor: done ? "default" : "grab" }}>
              <span className="key">{i + 1}</span>
              <span className="grow">{inline(it, `r${i}`)}</span>
              {!done && (
                <span className="row" style={{ gap: 4 }}>
                  <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => move(i, -1)} aria-label="Monter"><Icon name="chevron-up" size={16} stroke={2.2} /></button>
                  <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => move(i, 1)} aria-label="Descendre"><Icon name="chevron-down" size={16} stroke={2.2} /></button>
                </span>
              )}
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>
      </div>
      {!done && <button className="btn block" style={{ marginTop: 6 }} onClick={verify}>Vérifier l'ordre</button>}
      {checked && !done && <div className="feedback ko"><span className="tag">Séquence incorrecte</span>Les modules en rouge ne sont pas à leur place.</div>}
      {done && <div className="feedback ok"><span className="tag">Séquence validée</span><RichText md={ex.why} /></div>}
    </div>
  );
}

// ---------------- Câblage ----------------
function Wiring({ ex, onSolved }: ExProps & { ex: Extract<Exercise, { kind: "wiring" }> }) {
  const rights = useMemo(() => shuffle(ex.pairs.map((p, i) => ({ t: p.r, i }))), [ex]);
  const [sel, setSel] = useState<number | null>(null);
  const [links, setLinks] = useState<Record<number, number>>({}); // gauche -> index dans rights
  const [locked, setLocked] = useState<Record<number, boolean>>({});
  const [flash, setFlash] = useState<Record<number, boolean>>({});
  const [attempts, setAttempts] = useState(0);
  const [done, setDone] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const lRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const rRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [lines, setLines] = useState<{ x1: number; y1: number; x2: number; y2: number; l: number }[]>([]);

  useLayoutEffect(() => {
    const calc = () => {
      const b = box.current?.getBoundingClientRect(); if (!b) return;
      setLines(Object.entries(links).map(([l, r]) => {
        const a = lRefs.current[+l]?.getBoundingClientRect(); const c = rRefs.current[r]?.getBoundingClientRect();
        if (!a || !c) return null;
        return { x1: a.right - b.left, y1: a.top + a.height / 2 - b.top, x2: c.left - b.left, y2: c.top + c.height / 2 - b.top, l: +l };
      }).filter(Boolean) as typeof lines);
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, [links]);

  const tapLeft = (i: number) => { if (done || locked[i]) return; sfx("tap"); setSel(sel === i ? null : i); };
  const tapRight = (ri: number) => {
    if (done || sel === null) return;
    sfx("relay");
    const next = { ...links };
    for (const [l, r] of Object.entries(next)) if (r === ri && !locked[+l]) delete next[+l];
    if (Object.entries(next).some(([l, r]) => r === ri && locked[+l])) return;
    next[sel] = ri; setLinks(next); setSel(null);
  };
  const verify = (e: React.MouseEvent) => {
    const a = attempts + 1; setAttempts(a);
    const nl: Record<number, boolean> = { ...locked }; const wrong: Record<number, boolean> = {};
    const next = { ...links };
    for (const [l, r] of Object.entries(links)) {
      if (rights[r].i === +l) nl[+l] = true; else { wrong[+l] = true; delete next[+l]; }
    }
    setLocked(nl); setFlash(wrong);
    const ok = ex.pairs.every((_p, i) => nl[i]);
    recordAnswer(ok);
    if (ok) { setDone(true); good(e); onSolved(a); }
    else { bad(); setTimeout(() => { setLinks(next); setFlash({}); }, 700); }
  };
  const usedR = new Set(Object.values(links));
  return (
    <div>
      <div className="h3" style={{ fontSize: 17 }}>{inline(ex.q)}</div>
      <div className="small muted" style={{ marginBottom: 12 }}>Touche une prise à gauche, puis sa destination à droite.</div>
      <div ref={box} style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 34, rowGap: 10 }}>
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", overflow: "visible" }} aria-hidden="true">
          {lines.map((ln) => {
            const c = locked[ln.l] ? "var(--led)" : flash[ln.l] ? "var(--red)" : "var(--cyan)";
            const mx = (ln.x1 + ln.x2) / 2;
            return (
              <motion.path key={`${ln.l}`} d={`M${ln.x1} ${ln.y1} C${mx} ${ln.y1}, ${mx} ${ln.y2}, ${ln.x2} ${ln.y2}`} fill="none" stroke={c} strokeWidth="3" strokeLinecap="round"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.35 }} style={{ filter: `drop-shadow(0 0 4px ${c})` }} />
            );
          })}
        </svg>
        <div className="stack" style={{ gridColumn: 1 }}>
          {ex.pairs.map((p, i) => (
            <button key={i} ref={(el) => { lRefs.current[i] = el; }} onClick={() => tapLeft(i)}
              className={`choice ${locked[i] ? "ok" : flash[i] ? "ko" : sel === i ? "sel" : ""}`} style={{ padding: "11px 12px", fontSize: 14.5, justifyContent: "space-between" }}>
              <span>{p.l}</span><span style={{ width: 10, height: 10, borderRadius: "50%", flex: "none", marginTop: 5, background: links[i] !== undefined ? "var(--cyan)" : "#253250" }} />
            </button>
          ))}
        </div>
        <div className="stack" style={{ gridColumn: 2, gridRow: 1 }}>
          {rights.map((r, ri) => {
            const lockedHere = Object.entries(links).some(([l, x]) => x === ri && locked[+l]);
            return (
              <button key={ri} ref={(el) => { rRefs.current[ri] = el; }} onClick={() => tapRight(ri)}
                className={`choice ${lockedHere ? "ok" : usedR.has(ri) ? "sel" : ""}`} style={{ padding: "11px 12px", fontSize: 14.5, opacity: sel === null && !usedR.has(ri) && !done ? 0.85 : 1 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", flex: "none", marginTop: 5, background: usedR.has(ri) ? "var(--cyan)" : "#253250" }} />
                <span>{r.t}</span>
              </button>
            );
          })}
        </div>
      </div>
      {!done && <button className="btn block" style={{ marginTop: 14 }} disabled={Object.keys(links).length < ex.pairs.length} onClick={verify}>Tester les connexions</button>}
      {done && <div className="feedback ok"><span className="tag">Réseau opérationnel</span><RichText md={ex.why} /></div>}
    </div>
  );
}

// ---------------- Avec tes mots (Feynman) ----------------
// Brouillon de la réponse « Avec tes mots » : gardé sur l'appareil pour ne rien perdre en quittant la leçon.
const draftKey = (exKey: string) => `forma8:brouillon:${exKey}`;
function readDraft(exKey: string) { try { return exKey ? localStorage.getItem(draftKey(exKey)) ?? "" : ""; } catch { return ""; } }
function writeDraft(exKey: string, text: string) {
  if (!exKey) return;
  try { if (text.trim()) localStorage.setItem(draftKey(exKey), text); else localStorage.removeItem(draftKey(exKey)); } catch { /* stockage indisponible */ }
}

function Feynman({ ex, exKey, onSolved }: ExProps & { ex: Extract<Exercise, { kind: "feynman" }> }) {
  const settings = useSettings();
  const [text, setTextState] = useState(() => readDraft(exKey));
  const setText = (t: string) => { setTextState(t); writeDraft(exKey, t); };
  const [mode, setMode] = useState<"write" | "self" | "graded">("write");
  const [ticks, setTicks] = useState<boolean[]>(ex.criteria.map(() => false));
  const [grade, setGrade] = useState<FeynmanGrade | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const finish = (score: number) => {
    updateProgress((p) => { p.feynman[exKey] = Math.max(score, p.feynman[exKey] ?? 0); });
    if (score >= 70) addEnergy(REWARD.feynman, "explication solide");
    writeDraft(exKey, "");
    setDone(true); sfx("ok"); fx({ type: "burst", color: "#a78bfa" }); onSolved(1);
  };
  const askClaude = async () => {
    setLoading(true); setError("");
    try {
      const { gradeFeynman } = await loadClaude();
      const g = await gradeFeynman(ex.q, ex.model, ex.criteria, text);
      setGrade(g); setMode("graded"); finish(g.score);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  };
  return (
    <div>
      <div className="h3" style={{ fontSize: 17 }}>{inline(ex.q)}</div>
      <div className="small muted" style={{ marginBottom: 10 }}>Expliquer avec ses propres mots est la meilleure preuve qu'on a compris (méthode Feynman).</div>
      <textarea className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Écris ton explication ici…" disabled={done} rows={5} />
      {mode === "write" && (
        <div className="stack" style={{ marginTop: 12 }}>
          {settings.apiKey && <button className="btn block" disabled={text.trim().length < 30 || loading} onClick={askClaude}>{loading ? "Claude lit ta réponse…" : "Faire corriger par Claude"}</button>}
          <button className={`btn block ${settings.apiKey ? "ghost" : ""}`} disabled={text.trim().length < 30} onClick={() => setMode("self")}>Comparer à la réponse modèle</button>
          {text.trim().length < 30 && <div className="small dim">Écris au moins une ou deux phrases.</div>}
          {error && <div className="feedback ko"><span className="tag">Erreur</span>{error}</div>}
        </div>
      )}
      {mode === "self" && (
        <div style={{ marginTop: 12 }}>
          <div className="feedback info"><span className="tag">Réponse modèle</span><RichText md={ex.model} /></div>
          <div className="panel-title" style={{ marginTop: 14 }}>Coche ce que ta réponse contient vraiment</div>
          {ex.criteria.map((c, i) => (
            <button key={i} className={`choice ${ticks[i] ? "ok" : ""}`} disabled={done} onClick={() => setTicks((t) => t.map((v, k) => (k === i ? !v : v)))}>
              <span className="key">{ticks[i] ? <Icon name="check" size={14} stroke={2.4} /> : ""}</span><span>{c}</span>
            </button>
          ))}
          {!done && <button className="btn block" style={{ marginTop: 12 }} onClick={() => finish(Math.round((ticks.filter(Boolean).length / ticks.length) * 100))}>Valider mon auto-évaluation</button>}
          {done && <div className="feedback ok"><span className="tag">Enregistré</span>Score : {Math.round((ticks.filter(Boolean).length / ticks.length) * 100)} / 100. Si un critère manque, relis la notion et réessaie plus tard.</div>}
        </div>
      )}
      {mode === "graded" && grade && (
        <div className={`feedback ${grade.score >= 70 ? "ok" : "info"}`} style={{ marginTop: 12 }}>
          <span className="tag">Claude · {grade.score}/100 · {grade.verdict}</span>
          {grade.strengths.length > 0 && <><b>Points forts</b><ul style={{ margin: "4px 0 8px", paddingLeft: 18 }}>{grade.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul></>}
          {grade.fixes.length > 0 && <><b>À corriger</b><ul style={{ margin: "4px 0 8px", paddingLeft: 18 }}>{grade.fixes.map((s, i) => <li key={i}>{s}</li>)}</ul></>}
          <div className="small" style={{ display: "flex", gap: 8 }}><Icon name="bulb" size={16} style={{ color: "var(--amber)", marginTop: 2 }} /><span>{grade.tip}</span></div>
          <details style={{ marginTop: 8 }}><summary className="small muted">Voir la réponse modèle</summary><RichText md={ex.model} /></details>
        </div>
      )}
    </div>
  );
}

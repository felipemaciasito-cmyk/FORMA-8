import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { notion, room as getRoom, stepKey } from "../content";
import type { Room } from "../content/types";
import { addEnergy, checkBadges, fx, learnNotions, REWARD } from "../lib/game";
import { roomComplete, roomPower, roomReady, roomStepsDone, roomUnlocked, stepUnlocked } from "../lib/progress";
import { go } from "../lib/router";
import { sfx } from "../lib/sound";
import { getState, today, updateProgress, useProgress } from "../lib/store";
import { exportRoomFiche } from "../lib/fiche";
import { BlockView } from "./Blocks";
import { TopBar } from "./Chrome";
import { NotionChip } from "./Emblems";
import { Icon } from "./Icon";
import { DeliveryCard } from "./Mechanics";
import { OraSays } from "./Ora";

// ======================= Caisson (un niveau, un membre de l'équipe) =======================
export function RoomView({ id }: { id: string }) {
  const r = getRoom(id);
  const p = useProgress();
  if (!r) return <div className="wrap"><p>Caisson introuvable.</p></div>;
  if (!roomUnlocked(p, r)) return <div className="wrap"><TopBar title={r.member} kicker={r.code} onBack={() => go("")} /><OraSays mood="alert" md="Ce caisson est encore verrouillé. Réveille d'abord le membre de l'équipe précédent." /></div>;
  const power = roomPower(p, r);
  const done = roomStepsDone(p, r);
  const stepsAll = done === r.steps.length;
  return (
    <div className="wrap" style={{ ["--hue" as string]: r.hue }}>
      <TopBar title={r.member} kicker={`${r.code} · ${r.name} · ${r.version}`} onBack={() => go("")} />
      <motion.div className="panel glow" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: `linear-gradient(150deg, hsl(${r.hue} 80% 50% / .16), rgba(12,19,34,.9) 55%)`, borderColor: `hsl(${r.hue} 90% 60% / .35)` }}>
        <div style={{ fontSize: 17, marginBottom: 12 }}>{r.tagline}</div>
        <div className="row"><span className="mono small grow">RÉVEIL DU MEMBRE</span><span className="mono" style={{ color: "var(--accent)" }}>{power} %</span></div>
        <div className="progress" style={{ marginTop: 6, height: 8 }}><motion.i initial={{ width: 0 }} animate={{ width: `${power}%` }} transition={{ duration: 0.9 }} /></div>
      </motion.div>

      <div className="panel-title" style={{ marginTop: 20 }}>Protocoles de réveil</div>
      {!roomReady(r) && <OraSays md={`Les protocoles de réveil de **${r.member}** sont en préparation. Ils arriveront avec une prochaine version de l'appli.`} />}
      <div className="stack">
        {r.steps.map((s, i) => {
          const sdone = !!p.steps[stepKey(r.id, s.id)];
          const open = stepUnlocked(p, r, i);
          const at = !sdone && open ? Math.min(s.blocks.length, p.lessons?.[stepKey(r.id, s.id)] ?? 0) : 0;
          return (
            <motion.button key={s.id} className="choice" whileTap={{ scale: open ? 0.98 : 1 }} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
              onClick={() => { if (open) { sfx("open"); go(`caisson/${r.id}/${s.id}`); } else { sfx("ko"); fx({ type: "toast", icon: "lock", text: "Termine d'abord le protocole précédent", tone: "red" }); } }}
              style={{ alignItems: "center", opacity: open ? 1 : 0.5, borderColor: sdone ? "rgba(77,255,160,.4)" : open && !sdone ? "var(--accent)" : undefined }}>
              <RackIcon state={sdone ? "done" : open ? "open" : "locked"} hue={r.hue} />
              <span className="grow">
                <span className="mono" style={{ fontSize: 10.5, color: "var(--text-3)", letterSpacing: ".1em" }}>PROTOCOLE {String(i + 1).padStart(2, "0")}</span>
                <span style={{ display: "block", fontWeight: 700 }}>{s.title}</span>
                <span className="small muted">{s.introduces.length ? s.introduces.map((n) => notion(n)?.term.replace(/ \(.+\)$/, "")).join(" · ") : s.kicker}</span>
              </span>
              {sdone ? <span className="pill led">OK</span>
                : at > 1 ? <span className="pill cyan" aria-label={`Protocole en cours, ${Math.round((at / s.blocks.length) * 100)} pour cent`}>En cours · {Math.round((at / s.blocks.length) * 100)} %</span>
                : open ? <Icon name="play" size={16} /> : <Icon name="lock" size={16} />}
            </motion.button>
          );
        })}
      </div>

      {r.incident && (
        <motion.button className="panel" whileTap={{ scale: stepsAll ? 0.98 : 1 }} onClick={() => { if (stepsAll) { sfx("alarm"); go(`panne/${r.id}`); } else { sfx("ko"); } }}
          style={{ width: "100%", textAlign: "left", marginTop: 14, opacity: stepsAll ? 1 : 0.55, borderColor: p.incidents[r.id] ? "rgba(77,255,160,.4)" : "rgba(255,77,109,.45)", background: p.incidents[r.id] ? "rgba(77,255,160,.06)" : "linear-gradient(120deg, rgba(255,77,109,.14), rgba(12,19,34,.9))" }}>
          <div className="row">
            <span style={{ width: 46, height: 46, borderRadius: 14, display: "grid", placeItems: "center", flex: "none",
              color: p.incidents[r.id] ? "var(--led)" : "var(--red)", background: p.incidents[r.id] ? "var(--led-soft)" : "var(--red-soft)",
              border: `1px solid ${p.incidents[r.id] ? "rgba(77,255,160,.4)" : "rgba(255,77,109,.45)"}`, boxShadow: p.incidents[r.id] ? "none" : "0 0 16px rgba(255,77,109,.35)" }}>
              <Icon name={p.incidents[r.id] ? "extinguisher" : "siren"} size={26} />
            </span>
            <span className="grow">
              <span className="kicker" style={{ color: p.incidents[r.id] ? "var(--led)" : "var(--red)" }}>{p.incidents[r.id] ? "Panne résolue" : "Panne en cours"}</span>
              <span style={{ display: "block", fontWeight: 700 }}>{r.incident.title}</span>
              <span className="small muted">{stepsAll ? r.incident.brief : "Disponible quand tous les protocoles sont terminés."}</span>
            </span>
          </div>
        </motion.button>
      )}

      {r.project && <ProjectCard r={r} />}
      {r.delivery && <DeliveryCard r={r} />}

      <button className="btn ghost block" style={{ marginTop: 18 }} onClick={() => exportRoomFiche(r, getState().progress)}>
        <Icon name="share" size={18} /> Exporter la fiche du caisson
      </button>
      {roomComplete(p, r) && <div className="small dim" style={{ textAlign: "center", marginTop: 10 }}>{r.member} est réveillé. Les notions continuent de vivre en Maintenance.</div>}
    </div>
  );
}

function RackIcon({ state, hue }: { state: "done" | "open" | "locked"; hue: number }) {
  const c = state === "done" ? "#4dffa0" : state === "open" ? `hsl(${hue} 100% 62%)` : "#2a3550";
  return (
    <svg width="34" height="40" viewBox="0 0 34 40" aria-hidden="true">
      <rect x="2" y="2" width="30" height="36" rx="5" fill="#0b1222" stroke={c} strokeOpacity=".6" />
      {[0, 1, 2, 3].map((k) => (
        <g key={k}><rect x="7" y={8 + k * 7} width="20" height="4" rx="1.5" fill="#152038" />
          <rect x="22" y={9 + k * 7} width="3" height="2" fill={c} style={state !== "locked" ? { animation: `blink ${0.6 + k * 0.4}s steps(1) infinite` } : undefined} /></g>
      ))}
    </svg>
  );
}

function ProjectCard({ r }: { r: Room }) {
  const p = useProgress();
  const pr = r.project!;
  const key = (i: number) => `proj:${r.id}:${i}`;
  const doneCount = pr.steps.filter((_s, i) => p.checks?.[key(i)]).length;
  return (
    <div className="panel" style={{ marginTop: 20, borderColor: "rgba(167,139,250,.35)", background: "rgba(167,139,250,.06)" }}>
      <div className="panel-title" style={{ color: "var(--violet)" }}><Icon name="moon" size={16} /> Livraison {r.version} · {doneCount}/{pr.steps.length}</div>
      <div className="h3">{pr.title}</div>
      <div className="small muted" style={{ marginBottom: 10 }}>{pr.goal}</div>
      {pr.steps.map((s, i) => {
        const on = !!p.checks?.[key(i)];
        return (
          <button key={i} className={`choice ${on ? "ok" : ""}`} onClick={() => {
            sfx(on ? "tap" : "ok");
            updateProgress((d) => { d.checks = { ...(d.checks ?? {}), [key(i)]: !on }; });
            const all = pr.steps.every((_x, k) => (k === i ? !on : getState().progress.checks?.[key(k)]));
            if (all && !getState().progress.checks?.[`proj:${r.id}:done`]) {
              updateProgress((d) => { d.checks[`proj:${r.id}:done`] = true; });
              addEnergy(50, "livraison terminée");
            }
          }}>
            <span className="key">{on ? <Icon name="check" size={14} stroke={2.4} /> : i + 1}</span><span>{s}</span>
          </button>
        );
      })}
      <div className="small" style={{ marginTop: 10 }}><b>Réussi si :</b> {pr.success.join(" ")}</div>
    </div>
  );
}

// ======================= Protocole de réveil (leçon) =======================
export function StepView({ roomId, stepId }: { roomId: string; stepId: string }) {
  const r = getRoom(roomId);
  const p = useProgress();
  const idx = r ? r.steps.findIndex((s) => s.id === stepId) : -1;
  const step = r?.steps[idx];
  const key = r && step ? stepKey(r.id, step.id) : "";
  const wasDone = !!p.steps[key];
  const total = step?.blocks.length ?? 0;
  // Reprise : position enregistrée (synchronisée entre appareils) et exercices déjà réussis.
  const [resumedAt] = useState(() => (wasDone ? 0 : Math.min(total, getState().progress.lessons?.[key] ?? 0)));
  const [revealed, setRevealed] = useState(() => (wasDone ? 999 : Math.max(1, resumedAt)));
  const [solvedAtOpen] = useState(() => new Set(Object.keys(getState().progress.exercises).filter((k) => k.startsWith(`${key}#`))));
  const [solved, setSolved] = useState<Record<number, boolean>>({});
  const [finished, setFinished] = useState<null | { energy: number }>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const earned = useRef(0);

  useEffect(() => { if (revealed > Math.max(1, resumedAt) && revealed < 999) setTimeout(() => bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 60); }, [revealed, resumedAt]);
  useEffect(() => {
    if (resumedAt <= 1) return;
    fx({ type: "toast", icon: "play", text: `Reprise du protocole au bloc ${resumedAt} sur ${total}`, tone: "cyan" });
    const t = window.setTimeout(() => bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 450);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { if (finished) setTimeout(() => bottom.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 250); }, [finished]);

  const blocks = useMemo(() => step?.blocks ?? [], [step]);
  if (!r || !step) return <div className="wrap"><p>Protocole introuvable.</p></div>;
  if (!stepUnlocked(p, r, idx)) return <div className="wrap"><TopBar title={step.title} onBack={() => go(`caisson/${r.id}`)} /><OraSays mood="alert" md="Ce protocole n'est pas encore ouvert. Termine le précédent." /></div>;

  const visible = blocks.slice(0, revealed);
  const last = visible[visible.length - 1];
  const lastIdx = visible.length - 1;
  const isSolved = (i: number) => !!solved[i] || p.exercises[`${key}#${i}`] !== undefined;
  const blockedByExercise = last?.type === "exercise" && !isSolved(lastIdx) && !wasDone;
  const revealNext = () => {
    sfx("tap");
    const v = Math.min(blocks.length, revealed + 1);
    setRevealed(v);
    updateProgress((d) => { d.lessons = { ...(d.lessons ?? {}), [key]: Math.max(d.lessons?.[key] ?? 0, v) }; });
  };
  const atEnd = revealed >= blocks.length;
  const pct = Math.min(100, Math.round((Math.min(revealed, blocks.length) / blocks.length) * 100));

  const onSolved = (bi: number) => (attempts: number) => {
    setSolved((s) => ({ ...s, [bi]: true }));
    const exKey = `${key}#${bi}`;
    if (getState().progress.exercises[exKey] === undefined) {
      updateProgress((d) => { d.exercises[exKey] = attempts; });
      const e = attempts <= 1 ? REWARD.exerciseFirst : REWARD.exerciseRetry;
      earned.current += e;
      addEnergy(e);
    }
  };

  const complete = () => {
    const first = !getState().progress.steps[key];
    if (first) {
      updateProgress((d) => { d.steps[key] = today(); });
      learnNotions(step.introduces, r.id);
      addEnergy(REWARD.step, "protocole terminé");
      earned.current += REWARD.step;
    }
    sfx("power");
    fx({ type: "burst", color: `hsl(${r.hue} 100% 62%)` });
    checkBadges();
    setFinished({ energy: earned.current });
  };

  const next = r.steps[idx + 1];
  return (
    <div className="wrap" style={{ ["--hue" as string]: r.hue }}>
      <TopBar title={step.title} kicker={`${r.code} · Protocole ${String(idx + 1).padStart(2, "0")}`} onBack={() => go(`caisson/${r.id}`)} />
      <div className="progress" style={{ marginBottom: 18 }}><motion.i animate={{ width: `${pct}%` }} /></div>
      <div className="muted" style={{ fontSize: 17, marginBottom: 18, fontStyle: "italic" }}>{step.kicker}</div>
      <div className="stack" style={{ gap: 14 }}>
        <AnimatePresence initial={false}>
          {visible.map((b, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 24, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }} style={{ marginTop: 14 }}>
              <BlockView block={b} exKey={`${key}#${i}`} solvedBefore={solvedAtOpen.has(`${key}#${i}`)} onSolved={onSolved(i)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div ref={bottom} style={{ marginTop: 22, scrollMarginBottom: "calc(var(--tabbar-h) + var(--safe-bottom) + 20px)" }}>
        {!finished && !atEnd && (
          <motion.button className="btn block" whileTap={{ scale: 0.97 }} disabled={blockedByExercise} onClick={revealNext}>
            {blockedByExercise ? "Réussis la vérification pour continuer" : <>Continuer <Icon name="chevron-right" size={18} stroke={2.2} /></>}
          </motion.button>
        )}
        {!finished && atEnd && (
          <motion.button className="btn block led" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} whileTap={{ scale: 0.97 }} disabled={blockedByExercise} onClick={complete}>
            <Icon name="bolt" size={18} /> {wasDone ? "Relancer le protocole" : "Terminer le protocole"}
          </motion.button>
        )}
        <AnimatePresence>
          {finished && (
            <motion.div className="panel glow" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}
              style={{ textAlign: "center", borderColor: "rgba(77,255,160,.5)", background: "radial-gradient(circle at 50% 0%, rgba(77,255,160,.18), rgba(12,19,34,.95) 70%)" }}>
              <div style={{ display: "grid", placeItems: "center", margin: "2px 0 6px" }}>
                <span style={{ width: 64, height: 64, borderRadius: "50%", display: "grid", placeItems: "center", color: "var(--led)", background: "radial-gradient(circle, rgba(77,255,160,.28), rgba(77,255,160,.04) 70%)", border: "1px solid rgba(77,255,160,.5)", boxShadow: "0 0 28px rgba(77,255,160,.45)" }}>
                  <Icon name="bolt" size={34} />
                </span>
              </div>
              <div className="h2">Protocole {String(idx + 1).padStart(2, "0")} terminé</div>
              {finished.energy > 0 && <div className="mono" style={{ color: "var(--cyan)", fontSize: 20, margin: "6px 0 10px" }}>+{finished.energy} kW</div>}
              {step.introduces.length > 0 && (
                <>
                  <div className="small muted" style={{ marginBottom: 10 }}>Modules ajoutés à ta Base de connaissances :</div>
                  <div className="unlock-grid">
                    {step.introduces.map((n) => (
                      <div key={n}><NotionChip id={n} icon={notion(n)?.icon} size={56} trace /><span>{notion(n)?.term.replace(/\s*\(.+\)$/, "")}</span></div>
                    ))}
                  </div>
                </>
              )}
              <div className="stack">
                {next ? <button className="btn block" onClick={() => { setFinished(null); go(`caisson/${r.id}/${next.id}`); }}>Protocole suivant : {next.title}</button>
                  : r.incident && !p.incidents[r.id] ? <button className="btn block danger" onClick={() => { sfx("alarm"); go(`panne/${r.id}`); }}><Icon name="siren" size={18} /> Réparer la panne</button>
                  : <button className="btn block" onClick={() => go("")}>Retour à la carte</button>}
                <button className="btn ghost block" onClick={() => go(`caisson/${r.id}`)}>Retour au caisson</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ======================= Panne (défi de fin de caisson) =======================
export function IncidentView({ roomId }: { roomId: string }) {
  const r = getRoom(roomId);
  const p = useProgress();
  const [i, setI] = useState(0);
  const [fuses, setFuses] = useState(3);
  const [picked, setPicked] = useState<number[]>([]);
  const [state, setState] = useState<"play" | "won" | "lost">("play");
  const [shake, setShake] = useState(false);
  const order = useMemo(() => r?.incident?.scenarios.map((s) => [...s.options].sort(() => Math.random() - 0.5)) ?? [], [r]);
  if (!r?.incident) return <div className="wrap"><p>Aucune panne ici.</p></div>;
  if (roomStepsDone(p, r) < r.steps.length) return <div className="wrap"><TopBar title={r.incident.title} onBack={() => go(`caisson/${r.id}`)} /><OraSays mood="alert" md="Termine d'abord tous les protocoles du caisson." /></div>;
  const sc = r.incident.scenarios[i];
  const opts = order[i];
  const solvedNow = picked.some((k) => opts[k].ok);
  const last = picked[picked.length - 1];

  const pick = (k: number, e: React.MouseEvent) => {
    if (solvedNow || picked.includes(k) || state !== "play") return;
    const np = [...picked, k]; setPicked(np);
    if (opts[k].ok) { sfx("ok"); fx({ type: "burst", x: e.clientX, y: e.clientY, color: "#4dffa0" }); }
    else {
      sfx("alarm"); setShake(true); setTimeout(() => setShake(false), 500);
      const f = fuses - 1; setFuses(f);
      if (f <= 0) setTimeout(() => setState("lost"), 900);
    }
  };
  const nextScenario = () => {
    if (i + 1 < r.incident!.scenarios.length) { setI(i + 1); setPicked([]); sfx("tap"); return; }
    const first = !getState().progress.incidents[r.id];
    updateProgress((d) => { d.incidents[r.id] = { at: today(), fusesLeft: Math.max(fuses, d.incidents[r.id]?.fusesLeft ?? 0) }; });
    if (first) addEnergy(REWARD.incident, "panne résolue");
    sfx("power"); fx({ type: "burst", color: `hsl(${r.hue} 100% 62%)` }); checkBadges();
    setState("won");
  };
  const restart = () => { setI(0); setFuses(3); setPicked([]); setState("play"); sfx("power"); };

  return (
    <div className="wrap">
      <TopBar title={r.incident.title} kicker={`${r.code} · Panne`} onBack={() => go(`caisson/${r.id}`)} />
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
        <div className="row" style={{ gap: 8 }}>
          <span style={{ width: 14, height: 14, borderRadius: "50%", background: "var(--red)", boxShadow: "0 0 18px var(--red)", animation: state === "play" ? "blink .8s steps(1) infinite" : undefined }} />
          <span className="mono small" style={{ color: "var(--red)" }}>ALERTE {i + 1}/{r.incident.scenarios.length}</span>
        </div>
        <div className="row" style={{ gap: 6 }} aria-label={`${fuses} fusibles restants`}>
          {[0, 1, 2].map((k) => (
            <motion.span key={k} animate={{ opacity: k < fuses ? 1 : 0.2, scale: k < fuses ? 1 : 0.8 }}
              style={{ width: 16, height: 26, borderRadius: 4, border: "2px solid var(--amber)", background: k < fuses ? "linear-gradient(#ffd27a, #ffb547)" : "#1a1a1a", boxShadow: k < fuses ? "0 0 10px rgba(255,181,71,.6)" : "none" }} />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {state === "play" && (
          <motion.div key={i} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className={shake ? "shake" : ""}>
            <div className="panel" style={{ borderColor: "rgba(255,77,109,.5)", background: "linear-gradient(140deg, rgba(255,77,109,.16), rgba(12,19,34,.9))" }}>
              <div className="panel-title" style={{ color: "var(--red)" }}><Icon name="siren" size={16} /> Message d'alerte</div>
              <div style={{ fontSize: 17 }}>{sc.alert}</div>
            </div>
            <div className="h3" style={{ margin: "16px 0 10px" }}>{sc.q}</div>
            {opts.map((o, k) => {
              const st = picked.includes(k) ? (o.ok ? "ok" : "ko") : "";
              return <button key={k} className={`choice ${st}`} onClick={(e) => pick(k, e)} disabled={solvedNow && !picked.includes(k)}><span className="key">{st === "ok" ? <Icon name="check" size={14} stroke={2.4} /> : st === "ko" ? <Icon name="close" size={13} stroke={2.4} /> : "ABC"[k]}</span><span>{o.t}</span></button>;
            })}
            {last !== undefined && (
              <motion.div key={last} className={`feedback ${opts[last].ok ? "ok" : "ko"}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <span className="tag">{opts[last].ok ? "Diagnostic correct" : "Fusible grillé"}</span>
                <BlockView block={{ type: "text", md: opts[last].why }} exKey="" solvedBefore={false} onSolved={() => {}} />
              </motion.div>
            )}
            {solvedNow && <button className="btn block" style={{ marginTop: 14 }} onClick={nextScenario}>{i + 1 < r.incident.scenarios.length ? <>Alerte suivante <Icon name="chevron-right" size={18} stroke={2.2} /></> : <>Rétablir le courant <Icon name="bolt" size={18} /></>}</button>}
          </motion.div>
        )}
        {state === "lost" && (
          <motion.div key="lost" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <OraSays mood="alert" md="**Disjonction !** Les trois fusibles ont grillé. Pas de panique : relis les explications ci-dessus ou la Base de connaissances, puis réarme le tableau." />
            <button className="btn block" style={{ marginTop: 16 }} onClick={restart}>Réarmer et recommencer</button>
            <button className="btn ghost block" style={{ marginTop: 10 }} onClick={() => go("base")}>Revoir la Base de connaissances</button>
          </motion.div>
        )}
        {state === "won" && (
          <motion.div key="won" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="panel glow" style={{ textAlign: "center", borderColor: "rgba(77,255,160,.5)" }}>
            <div style={{ display: "grid", placeItems: "center", margin: "2px 0 8px" }}>
              <span style={{ width: 68, height: 68, borderRadius: 20, display: "grid", placeItems: "center", color: "var(--led)", background: "var(--led-soft)", border: "1px solid rgba(77,255,160,.45)", boxShadow: "0 0 28px rgba(77,255,160,.35)" }}>
                <Icon name="extinguisher" size={38} />
              </span>
            </div>
            <div className="h2">Panne réparée</div>
            <div className="muted" style={{ marginBottom: 14 }}>{fuses === 3 ? "Sans un seul fusible grillé. Impressionnant." : `Avec ${fuses} fusible${fuses > 1 ? "s" : ""} restant${fuses > 1 ? "s" : ""}.`} {r.member} est entièrement réveillé.</div>
            <button className="btn block" onClick={() => go("")}>Retour à la carte</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

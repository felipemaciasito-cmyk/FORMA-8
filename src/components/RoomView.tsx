import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { crewLines, notion, room as getRoom, stepKey } from "../content";
import type { Block, Room } from "../content/types";
import { addEnergy, checkBadges, fx, learnNotions, REWARD } from "../lib/game";
import { roomComplete, roomPower, roomReady, roomStepsDone, roomUnlocked, stepMinutes, stepUnlocked } from "../lib/progress";
import { go } from "../lib/router";
import { CHARGE_HIT, sfx } from "../lib/sound";
import { getState, today, updateProgress, useProgress } from "../lib/store";
import { exportRoomFiche } from "../lib/fiche";
import { BlockView } from "./Blocks";
import { TopBar } from "./Chrome";
import { NotionChip } from "./Emblems";
import { Icon } from "./Icon";
import { AskOra, DeliveryCard } from "./Mechanics";
import { plain } from "../lib/richtext";
import { OraSays } from "./Ora";
import { Rays, Shockwave, Sparks } from "./Rewards";
import { fillBattery, getEnergyBar, startEnergyBar, stopEnergyBar, useEnergyBar } from "../lib/energy";
import { bigStrike, centerOf } from "./Bolts";
import { ArcScene, PlugScene } from "./PlugScene";
import { CrewCapsule, CrewFigure, MemberSays } from "./Crew";

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
      <CaissonHero r={r} power={power} stepsDone={done} awake={roomComplete(p, r)} />

      <div className="panel-title" style={{ marginTop: 20 }}>Protocoles de réveil</div>
      {!roomReady(r) && <OraSays md={`Les protocoles de réveil de **${r.member}** sont en préparation. Ils arriveront avec une prochaine version de l'appli.`} />}
      <ol className="quest" style={{ listStyle: "none", padding: 0, margin: 0, position: "relative" }}>
        {r.steps.length > 1 && (
          <span aria-hidden="true" style={{ position: "absolute", left: 21, top: 30, bottom: 30, width: 2, borderRadius: 2, background: "rgba(125,200,255,.12)" }}>
            <motion.span initial={{ height: 0 }} animate={{ height: `${Math.min(100, (done / Math.max(1, r.steps.length - 1)) * 100)}%` }} transition={{ duration: 0.9, ease: "easeOut" }}
              style={{ display: "block", width: "100%", background: "var(--led)", boxShadow: "0 0 8px var(--led)", borderRadius: 2 }} />
          </span>
        )}
        {r.steps.map((s, i) => {
          const sdone = !!p.steps[stepKey(r.id, s.id)];
          const open = stepUnlocked(p, r, i);
          const at = !sdone && open ? Math.min(s.blocks.length, p.lessons?.[stepKey(r.id, s.id)] ?? 0) : 0;
          const current = open && !sdone;
          return (
            <motion.li key={s.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
              style={{ display: "flex", gap: 10, alignItems: "center", marginTop: i ? 10 : 0, position: "relative" }}>
              <QuestNode state={sdone ? "done" : current ? "open" : "locked"} hue={r.hue} n={i + 1} />
              <motion.button className="choice" whileTap={{ scale: open ? 0.98 : 1 }}
                onClick={() => { if (open) { sfx("open"); go(`caisson/${r.id}/${s.id}`); } else { sfx("ko"); fx({ type: "toast", icon: "lock", text: "Termine d'abord le protocole précédent", tone: "red" }); } }}
                style={{ flex: 1, minWidth: 0, margin: 0, alignItems: "center", opacity: open ? 1 : 0.5, borderColor: sdone ? "rgba(77,255,160,.4)" : current ? "var(--accent)" : undefined,
                  boxShadow: current ? "0 0 22px -6px var(--accent)" : undefined }}>
                <span className="grow" style={{ minWidth: 0 }}>
                  <span className="mono" style={{ fontSize: 10.5, color: "var(--text-3)", letterSpacing: ".1em" }}>PROTOCOLE {String(i + 1).padStart(2, "0")} · {stepMinutes(s)} MIN · +{REWARD.step} KW</span>
                  <span style={{ display: "block", fontWeight: 700 }}>{s.title}</span>
                  <span className="small muted">{s.introduces.length ? s.introduces.map((n) => notion(n)?.term.replace(/ \(.+\)$/, "")).join(" · ") : s.kicker}</span>
                </span>
                {sdone ? <span className="pill led">OK</span>
                  : at > 1 ? <span className="pill cyan" aria-label={`Protocole en cours, ${Math.round((at / s.blocks.length) * 100)} pour cent`}>En cours · {Math.round((at / s.blocks.length) * 100)} %</span>
                  : open ? <Icon name="play" size={16} /> : <Icon name="lock" size={16} />}
              </motion.button>
            </motion.li>
          );
        })}
      </ol>

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

/** Le membre dans sa capsule, ce qu'il dit selon son état, et la jauge de son réveil. */
function CaissonHero({ r, power, stepsDone, awake }: { r: Room; power: number; stepsDone: number; awake: boolean }) {
  const lines = crewLines(r.id);
  const say = awake ? lines?.reveil : stepsDone > 0 ? lines?.demi : lines?.dort;
  return (
    <motion.div className="panel glow" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      style={{ padding: "14px 14px 16px", background: `radial-gradient(circle at 22% 30%, hsl(${r.hue} 90% 50% / .22), rgba(12,19,34,.92) 62%)`, borderColor: `hsl(${r.hue} 90% 60% / .35)` }}>
      <div className="row" style={{ alignItems: "center", gap: 12 }}>
        <div style={{ flex: "none", marginTop: -6 }}><CrewCapsule id={r.id} state={awake ? "awake" : "asleep"} power={power} size={128} /></div>
        <div className="grow" style={{ minWidth: 0 }}>
          <div className="mono" style={{ fontSize: 10.5, letterSpacing: ".12em", color: "var(--accent)" }}>{awake ? "RÉVEILLÉ" : power ? "RÉVEIL EN COURS" : "EN SOMMEIL"}</div>
          <div style={{ fontWeight: 700, fontSize: 17, lineHeight: 1.25, margin: "2px 0 4px" }}>{r.name}</div>
          <div className="small muted">{lines?.role ?? r.tagline}</div>
          <div className="row" style={{ marginTop: 10 }}><span className="mono small grow">RÉVEIL DU MEMBRE</span><span className="mono" style={{ color: "var(--accent)" }}>{power} %</span></div>
          <div className="progress" style={{ marginTop: 6, height: 8 }}><motion.i initial={{ width: 0 }} animate={{ width: `${power}%` }} transition={{ duration: 0.9 }} /></div>
        </div>
      </div>
      {say && <MemberSays member={r.member} hue={r.hue} md={say} asleep={!awake} room={r.id} />}
    </motion.div>
  );
}

/** Un nœud du chemin des protocoles : terminé, ouvert (pulsation) ou verrouillé. */
function QuestNode({ state, hue, n }: { state: "done" | "open" | "locked"; hue: number; n: number }) {
  const c = state === "done" ? "var(--led)" : state === "open" ? `hsl(${hue} 100% 64%)` : "#2a3550";
  return (
    <span aria-hidden="true" style={{ position: "relative", flex: "none", width: 44, height: 44, display: "grid", placeItems: "center" }}>
      {state === "open" && <span style={{ position: "absolute", inset: 4, borderRadius: "50%", border: `2px solid ${c}`, animation: "pulse-ring 2s infinite" }} />}
      <span style={{ width: 34, height: 34, borderRadius: "50%", display: "grid", placeItems: "center", background: state === "done" ? "var(--led-soft)" : "#0b1222",
        border: `2px solid ${c}`, color: c, boxShadow: state === "locked" ? "none" : `0 0 12px ${c}`, font: "700 13px var(--mono)" }}>
        {state === "done" ? <Icon name="check" size={16} stroke={2.6} /> : state === "locked" ? <Icon name="lock" size={14} /> : n}
      </span>
    </span>
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
/** Texte brut d'un protocole, transmis à ORA pour qu'elle réponde dans le contexte de la leçon. */
function lessonText(step: { title: string; kicker: string; blocks: Block[] }) {
  const out = [step.title, step.kicker];
  for (const b of step.blocks) {
    if (b.type === "text" || b.type === "callout") out.push(plain(b.md));
    else if (b.type === "definition") { const n = notion(b.notion); if (n) out.push(`${n.term} : ${plain(n.def.simple)}`); }
    else if (b.type === "analogy") out.push(`${b.title} : ${plain(b.md)}`);
    else if (b.type === "recap") out.push(...b.points.map(plain));
    else if (b.type === "procedure") out.push(b.title, ...b.steps.map((x) => plain(x.do)));
    else if (b.type === "mission") out.push(b.title, b.goal);
  }
  return out.join("\n");
}
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
  const [finished, setFinished] = useState<null | { energy: number; before: number; after: number; top: number; plug: boolean; cells: number }>(null);
  // Scène du branchement : la suite (réplique, notions, boutons) apparaît une fois la batterie branchée.
  const [plugged, setPlugged] = useState(false);
  const [charging, setCharging] = useState(false);
  const [cheer, setCheer] = useState(0);
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
  // L'écran de fin couvre tout l'écran (rien du protocole ne doit apparaître autour) ; la barre du haut reste
  // posée par-dessus, pour suivre les kW qui rejoignent le compteur.
  const finishOpen = !!finished;
  useEffect(() => {
    document.body.classList.toggle("finish-open", finishOpen);
    return () => document.body.classList.remove("finish-open");
  }, [finishOpen]);

  // Batterie du protocole : une cellule par vérification, plus une pour la fin. Les kW y attendent le branchement.
  const exCount = step ? step.blocks.filter((b) => b.type === "exercise").length : 0;
  useEffect(() => {
    if (!step || wasDone) return;
    const litAtOpen = step.blocks.filter((b, i) => b.type === "exercise" && solvedAtOpen.has(`${key}#${i}`)).length;
    startEnergyBar(REWARD.step + exCount * REWARD.exerciseFirst, exCount + 1, litAtOpen);
    return () => stopEnergyBar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

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
    setCheer((c) => c + 1);
    // Une vérification réussie fait grandir son encadré (« Séquence validée », explication…) : le bouton « Continuer »
    // descend alors sous la batterie, posée en bas de l'écran, et un toucher tombe sur elle. On le ramène en vue.
    window.setTimeout(() => bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 450);
    const exKey = `${key}#${bi}`;
    if (getState().progress.exercises[exKey] === undefined) {
      updateProgress((d) => { d.exercises[exKey] = attempts; });
      const e = attempts <= 1 ? REWARD.exerciseFirst : REWARD.exerciseRetry;
      earned.current += e;
      addEnergy(e);
    }
  };

  const complete = (ev?: React.MouseEvent) => {
    if (charging) return;
    const before = roomPower(getState().progress, r);
    const first = !getState().progress.steps[key];
    if (first) {
      updateProgress((d) => { d.steps[key] = today(); });
      learnNotions(step.introduces, r.id);
      addEnergy(REWARD.step, undefined, { quiet: true });
      earned.current += REWARD.step;
    }
    checkBadges();
    const after = roomPower(getState().progress, r);
    const hud = document.querySelector(".hud")?.getBoundingClientRect();
    const open = () => setFinished({ energy: Math.max(earned.current, getEnergyBar().held), before, after, top: hud ? Math.max(0, hud.bottom - 12) : 0, plug: first, cells: exCount + 1 });
    if (!first) { sfx("power"); fx({ type: "burst", color: `hsl(${r.hue} 100% 62%)` }); open(); return; }
    // Première fois : le grand éclair charge la dernière cellule, puis la scène du branchement s'ouvre.
    setCharging(true);
    sfx("charge");
    const from = ev ? { x: ev.clientX, y: ev.clientY } : centerOf(document.activeElement);
    const cellsEls = document.querySelectorAll(".battery-dock .battery i");
    bigStrike(from, [centerOf(cellsEls[cellsEls.length - 1])], CHARGE_HIT, () => fillBattery());
    window.setTimeout(() => { setCharging(false); open(); }, (CHARGE_HIT + 1.2) * 1000);
  };
  // La batterie est branchée sur la centrale. Le réveil ne vient que de l'arc, envoyé par le joueur depuis la centrale.
  const onPlugged = () => setPlugged(true);
  const onAwaken = () => window.setTimeout(() => fx({ type: "awaken", roomId: r.id }), 150);

  const next = r.steps[idx + 1];
  return (
    <div className="wrap" style={{ ["--hue" as string]: r.hue }}>
      <TopBar title={step.title} kicker={`${r.code} · Protocole ${String(idx + 1).padStart(2, "0")}`} onBack={() => go(`caisson/${r.id}`)}
        right={<AskOra lesson={lessonText(step)} known={[...Object.keys(p.notions), ...step.introduces].map((id) => notion(id)?.term ?? id)} />} />
      <StepMeter r={r} total={blocks.length} revealed={Math.min(revealed, blocks.length)} pct={pct} cheer={cheer} />
      <div className="muted" style={{ fontSize: 17, margin: "14px 0 12px", fontStyle: "italic" }}>{step.kicker}</div>
      {!wasDone && revealed <= 1 && <StepBriefing step={step} />}
      <div className="stack" style={{ gap: 14 }}>
        <AnimatePresence initial={false}>
          {visible.map((b, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 24, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }} style={{ marginTop: 14 }}>
              <BlockView block={b} exKey={`${key}#${i}`} solvedBefore={solvedAtOpen.has(`${key}#${i}`)} onSolved={onSolved(i)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {!finished && <Battery />}
      <div ref={bottom} style={{ marginTop: 22, paddingBottom: 28, scrollMarginBottom: "calc(var(--tabbar-h) + var(--safe-bottom) + 20px)" }}>
        {!finished && !atEnd && (
          <motion.button className="btn block" whileTap={{ scale: 0.97 }} disabled={blockedByExercise} onClick={revealNext}>
            {blockedByExercise ? "Réussis la vérification pour continuer" : <>Continuer <Icon name="chevron-right" size={18} stroke={2.2} /></>}
          </motion.button>
        )}
        {!finished && atEnd && (
          <motion.button className="btn block led" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} whileTap={{ scale: 0.97 }} disabled={blockedByExercise || charging} onClick={(e) => complete(e)}>
            <Icon name="bolt" size={18} /> {wasDone && !charging && !finished ? "Relancer le protocole" : "Terminer le protocole"}
          </motion.button>
        )}
        <AnimatePresence>
          {finished && (
            <motion.div key="fini" role="dialog" aria-modal="true" aria-label={`Protocole ${String(idx + 1).padStart(2, "0")} terminé`}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="finish-bg" style={{ position: "fixed", inset: 0, zIndex: 105, overflowY: "auto", overflowX: "hidden" }}>
              <div style={{ maxWidth: 420, margin: "0 auto", padding: `${finished.top + 22}px 18px calc(var(--safe-bottom) + 28px)`, textAlign: "center" }}>
                {finished.plug ? (
                  <PlugScene room={r} index={idx} cells={finished.cells} energy={finished.energy} incidentOpen={!!r.incident && !p.incidents[r.id]} onPlugged={onPlugged} onAwaken={onAwaken} />
                ) : (<>
                <div style={{ position: "relative", display: "grid", placeItems: "center", height: 120 }}>
                    <Rays color={`hsl(${r.hue} 100% 62% / .35)`} size={360} opacity={0.6} />
                    <Shockwave color={`hsl(${r.hue} 100% 64%)`} delay={0.15} size={200} />
                    <Sparks color={`hsl(${r.hue} 100% 66%)`} count={20} radius={130} delay={0.15} />
                    <motion.div initial={{ scale: 0.4, opacity: 0, y: 20 }} animate={{ scale: [0.4, 1.12, 1], opacity: 1, y: [20, -8, 0] }} transition={{ duration: 0.7, ease: "easeOut" }} style={{ position: "relative" }}>
                      <CrewFigure id={r.id} state={roomComplete(p, r) ? "awake" : "asleep"} mood="happy" size={96} label={r.member} />
                    </motion.div>
                  </div>
                  <div className="mono" style={{ fontSize: 11, letterSpacing: ".14em", color: "var(--accent)", marginTop: 6 }}>{r.code} · {r.member.toUpperCase()}</div>
                  <div className="h2" style={{ margin: "4px 0 2px" }}>Protocole {String(idx + 1).padStart(2, "0")} terminé</div>
                  <div className="muted">{step.title}</div>
  
                  <div className="panel" style={{ margin: "16px 0 0", padding: 14, textAlign: "left" }}>
                    <div className="row"><span className="mono small grow">RÉVEIL DE {r.member.toUpperCase()}</span>
                      <span className="mono" style={{ color: "var(--accent)" }}><CountUp from={finished.before} to={finished.after} delay={0.5} /> %</span></div>
                    <div className="progress" style={{ marginTop: 8, height: 10 }}>
                      <motion.i initial={{ width: `${finished.before}%` }} animate={{ width: `${finished.after}%` }} transition={{ delay: 0.5, duration: 1.2, ease: "easeOut" }} />
                    </div>
                    <div className="small muted" style={{ marginTop: 8 }}>{finished.after >= 100 ? `${r.member} est prêt à se réveiller.` : r.incident && idx === r.steps.length - 1 ? "Dernière étape : réparer la panne." : `${r.steps.length - roomStepsDone(p, r)} protocole${r.steps.length - roomStepsDone(p, r) > 1 ? "s" : ""} avant la panne finale.`}</div>
                  </div>
  
                </>)}
                {(!finished.plug || plugged) && (<>
                {crewLines(r.id) && !roomComplete(p, r) && <div style={{ textAlign: "left" }}><MemberSays member={r.member} hue={r.hue} md={crewLines(r.id)!.demi} asleep room={r.id} /></div>}
                {step.introduces.length > 0 && (
                  <>
                    <div className="small muted" style={{ margin: "10px 0" }}>Modules ajoutés à ta Base de connaissances :</div>
                    <div className="unlock-grid">
                      {step.introduces.map((n, k) => (
                        <motion.div key={n} initial={{ opacity: 0, y: 24, rotate: -6 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ delay: 1.2 + k * 0.18, type: "spring", stiffness: 260, damping: 18 }}>
                          <NotionChip id={n} icon={notion(n)?.icon} size={56} trace /><span>{notion(n)?.term.replace(/\s*\(.+\)$/, "")}</span>
                        </motion.div>
                      ))}
                    </div>
                  </>
                )}
                <div className="stack" style={{ marginTop: 16 }}>
                  {next ? <button className="btn block" onClick={() => { setFinished(null); go(`caisson/${r.id}/${next.id}`); }}>Protocole suivant : {next.title}</button>
                    : r.incident && !p.incidents[r.id] ? <button className="btn block danger" onClick={() => { sfx("alarm"); go(`panne/${r.id}`); }}><Icon name="siren" size={18} /> Réparer la panne</button>
                    : <button className="btn block" onClick={() => go("")}>Retour à la carte</button>}
                  <button className="btn ghost block" onClick={() => go(`caisson/${r.id}`)}>Retour au caisson</button>
                  <button className="btn ghost small block" onClick={() => { sfx("tap"); setFinished(null); }}>Relire le protocole</button>
                </div>
                </>)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** La batterie du protocole, posée au-dessus des onglets : chaque bonne réponse y charge une cellule (éclair). */
function Battery() {
  const bar = useEnergyBar();
  if (!bar.max || !bar.cells) return null;
  const pct = Math.round((bar.lit / bar.cells) * 100);
  return (
    <div className="battery-dock no-print" role="status" aria-label={`Batterie du protocole : ${pct} %`}>
      <div>
        <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".12em", color: "var(--text-3)" }}>BATTERIE</span>
        <div className={`battery ${bar.lit >= bar.cells ? "full" : ""}`} aria-hidden="true">
          {Array.from({ length: bar.cells }, (_, i) => <i key={i} data-cell={i} className={`${i === bar.cells - 1 ? "final" : ""} ${i < bar.lit ? "on" : ""}`} />)}
        </div>
        <span className="lbl">{pct} %</span>
      </div>
    </div>
  );
}

/** Le membre veille sur le protocole ; la jauge est découpée en un segment par bloc. */
function StepMeter({ r, total, revealed, pct, cheer }: { r: Room; total: number; revealed: number; pct: number; cheer: number }) {
  const p = useProgress();
  const [smile, setSmile] = useState(false);
  useEffect(() => {
    if (!cheer) return;
    setSmile(true);
    const t = window.setTimeout(() => setSmile(false), 1600);
    return () => window.clearTimeout(t);
  }, [cheer]);
  const awake = roomComplete(p, r);
  return (
    <div className="row" style={{ gap: 10, alignItems: "center" }}>
      <motion.span animate={smile ? { y: [0, -6, 0], rotate: [0, -6, 6, 0] } : { y: 0 }} transition={{ duration: 0.6 }}
        style={{ flex: "none", width: 42, height: 42, borderRadius: 14, display: "grid", placeItems: "center", background: "#0b1222", border: `1px solid hsl(${r.hue} 90% 60% / .4)`, overflow: "hidden" }}>
        <CrewFigure id={r.id} state={awake || smile ? "awake" : "asleep"} mood={smile ? "happy" : "neutral"} crop="head" size={40} label={r.member} />
      </motion.span>
      <div className="grow" style={{ minWidth: 0 }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <span className="mono" style={{ fontSize: 10.5, letterSpacing: ".1em", color: "var(--text-3)" }}>{smile ? `${r.member.toUpperCase()} SOURIT DANS SON SOMMEIL` : `BLOC ${revealed} / ${total}`}</span>
          <span className="mono" style={{ fontSize: 10.5, color: "var(--accent)" }}>{pct} %</span>
        </div>
        <div aria-hidden="true" style={{ display: "flex", gap: total > 24 ? 2 : 3, marginTop: 6 }}>
          {Array.from({ length: total }, (_, i) => (
            <span key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: i < revealed ? "var(--accent)" : "rgba(255,255,255,.08)",
              boxShadow: i < revealed ? "0 0 6px var(--accent)" : "none", opacity: i === revealed - 1 ? 1 : i < revealed ? 0.75 : 1,
              animation: i === revealed - 1 && revealed < total ? "blink 1.6s steps(1) infinite" : undefined, transition: "background .3s" }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Ce qui attend le joueur dans ce protocole : de quoi se lancer en sachant où l'on va. */
function StepBriefing({ step }: { step: { blocks: Block[]; introduces: string[] } }) {
  const ex = step.blocks.filter((b) => b.type === "exercise").length;
  const sims = step.blocks.filter((b) => b.type === "interactive").length;
  const procs = step.blocks.filter((b) => b.type === "procedure" || b.type === "mission").length;
  const items: [string, number, string][] = [
    ["notion", step.introduces.length, "notions"], ["exercice", ex, "vérifications"], ["simulateur", sims, "simulateurs"], ["manip", procs, "manipulations"],
  ];
  const maxKw = REWARD.step + ex * REWARD.exerciseFirst;
  return (
    <motion.div className="panel" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 0, marginBottom: 6, padding: 12 }}>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
        <span className="panel-title" style={{ margin: 0 }}><Icon name="target" size={16} /> Au programme</span>
        <span className="mono small" style={{ color: "var(--cyan)" }}>jusqu'à +{maxKw} kW</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, textAlign: "center" }}>
        {items.map(([k, n, label]) => (
          <div key={k} style={{ opacity: n ? 1 : 0.4 }}><div className="mono" style={{ fontSize: 20, color: n ? "var(--text)" : "var(--text-3)" }}>{n}</div><div style={{ fontSize: 11.5, color: "var(--text-2)", lineHeight: 1.2 }}>{label}</div></div>
        ))}
      </div>
    </motion.div>
  );
}

/** Un nombre qui défile de « from » à « to ». */
function CountUp({ from, to, delay = 0 }: { from: number; to: number; delay?: number }) {
  const [v, setV] = useState(from);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now() + delay * 1000;
    const tick = (t: number) => {
      const k = Math.min(1, Math.max(0, (t - t0) / 1000));
      setV(Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [from, to, delay]);
  return <>{v}</>;
}

// ======================= Panne (défi de fin de caisson) =======================
export function IncidentView({ roomId }: { roomId: string }) {
  const r = getRoom(roomId);
  const p = useProgress();
  const [i, setI] = useState(0);
  const [fuses, setFuses] = useState(3);
  const [picked, setPicked] = useState<number[]>([]);
  const [state, setState] = useState<"play" | "won" | "lost">("play");
  // Toutes les prises de la centrale sont branchées : le joueur envoie l'arc qui réveille le membre.
  const [rearm, setRearm] = useState(false);
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
    sfx("power"); fx({ type: "burst" }); checkBadges();
    setState("won");
    setRearm(first && roomComplete(getState().progress, r));
  };
  const sendArc = () => window.setTimeout(() => { setRearm(false); fx({ type: "awaken", roomId: r.id }); }, 150);
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
            <div className="muted" style={{ marginBottom: 14 }}>{fuses === 3 ? "Sans un seul fusible grillé. Impressionnant." : `Avec ${fuses} fusible${fuses > 1 ? "s" : ""} restant${fuses > 1 ? "s" : ""}.`} {!rearm && roomComplete(p, r) ? `${r.member} est entièrement réveillé.` : ""}</div>
            {rearm ? <ArcScene room={r} onAwaken={sendArc} />
              : <button className="btn block" onClick={() => go("")}>Retour à la carte</button>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { motion } from "motion/react";
import { ROOMS, stepKey } from "../content";
import type { Room } from "../content/types";
import { dueNotions, fx } from "../lib/game";
import { currentRoom, roomComplete, roomPower, roomReady, roomUnlocked, roomsDoneCount, stepMinutes, totalPower } from "../lib/progress";
import { go } from "../lib/router";
import { sfx } from "../lib/sound";
import { useProgress, type Progress } from "../lib/store";
import { Icon, type IconId } from "./Icon";
import { OraSays } from "./Ora";
import { CrewFigure } from "./Crew";

// Carte de la réserve : les 11 caissons, reliés par des câbles qui s'allument
// quand le membre de l'équipe précédent est réveillé.

const ROW = 200;

export function MapView() {
  const p = useProgress();
  const cur = currentRoom(p);
  const power = totalPower(p);
  const due = new Set(dueNotions(p));
  const height = ROOMS.length * ROW + 40;
  const awake = roomsDoneCount(p);

  const greet = !roomReady(cur)
    ? `La réserve est sous tension${p.name ? `, ${p.name}` : ""}. Les protocoles de réveil du **${cur.code}** sont encore en préparation : ils arriveront avec les prochaines versions de l'appli.`
    : !Object.keys(p.steps).length
      ? `La réserve est sous tension${p.name ? `, ${p.name}` : ""}. Commence par le **${ROOMS[0].code}** : ${ROOMS[0].member} t'y attend pour poser les bases.`
      : awake === ROOMS.length
        ? "Toute l'équipe est réveillée. Reviens chaque jour pour la **maintenance** : c'est elle qui ancre tes connaissances."
        : `Prochain réveil : **${cur.code} · ${cur.member}**.${due.size ? ` Et ${due.size} notion${due.size > 1 ? "s" : ""} surchauffe${due.size > 1 ? "nt" : ""} : passe en maintenance.` : ""}`;

  return (
    <div className="wrap">
      <div className="panel glow" style={{ ["--hue" as string]: 190, display: "flex", gap: 16, alignItems: "center" }}>
        <PowerRing value={power} />
        <div className="grow">
          <div className="kicker">Réserve de FORMA-8</div>
          <div className="h2" style={{ margin: "2px 0 4px", fontSize: 19, whiteSpace: "nowrap" }}>Équipe réveillée {power}&nbsp;%</div>
          <div className="small muted">{awake} / {ROOMS.length} membres de l'équipe réveillés</div>
        </div>
        <button className="icon-btn" style={{ alignSelf: "flex-start" }} onClick={() => { sfx("tap"); go("equipe"); }} aria-label="Ton équipe">
          <Icon name="team" size={20} />
        </button>
      </div>

      <ProductTimeline />

      <div style={{ margin: "16px 0" }}><OraSays compact md={greet} mood={due.size ? "alert" : "happy"} /></div>

      <QuartPanel />

      <div style={{ position: "relative", height, marginTop: 8 }}>
        <Cables p={p} />
        {ROOMS.map((r, i) => {
          const left = i % 2 === 0;
          const unlocked = roomUnlocked(p, r);
          const done = roomComplete(p, r);
          const hot = r.steps.some((s) => s.introduces.some((n) => due.has(n)));
          return (
            <CaissonTile key={r.id} room={r} i={i} left={left} unlocked={unlocked} done={done} current={r.id === cur.id && unlocked && !done}
              power={roomPower(p, r)} hot={hot}
              onClick={() => {
                if (!unlocked) {
                  sfx("ko");
                  const req = ROOMS.find((x) => x.id === r.requires[0]);
                  fx({ type: "toast", icon: "lock", text: `Verrouillé : réveille d'abord ${req ? req.member : "le membre précédent"}`, tone: "red" });
                  return;
                }
                sfx("open");
                go(`caisson/${r.id}`);
              }} />
          );
        })}
      </div>
    </div>
  );
}

// ---------- Le quart du jour : quoi faire maintenant, dans l'ordre, avec la durée estimée ----------
interface QuartAction { icon: IconId; label: string; detail: string; minutes: number; go: string; primary?: boolean }

export function quartActions(p: Progress): QuartAction[] {
  const out: QuartAction[] = [];
  const due = dueNotions(p).length;
  const cur = currentRoom(p);
  if (due > 0) out.push({ icon: "thermo", label: `Refroidir ${due} notion${due > 1 ? "s" : ""}`, detail: "Maintenance : révision espacée", minutes: Math.min(10, 2 + due), go: "maintenance" });
  if (roomUnlocked(p, cur) && roomReady(cur)) {
    const next = cur.steps.find((s) => !p.steps[stepKey(cur.id, s.id)]);
    if (next) {
      const at = Math.min(next.blocks.length, p.lessons?.[stepKey(cur.id, next.id)] ?? 0);
      out.push({ icon: "play", label: at > 1 ? `Reprendre : ${next.title}` : `Continuer : ${next.title}`, detail: `${cur.code} · ${at > 1 ? `${Math.round((at / next.blocks.length) * 100)} % fait` : next.kicker}`, minutes: stepMinutes(next), go: `caisson/${cur.id}/${next.id}` });
    } else if (cur.incident && !p.incidents[cur.id]) {
      out.push({ icon: "siren", label: `Réparer la panne : ${cur.incident.title}`, detail: cur.code, minutes: 5, go: `panne/${cur.id}` });
    }
    if (cur.delivery && !p.deliveries[cur.id] && cur.steps.every((s) => p.steps[stepKey(cur.id, s.id)])) {
      out.push({ icon: "rocket", label: `Vérifier ta livraison ${cur.version}`, detail: cur.delivery.title, minutes: 5, go: `caisson/${cur.id}` });
    }
  }
  if (out.length) out[due > 0 && out.length > 1 ? 1 : 0].primary = true;
  return out.slice(0, 3);
}

function QuartPanel() {
  const p = useProgress();
  const actions = quartActions(p);
  if (!actions.length) return null;
  const total = actions.reduce((a, x) => a + x.minutes, 0);
  return (
    <div className="panel" style={{ marginBottom: 12, borderColor: "rgba(59,232,255,.3)" }}>
      <div className="row"><span className="panel-title grow" style={{ margin: 0 }}><Icon name="clock" size={16} /> Ton quart du jour</span><span className="mono small" style={{ color: "var(--cyan)" }}>environ {total} min</span></div>
      <div className="stack" style={{ marginTop: 10 }}>
        {actions.map((a, i) => (
          <motion.button key={a.go + i} className={a.primary ? "btn block" : "choice"} whileTap={{ scale: 0.97 }} onClick={() => { sfx("open"); go(a.go); }}
            style={a.primary ? { justifyContent: "flex-start", textAlign: "left" } : { alignItems: "center" }}>
            <Icon name={a.icon} size={18} />
            <span className="grow" style={{ minWidth: 0 }}>
              <b style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.label}</b>
              <span className="small" style={{ opacity: 0.8 }}>{a.detail}</span>
            </span>
            <span className="mono small">{a.minutes} min</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

/** La frise de ton produit : une version par membre de l'équipe, de v0.0 à v1.0. */
function ProductTimeline() {
  const p = useProgress();
  const next = ROOMS.find((r) => !p.deliveries[r.id]);
  const delivered = ROOMS.filter((r) => p.deliveries[r.id]).length;
  return (
    <div className="panel" style={{ marginTop: 12, padding: "12px 14px" }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ minWidth: 0 }}>
          <span className="kicker">Ton produit</span>
          <b style={{ display: "block", fontSize: 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.product.name || "À choisir au caisson 00"}</b>
        </span>
        <span className="mono" style={{ fontSize: 12, color: "var(--led)", flex: "none" }}>{delivered ? ROOMS[delivered - 1].version : "v0.0"} → v1.0</span>
      </div>
      <div style={{ position: "relative", margin: "14px 4px 4px" }}>
        <span aria-hidden="true" style={{ position: "absolute", left: 8, right: 8, top: 9, height: 2, background: "rgba(125,200,255,.12)" }} />
        <motion.span aria-hidden="true" initial={{ width: 0 }} animate={{ width: `calc(${(Math.max(0, delivered - 0.5) / (ROOMS.length - 1)) * 100}% - ${delivered ? 8 : 0}px)` }} transition={{ duration: 1, ease: "easeOut" }}
          style={{ position: "absolute", left: 8, top: 9, height: 2, background: "var(--led)", boxShadow: "0 0 8px var(--led)" }} />
        <div style={{ position: "relative", display: "flex", justifyContent: "space-between" }}>
          {ROOMS.map((r) => {
            const done = !!p.deliveries[r.id];
            const cur = next?.id === r.id;
            const c = `hsl(${r.hue} 100% 64%)`;
            return (
              <button key={r.id} type="button" aria-label={`${r.version} : ${r.delivery?.title ?? r.name}${done ? " (livrée)" : cur ? " (prochaine livraison)" : ""}`}
                onClick={() => { sfx("tap"); fx({ type: "toast", icon: done ? "check" : "rocket", text: `${r.version} · ${r.delivery?.title ?? r.name}${done ? " : livrée" : ""}`, tone: done ? "led" : "cyan" }); }}
                style={{ position: "relative", width: 20, height: 20, padding: 0, border: 0, background: "transparent", display: "grid", placeItems: "center" }}>
                {cur && <span style={{ position: "absolute", inset: -2, borderRadius: "50%", border: `2px solid ${c}`, animation: "pulse-ring 2s infinite" }} />}
                <span style={{ width: done ? 14 : cur ? 12 : 8, height: done ? 14 : cur ? 12 : 8, borderRadius: "50%", background: done ? "var(--led)" : cur ? c : "#1c2a44",
                  boxShadow: done ? "0 0 10px var(--led)" : cur ? `0 0 10px ${c}` : "none", display: "grid", placeItems: "center", color: "#00140a" }}>
                  {done && <Icon name="check" size={10} stroke={3} />}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="small muted" style={{ marginTop: 8 }}>
        {next ? <>Prochaine livraison : <b style={{ color: "var(--text)" }}>{next.version}</b>{next.delivery ? ` · ${next.delivery.title}` : ` · avec ${next.member}`}</> : "Toutes les versions sont livrées. Ton produit est lancé."}
      </div>
    </div>
  );
}

function PowerRing({ value }: { value: number }) {
  const R = 30, C = 2 * Math.PI * R;
  return (
    <svg width="76" height="76" viewBox="0 0 76 76" aria-label={`Équipe réveillée à ${value} %`}>
      <circle cx="38" cy="38" r={R} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="7" />
      <motion.circle cx="38" cy="38" r={R} fill="none" stroke="var(--cyan)" strokeWidth="7" strokeLinecap="round" transform="rotate(-90 38 38)"
        strokeDasharray={C} initial={{ strokeDashoffset: C }} animate={{ strokeDashoffset: C * (1 - value / 100) }} transition={{ duration: 1.2, ease: "easeOut" }}
        style={{ filter: "drop-shadow(0 0 6px var(--cyan))" }} />
      <text x="38" y="43" textAnchor="middle" fill="#e7f0ff" style={{ font: "700 16px var(--mono)" }}>{value}%</text>
    </svg>
  );
}

function Cables({ p }: { p: ReturnType<typeof useProgress> }) {
  const H = ROOMS.length * ROW + 40;
  return (
    <svg width="100%" height={H} viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" style={{ position: "absolute", inset: 0 }} aria-hidden="true">
      {ROOMS.slice(0, -1).map((r, i) => {
        const x1 = i % 2 === 0 ? 28 : 72, x2 = i % 2 === 0 ? 72 : 28;
        const y1 = i * ROW + 92, y2 = (i + 1) * ROW + 92;
        const d = `M ${x1} ${y1} C ${x1} ${y1 + 110}, ${x2} ${y2 - 110}, ${x2} ${y2}`;
        const live = roomComplete(p, r);
        const next = ROOMS[i + 1];
        return (
          <g key={r.id}>
            <path d={d} fill="none" stroke="#0a1120" strokeWidth="9" vectorEffect="non-scaling-stroke" />
            <path d={d} fill="none" stroke={live ? `hsl(${next.hue} 100% 62%)` : "rgba(125,200,255,.1)"} strokeWidth={live ? 3 : 2} vectorEffect="non-scaling-stroke"
              strokeDasharray={live ? "8 12" : "3 9"} style={live ? { animation: "dash 1.2s linear infinite", filter: `drop-shadow(0 0 4px hsl(${next.hue} 100% 62%))` } : undefined} />
          </g>
        );
      })}
    </svg>
  );
}

/** Caisson sur sa dalle isométrique : même dalle et mêmes voyants que les salles de FORMA-7, avec une capsule et la silhouette du membre de l'équipe. */
function CaissonTile({ room: r, i, left, unlocked, done, current, power, hot, onClick }: {
  room: Room; i: number; left: boolean; unlocked: boolean; done: boolean; current: boolean; power: number; hot: boolean; onClick: () => void;
}) {
  const h = r.hue;
  const ready = roomReady(r);
  const top = done ? `hsl(${h} 70% 42%)` : unlocked ? `hsl(${h} 45% 22%)` : "#0e1627";
  const sideL = done ? `hsl(${h} 70% 28%)` : unlocked ? `hsl(${h} 40% 14%)` : "#0a101d";
  const sideR = done ? `hsl(${h} 70% 20%)` : unlocked ? `hsl(${h} 40% 10%)` : "#070c17";
  const accent = `hsl(${h} 100% 64%)`;
  const status = done ? "RÉVEILLÉ" : !unlocked ? "EN SOMMEIL" : ready ? `${power} %` : "EN PRÉPARATION";
  return (
    <motion.button type="button" onClick={onClick} aria-label={`${r.code} ${r.member}, ${r.name}${unlocked ? "" : " (verrouillé)"}`}
      initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.5, delay: 0.05 }}
      whileTap={{ scale: 0.95 }}
      style={{ position: "absolute", top: i * ROW, left: left ? "28%" : "72%", width: 168, marginLeft: -84, textAlign: "center" }}>
      <div style={{ position: "relative", width: 168, height: 130 }}>
        {current && <span style={{ position: "absolute", left: 34, top: 18, width: 100, height: 100, borderRadius: "50%", border: `2px solid ${accent}`, animation: "pulse-ring 2s infinite" }} />}
        {current && (
          <motion.span initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: [0, -4, 0] }} transition={{ y: { duration: 2.2, repeat: Infinity, ease: "easeInOut" } }}
            className="mono" style={{ position: "absolute", left: "50%", top: -22, x: "-50%", whiteSpace: "nowrap", fontSize: 10, letterSpacing: ".12em", padding: "3px 8px", borderRadius: 999, color: "#04121c", background: accent, boxShadow: `0 0 14px ${accent}` }}>
            PROCHAIN RÉVEIL
          </motion.span>
        )}
        <svg width="168" height="130" viewBox="0 0 168 130" style={{ overflow: "visible", filter: done ? `drop-shadow(0 0 16px hsl(${h} 100% 55% / .55))` : current ? `drop-shadow(0 0 10px hsl(${h} 100% 55% / .35))` : undefined }}>
          {/* dalle isométrique */}
          <polygon points="84,22 158,58 84,94 10,58" fill={top} stroke={unlocked ? accent : "rgba(255,255,255,.08)"} strokeOpacity={done ? 0.9 : 0.5} />
          <polygon points="10,58 84,94 84,118 10,82" fill={sideL} />
          <polygon points="158,58 84,94 84,118 158,82" fill={sideR} />
          {/* socle de la capsule */}
          <ellipse cx="84" cy="62" rx="30" ry="15" fill={done ? "#1d2a44" : "#0b1322"} stroke={unlocked ? accent : "#1f2b40"} strokeOpacity=".5" />
          {/* corps de la capsule */}
          <path d="M60 60 L60 14 A24 12 0 0 1 108 14 L108 60 A24 12 0 0 1 60 60 Z" fill={done ? "#152036" : "#0b1322"} stroke={unlocked ? accent : "#1f2b40"} strokeOpacity={done ? 0.9 : 0.45} />
          <path d="M60 60 L60 14 A24 12 0 0 1 84 2 L84 72 A24 12 0 0 1 60 60 Z" fill={done ? "#1d2a44" : "#111a2c"} opacity=".7" />
          <ellipse cx="84" cy="14" rx="24" ry="12" fill={done ? `hsl(${h} 70% 42%)` : unlocked ? `hsl(${h} 45% 22%)` : "#111a2c"} stroke={unlocked ? accent : "#1f2b40"} strokeOpacity=".6" />
          {/* hublot : le membre de l'équipe, endormi, réveillé, ou simple silhouette tant que son caisson est verrouillé */}
          <rect x="66" y="16" width="36" height="40" rx="12" fill="#050a14" stroke={unlocked ? accent : "#1f2b40"} strokeOpacity=".7" />
          <CrewFigure id={r.id} state={done ? "awake" : unlocked ? "asleep" : "locked"} crop="head" x={67} y={19} width={34} height={34} />
          {!done && <rect x="66" y="16" width="36" height="40" rx="12" fill={`hsl(${h} 60% 85%)`} opacity=".06" />}
          {/* voyants */}
          {[0, 1, 2, 3].map((l) => (
            <rect key={l} x={63} y={20 + l * 9} width="3" height="4" rx="1"
              fill={done ? (l % 2 ? "#4dffa0" : accent) : unlocked && l === 0 ? accent : "#1f2b40"}
              style={done ? { animation: `blink ${0.8 + (l % 4) * 0.37}s steps(1) infinite` } : current && l === 0 ? { animation: "flicker 3s infinite" } : undefined} />
          ))}
          {!unlocked && (
            <g transform="translate(72 70)" opacity=".75">
              <rect x="2" y="10" width="20" height="16" rx="3" fill="#1a2438" stroke="#3a4a66" />
              <path d="M6 10V7a6 6 0 0 1 12 0v3" fill="none" stroke="#3a4a66" strokeWidth="2.4" />
            </g>
          )}
          {hot && unlocked && <circle cx="150" cy="30" r="7" fill="var(--red)" style={{ animation: "blink 1s steps(1) infinite" }} />}
        </svg>
      </div>
      <div className="mono" style={{ fontSize: 10.5, letterSpacing: ".14em", color: unlocked ? accent : "var(--text-3)" }}>{r.code} · {status}</div>
      <div style={{ fontWeight: 700, fontSize: 15, color: unlocked ? "var(--text)" : "var(--text-3)", lineHeight: 1.2, marginTop: 2 }}>{r.member}</div>
      <div className="small" style={{ color: "var(--text-3)", marginTop: 2 }}>{r.name} · {r.version}</div>
    </motion.button>
  );
}

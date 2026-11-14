import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { allNotions, notion, notionOrigin } from "../content";
import { addEnergy, BADGES, BOX_DAYS, checkBadges, dueNotions, fx, levelOf, LEVELS, REWARD, reviewNotion, uptime } from "../lib/game";
import { refreshHeritage, useHeritage } from "../lib/forma7";
import { RichText } from "../lib/richtext";
import { sfx } from "../lib/sound";
import { getState, today, useProgress } from "../lib/store";
import { openTerm } from "../lib/termBus";
import { BadgeEmblem, NotionChip, notionHue } from "./Emblems";
import { TopBar } from "./Chrome";
import { Icon } from "./Icon";
import { OraSays } from "./Ora";
import SkillWorkshop from "./SkillWorkshop";

// ======================= Base de connaissances =======================
export function BaseView({ focus }: { focus?: string }) {
  const p = useProgress();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "learned" | "due">("all");
  const due = new Set(dueNotions(p));
  const list = allNotions().filter((n) => {
    const s = `${n.term} ${n.def.simple}`.toLowerCase();
    if (q && !s.includes(q.toLowerCase())) return false;
    if (filter === "learned") return !!p.notions[n.id];
    if (filter === "due") return due.has(n.id);
    return true;
  });
  const learned = Object.keys(p.notions).length;
  const lv = levelOf(p.energy);
  const acc = p.stats.answers ? Math.round((p.stats.correct / p.stats.answers) * 100) : 0;
  return (
    <div className="wrap">
      <TopBar title="Base de connaissances" kicker={`${learned} / ${allNotions().length} notions collectées`} />
      <input className="input" placeholder="Rechercher une notion…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Rechercher une notion" />
      <div className="row wrap-row" style={{ gap: 8, margin: "12px 0" }}>
        {([["all", "Toutes"], ["learned", "Assimilées"], ["due", `À réviser (${due.size})`]] as const).map(([k, l]) => (
          <button key={k} className={`chip ${filter === k ? "on" : ""}`} onClick={() => { sfx("tap"); setFilter(k); }}>{l}</button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
        {list.map((n, i) => {
          const st = p.notions[n.id];
          const origin = notionOrigin(n.id);
          const open = !!(st || origin.missionId);
          const hot = due.has(n.id);
          return (
            <motion.button key={n.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 20) * 0.02 }} whileTap={{ scale: 0.95 }}
              onClick={() => { if (open) openTerm(n.id); else { sfx("ko"); fx({ type: "toast", icon: "lock", text: `Tu découvriras cette notion au ${origin.room?.code ?? "prochain caisson"}`, tone: "red" }); } }}
              className="panel notion-tile" style={{ marginTop: 0, padding: 12, textAlign: "left", minHeight: 128, borderColor: hot ? "rgba(255,77,109,.5)" : st ? `hsl(${notionHue(n.id)} 90% 60% / .32)` : undefined, opacity: open ? 1 : 0.6 }}>
              <NotionChip id={n.id} icon={n.icon} size={46} locked={!open} />
              <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.25 }}>{open ? n.term : "Notion verrouillée"}</div>
              <div className="mono" style={{ fontSize: 10, color: hot ? "var(--red)" : "var(--text-3)", display: "flex", alignItems: "center", gap: 4 }}>
                {st ? <>BOÎTE {st.box}/5{hot && <><Icon name="thermo" size={11} /> SURCHAUFFE</>}</> : origin.room?.code}
              </div>
            </motion.button>
          );
        })}
      </div>
      {list.length === 0 && <p className="muted" style={{ textAlign: "center", marginTop: 20 }}>{allNotions().length ? "Aucune notion ne correspond." : "Les notions arriveront avec les protocoles de réveil."}</p>}

      <div id="badges" className="panel-title" style={{ marginTop: 28 }}><Icon name="trophy" size={16} /> Badges & accréditation</div>
      <div className="panel" ref={(el) => { if (el && focus === "badges") setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 120); }}>
        <div className="row"><span className="grow"><b>{lv.title}</b> · niveau {lv.index}</span><span className="mono" style={{ color: "var(--cyan)" }}>{p.energy} kW</span></div>
        <div className="progress" style={{ margin: "8px 0" }}><motion.i initial={{ width: 0 }} animate={{ width: `${lv.pct}%` }} /></div>
        <div className="small muted">{lv.next ? `Prochain grade : ${lv.next.title} à ${lv.next.at} kW` : "Grade maximal atteint."}</div>
        <div className="row wrap-row" style={{ gap: 6, marginTop: 10 }}>{LEVELS.map((l, i) => <span key={l.title} className={`pill ${i < lv.index ? "cyan" : ""}`}>{l.title}</span>)}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginTop: 12 }}>
        {BADGES.map((b) => {
          const got = p.badges[b.id];
          return (
            <div key={b.id} className="panel" style={{ marginTop: 0, padding: 12, textAlign: "center", opacity: got ? 1 : 0.72, borderColor: got ? "rgba(255,181,71,.45)" : undefined,
              background: got ? "linear-gradient(170deg, rgba(255,181,71,.10), rgba(12,19,34,.85) 55%)" : undefined }}>
              <div style={{ display: "grid", placeItems: "center", margin: "2px 0 6px" }}><BadgeEmblem icon={b.icon} got={!!got} size={58} label={got ? `Badge obtenu : ${b.title}` : `Badge à débloquer : ${b.title}`} /></div>
              <div style={{ fontWeight: 700, fontSize: 13.5, marginTop: 4, color: got ? "var(--text)" : "var(--text-2)" }}>{b.title}</div>
              <div className="small muted" style={{ fontSize: 12 }}>{b.desc}</div>
            </div>
          );
        })}
      </div>
      <div className="panel" style={{ marginTop: 12 }}>
        <div className="panel-title">Statistiques</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Stat label="Réponses" value={p.stats.answers} /><Stat label="Justesse" value={`${acc} %`} />
          <Stat label="Révisions" value={p.stats.reviews} /><Stat label="Uptime" value={`${uptime(p.days)} j`} />
        </div>
      </div>
      <HeritagePanel />
    </div>
  );
}

/** Clin d'oeil à FORMA-7 : grade et badges obtenus là-bas, en lecture seule, sans effet sur FORMA-8. */
function HeritagePanel() {
  const { heritage: h, status } = useHeritage();
  return (
    <div className="panel" style={{ marginTop: 12 }}>
      <div className="panel-title"><Icon name="rack" size={16} /> Héritage FORMA-7</div>
      {h ? (
        <>
          <div className="row"><span className="grow">Grade obtenu dans FORMA-7 : <b>{h.grade}</b></span><span className="mono" style={{ color: "var(--cyan)" }}>{h.energy} kW</span></div>
          <div className="small muted" style={{ marginTop: 4 }}>{h.notions} notion{h.notions > 1 ? "s" : ""} collectée{h.notions > 1 ? "s" : ""} · lu {h.source === "local" ? "sur cet appareil" : "dans ton dépôt de données"} le {new Date(h.readAt).toLocaleDateString("fr-FR")}</div>
          {h.badges.length > 0 && (
            <div className="row wrap-row" style={{ gap: 8, marginTop: 10 }}>
              {h.badges.map((b) => <span key={b.id} title={b.title}><BadgeEmblem icon={b.icon} got size={40} label={`Badge FORMA-7 : ${b.title}`} /></span>)}
            </div>
          )}
          <div className="small dim" style={{ marginTop: 8 }}>Un souvenir de ton passage dans le datacenter : cela ne change rien à ta progression dans FORMA-8.</div>
        </>
      ) : (
        <div className="small muted">{status === "loading" ? "Recherche de ta progression FORMA-7…" : "Aucune progression FORMA-7 trouvée. Elle s'affichera ici si FORMA-7 est utilisée sur cet appareil, ou si sa synchronisation est activée."}</div>
      )}
      <button className="btn small subtle block" style={{ marginTop: 10 }} disabled={status === "loading"} onClick={() => { sfx("tap"); refreshHeritage(); }}><Icon name="refresh" size={16} /> Relire FORMA-7</button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div><div className="mono" style={{ fontSize: 22, color: "var(--cyan)" }}>{value}</div><div className="small muted">{label}</div></div>;
}

// ======================= Maintenance (révision espacée) =======================
export function MaintenanceView() {
  const p = useProgress();
  const due = dueNotions(p);
  const learned = Object.keys(p.notions);
  const [session, setSession] = useState<string[] | null>(null);
  const [k, setK] = useState(0);
  const [score, setScore] = useState(0);
  const boxes = [1, 2, 3, 4, 5].map((b) => learned.filter((id) => p.notions[id].box === b).length);

  const start = (ids: string[]) => { sfx("power"); setSession([...ids].sort(() => Math.random() - 0.5).slice(0, 10)); setK(0); setScore(0); };
  if (session) {
    if (k >= session.length) {
      return (
        <div className="wrap">
          <TopBar title="Maintenance terminée" kicker="Révision espacée" onBack={() => setSession(null)} />
          <OraSays mood="happy" md={`Maintenance terminée : **${score} / ${session.length}** notions refroidies. Les notions réussies reviendront plus tard, les autres demain. C'est ce rythme qui ancre durablement ce que tu apprends.`} />
          <button className="btn block" style={{ marginTop: 16 }} onClick={() => setSession(null)}>Retour</button>
        </div>
      );
    }
    const id = session[k];
    return (
      <div className="wrap">
        <TopBar title="Maintenance" kicker={`Notion ${k + 1} / ${session.length}`} onBack={() => setSession(null)} />
        <div className="progress" style={{ marginBottom: 16 }}><motion.i animate={{ width: `${(k / session.length) * 100}%` }} /></div>
        <AnimatePresence mode="wait">
          <motion.div key={id + k} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <ReviewCard id={id} pool={learned} onDone={(ok) => {
              const wasDue = (getState().progress.notions[id]?.due ?? "9999") <= today();
              if (wasDue) reviewNotion(id, ok);
              if (ok) { setScore((s) => s + 1); addEnergy(REWARD.review); }
              checkBadges();
              setTimeout(() => setK((x) => x + 1), 250);
            }} />
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }
  return (
    <div className="wrap">
      <TopBar title="Maintenance" kicker="Révision espacée · méthode Leitner" />
      <OraSays mood={due.length ? "alert" : "happy"} md={due.length
        ? `**${due.length} notion${due.length > 1 ? "s" : ""} en surchauffe.** Une notion non révisée s'efface peu à peu de la mémoire. Quelques minutes suffisent pour la refroidir.`
        : learned.length ? "Aucune surchauffe aujourd'hui. Tu peux t'entraîner librement, ou revenir demain." : "Rien à réviser pour l'instant : termine ton premier protocole de réveil, les notions arriveront ici."} />
      <div className="panel" style={{ marginTop: 16 }}>
        <div className="panel-title">Tes 5 boîtes</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, alignItems: "end", height: 120 }}>
          {boxes.map((n, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div className="mono small" style={{ color: "var(--text-2)" }}>{n}</div>
              <motion.div initial={{ height: 0 }} animate={{ height: 12 + Math.min(70, n * 10) }} style={{ borderRadius: 6, background: `hsl(${190 + i * 25} 90% ${45 + i * 4}%)`, boxShadow: n ? `0 0 12px hsl(${190 + i * 25} 90% 50% / .5)` : "none" }} />
              <div className="mono" style={{ fontSize: 10, color: "var(--text-3)", marginTop: 4 }}>B{i + 1} · {BOX_DAYS[i + 1]}j</div>
            </div>
          ))}
        </div>
        <div className="small muted" style={{ marginTop: 10 }}>Chaque réussite fait monter la notion d'une boîte, et l'espace jusqu'à la prochaine révision s'allonge. Une erreur la renvoie en boîte 1.</div>
      </div>
      <div className="stack" style={{ marginTop: 14 }}>
        <button className="btn block danger" disabled={!due.length} onClick={() => start(due)}><Icon name="thermo" size={18} /> Refroidir {due.length} notion{due.length > 1 ? "s" : ""}</button>
        <button className="btn ghost block" disabled={learned.length < 4} onClick={() => start(learned)}>Entraînement libre</button>
        {learned.length > 0 && learned.length < 4 && <div className="small dim">L'entraînement libre s'ouvre dès 4 notions collectées.</div>}
      </div>
    </div>
  );
}

function ReviewCard({ id, pool, onDone }: { id: string; pool: string[]; onDone: (ok: boolean) => void }) {
  const n = notion(id)!;
  const mode = useMemo(() => (pool.length >= 4 && Math.random() < 0.6 ? "qcm" : "flash"), [pool.length]);
  const choices = useMemo(() => {
    const others = pool.filter((x) => x !== id).sort(() => Math.random() - 0.5).slice(0, 3);
    return [id, ...others].sort(() => Math.random() - 0.5);
  }, [id, pool]);
  const [reveal, setReveal] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  if (mode === "qcm") {
    return (
      <div className="panel">
        <div className="panel-title">Quelle notion correspond ?</div>
        <div style={{ fontSize: 17, marginBottom: 14 }}><RichText md={n.def.simple} /></div>
        {choices.map((c) => {
          const cn = notion(c)!;
          const st = picked ? (c === id ? "ok" : c === picked ? "ko" : "") : "";
          return <button key={c} className={`choice ${st}`} disabled={!!picked} onClick={() => { setPicked(c); sfx(c === id ? "ok" : "ko"); setTimeout(() => onDone(c === id), c === id ? 700 : 1600); }}><span className="key" style={{ width: 30, height: 30, color: `hsl(${notionHue(c)} 100% 70%)` }}><Icon name={cn.icon} size={20} /></span><span>{cn.term}</span></button>;
        })}
      </div>
    );
  }
  return (
    <div className="panel" style={{ textAlign: "center", minHeight: 260 }}>
      <div style={{ display: "grid", placeItems: "center", margin: "4px 0 8px" }}><NotionChip id={id} icon={n.icon} size={78} /></div>
      <div className="h2">{n.term}</div>
      {!reveal ? (
        <>
          <div className="muted" style={{ margin: "10px 0 18px" }}>Explique-la dans ta tête, puis retourne la carte.</div>
          <button className="btn block" onClick={() => { sfx("open"); setReveal(true); }}>Retourner la carte</button>
        </>
      ) : (
        <motion.div initial={{ rotateX: 90, opacity: 0 }} animate={{ rotateX: 0, opacity: 1 }} style={{ textAlign: "left" }}>
          <div style={{ margin: "12px 0" }}><RichText md={n.def.standard} /></div>
          <div className="small muted" style={{ marginBottom: 14, display: "flex", gap: 8 }}><Icon name="frame" size={16} style={{ color: "var(--violet)", marginTop: 2 }} /><span>{n.analogy}</span></div>
          <div className="row">
            <button className="btn danger grow" onClick={() => { sfx("ko"); onDone(false); }}>À revoir</button>
            <button className="btn led grow" onClick={() => { sfx("ok"); onDone(true); }}>Je savais</button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ======================= Atelier =======================
export function AtelierView() {
  return (
    <div className="wrap">
      <TopBar title="Atelier des Skills" kicker="Forge de compétences" />
      <OraSays compact md={notionKnown("skill") ? "Ici, tu forges de **vrais** fichiers SKILL.md, prêts à installer dans ton équipe." : "L'Atelier est ouvert, mais tu comprendras tout son intérêt au **Caisson 02**. Tu peux déjà partir d'un modèle pour voir à quoi ça ressemble."} />
      <div style={{ marginTop: 16 }}><SkillWorkshop /></div>
    </div>
  );
}
function notionKnown(id: string) { return !!getState().progress.notions[id]; }

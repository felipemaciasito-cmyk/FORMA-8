import { motion } from "motion/react";
import { useState } from "react";
import { sfx } from "../../lib/sound";
import { Icon } from "../Icon";

// Construire un jeton d'accès GitHub au plus juste : la mission est de
// synchroniser FORMA-8 dans le dépôt de données. Chaque droit en trop
// augmente ce qu'un inconnu pourrait faire si le jeton fuyait.

type Access = "all" | "select";
type Level = "none" | "read" | "write";
interface Cfg { access: Access; contents: Level; actions: Level; admin: Level; expiry: 7 | 30 | 90 | 0 }

const START: Cfg = { access: "all", contents: "write", actions: "write", admin: "write", expiry: 0 };
const IDEAL: Cfg = { access: "select", contents: "write", actions: "none", admin: "none", expiry: 90 };

function analyse(c: Cfg) {
  const leaks: string[] = [];
  let risk = 0;
  if (c.access === "all") { risk += 30; leaks.push("lire et modifier TOUS tes dépôts, y compris ceux qui n'ont rien à voir"); }
  if (c.contents === "write") { risk += 15; leaks.push("modifier ou effacer les fichiers des dépôts autorisés"); }
  else if (c.contents === "read") risk += 5;
  if (c.actions === "write") { risk += 15; leaks.push("lancer ou modifier tes robots d'intégration continue"); }
  else if (c.actions === "read") risk += 3;
  if (c.admin === "write") { risk += 30; leaks.push("changer les réglages des dépôts, voire les rendre publics"); }
  else if (c.admin === "read") risk += 5;
  if (c.expiry === 0) { risk += 10; leaks.push("continuer à agir pour toujours, car le jeton n'expire jamais"); }
  else if (c.expiry === 90) risk += 2;
  const works = c.contents === "write";
  return { risk: Math.min(100, risk), leaks, works };
}

function Choice<T extends string | number>({ label, value, options, onPick }: { label: string; value: T; options: [T, string][]; onPick: (v: T) => void }) {
  return (
    <div style={{ marginTop: 12 }}>
      <div className="small" style={{ color: "var(--text-2)", marginBottom: 6 }}>{label}</div>
      <div className="row wrap-row" style={{ gap: 6 }}>
        {options.map(([v, l]) => <button key={String(v)} className={`chip ${value === v ? "on" : ""}`} onClick={() => onPick(v)}>{l}</button>)}
      </div>
    </div>
  );
}

export default function TokenBuilder() {
  const [c, setC] = useState<Cfg>(START);
  const set = (patch: Partial<Cfg>) => { sfx("tap"); setC({ ...c, ...patch }); };
  const a = analyse(c);
  const perfect = a.works && a.risk === analyse(IDEAL).risk;
  const tone = a.risk >= 50 ? "var(--red)" : a.risk >= 20 ? "var(--amber)" : "var(--led)";

  return (
    <div>
      <div className="feedback info"><span className="tag">Mission</span>Créer un jeton pour que FORMA-8 synchronise ta progression dans le dépôt FORMA-7-data. Rien de plus.</div>
      <Choice label="Dépôts accessibles" value={c.access} options={[["all", "Tous mes dépôts"], ["select", "Seulement FORMA-7-data"]]} onPick={(v) => set({ access: v })} />
      <Choice label="Contenu des fichiers (Contents)" value={c.contents} options={[["none", "Aucun"], ["read", "Lecture"], ["write", "Lecture et écriture"]]} onPick={(v) => set({ contents: v })} />
      <Choice label="Robots d'intégration continue (Actions)" value={c.actions} options={[["none", "Aucun"], ["read", "Lecture"], ["write", "Écriture"]]} onPick={(v) => set({ actions: v })} />
      <Choice label="Réglages des dépôts (Administration)" value={c.admin} options={[["none", "Aucun"], ["read", "Lecture"], ["write", "Écriture"]]} onPick={(v) => set({ admin: v })} />
      <Choice label="Expiration" value={c.expiry} options={[[7, "7 jours"], [30, "30 jours"], [90, "90 jours"], [0, "Jamais"]]} onPick={(v) => set({ expiry: v })} />

      <div className="panel" style={{ marginTop: 14, background: "#050912" }}>
        <div className="row"><span className="mono small grow">RISQUE EN CAS DE FUITE</span><span className="mono" style={{ color: tone }}>{a.risk} / 100</span></div>
        <div className="progress" style={{ marginTop: 6, height: 8 }}><motion.i animate={{ width: `${a.risk}%` }} style={{ background: tone }} /></div>
        {a.leaks.length > 0
          ? <><div className="small" style={{ marginTop: 10 }}>Si ce jeton fuit, quelqu'un pourrait :</div><ul className="small" style={{ margin: "4px 0 0", paddingLeft: 18 }}>{a.leaks.map((l) => <li key={l}>{l}</li>)}</ul></>
          : <div className="small" style={{ marginTop: 10 }}>Même en cas de fuite, les dégâts restent limités au strict nécessaire.</div>}
      </div>
      <motion.div key={`${a.works}-${perfect}`} className={`feedback ${!a.works ? "ko" : perfect ? "ok" : "info"}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {!a.works ? <><Icon name="warn" size={14} /> Ce jeton ne permet pas la mission : la synchronisation doit pouvoir écrire le fichier de progression (Contents : lecture et écriture).</>
          : perfect ? <><span className="tag">Moindre privilège</span>Juste ce qu'il faut, pour une durée limitée. C'est le bon réflexe pour chaque jeton et chaque clé.</>
          : "Le jeton fonctionne, mais il donne plus de droits que nécessaire. Retire ce qui ne sert pas à la mission."}
      </motion.div>
      <button className="btn ghost small block" style={{ marginTop: 10 }} onClick={() => set(START)}><Icon name="refresh" size={16} /> Recommencer</button>
    </div>
  );
}

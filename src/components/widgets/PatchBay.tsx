import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { sfx } from "../../lib/sound";
import { Icon } from "../Icon";

// Baie de brassage : brancher l'IA à des outils, avec des droits.
// Pictogrammes génériques (courrier, dossier…) : aucun logo de marque.
const SERVICES = [
  { id: "gmail", name: "Gmail", icon: "mail" },
  { id: "drive", name: "Drive", icon: "folder" },
  { id: "agenda", name: "Agenda", icon: "calendar" },
  { id: "notion", name: "Notion", icon: "note" },
  { id: "slack", name: "Slack", icon: "chat" },
] as const;
const REQUESTS = [
  { q: "Résume mes mails non lus de ce matin.", need: "gmail", mode: "lecture" },
  { q: "Quels rendez-vous ai-je demain ?", need: "agenda", mode: "lecture" },
  { q: "Range le devis signé dans le dossier Clients.", need: "drive", mode: "écriture" },
];

type Perm = "lecture" | "écriture";

export default function PatchBay() {
  const [links, setLinks] = useState<Record<string, Perm>>({});
  const [asking, setAsking] = useState<string | null>(null);
  const [req, setReq] = useState<number | null>(null);
  const connect = (id: string) => {
    if (links[id]) { sfx("relay"); const n = { ...links }; delete n[id]; setLinks(n); return; }
    sfx("open"); setAsking(id);
  };
  const grant = (perm: Perm) => { if (!asking) return; sfx("relay"); setLinks({ ...links, [asking]: perm }); setAsking(null); };
  const r = req !== null ? REQUESTS[req] : null;
  const ok = r ? !!links[r.need] && (r.mode === "lecture" || links[r.need] === "écriture") : false;
  return (
    <div>
      <div style={{ position: "relative", display: "grid", gridTemplateColumns: "92px 1fr", gap: 14, alignItems: "center" }}>
        <div style={{ height: 230, borderRadius: 16, display: "grid", placeItems: "center", textAlign: "center", background: "radial-gradient(circle, rgba(59,232,255,.25), rgba(12,19,34,.9) 70%)", border: "1px solid rgba(59,232,255,.4)" }}>
          <div style={{ display: "grid", justifyItems: "center", gap: 4 }}><Icon name="bot" size={34} style={{ color: "var(--cyan)", filter: "drop-shadow(0 0 6px rgba(59,232,255,.6))" }} /><div className="mono small" style={{ color: "var(--cyan)" }}>ASSISTANT</div></div>
        </div>
        <div className="stack">
          {SERVICES.map((s) => {
            const l = links[s.id];
            return (
              <button key={s.id} className={`choice ${l ? "ok" : ""}`} style={{ padding: "9px 12px", alignItems: "center", position: "relative" }} onClick={() => connect(s.id)}>
                <motion.span aria-hidden="true" style={{ position: "absolute", right: "100%", top: "50%", height: 3, background: l ? (l === "écriture" ? "var(--amber)" : "var(--led)") : "transparent", boxShadow: l ? "0 0 8px var(--led)" : "none" }}
                  animate={{ width: l ? 14 : 0 }} />
                <Icon name={s.icon} size={20} style={{ color: l ? (l === "écriture" ? "var(--amber)" : "var(--led)") : "var(--text-2)" }} />
                <span className="grow" style={{ fontWeight: 600 }}>{s.name}</span>
                <span className={`pill ${l === "écriture" ? "amber" : l ? "led" : ""}`}>{l ?? "débranché"}</span>
              </button>
            );
          })}
        </div>
      </div>
      <AnimatePresence>
        {asking && (
          <motion.div className="panel" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} style={{ marginTop: 12, borderColor: "var(--amber)" }}>
            <div className="panel-title" style={{ color: "var(--amber)" }}><Icon name="shield-check" size={16} /> Demande d'autorisation</div>
            <div style={{ marginBottom: 10 }}>L'assistant demande l'accès à <b>{SERVICES.find((s) => s.id === asking)?.name}</b>. Quels droits accordes-tu ?</div>
            <div className="row">
              <button className="btn small led grow" onClick={() => grant("lecture")}>Lecture seule</button>
              <button className="btn small subtle grow" onClick={() => grant("écriture")}>Lecture + écriture</button>
              <button className="btn small ghost" onClick={() => setAsking(null)}>Refuser</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="small muted" style={{ margin: "14px 0 8px" }}>Envoie une demande à l'assistant :</div>
      <div className="stack">
        {REQUESTS.map((x, i) => <button key={i} className={`chip ${req === i ? "on" : ""}`} style={{ width: "100%", justifyContent: "flex-start" }} onClick={() => { setReq(i); sfx("tap"); }}>« {x.q} »</button>)}
      </div>
      {r && (
        <motion.div key={`${req}-${ok}-${links[r.need] ?? ""}`} className={`feedback ${ok ? "ok" : "ko"}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          <span className="tag">{ok ? "Données reçues par le câble" : "Accès impossible"}</span>
          {ok
            ? r.mode === "lecture" ? "L'assistant lit les données via le connecteur, les ajoute à son contexte et te répond. Une simple lecture suffit : bon réflexe." : "L'assistant agit dans l'outil. L'écriture est puissante : demande une confirmation avant les actions importantes."
            : !links[r.need] ? `« Je n'ai pas accès à ${SERVICES.find((s) => s.id === r.need)?.name}. » Branche le câble correspondant.` : "« J'ai seulement le droit de lire. » Cette action demande l'écriture : à toi de décider si tu l'accordes."}
        </motion.div>
      )}
    </div>
  );
}

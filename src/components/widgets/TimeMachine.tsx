import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { sfx } from "../../lib/sound";
import { Icon } from "../Icon";

// La machine à remonter les versions : la page d'un produit imaginaire, photographiée
// à chaque étape. Le joueur remonte dans l'historique, compare, puis restaure une
// ancienne version. Il découvre l'idée centrale du caisson : restaurer n'efface rien,
// cela ajoute une version de plus. (Écrit à neuf pour FORMA-8.)

interface Page { title: string; orange?: boolean; phrase?: string; button?: boolean; perks?: boolean }
interface Version { page: Page; what: string; when: string; restoredFrom?: number }

const START: Version[] = [
  { when: "Lundi, 18:02", what: "Crée la page d'accueil", page: { title: "Carnet de chantier" } },
  { when: "Lundi, 18:20", what: "Ajoute la phrase de présentation", page: { title: "Carnet de chantier", phrase: "Tes photos de chantier, retrouvées en deux touchers." } },
  { when: "Mardi, 12:41", what: "Ajoute le bouton Contact", page: { title: "Carnet de chantier", phrase: "Tes photos de chantier, retrouvées en deux touchers.", button: true } },
  { when: "Mardi, 12:55", what: "Passe le titre en orange", page: { title: "Carnet de chantier", orange: true, phrase: "Tes photos de chantier, retrouvées en deux touchers.", button: true } },
  { when: "Jeudi, 08:10", what: "Ajoute trois avantages", page: { title: "Carnet de chantier", orange: true, phrase: "Tes photos de chantier, retrouvées en deux touchers.", button: true, perks: true } },
];

export default function TimeMachine() {
  const [versions, setVersions] = useState<Version[]>(START);
  const [k, setK] = useState(START.length - 1);
  const [wentBack, setWentBack] = useState(false);
  const v = versions[k];
  const last = versions.length - 1;
  const restored = versions.length > START.length;
  const goals = [
    { t: "Remonte jusqu'à la toute première version", ok: wentBack },
    { t: "Restaure une ancienne version", ok: restored },
  ];
  const done = goals.every((g) => g.ok);

  const show = (i: number) => {
    if (i < 0 || i > last || i === k) return;
    sfx("relay");
    setK(i);
    if (i === 0) setWentBack(true);
  };
  const restore = () => {
    if (k === last) return;
    sfx(wentBack ? "badge" : "power");
    const nv: Version = { when: "Aujourd'hui", what: `Reviens à la version ${k + 1}`, page: v.page, restoredFrom: k };
    setVersions([...versions, nv]);
    setK(versions.length);
  };
  const reset = () => { sfx("tap"); setVersions(START); setK(START.length - 1); setWentBack(false); };

  const p = v.page;
  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
        <span className="mono small">HISTORIQUE · {versions.length} VERSIONS</span>
        <span className={`pill ${k === last ? "led" : "amber"}`} style={{ whiteSpace: "nowrap" }}>{k === last ? "Actuelle" : "Passée"}</span>
      </div>

      {/* La page telle qu'elle était à cette version. */}
      <div style={{ borderRadius: 14, border: "1px solid var(--line-strong)", background: "#050912", padding: 10 }}>
        <div className="mono" style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 8 }}>LA PAGE, À LA VERSION {k + 1}</div>
        <AnimatePresence mode="wait">
          <motion.div key={k} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            style={{ minHeight: 168, borderRadius: 10, background: "#0b1222", border: "1px solid var(--line)", padding: 14 }}>
            <div style={{ fontSize: 19, fontWeight: 700, color: p.orange ? "var(--amber)" : "var(--text)" }}>{p.title}</div>
            {p.phrase && <div className="small" style={{ color: "var(--text-2)", marginTop: 6 }}>{p.phrase}</div>}
            {p.perks && (
              <div className="small" style={{ marginTop: 8, color: "var(--text-2)" }}>
                <div>· Rangé par chantier</div><div>· Partage en un toucher</div><div>· Fonctionne sans réseau</div>
              </div>
            )}
            {p.button && <div style={{ display: "inline-block", marginTop: 10, padding: "6px 14px", borderRadius: 999, background: "var(--cyan)", color: "#04121c", font: "700 12px var(--font)" }}>Me contacter</div>}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* La frise : une pastille par version. */}
      <div style={{ overflowX: "auto", marginTop: 10 }}>
        <div className="row" style={{ gap: 6, padding: "2px 0 6px", width: "max-content" }}>
          {versions.map((x, i) => (
            <button key={i} className={`chip ${i === k ? "on" : ""}`} style={{ minWidth: 44, minHeight: 40, justifyContent: "center" }} aria-label={`Voir la version ${i + 1} : ${x.what}`} onClick={() => show(i)}>
              {x.restoredFrom !== undefined ? <Icon name="refresh" size={14} /> : null} {i + 1}
            </button>
          ))}
        </div>
      </div>

      <motion.div key={`${k}-${versions.length}`} className={`feedback ${v.restoredFrom !== undefined ? "ok" : "info"}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 6 }}>
        <span className="tag">Version {k + 1} · {v.when}</span>
        <b>« {v.what} »</b>
        {v.restoredFrom !== undefined
          ? <> Tu as restauré la version {v.restoredFrom + 1}. Compte les pastilles : aucune n'a disparu. Revenir en arrière <b>ajoute</b> une version, et les versions {v.restoredFrom + 2} à {k} restent consultables.</>
          : k === last ? <> C'est la version actuelle. Remonte le temps avec les pastilles ou les flèches.</>
            : k === 0 ? <> Le tout début : un simple titre. Tout ce qui a suivi est gardé, dans l'ordre.</>
              : <> Tu regardes le passé : rien n'est modifié tant que tu ne restaures pas.</>}
      </motion.div>

      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn subtle" onClick={() => show(k - 1)} disabled={k === 0} aria-label="Version précédente"><Icon name="back" size={18} /></button>
        <button className="btn grow" style={{ padding: "8px 10px", fontSize: 15 }} onClick={restore} disabled={k === last}><Icon name="refresh" size={16} /> Restaurer cette version</button>
        <button className="btn subtle" onClick={() => show(k + 1)} disabled={k === last} aria-label="Version suivante"><Icon name="chevron-right" size={18} /></button>
      </div>
      {k === last && !restored && <div className="small dim" style={{ marginTop: 6 }}>Pour restaurer, choisis d'abord une version passée.</div>}

      <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 12, background: "#050912", border: "1px solid var(--line)" }}>
        <div className="mono small" style={{ color: done ? "var(--led)" : "var(--text-3)", marginBottom: 4 }}>{done ? "DÉFIS RÉUSSIS" : `DÉFIS · ${goals.filter((g) => g.ok).length}/${goals.length}`}</div>
        {goals.map((g) => (
          <div key={g.t} className="small" style={{ display: "flex", gap: 8, alignItems: "center", margin: "5px 0", color: g.ok ? "var(--text)" : "var(--text-2)" }}>
            <span aria-hidden="true" style={{ flex: "none", width: 18, height: 18, borderRadius: 6, display: "grid", placeItems: "center", border: `1px solid ${g.ok ? "var(--led)" : "var(--line-strong)"}`, background: g.ok ? "var(--led)" : "transparent", color: "#002010" }}>{g.ok && <Icon name="check" size={12} stroke={2.6} />}</span>
            <span>{g.t}{g.ok ? " : fait" : ""}</span>
          </div>
        ))}
      </div>
      <button className="btn ghost small block" style={{ marginTop: 8 }} onClick={reset}><Icon name="refresh" size={16} /> Recommencer</button>
    </div>
  );
}

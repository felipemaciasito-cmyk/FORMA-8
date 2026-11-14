import { useState } from "react";
import { allNotions } from "../content";
import { BADGES } from "../lib/game";
import { go } from "../lib/router";
import { sfx } from "../lib/sound";
import { useProgress } from "../lib/store";
import { TopBar } from "./Chrome";
import { BadgeEmblem, LEITNER_COLORS, LEITNER_LABELS, ModuleChip, NotionChip } from "./Emblems";
import { ICON_LABELS, NOTION_ICON_IDS, UI_ICON_IDS } from "./glyphs";
import { Icon } from "./Icon";
import { openTerm } from "../lib/termBus";

// Catalogue du système visuel : puces de module, emblèmes et pictogrammes.
export function IconLibraryView() {
  const p = useProgress();
  const [replay, setReplay] = useState(0);
  return (
    <div className="wrap">
      <TopBar title="Bibliothèque d'icônes" kicker="Système visuel · zéro emoji" onBack={() => go("reglages")} />
      <p className="muted small">Chaque pictogramme est dessiné pour FORMA-7 et repris dans FORMA-8 : grille de 24, trait de 1,8 aux bouts arrondis, couleurs du datacenter. Aucun emoji n'est utilisé dans l'appli.</p>

      <div className="panel-title" style={{ marginTop: 18 }}><Icon name="neural-chip" size={16} /> Puces de module · états</div>
      <div className="panel">
        <div className="row wrap-row" style={{ gap: 14, justifyContent: "space-between" }}>
          {[
            { s: "locked" as const, l: "Verrouillée" },
            { s: "idle" as const, l: "Découverte" },
            { s: "learned" as const, l: "Assimilée" },
            { s: "due" as const, l: "Surchauffe" },
          ].map((x) => (
            <div key={x.s} style={{ textAlign: "center" }}>
              <ModuleChip icon="layers" hue={160} state={x.s} box={x.s === "learned" ? 3 : x.s === "due" ? 2 : 0} size={60} />
              <div className="mono" style={{ fontSize: 10, color: "var(--text-3)", marginTop: 4 }}>{x.l}</div>
            </div>
          ))}
        </div>
        <div className="hr" />
        <div className="small muted" style={{ marginBottom: 8 }}>Le voyant et la réglette indiquent la boîte Leitner :</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4 }}>
          {[1, 2, 3, 4, 5].map((b) => (
            <div key={b} style={{ display: "grid", justifyItems: "center", textAlign: "center" }}>
              <ModuleChip icon="layers" hue={160} state="learned" box={b} size={46} />
              <div className="mono" style={{ fontSize: 9, lineHeight: 1.25, color: LEITNER_COLORS[b - 1], marginTop: 2 }}>B{b}<br />{LEITNER_LABELS[b - 1]}</div>
            </div>
          ))}
        </div>
        <div className="hr" />
        <div className="row" style={{ gap: 14 }}>
          <div key={replay}><ModuleChip icon="robot-arm" hue={350} state="learned" box={1} size={64} trace /></div>
          <div className="grow small muted">Quand une notion est débloquée, son tracé se dessine. Désactivé si les animations sont réduites.</div>
          <button className="icon-btn" onClick={() => { sfx("tap"); setReplay((r) => r + 1); }} aria-label="Rejouer l'animation"><Icon name="refresh" size={18} /></button>
        </div>
      </div>

      <div className="panel-title" style={{ marginTop: 18 }}><Icon name="base" size={16} /> Les {allNotions().length} notions</div>
      <div className="icon-sheet">
        {allNotions().map((nn) => (
          <div key={nn.id} onClick={() => openTerm(nn.id)} style={{ cursor: "pointer" }}>
            <NotionChip id={nn.id} icon={nn.icon} size={50} />
            <span style={{ color: "var(--text-2)", fontFamily: "var(--font)", fontSize: 11.5, lineHeight: 1.2 }}>{nn.term.replace(/\s*\(.+\)$/, "")}</span>
          </div>
        ))}
      </div>

      <div className="panel-title" style={{ marginTop: 18 }}><Icon name="trophy" size={16} /> Emblèmes de badges</div>
      <div className="icon-sheet">
        {BADGES.map((b) => (
          <div key={b.id}>
            <BadgeEmblem icon={b.icon} got={!!p.badges[b.id]} size={54} />
            <span style={{ color: "var(--text-2)", fontFamily: "var(--font)", fontSize: 11.5 }}>{b.title}</span>
          </div>
        ))}
        <div><BadgeEmblem icon="bolt" got size={54} /><span>obtenu</span></div>
        <div><BadgeEmblem icon="bolt" got={false} size={54} /><span>éteint</span></div>
      </div>

      <div className="panel-title" style={{ marginTop: 18 }}><Icon name="spark" size={16} /> Glyphes de notions ({NOTION_ICON_IDS.length})</div>
      <div className="icon-sheet">
        {NOTION_ICON_IDS.map((id) => (
          <div key={id} title={ICON_LABELS[id]}><Icon name={id} size={28} style={{ color: "var(--cyan)" }} /><span>{id}</span></div>
        ))}
      </div>

      <div className="panel-title" style={{ marginTop: 18 }}><Icon name="gear" size={16} /> Interface ({UI_ICON_IDS.length})</div>
      <div className="icon-sheet">
        {UI_ICON_IDS.map((id) => (
          <div key={id} title={ICON_LABELS[id]}><Icon name={id} size={28} style={{ color: "var(--text)" }} /><span>{id}</span></div>
        ))}
      </div>
    </div>
  );
}

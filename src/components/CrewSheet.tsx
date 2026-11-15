// Planche de contrôle des personnages (temporaire, pour vérifier les dessins).
import { ROOMS } from "../content";
import { CrewCapsule, CrewFigure } from "./Crew";
export function CrewSheet() {
  return (
    <div className="wrap">
      {(["awake", "asleep", "locked"] as const).map((st) => (
        <div key={st} style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 16 }}>
          {ROOMS.map((r) => <div key={r.id} style={{ textAlign: "center" }}><CrewFigure id={r.id} state={st} size={84} /><div className="mono" style={{ fontSize: 9 }}>{r.id}</div></div>)}
        </div>
      ))}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        <CrewCapsule id="c01" state="asleep" power={60} size={170} />
        <CrewCapsule id="c01" state="awake" power={100} size={170} mood="happy" />
      </div>
      <div style={{ display: "flex", gap: 8 }}>{ROOMS.map((r) => <CrewFigure key={r.id} id={r.id} state="awake" crop="head" size={32} />)}</div>
    </div>
  );
}

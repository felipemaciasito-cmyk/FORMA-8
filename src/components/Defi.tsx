// Défi du jour (lot du 17/11/2026, aperçu validé par le propriétaire) : chaque jour, le dernier membre réveillé pose
// une question sur ses notions. Les réponses sont dans sa bulle ; une mauvaise réponse donne une piste, la bonne
// rapporte 15 kW. Un défi par jour, sur cet appareil.
import { motion } from "motion/react";
import { useState } from "react";
import { room } from "../content/index";
import { addEnergy, fx } from "../lib/game";
import { eveille, INTERACTIONS } from "../lib/eveil";
import { sfx } from "../lib/sound";
import { today, useProgress } from "../lib/store";
import { nomDe } from "../lib/voice";
import { Bulle } from "./Bulle";
import { Icon } from "./Icon";

export const DEFI_KW = 15;
const KEY = "forma8:defi";

function lire(): { jour: string; fait: boolean } | null {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "null"); } catch { return null; }
}
function ecrire(v: { jour: string; fait: boolean }) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* stockage indisponible */ } }

/** Le membre qui pose le défi : le dernier réveillé parmi ceux qui ont des questions. */
function poseur(): string | undefined {
  const list = Object.keys(INTERACTIONS.defis).filter((s) => eveille(s));
  return list[list.length - 1];
}

/** Numéro du jour : la question change chaque jour. */
const numeroDuJour = (jour: string) => Math.floor(Date.parse(`${jour}T12:00:00`) / 86400000);

export function DefiDuJour() {
  useProgress();
  const jour = today();
  const qui = poseur();
  const [ouvert, setOuvert] = useState(false);
  const [ligne, setLigne] = useState<{ md: string; choix?: string[] } | null>(null);
  const [fait, setFait] = useState(() => lire()?.jour === jour && !!lire()?.fait);
  if (!qui) return null;
  const d = INTERACTIONS.defis[qui];
  const q = d.questions[numeroDuJour(jour) % d.questions.length];
  const hue = room(qui === "ora" ? "c00" : qui)?.hue ?? 190;

  const ouvrir = () => {
    sfx("open"); setOuvert(true);
    setLigne(fait ? { md: d.fait } : { md: q.question, choix: q.choix });
  };
  const choisir = (i: number) => {
    if (i === q.bonne) {
      sfx("ok");
      ecrire({ jour, fait: true }); setFait(true);
      addEnergy(DEFI_KW, "Défi du jour");
      fx({ type: "burst", color: "#3be8ff" });
      setLigne({ md: d.bravo[numeroDuJour(jour) % d.bravo.length] });
    } else {
      sfx("ko");
      setLigne({ md: q.piste, choix: q.choix });
    }
  };

  return (
    <div className="panel defi" style={{ ["--hue" as string]: hue, marginTop: 12 }}>
      <div className="row" style={{ alignItems: "center", gap: 10 }}>
        <Icon name="bolt" size={18} />
        <div className="grow">
          <div className="kicker">Défi du jour</div>
          <div className="small muted">{fait ? "Relevé aujourd'hui. Un nouveau défi demain." : `${nomDe(qui)} te pose une question · +${DEFI_KW} kW`}</div>
        </div>
        {!ouvert && <motion.button type="button" className="btn" whileTap={{ scale: 0.96 }} onClick={ouvrir}>{fait ? "Revoir" : "Relever"}</motion.button>}
      </div>
      {ouvert && ligne && (
        <div style={{ marginTop: 10 }}>
          <Bulle speaker={qui} md={ligne.md} choix={ligne.choix} onChoix={choisir} options={{ retour: false, delai: 120 }} />
        </div>
      )}
    </div>
  );
}

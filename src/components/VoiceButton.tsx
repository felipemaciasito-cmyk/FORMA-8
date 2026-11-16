import { useEffect, useState } from "react";
import { getVoiceState, hasVoice, onVoice, speak, stopVoice } from "../lib/voice";
import { voiceKey } from "../lib/voice-key";
import { useSettings } from "../lib/store";
import { Icon } from "./Icon";

/**
 * Voix d'une réplique affichée : le personnage la lit quand sa bulle apparaît (si le réglage « Voix de l'équipe »
 * est activé et que le son est débloqué), et le joueur peut la réécouter. Renvoie aussi le niveau de la voix (0 à 1)
 * pour animer le personnage pendant qu'il parle.
 */
export function useVoiceLine(speaker: string | undefined, md: string | undefined, auto = true) {
  const settings = useSettings();
  const available = !!speaker && !!md && (settings.voices ?? true) && hasVoice(speaker, md);
  const key = speaker && md ? voiceKey(speaker, md) : "";
  const [level, setLevel] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => {
    if (!key) return;
    const cur = getVoiceState();
    if (cur.key === key) { setSpeaking(cur.speaking); setLevel(cur.level); }
    return onVoice((s) => {
      if (s.key !== key) { setSpeaking(false); setLevel(0); return; }
      setSpeaking(s.speaking); setLevel(s.level);
    });
  }, [key]);
  useEffect(() => {
    if (!available || !auto) return;
    // Petit délai : la bulle apparaît d'abord, puis le personnage parle.
    const t = window.setTimeout(() => { void speak(speaker!, md!, true); }, 350);
    return () => window.clearTimeout(t);
  }, [available, auto, key]); // eslint-disable-line react-hooks/exhaustive-deps
  const replay = () => { if (!available) return; if (speaking) stopVoice(); else void speak(speaker!, md!); };
  return { available, speaking, level, replay };
}

/** Petit bouton « Réécouter » (ou « Arrêter » pendant que le personnage parle). */
export function ReplayButton({ voice, who, color }: { voice: ReturnType<typeof useVoiceLine>; who: string; color: string }) {
  if (!voice.available) return null;
  return (
    <button className="voice-btn" onClick={voice.replay} aria-label={voice.speaking ? `Arrêter la voix de ${who}` : `Réécouter ${who}`}
      style={{ color, borderColor: color }} data-speaking={voice.speaking ? "1" : undefined}>
      <Icon name="speaker" size={14} stroke={2.2} />
      <span className="voice-bars" aria-hidden="true">
        {[0, 1, 2].map((i) => <i key={i} style={{ transform: `scaleY(${voice.speaking ? 0.3 + voice.level * (0.7 - i * 0.12) : 0.3})` }} />)}
      </span>
    </button>
  );
}

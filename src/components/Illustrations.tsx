// Illustrations des analogies de FORMA-8, dessinées pour FORMA-8 dans le style de la
// couche visuelle (mêmes couleurs, cadre 320 x 120, étiquettes en police mono).
// Les illustrations de FORMA-7 (composant Art) ne sont pas utilisées : aucun contenu repris.
import ids from "../content/illustration-ids.json";

export type IllustrationId = keyof typeof ids;

const C = { c: "#3be8ff", l: "#4dffa0", a: "#ffb547", v: "#a78bfa", r: "#ff4d6d", d: "#1a2640", m: "#2a3a5c", t: "#8aa0c4" };
const label = (x: number, y: number, t: string, fill = C.t) => <text x={x} y={y} textAnchor="middle" fill={fill} style={{ font: "600 10px var(--mono)" }}>{t}</text>;

export function Illustration({ name }: { name?: string }) {
  if (!name) return null;
  const common = { width: "100%", height: 120, viewBox: "0 0 320 120", role: "img" as const, "aria-hidden": true };
  switch (name as IllustrationId) {
    case "web-magasin": return (
      <svg {...common}>
        <rect x="28" y="26" width="40" height="66" rx="8" fill={C.d} stroke={C.c} strokeWidth="2" /><rect x="34" y="34" width="28" height="44" rx="3" fill="#0b1222" /><circle cx="48" cy="85" r="3" fill={C.c} />
        <path d="M80 60h150" stroke={C.m} strokeWidth="10" strokeLinecap="round" /><path d="M86 60h138" stroke={C.t} strokeWidth="1.5" strokeDasharray="6 7" />
        <circle r="5" fill={C.c} style={{ animation: "none" }}><animateMotion dur="2.6s" repeatCount="indefinite" path="M90 60H220" /></circle>
        <path d="M240 46l24-16 24 16v46h-48Z" fill={C.d} stroke={C.l} strokeWidth="2" /><rect x="252" y="62" width="24" height="30" rx="2" fill="#0b1222" stroke={C.l} />
        <rect x="248" y="50" width="32" height="7" rx="2" fill={C.l} opacity=".7" />
        {label(48, 108, "TON NAVIGATEUR", C.c)}{label(155, 44, "INTERNET")}{label(264, 108, "SERVEUR", C.l)}
      </svg>);
    case "trois-couches": return (
      <svg {...common}>
        <g transform="translate(18 18)"><path d="M10 40l40-28 40 28v44H10Z" fill="none" stroke={C.c} strokeWidth="2.5" /><path d="M30 84V56h20v28" fill="none" stroke={C.c} strokeWidth="2" />{label(50, 100, "STRUCTURE", C.c)}</g>
        <g transform="translate(116 18)"><path d="M10 40l40-28 40 28v44H10Z" fill={C.v} opacity=".55" stroke={C.v} strokeWidth="2.5" /><rect x="58" y="52" width="18" height="14" rx="2" fill="#0b1222" />{label(50, 100, "APPARENCE", C.v)}</g>
        <g transform="translate(214 18)"><path d="M10 40l40-28 40 28v44H10Z" fill={C.v} opacity=".55" stroke={C.a} strokeWidth="2.5" /><rect x="58" y="52" width="18" height="14" rx="2" fill={C.a} style={{ animation: "blink 1.6s steps(1) infinite" }} /><path d="M24 70h10v-8" stroke={C.a} strokeWidth="2" fill="none" />{label(50, 100, "COMPORTEMENT", C.a)}</g>
      </svg>);
    case "chef-equipe": return (
      <svg {...common}>
        <circle cx="52" cy="40" r="12" fill={C.c} opacity=".9" /><rect x="36" y="56" width="32" height="30" rx="10" fill={C.c} opacity=".55" />
        <rect x="74" y="44" width="40" height="28" rx="3" fill="#dfe9ff" opacity=".85" /><path d="M80 52h28M80 58h22M80 64h26" stroke={C.m} strokeWidth="2" />
        <path d="M130 60h34" stroke={C.t} strokeWidth="2" strokeDasharray="4 4" />
        <g transform="translate(200 60)">
          <circle r="34" fill="none" stroke={C.m} strokeWidth="6" />
          <circle r="34" fill="none" stroke={C.l} strokeWidth="6" strokeDasharray="40 174" style={{ transformOrigin: "center", animation: "spin 3s linear infinite" }} />
          <rect x="-14" y="-14" width="28" height="24" rx="7" fill={C.d} stroke={C.l} strokeWidth="2" /><circle cx="-5" cy="-3" r="2.5" fill={C.l} /><circle cx="5" cy="-3" r="2.5" fill={C.l} />
        </g>
        {label(52, 104, "TOI : LA DEMANDE", C.c)}{label(200, 112, "L'AGENT : AGIT, VÉRIFIE", C.l)}
      </svg>);
    case "serrure-cle": return (
      <svg {...common}>
        <rect x="50" y="34" width="70" height="60" rx="10" fill={C.d} stroke={C.r} strokeWidth="2.5" /><path d="M66 34V22a19 19 0 0 1 38 0v12" fill="none" stroke={C.r} strokeWidth="3" />
        <circle cx="85" cy="58" r="7" fill="#0b1222" /><rect x="82" y="62" width="6" height="16" rx="2" fill="#0b1222" />
        <path d="M150 64h30" stroke={C.t} strokeWidth="2" strokeDasharray="4 4" />
        <circle cx="222" cy="64" r="16" fill="none" stroke={C.l} strokeWidth="3" /><path d="M238 64h46v12M268 64v10" fill="none" stroke={C.l} strokeWidth="3" strokeLinecap="round" />
        {label(85, 112, "1 · LE PROBLÈME", C.r)}{label(250, 112, "2 · LA SOLUTION", C.l)}
      </svg>);
    case "vitrine": return (
      <svg {...common}>
        <rect x="40" y="14" width="240" height="20" rx="10" fill={C.d} stroke={C.m} /><circle cx="56" cy="24" r="4" fill={C.l} />
        <text x="70" y="28" fill={C.c} style={{ font: "600 10px var(--mono)" }}>ton-compte.github.io/ton-produit</text>
        <rect x="40" y="42" width="240" height="56" rx="8" fill={C.d} stroke={C.c} strokeWidth="2" />
        <rect x="56" y="54" width="120" height="10" rx="3" fill={C.c} opacity=".8" /><rect x="56" y="70" width="170" height="6" rx="3" fill={C.m} /><rect x="56" y="82" width="60" height="9" rx="4" fill={C.a} />
        <rect x="222" y="50" width="48" height="16" rx="8" fill={C.l} opacity=".9" /><text x="246" y="61" textAnchor="middle" fill="#04060c" style={{ font: "700 9px var(--mono)" }}>EN LIGNE</text>
        {label(160, 114, "TA PAGE, VISIBLE PAR TOUS")}
      </svg>);
    case "photos-chantier": return (
      <svg {...common}>
        <path d="M30 96h260" stroke={C.m} strokeWidth="3" strokeLinecap="round" />
        {[0, 1, 2, 3].map((i) => (
          <g key={i} transform={`translate(${28 + i * 70} 16)`}>
            <rect x="0" y="0" width="56" height="62" rx="5" fill={C.d} stroke={i === 3 ? C.l : C.c} strokeWidth="2" />
            <rect x="6" y="6" width="44" height="38" rx="2" fill="#0b1222" />
            <path d="M12 40h32" stroke={C.t} strokeWidth="2" />
            {i >= 1 && <path d="M16 40V26h24v14" fill="none" stroke={C.a} strokeWidth="2" />}
            {i >= 2 && <path d="M13 27l15-11 15 11" fill="none" stroke={C.a} strokeWidth="2" strokeLinejoin="round" />}
            {i >= 3 && <rect x="24" y="31" width="8" height="9" rx="1" fill={C.l} style={{ animation: "blink 1.6s steps(1) infinite" }} />}
            <rect x="8" y="50" width="28" height="5" rx="2" fill={C.m} />
            <circle cx="28" cy="80" r="5" fill={i === 3 ? C.l : C.c} />
          </g>
        ))}
        {label(56, 114, "LUNDI", C.c)}{label(126, 114, "MARDI", C.c)}{label(196, 114, "JEUDI", C.c)}{label(266, 114, "AUJOURD'HUI", C.l)}
      </svg>);
    case "voie-essai": return (
      <svg {...common}>
        <path d="M24 44h272" stroke={C.c} strokeWidth="3" strokeLinecap="round" />
        <path d="M96 44C122 44 118 86 144 86h44c26 0 22-42 48-42" fill="none" stroke={C.v} strokeWidth="3" strokeLinecap="round" />
        {[40, 96].map((x) => <circle key={x} cx={x} cy="44" r="7" fill="#0b1222" stroke={C.c} strokeWidth="2.6" />)}
        {[144, 188].map((x) => <circle key={x} cx={x} cy="86" r="7" fill="#0b1222" stroke={C.v} strokeWidth="2.6" />)}
        <circle cx="236" cy="44" r="9" fill="#0b1222" stroke={C.l} strokeWidth="2.6" /><circle cx="236" cy="44" r="3" fill={C.l} />
        <circle cx="282" cy="44" r="7" fill="#0b1222" stroke={C.c} strokeWidth="2.6" />
        <circle r="4" fill={C.v} style={{ animation: "none" }}><animateMotion dur="3.2s" repeatCount="indefinite" path="M96 44C122 44 118 86 144 86h44c26 0 22-42 48-42" /></circle>
        {label(160, 24, "MAIN : LA VERSION PRINCIPALE", C.c)}{label(166, 110, "UNE BRANCHE : TON ESSAI", C.v)}
      </svg>);
    case "relecture": return (
      <svg {...common}>
        <rect x="26" y="16" width="78" height="74" rx="6" fill={C.d} stroke={C.c} strokeWidth="2" />
        <rect x="34" y="26" width="62" height="7" rx="2" fill={C.m} /><rect x="34" y="38" width="62" height="7" rx="2" fill={C.r} opacity=".55" />
        <rect x="34" y="50" width="62" height="7" rx="2" fill={C.l} opacity=".6" /><rect x="34" y="62" width="62" height="7" rx="2" fill={C.l} opacity=".6" /><rect x="34" y="74" width="40" height="7" rx="2" fill={C.m} />
        <path d="M114 54h22" stroke={C.t} strokeWidth="2" strokeDasharray="4 4" />
        <path d="M146 54c10-16 38-16 48 0c-10 16-38 16-48 0Z" fill={C.d} stroke={C.a} strokeWidth="2.5" /><circle cx="170" cy="54" r="7" fill={C.a} style={{ animation: "blink 2.4s steps(1) infinite" }} />
        <path d="M204 54h22" stroke={C.t} strokeWidth="2" strokeDasharray="4 4" />
        <circle cx="262" cy="54" r="24" fill={C.d} stroke={C.l} strokeWidth="2.5" /><path d="M250 54l9 9 16-18" fill="none" stroke={C.l} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        {label(65, 108, "LE CHANGEMENT", C.c)}{label(170, 108, "TA RELECTURE", C.a)}{label(262, 108, "LA FUSION", C.l)}
      </svg>);
    case "correction": return (
      <svg {...common}>
        <rect x="60" y="10" width="200" height="86" rx="8" fill={C.d} stroke={C.m} strokeWidth="2" />
        <path d="M60 32h200M60 54h200M60 76h200" stroke={C.m} strokeWidth="1" />
        <circle cx="78" cy="21" r="5" fill={C.c} /><rect x="92" y="17" width="110" height="8" rx="3" fill={C.c} opacity=".7" />
        <circle cx="78" cy="43" r="5" fill={C.c} /><rect x="92" y="39" width="84" height="8" rx="3" fill={C.c} opacity=".7" />
        <circle cx="78" cy="65" r="5" fill={C.r} /><rect x="92" y="61" width="124" height="8" rx="3" fill={C.r} opacity=".65" />
        <circle cx="78" cy="86" r="5" fill={C.l} /><rect x="92" y="82" width="96" height="8" rx="3" fill={C.l} opacity=".8" />
        <path d="M236 82c14-2 14-20 0-18" fill="none" stroke={C.l} strokeWidth="2.5" strokeLinecap="round" /><path d="M241 59l-6 5 7 4" fill="none" stroke={C.l} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {label(160, 113, "ON N'EFFACE RIEN : ON AJOUTE UNE CORRECTION")}
      </svg>);
    default: return null;
  }
}

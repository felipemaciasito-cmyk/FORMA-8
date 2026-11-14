// Petites illustrations vectorielles pour les analogies.
const C = { c: "#3be8ff", l: "#4dffa0", a: "#ffb547", v: "#a78bfa", r: "#ff4d6d", d: "#1a2640", m: "#2a3a5c" };

export function Art({ name }: { name?: string }) {
  if (!name) return null;
  const common = { width: "100%", height: 120, viewBox: "0 0 320 120", role: "img" as const, "aria-hidden": true };
  switch (name) {
    case "engine": return (
      <svg {...common}>
        <rect x="40" y="40" width="240" height="56" rx="26" fill={C.d} stroke={C.m} />
        <rect x="70" y="20" width="110" height="34" rx="14" fill={C.d} stroke={C.m} />
        <circle cx="90" cy="98" r="16" fill="#0b1222" stroke={C.c} strokeWidth="3" /><circle cx="230" cy="98" r="16" fill="#0b1222" stroke={C.c} strokeWidth="3" />
        <g transform="translate(150 56)"><circle r="18" fill="none" stroke={C.a} strokeWidth="3" strokeDasharray="6 4" style={{ transformOrigin: "center", animation: "spin 4s linear infinite" }} /><circle r="6" fill={C.a} /></g>
        <text x="195" y="74" fill={C.a} style={{ font: "600 11px var(--mono)" }}>MODÈLE</text>
        <text x="74" y="41" fill="#8aa0c4" style={{ font: "600 10px var(--mono)" }}>APPLICATION</text>
      </svg>);
    case "lego": return (
      <svg {...common}>
        {["Bon", "jour", " à", " tous", " !"].map((t, i) => (
          <g key={i} transform={`translate(${28 + i * 56} ${40 + (i % 2) * 6})`}>
            <rect width="50" height="38" rx="6" fill={[C.c, C.v, C.l, C.a, C.r][i]} opacity=".85" />
            <circle cx="14" cy="-2" r="6" fill={[C.c, C.v, C.l, C.a, C.r][i]} /><circle cx="36" cy="-2" r="6" fill={[C.c, C.v, C.l, C.a, C.r][i]} />
            <text x="25" y="25" textAnchor="middle" fill="#04060c" style={{ font: "700 13px var(--mono)" }}>{t}</text>
          </g>
        ))}
        <text x="160" y="108" textAnchor="middle" fill="#8aa0c4" style={{ font: "600 10px var(--mono)" }}>5 TOKENS</text>
      </svg>);
    case "counter": return (
      <svg {...common}>
        <rect x="20" y="66" width="280" height="12" rx="4" fill={C.m} />
        <rect x="190" y="18" width="110" height="48" rx="8" fill={C.d} stroke={C.m} />
        {[0, 1, 2].map((k) => <circle key={k} cx={212 + k * 30} cy="42" r="9" fill="none" stroke={C.v} strokeWidth="2" style={{ transformOrigin: `${212 + k * 30}px 42px`, animation: `spin ${2 + k}s linear infinite` }} strokeDasharray="5 3" />)}
        <circle cx="95" cy="38" r="14" fill={C.c} opacity=".9" /><rect x="78" y="54" width="34" height="14" rx="6" fill={C.c} opacity=".6" />
        <text x="95" y="98" textAnchor="middle" fill={C.c} style={{ font: "600 10px var(--mono)" }}>ASSISTANT</text>
        <text x="245" y="98" textAnchor="middle" fill={C.v} style={{ font: "600 10px var(--mono)" }}>LLM</text>
      </svg>);
    case "desk": return (
      <svg {...common}>
        <rect x="30" y="58" width="260" height="10" rx="3" fill={C.m} />
        <rect x="44" y="68" width="10" height="44" fill={C.m} /><rect x="266" y="68" width="10" height="44" fill={C.m} />
        {[0, 1, 2, 3].map((k) => <rect key={k} x={70 + k * 46} y={30 - (k % 2) * 6} width="38" height="26" rx="3" fill="#dfe9ff" opacity={0.85 - k * 0.12} transform={`rotate(${k * 4 - 6} ${89 + k * 46} 43)`} />)}
        <rect x="200" y="74" width="70" height="34" rx="3" fill={C.d} stroke={C.m} /><rect x="214" y="88" width="42" height="4" rx="2" fill={C.m} />
        <text x="150" y="20" textAnchor="middle" fill={C.c} style={{ font: "600 10px var(--mono)" }}>CONTEXTE VISIBLE</text>
        <text x="235" y="118" textAnchor="middle" fill="#6b7a96" style={{ font: "600 9px var(--mono)" }}>TIROIR (INVISIBLE)</text>
      </svg>);
    case "plans": return (
      <svg {...common}>
        {[{ h: 30, t: "GRATUIT", c: "#6b7a96" }, { h: 62, t: "~20 $", c: C.c }, { h: 94, t: "100-200 $", c: C.v }].map((b, i) => (
          <g key={i}>
            <rect x={50 + i * 85} y={108 - b.h} width="60" height={b.h} rx="8" fill={b.c} opacity=".8" />
            <text x={80 + i * 85} y={102 - b.h} textAnchor="middle" fill={b.c} style={{ font: "700 11px var(--mono)" }}>{b.t}</text>
          </g>
        ))}
      </svg>);
    case "photo": return (
      <svg {...common}>
        <rect x="40" y="22" width="90" height="76" rx="8" fill={C.d} stroke={C.m} /><circle cx="85" cy="52" r="16" fill={C.a} opacity=".8" /><path d="M58 92q27-26 54 0" fill={C.a} opacity=".5" />
        <path d="M148 60h40" stroke={C.c} strokeWidth="3" markerEnd="url(#arr)" />
        <defs><marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill={C.c} /></marker></defs>
        <rect x="200" y="22" width="90" height="76" rx="8" fill={C.d} stroke={C.l} /><text x="245" y="64" textAnchor="middle" fill={C.l} style={{ font: "700 11px var(--mono)" }}>IMITATION</text>
      </svg>);
    case "floors": return (
      <svg {...common}>
        {[{ y: 12, t: "1 · PRÉFÉRENCES (partout)", c: C.v }, { y: 48, t: "2 · PROJET (un dossier)", c: C.c }, { y: 84, t: "3 · MESSAGE (une demande)", c: C.l }].map((f, i) => (
          <g key={i}><rect x={30 + i * 20} y={f.y} width={260 - i * 40} height="28" rx="6" fill={f.c} opacity=".18" stroke={f.c} /><text x="160" y={f.y + 18} textAnchor="middle" fill={f.c} style={{ font: "700 11px var(--mono)" }}>{f.t}</text></g>
        ))}
      </svg>);
    case "books": return (
      <svg {...common}>
        <rect x="20" y="100" width="280" height="8" rx="2" fill={C.m} />
        {Array.from({ length: 11 }, (_, i) => {
          const open = i === 6;
          return <g key={i}><rect x={28 + i * 24} y={open ? 20 : 34 + (i % 3) * 6} width="20" height={open ? 80 : 66 - (i % 3) * 6} rx="2" fill={open ? C.a : [C.c, C.v, C.l][i % 3]} opacity={open ? 1 : 0.45} />
            {open && <text x={38 + i * 24} y="14" textAnchor="middle" fill={C.a} style={{ font: "700 10px var(--mono)" }}>OUVERT</text>}</g>;
        })}
      </svg>);
    default: return null;
  }
}

import type { CSSProperties } from "react";
import { GLYPHS, isIconId, type Glyph, type IconId } from "./glyphs";

export type { IconId };

/** Résout un identifiant (y compris venant des données) vers un dessin ; glyphe générique si inconnu. */
export function glyphOf(name: string | undefined): Glyph {
  return name && isIconId(name) ? GLYPHS[name] : GLYPHS.generic;
}

/**
 * Couches d'un glyphe, à placer dans un <svg viewBox="0 0 24 24">.
 * trace : prépare l'animation de tracé (pathLength normalisé, classes « tr » et « fi »).
 */
export function GlyphLayers({ glyph, trace, secondaryOpacity = 0.5 }: { glyph: Glyph; trace?: boolean; secondaryOpacity?: number }) {
  const tr = trace ? { pathLength: 1, className: "tr" } : {};
  const fi = trace ? { className: "fi" } : {};
  return (
    <>
      {glyph.a && <path d={glyph.a} opacity={secondaryOpacity} {...tr} />}
      {glyph.d && <path d={glyph.d} {...tr} />}
      {glyph.f && <path d={glyph.f} fill="currentColor" stroke="none" {...fi} />}
      {glyph.t && (
        <text x="12" y="12.6" textAnchor="middle" dominantBaseline="middle" fill="currentColor" stroke="none" {...fi}
          style={{ font: `700 ${glyph.t.length <= 2 ? 10 : 8.4}px var(--mono)`, letterSpacing: glyph.t.length <= 2 ? "0" : "-0.04em" }}>
          {glyph.t}
        </text>
      )}
    </>
  );
}

/** Pictogramme FORMA-7 (trait 1.8, coins arrondis). */
export function Icon({ name, size = 22, stroke = 1.8, className, style, title }: {
  name: IconId | string; size?: number; stroke?: number; className?: string; style?: CSSProperties; title?: string;
}) {
  return (
    <svg className={className} style={style} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true })}>
      <GlyphLayers glyph={glyphOf(name)} />
    </svg>
  );
}

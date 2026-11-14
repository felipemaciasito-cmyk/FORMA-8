import { Fragment, type ReactNode } from "react";
import { stripEmoji } from "./emoji-rules";
import { openTerm } from "./termBus";

// Mini-rendu de texte : paragraphes, listes « - », **gras**, `code`, et [[notion]] cliquable.
// Règle « zéro emoji » : tout emoji qui se glisserait dans un texte (mission, réponse de Claude) est retiré à l'affichage.

const INLINE_RE = /(\[\[[a-z0-9-]+(?:\|[^\]]+)?\]\]|\*\*[^*]+\*\*|`[^`]+`)/g;

export function inline(text: string, keyPrefix = "i"): ReactNode[] {
  const parts = stripEmoji(text).split(INLINE_RE).filter((p) => p !== "");
  return parts.map((part, i) => {
    const k = `${keyPrefix}-${i}`;
    const ref = part.match(/^\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]$/);
    if (ref) {
      const id = ref[1];
      const label = ref[2] ?? labelFor(id);
      return (
        <button key={k} type="button" className="term" onClick={(e) => { e.stopPropagation(); openTerm(id); }}>
          {label}
        </button>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={k}>{inline(part.slice(2, -2), k)}</strong>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={k}>{part.slice(1, -1)}</code>;
    return <Fragment key={k}>{part}</Fragment>;
  });
}

let labelResolver: (id: string) => string = (id) => id;
export function setLabelResolver(fn: (id: string) => string) { labelResolver = fn; }
function labelFor(id: string) { return labelResolver(id); }

export function RichText({ md, className }: { md: string; className?: string }) {
  const blocks = md.split(/\n{2,}/);
  return (
    <div className={`rt ${className ?? ""}`}>
      {blocks.map((b, bi) => {
        const lines = b.split("\n");
        if (lines.every((l) => /^\s*-\s+/.test(l))) {
          return <ul key={bi}>{lines.map((l, li) => <li key={li}>{inline(l.replace(/^\s*-\s+/, ""), `${bi}-${li}`)}</li>)}</ul>;
        }
        // Un paragraphe peut contenir une liste après une phrase d'introduction.
        const firstList = lines.findIndex((l) => /^\s*-\s+/.test(l));
        if (firstList > 0 && lines.slice(firstList).every((l) => /^\s*-\s+/.test(l))) {
          return (
            <Fragment key={bi}>
              <p>{inline(lines.slice(0, firstList).join(" "), `${bi}p`)}</p>
              <ul>{lines.slice(firstList).map((l, li) => <li key={li}>{inline(l.replace(/^\s*-\s+/, ""), `${bi}-${li}`)}</li>)}</ul>
            </Fragment>
          );
        }
        return <p key={bi}>{lines.map((l, li) => <Fragment key={li}>{li > 0 && <br />}{inline(l, `${bi}-${li}`)}</Fragment>)}</p>;
      })}
    </div>
  );
}

/** Texte brut sans balises (pour l'export et la synthèse vocale). */
export function plain(md: string) {
  return stripEmoji(md).replace(/\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]/g, (_m, id, label) => label ?? labelFor(id)).replace(/\*\*/g, "").replace(/`/g, "");
}

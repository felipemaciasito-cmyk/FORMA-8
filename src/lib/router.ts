import { useEffect, useState } from "react";

// Routeur minimal par « # » (compatible GitHub Pages, aucun serveur nécessaire).
export function parseHash(h = window.location.hash) {
  const path = h.replace(/^#\/?/, "");
  return path.split("/").filter(Boolean).map(decodeURIComponent);
}

export function useRoute() {
  const [route, setRoute] = useState(parseHash());
  useEffect(() => {
    const on = () => setRoute(parseHash());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return route;
}

export function go(path: string) {
  const target = "#/" + path.replace(/^\//, "");
  if (window.location.hash !== target) window.location.hash = target;
}

export function back(fallback = "") {
  if (window.history.length > 1) window.history.back();
  else go(fallback);
}

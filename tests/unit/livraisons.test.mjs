// Tests des contrôles de livraison (src/lib/checks.ts), avec un faux GitHub.
import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateCheck, pagesUrl } from "../../src/lib/checks.ts";

const product = { name: "Mon produit", pitch: "", owner: "Felipe-Test", repo: "mon-produit" };

/** Faux « fetch » : répond selon l'adresse demandée, et garde la trace des appels. */
function fakeFetch(routes) {
  const calls = [];
  const f = async (url, init) => {
    calls.push({ url: String(url), init });
    for (const [pattern, [status, body]] of Object.entries(routes)) {
      if (String(url).includes(pattern)) return new Response(body === undefined ? "" : JSON.stringify(body), { status });
    }
    return new Response("", { status: 404 });
  };
  f.calls = calls;
  return f;
}

test("dossier avec au moins un sous-dossier (un skill dans .claude/skills)", async () => {
  const f = fakeFetch({ "contents/.claude/skills": [200, [{ type: "dir", name: "verif-iphone" }, { type: "file", name: "LISEZMOI.md" }]] });
  const ok = await evaluateCheck({ id: "s", kind: "folder", label: "", path: ".claude/skills" }, product, { fetch: f, token: "t" });
  assert.equal(ok.ok, true);
  assert.match(ok.detail, /verif-iphone/);
  const vide = fakeFetch({ "contents/.claude/skills": [200, [{ type: "file", name: "LISEZMOI.md" }]] });
  assert.equal((await evaluateCheck({ id: "s", kind: "folder", label: "", path: ".claude/skills" }, product, { fetch: vide, token: "t" })).ok, false);
  const absent = fakeFetch({});
  const ko = await evaluateCheck({ id: "s", kind: "folder", label: "", path: ".claude/skills" }, product, { fetch: absent, token: "t" });
  assert.equal(ko.ok, false);
  assert.match(ko.detail, /introuvable/);
});

test("adresse publique de la page du produit (même site que FORMA-8)", () => {
  assert.equal(pagesUrl(product), "https://felipe-test.github.io/mon-produit/");
});

test("fichier présent ou absent", async () => {
  const f = fakeFetch({ "contents/CLAUDE.md": [200, { name: "CLAUDE.md" }] });
  const ok = await evaluateCheck({ id: "a", kind: "file", label: "", path: "CLAUDE.md" }, product, { fetch: f, token: "t" });
  assert.equal(ok.ok, true);
  const ko = await evaluateCheck({ id: "b", kind: "file", label: "", path: "docs/SPEC.md" }, product, { fetch: f, token: "t" });
  assert.equal(ko.ok, false);
  assert.match(ko.detail, /introuvable/);
  assert.equal(f.calls[0].init.headers.Authorization, "Bearer t");
});

test("nombre minimal de commits", async () => {
  const f = fakeFetch({ commits: [200, [{}, {}, {}]] });
  assert.equal((await evaluateCheck({ id: "c", kind: "commits", label: "", min: 3 }, product, { fetch: f, token: "" })).ok, true);
  assert.equal((await evaluateCheck({ id: "c", kind: "commits", label: "", min: 5 }, product, { fetch: f, token: "" })).ok, false);
});

test("dépôt vide : message clair", async () => {
  const f = fakeFetch({ commits: [409, { message: "Git Repository is empty." }] });
  const r = await evaluateCheck({ id: "c", kind: "commits", label: "", min: 1 }, product, { fetch: f, token: "" });
  assert.equal(r.ok, false);
  assert.match(r.detail, /vide/);
});

test("seules les pull requests fusionnées comptent", async () => {
  const f = fakeFetch({ pulls: [200, [{ merged_at: "2026-11-20T10:00:00Z" }, { merged_at: null }]] });
  assert.equal((await evaluateCheck({ id: "p", kind: "pullsMerged", label: "", min: 1 }, product, { fetch: f, token: "t" })).ok, true);
  assert.equal((await evaluateCheck({ id: "p", kind: "pullsMerged", label: "", min: 2 }, product, { fetch: f, token: "t" })).ok, false);
});

test("workflow réussi, et permission manquante expliquée", async () => {
  const ok = fakeFetch({ "actions/workflows/deploy.yml/runs": [200, { total_count: 2 }] });
  assert.equal((await evaluateCheck({ id: "w", kind: "workflow", label: "", file: "deploy.yml" }, product, { fetch: ok, token: "t" })).ok, true);
  const denied = fakeFetch({ "actions/runs": [403, {}] });
  const r = await evaluateCheck({ id: "w", kind: "workflow", label: "" }, product, { fetch: denied, token: "t" });
  assert.equal(r.ok, false);
  assert.match(r.detail, /Actions : Read-only/);
});

test("page publiée en ligne", async () => {
  const f = fakeFetch({ "felipe-test.github.io/mon-produit/": [200, undefined] });
  assert.equal((await evaluateCheck({ id: "g", kind: "pages", label: "" }, product, { fetch: f, token: "" })).ok, true);
  assert.equal((await evaluateCheck({ id: "g", kind: "pages", label: "" }, { ...product, repo: "autre" }, { fetch: f, token: "" })).ok, false);
});

test("sans dépôt de produit, rien n'est interrogé", async () => {
  const f = fakeFetch({});
  const r = await evaluateCheck({ id: "a", kind: "file", label: "", path: "README.md" }, { ...product, repo: "" }, { fetch: f, token: "t" });
  assert.equal(r.ok, false);
  assert.equal(f.calls.length, 0);
});

test("un contrôle manuel n'est jamais validé automatiquement", async () => {
  const r = await evaluateCheck({ id: "m", kind: "manual", label: "J'ai montré ma page à quelqu'un" }, product, { fetch: fakeFetch({}), token: "t" });
  assert.equal(r.ok, false);
});

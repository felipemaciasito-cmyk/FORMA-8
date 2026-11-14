// Tests de la fusion sans perte entre appareils (src/lib/merge.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import { canonical, mergeProgress } from "../../src/lib/merge.ts";

const base = () => ({
  version: 1, epoch: "0", name: "", bootedOnce: true, energy: 0,
  counters: {}, steps: {}, lessons: {}, exercises: {}, incidents: {}, notions: {},
  days: [], badges: {}, feynman: {}, skills: [], deletedSkills: {},
  stats: { answers: 0, correct: 0, reviews: 0 }, orientationSeen: [], checks: {}, checksAt: {},
  product: { name: "", pitch: "", owner: "x", repo: "" }, deliveryChecks: {}, deliveries: {}, consignes: {}, reports: {},
});

test("additionne l'énergie gagnée sur deux appareils sans rien perdre", () => {
  const iphone = { ...base(), counters: { iphone: { energy: 120, answers: 4, correct: 3, reviews: 0 } } };
  const ipad = { ...base(), counters: { ipad: { energy: 80, answers: 2, correct: 2, reviews: 1 } } };
  const m = mergeProgress(iphone, ipad);
  assert.equal(m.energy, 200);
  assert.equal(m.stats.answers, 6);
  assert.equal(m.stats.reviews, 1);
});

test("réunit les protocoles terminés et garde la date la plus ancienne", () => {
  const a = { ...base(), steps: { "c00/p1": "2026-11-15" } };
  const b = { ...base(), steps: { "c00/p1": "2026-11-14", "c00/p2": "2026-11-16" } };
  const m = mergeProgress(a, b);
  assert.deepEqual(m.steps, { "c00/p1": "2026-11-14", "c00/p2": "2026-11-16" });
});

test("garde la position la plus avancée dans un protocole en cours", () => {
  const m = mergeProgress({ ...base(), lessons: { "c01/p1": 3 } }, { ...base(), lessons: { "c01/p1": 7 } });
  assert.equal(m.lessons["c01/p1"], 7);
});

test("une réinitialisation (nouvelle époque) l'emporte partout", () => {
  const old = { ...base(), epoch: "0", counters: { iphone: { energy: 500, answers: 0, correct: 0, reviews: 0 } } };
  const reset = { ...base(), epoch: "2026-11-14T10:00:00.000Z" };
  const m = mergeProgress(old, reset);
  assert.equal(m.energy, 0);
  assert.equal(m.epoch, reset.epoch);
});

test("la fusion est symétrique (même résultat dans les deux sens)", () => {
  const a = { ...base(), name: "Alex", nameAt: "2026-11-14T08:00:00Z", badges: { boot: "2026-11-14" }, days: ["2026-11-14"] };
  const b = { ...base(), name: "", badges: { room1: "2026-11-15" }, days: ["2026-11-15"] };
  assert.equal(canonical(mergeProgress(a, b)), canonical(mergeProgress(b, a)));
});

test("livraisons : un contrôle vérifié l'emporte sur un contrôle coché à la main", () => {
  const a = { ...base(), deliveryChecks: { "c00:page": { state: "manual", at: "2026-11-20T08:00:00Z" } }, deliveries: {} };
  const b = { ...base(), deliveryChecks: { "c00:page": { state: "verified", at: "2026-11-21T08:00:00Z" }, "c00:readme": { state: "verified", at: "2026-11-21T08:00:00Z" } }, deliveries: { c00: "2026-11-21" } };
  const m = mergeProgress(a, b);
  assert.equal(m.deliveryChecks["c00:page"].state, "verified");
  assert.ok(m.deliveryChecks["c00:readme"]);
  assert.equal(m.deliveries.c00, "2026-11-21");
});

test("consignes et rapports de bug : la meilleure note est gardée", () => {
  const m = mergeProgress({ ...base(), consignes: { "c03:spec": 72 }, reports: { "c04:bug1": 90 } }, { ...base(), consignes: { "c03:spec": 88 }, reports: { "c04:bug1": 60 } });
  assert.equal(m.consignes["c03:spec"], 88);
  assert.equal(m.reports["c04:bug1"], 90);
});

test("produit : la version la plus récente gagne", () => {
  const old = { name: "Ancien", pitch: "", owner: "x", repo: "a", at: "2026-11-20T08:00:00Z" };
  const neu = { name: "Nouveau", pitch: "", owner: "x", repo: "b", at: "2026-11-22T08:00:00Z" };
  assert.equal(mergeProgress({ ...base(), product: old }, { ...base(), product: neu }).product.repo, "b");
  assert.equal(mergeProgress({ ...base(), product: neu }, { ...base(), product: old }).product.repo, "b");
});

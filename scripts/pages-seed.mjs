// A stored v3 record for the page checks (专项练习 / 错题本 / 最近练得怎么样 / 印到纸上),
// shared by the Taro H5 pages e2e and the WeChat simulator e2e. Same storage key
// and shape the app writes (nsl-v01-state, version 3); nothing here is new state.
//
// One current mistake in every released domain (the first item of each), one
// fraction_fields mistake (ifraction-1-2, listed as 0.5 = an empty bar), one
// recovered mistake (stable, so not in the book), one right answer, and a few
// finished / stopped sets for 最近练得怎么样.
import { DOMAIN_ORDER, loadCoreCatalog } from "../src/core/content.js";

export const PAGES_LEARNER = "e2e-pages";

export function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function pagesSeed(catalog = loadCoreCatalog(), day = localToday()) {
  const attempt = (correct) => ({ correct, day, slow: false, inputMode: "onscreen_keypad", elapsedMs: 2400 });
  const schedule = { due_day: day, bucket: "1d", reason: "wrong" };
  const relations = {};
  const mistakes = [];
  for (const d of DOMAIN_ORDER) {
    const item = catalog.find((i) => i.domain === d);
    relations[item.id] = { status: "learning", attempts: [attempt(false)], schedule };
    mistakes.push(item.id);
  }
  const ff = catalog.find((i) => i.answer_type === "fraction_fields");
  relations[ff.id] = { status: "shaky", attempts: [attempt(true), attempt(false)], schedule };
  mistakes.push(ff.id);
  const recovered = catalog.find((i) => i.domain === "cubes" && !relations[i.id]);
  relations[recovered.id] = { status: "stable", attempts: [attempt(false), attempt(true), attempt(true)], schedule: { due_day: day, bucket: "7d", reason: "stable" } };
  const right = catalog.find((i) => i.domain === "squares" && !relations[i.id]);
  relations[right.id] = { status: "learning", attempts: [attempt(true)], schedule: { due_day: day, bucket: "1d", reason: "first-correct" } };
  const sessions = [
    { id: "s1", mode: "daily", day, completed: true, earlyStop: false, correct: 7, total: 10 },
    { id: "s2", mode: "daily", day, completed: false, earlyStop: true, correct: 2, total: 3 },
  ];
  const root = {
    version: 3,
    active_learner_id: PAGES_LEARNER,
    learners: {
      [PAGES_LEARNER]: {
        profile: { learner_id: PAGES_LEARNER, created_on: day },
        relations,
        sessions,
        activeSession: null,
        prefs: { sound: false },
      },
    },
  };
  // Book order is DOMAIN_ORDER, catalog order inside a group (core's buildMistakeBook).
  const order = new Map(catalog.map((i, n) => [i.id, n]));
  const byDomain = DOMAIN_ORDER.map((d) => ({
    domain: d,
    ids: mistakes.filter((id) => catalog[order.get(id)].domain === d).sort((a, b) => order.get(a) - order.get(b)),
  }));
  return { root, mistakes, groups: byDomain, fractionFields: ff.id, recovered: recovered.id, right: right.id, practiced: Object.keys(relations).length };
}

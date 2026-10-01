// Shared slice logic: math tokens for the MathText component, Home modes,
// and Home → Training → Correct / Wrong on the real core with an in-memory backend.
import assert from "node:assert/strict";
import test from "node:test";
import { mathTokens, mathLabel } from "../app/components/math/tokens.js";
import { createTrainingFlow, CORRECT_PAUSE_MS } from "../app/pages/train/flow.js";
import { homeView } from "../app/pages/home/model.js";
import { createStateStore } from "../src/adapter/storage-contract.js";
import { loadCoreCatalog, getRelationById } from "../src/core/content.js";
import { emptyState } from "../src/core/store.js";

function memoryBackend() {
  const map = new Map();
  return { map, getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, v), removeItem: (k) => map.delete(k) };
}
const catalog = loadCoreCatalog();
const day = "2026-10-01";
function flowWith(backend = memoryBackend()) {
  let t = 1000;
  const flow = createTrainingFlow({ store: createStateStore(backend), catalog, today: () => day, now: () => (t += 1500) });
  return { flow, backend };
}
const wrongFor = (item) => (item.canonical_answer === "1" ? "2" : "1");
const type = (flow, text) => [...text].forEach((d) => flow.input(d));

test("fraction text becomes a fraction token; stored text is unchanged", () => {
  assert.deepEqual(mathTokens("3/4 = ?"), [
    { type: "fraction", numerator: "3", denominator: "4", label: "3/4" },
    { type: "text", text: " = ?" },
  ]);
  assert.equal(mathLabel("1/2 的一半，也可以 1 − 1/4"), "1/2 的一半，也可以 1 − 1/4");
  assert.equal(mathTokens("6 × 12 = 72").length, 1);
});

test("repeating decimal becomes dots over the block, never brackets", () => {
  const [t] = mathTokens("0.(6)");
  assert.deepEqual(t, { type: "repeating", lead: "0.", block: "6", label: "0.6，6 循环" });
  const [, r] = mathTokens("1/3 = 0.(3)");
  assert.equal(r.type, "text");
  assert.equal(mathTokens("1/3 = 0.(3)")[2].block, "3");
});

test("correct pause stays inside the 400–700ms contract", () => {
  assert.ok(CORRECT_PAUSE_MS >= 400 && CORRECT_PAUSE_MS <= 700);
});

test("home modes keep main's copy", () => {
  const fresh = homeView(emptyState(), day);
  assert.equal(fresh.cta, "开始今天的练习");
  assert.equal(fresh.sub, "大约 5～10 分钟");
  const paused = homeView({ ...emptyState(), activeSession: { answered: 3 } }, day);
  assert.equal(paused.cta, "继续刚才的练习");
  assert.equal(paused.secondary.label, "重新开始一小段");
});

test("training: one question, calm k / 10, empty submit is not judged", () => {
  const { flow } = flowWith();
  flow.begin();
  const v = flow.view();
  assert.equal(v.screen, "train");
  assert.equal(`${v.position} / ${v.total}`, "1 / 10");
  assert.equal(flow.submit(), "nudge");
  assert.equal(flow.view().nudge, "先写一个数");
  assert.equal(flow.view().screen, "train");
  assert.equal(flow.state.activeSession.answered, 0);
});

test("correct → short feedback → next question; attempt recorded by core", () => {
  const { flow } = flowWith();
  flow.begin();
  const item = flow.view().item;
  type(flow, item.canonical_answer);
  assert.equal(flow.submit(), "correct");
  assert.equal(flow.view().screen, "correct");
  assert.equal(flow.view().feedback.word, "对");
  assert.equal(flow.submit(), null, "a second submit is ignored");
  assert.equal(flow.input("5"), false, "no typing during feedback");
  flow.advance();
  const next = flow.view();
  assert.equal(next.screen, "train");
  assert.equal(`${next.position} / ${next.total}`, "2 / 10");
  const rel = flow.state.relations[item.id];
  assert.equal(rel.attempts.length, 1);
  assert.equal(rel.attempts[0].correct, true);
  assert.equal(rel.attempts[0].inputMode, "onscreen_keypad");
});

test("wrong → correct relation + hook, no retry, 下一题 goes to a different item", () => {
  const { flow } = flowWith();
  flow.begin();
  const item = flow.view().item;
  type(flow, wrongFor(item));
  assert.equal(flow.submit(), "wrong");
  const v = flow.view();
  assert.equal(v.screen, "wrong");
  assert.equal(v.feedback.relation, getRelationById(item.id, catalog).relation);
  assert.ok(v.feedback.hook);
  assert.equal(flow.input("1"), false, "input locked");
  assert.equal(flow.submit(), null, "no re-answer on this item");
  flow.advance();
  assert.notEqual(flow.view().item.id, item.id);
  assert.equal(flow.state.relations[item.id].attempts[0].correct, false);
  assert.ok(flow.state.activeSession.reappearPlan[item.id] !== undefined, "core plans the later reappearance");
});

test("a full set ends after 10 answers and is stored as completed", () => {
  const { flow, backend } = flowWith();
  flow.begin();
  let guard = 0;
  while (flow.view().screen !== "done" && guard++ < 40) {
    const { item } = flow.view();
    type(flow, item.canonical_answer);
    flow.submit();
    flow.advance();
  }
  const stored = JSON.parse(backend.map.get("nsl-v01-state"));
  assert.equal(stored.activeSession, null);
  assert.equal(stored.lastResult.total, 10);
  assert.equal(stored.lastResult.completed, true);
  assert.equal(homeView(stored, day).mode, "done");
});

test("先停 keeps what was done and ends the set early; resume continues a stored set", () => {
  const backend = memoryBackend();
  const a = flowWith(backend).flow;
  a.begin();
  type(a, a.view().item.canonical_answer);
  a.submit();
  a.advance();
  const pending = a.view().item.id;
  // a fresh page (e.g. the Mini Program was killed) resumes the stored set
  const b = flowWith(backend).flow;
  b.resume();
  assert.equal(b.view().item.id, pending);
  assert.equal(b.view().position, 2);
  b.stop();
  const stored = JSON.parse(backend.map.get("nsl-v01-state"));
  assert.equal(stored.lastResult.earlyStop, true);
  assert.equal(stored.lastResult.total, 1);
});

import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadCoreCatalog,
  getRelationById,
  isEntryUnlocked,
  sharesFamily,
  filterByDomain,
} from "../src/core/content.js";
import { judgeAnswer, parseFraction } from "../src/core/answer.js";
import { feedbackFor } from "../src/core/feedback.js";
import { buildSessionQueue } from "../src/core/schedule.js";
import { startSession, submitAnswer, peekCurrent } from "../src/core/session.js";
import { MASTERY } from "../src/core/mastery.js";
import { emptyLearner } from "../src/core/store.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const catalog = loadCoreCatalog();
const byId = (id) => getRelationById(id, catalog);
const stable = () => ({
  status: MASTERY.STABLE,
  attempts: [
    { correct: true, day: "2026-09-01", slow: false },
    { correct: true, day: "2026-09-02", slow: false },
    { correct: true, day: "2026-09-04", slow: false },
  ],
  schedule: { due_day: "2026-12-01", bucket: "maintenance", reason: "stable-maintenance" },
});

// ---------- metadata ----------

test("new ids follow the frozen v0.2C list and never collide with v0.1", () => {
  const ids = catalog.map((r) => r.id);
  const isq = [6, 7, 8, 9, 10, 15, 20, 11, 12, 13, 14, 16, 25, 17, 18, 19].map((n) => `isquare-${n}`);
  for (const id of isq) assert.ok(ids.includes(id), id);
  for (const id of ["fraction-1-3", "fraction-2-3", "fraction-1-9", "fraction-1-7"]) assert.ok(ids.includes(id), id);
  const ifr = ids.filter((id) => id.startsWith("ifraction-"));
  assert.equal(ifr.length, 27);
  for (const id of ifr) assert.ok(byId(id.slice(1)), `counterpart of ${id}`);
});

test("families[] / direction / entry_after / answer_type are consistent", () => {
  for (const item of catalog) {
    assert.ok(["integer", "decimal", "fraction_fields", "decimal_repeating"].includes(item.answer_type), item.id);
    for (const family of item.families) {
      assert.ok(family.id && family.type, item.id);
      if (family.type === "inverse_pair") {
        const other = byId(family.counterpart);
        assert.ok(other, `${item.id} → ${family.counterpart}`);
        assert.ok(other.families.some((f) => f.id === family.id && f.counterpart === item.id), `mutual ${item.id}`);
        assert.ok(sharesFamily(item, other));
      }
    }
    if (item.direction === "inverse") {
      assert.ok(item.entry_after, `${item.id} has entry_after`);
      const counterpart = byId(item.entry_after);
      assert.equal(counterpart.direction, "forward");
      assert.equal(item.tier, Math.min(counterpart.tier + 1, 3), `${item.id} tier = forward + 1`);
      assert.equal(item.domain, counterpart.domain);
    }
  }
  assert.deepEqual(byId("fraction-1-8").families.map((f) => f.id), ["fr-1-8", "eighths"], "multi-valued");
  assert.equal(byId("isquare-15").entry_after, "square-15");
  assert.equal(byId("isquare-15").answer_type, "integer");
  assert.equal(byId("ifraction-1-8").answer_type, "fraction_fields");
  assert.equal(byId("ifraction-1-8").prompt, "0.125 = ?/?");
  assert.equal(byId("fraction-1-7").answer_type, "decimal_repeating");
  assert.equal(byId("product-12-7").families.length, 0, "old fields default to []");
});

test("Structured Practice 12 stay in the pool, never trainable", () => {
  const km = JSON.parse(readFileSync(join(root, "content/v0.2c/fractions_repeating.knowledge_map.json"), "utf8"));
  const structured = km.entries.filter((e) => e.level === "structured_practice");
  assert.equal(structured.length, 12);
  for (const entry of structured) assert.equal(byId(entry.id), null, entry.id);
});

test("memory hook and frames for new relations are read from content by id", () => {
  const seven = byId("fraction-1-7");
  const fb = feedbackFor(seven, "wrong");
  assert.equal(fb.hook, "142857 是「走马灯数」：记住 142｜857 这一圈。");
  assert.deepEqual(fb.level3.frames.map((f) => f.title), ["1 ÷ 7", "142 | 857", "0.(142857)"]);
  const inv = feedbackFor(byId("isquare-15"), "wrong");
  assert.equal(inv.relation, "15² = 225");
  assert.ok(inv.level3.frames.length >= 2);
  for (const item of catalog.slice(75)) {
    assert.ok(item.hook && item.relation && item.pattern?.check && item.frames?.length >= 2, item.id);
  }
});

test("learner state stores no hook / frames text after a wrong answer", () => {
  const item = byId("fraction-1-3");
  const session = startSession({ mode: "focused", domain: "fraction_decimal", day: "2026-10-01", catalog, relations: {}, seed: 1 });
  const result = submitAnswer({ item, state: emptyLearner(), session, raw: "6", meta: { day: "2026-10-01", inputMode: "onscreen_keypad", elapsedMs: 900 } });
  const text = JSON.stringify(result.state);
  assert.equal(text.includes(item.hook), false);
  assert.equal(text.includes("frames"), false);
  assert.equal(result.feedback.hook, item.hook);
});

// ---------- entry_after ----------

test("entry_after: inverse locked before the forward relation is stable", () => {
  assert.equal(isEntryUnlocked(byId("isquare-15"), {}), false);
  assert.equal(isEntryUnlocked(byId("isquare-15"), { "square-15": { status: MASTERY.LEARNING, attempts: [{ correct: true, day: "2026-09-01" }] } }), false);
  const queue = buildSessionQueue(filterByDomain("squares", catalog), {}, { size: 32, day: "2026-10-01", interleave: false, seed: 1 });
  assert.equal(queue.some((id) => id.startsWith("isquare-")), false);
  const daily = startSession({ mode: "daily", day: "2026-10-01", catalog, relations: {}, size: 40, seed: 2 });
  assert.equal(daily.queue.some((id) => id.startsWith("isquare-") || id.startsWith("ifraction-")), false);
});

test("entry_after: unlocks once the forward relation is stable", () => {
  const relations = { "square-15": stable() };
  assert.equal(isEntryUnlocked(byId("isquare-15"), relations), true);
  const queue = buildSessionQueue(filterByDomain("squares", catalog), relations, { size: 32, day: "2026-10-01", interleave: false, seed: 1 });
  assert.ok(queue.includes("isquare-15"));
  assert.equal(queue.includes("isquare-12"), false);
});

test("entry_after: once attempted, the inverse stays available when forward turns shaky", () => {
  const relations = {
    "square-15": { status: MASTERY.SHAKY, attempts: [...stable().attempts, { correct: false, day: "2026-09-30" }], schedule: { due_day: "2026-09-30", bucket: "1d", reason: "stable-wrong" } },
    "isquare-15": { status: MASTERY.LEARNING, attempts: [{ correct: false, day: "2026-09-29" }], schedule: { due_day: "2026-09-30", bucket: "1d", reason: "wrong" } },
  };
  assert.equal(isEntryUnlocked(byId("isquare-15"), relations), true);
  const queue = buildSessionQueue(filterByDomain("squares", catalog), relations, { size: 10, day: "2026-10-01", interleave: false, seed: 1 });
  assert.ok(queue.includes("isquare-15"), "not hidden");
  assert.equal(relations["isquare-15"].attempts.length, 1, "not reset");
});

// ---------- fraction input ----------

const half = byId("ifraction-1-2");
const eighth = byId("ifraction-1-8");

test("fraction judging: 1/8 correct, 2/4 needs_simplification, 3/5 incorrect", () => {
  assert.equal(judgeAnswer(eighth, "1/8").kind, "correct");
  assert.equal(judgeAnswer(eighth, "1/8").outcome, "correct");
  assert.equal(judgeAnswer(half, "1/2").outcome, "correct");
  const two = judgeAnswer(half, "2/4");
  assert.equal(two.kind, "needs_simplification");
  assert.equal(two.outcome, "needs_simplification");
  assert.equal(feedbackFor(half, two.kind, two).message, "2/4 和 1/2 一样大，再约到最简：1/2。");
  assert.equal(judgeAnswer(half, "50/100").kind, "needs_simplification");
  assert.equal(judgeAnswer(half, "3/5").outcome, "incorrect");
  assert.equal(judgeAnswer(half, "3/5").kind, "wrong");
});

test("malformed fractions never form an attempt and say 先写一个分数", () => {
  for (const raw of ["", "  ", "/", "1/", "/8", "1/0", "0/8", "1/2/3", "12", "1.5/2", "1//2"]) {
    const judged = judgeAnswer(eighth, raw);
    assert.ok(["empty", "invalid"].includes(judged.kind), `${raw} → ${judged.kind}`);
    const fb = feedbackFor(eighth, judged.kind, judged);
    assert.equal(fb.record, false);
    assert.equal(fb.message, "先写一个分数");
  }
  assert.equal(parseFraction("08/16").text, "8/16");
});

test("needs_simplification: no attempt, no mastery, no schedule, stays on the item", () => {
  const relations = { "fraction-1-2": stable() };
  const state = { ...emptyLearner(), relations };
  let session = startSession({ mode: "focused", domain: "fraction_decimal", day: "2026-10-01", catalog, relations, seed: 4 });
  // put the inverse at the head for this check
  session = { ...session, queue: ["ifraction-1-2", ...session.queue.filter((id) => id !== "ifraction-1-2")] };
  const peeked = peekCurrent(session, catalog);
  assert.equal(peeked.item.id, "ifraction-1-2");
  const meta = { day: "2026-10-01", inputMode: "onscreen_keypad", elapsedMs: 900 };
  const first = submitAnswer({ item: peeked.item, state, session: peeked.session, raw: "2/4", meta });
  assert.equal(first.judged.kind, "needs_simplification");
  assert.equal(first.feedback.record, false);
  assert.equal(first.state, state, "state untouched");
  assert.equal(first.session, peeked.session, "session untouched: same item, cursor unchanged");
  assert.equal(first.state.relations["ifraction-1-2"], undefined, "no attempt, no schedule");
  assert.equal(peekCurrent(first.session, catalog).item.id, "ifraction-1-2");
  const second = submitAnswer({ item: peeked.item, state: first.state, session: first.session, raw: "1/2", meta });
  assert.equal(second.judged.kind, "correct");
  assert.equal(second.state.relations["ifraction-1-2"].attempts.length, 1);
  assert.equal(second.state.relations["ifraction-1-2"].attempts[0].correct, true);
  assert.equal(second.session.answered, 1);
});

test("an incorrect fraction is an ordinary wrong with mistake evidence", () => {
  const relations = { "fraction-1-2": stable() };
  const session = startSession({ mode: "focused", domain: "fraction_decimal", day: "2026-10-01", catalog, relations, seed: 4 });
  const result = submitAnswer({ item: half, state: { ...emptyLearner(), relations }, session, raw: "3/5", meta: { day: "2026-10-01", inputMode: "onscreen_keypad", elapsedMs: 900 } });
  assert.equal(result.feedback.record, true);
  assert.equal(result.state.relations["ifraction-1-2"].attempts[0].correct, false);
  assert.equal(result.state.relations["ifraction-1-2"].schedule.reason, "wrong");
  assert.equal(result.feedback.relation, "0.5 = 1/2");
});

// ---------- repeating decimals ----------

test("repeating block input: 3 for 1/3, 6 for 2/3, 1 for 1/9, 142857 for 1/7", () => {
  assert.equal(judgeAnswer(byId("fraction-1-3"), "3").kind, "correct");
  assert.equal(judgeAnswer(byId("fraction-1-3"), "3").normalized, "0.(3)");
  assert.equal(judgeAnswer(byId("fraction-2-3"), "6").kind, "correct");
  assert.equal(judgeAnswer(byId("fraction-1-9"), "1").kind, "correct");
  const seven = judgeAnswer(byId("fraction-1-7"), "142857");
  assert.equal(seven.kind, "correct");
  assert.equal(seven.normalized, "0.(142857)");
});

test("wrong cycle is an ordinary incorrect; empty cycle is not an attempt", () => {
  const seven = byId("fraction-1-7");
  assert.equal(judgeAnswer(seven, "142587").outcome, "incorrect");
  assert.equal(judgeAnswer(seven, "285714").outcome, "incorrect", "2/7's block");
  assert.equal(judgeAnswer(seven, "142857142857").outcome, "incorrect", "no second pass");
  assert.equal(judgeAnswer(byId("fraction-1-3"), "33").outcome, "incorrect");
  const empty = judgeAnswer(seven, "");
  assert.equal(empty.kind, "empty");
  assert.equal(feedbackFor(seven, empty.kind).record, false);
  const session = startSession({ mode: "focused", domain: "fraction_decimal", day: "2026-10-01", catalog, relations: {}, seed: 1 });
  const state = emptyLearner();
  const result = submitAnswer({ item: seven, state, session, raw: "", meta: { day: "2026-10-01", inputMode: "onscreen_keypad", elapsedMs: 10 } });
  assert.equal(result.state, state);
  assert.equal(result.feedback.message, "先写一个数");
});

test("integer and plain decimal keyboards are unchanged; decimal → fraction uses the two fraction boxes", () => {
  assert.equal(byId("square-15").needsDecimalPoint, false);
  assert.equal(byId("square-15").fractionFields, false);
  assert.equal(byId("fraction-1-8").needsDecimalPoint, true);
  assert.equal(byId("fraction-1-8").fractionFields, false);
  assert.equal(byId("ifraction-1-8").fractionFields, true);
  assert.equal(byId("ifraction-1-8").needsDecimalPoint, false);
  assert.equal(byId("fraction-1-7").needsDecimalPoint, false);
  assert.equal(byId("fraction-1-7").fractionFields, false);
  assert.equal(byId("fraction-1-7").repeatingBlock, true);
  assert.equal(byId("isquare-15").integerOnly, true);
});

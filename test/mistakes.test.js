import assert from "node:assert/strict";
import test from "node:test";
import {
  isHistoricalMistake,
  isCurrentMistake,
  isRecoveredMistake,
  listCurrentMistakeIds,
  buildMistakeBook,
} from "../src/core/mistakes.js";
import { buildMistakeQueue, dueNow, listUnstableIds } from "../src/core/schedule.js";
import { buildA4Sheet, defaultPrintSelection } from "../src/core/a4.js";
import { loadCoreCatalog, getRelationById } from "../src/core/content.js";
import { startSession, submitAnswer, peekCurrent } from "../src/core/session.js";
import { MASTERY, studentLabel } from "../src/core/mastery.js";
import { emptyLearner } from "../src/core/store.js";

const catalog = loadCoreCatalog();

function answerOnce(state, id, raw, day, mode = "focused") {
  const item = getRelationById(id, catalog);
  const session = startSession({ mode, domain: item.domain, day, size: 1, catalog, relations: state.relations, seed: 1 });
  return submitAnswer({
    item,
    state,
    session,
    raw,
    meta: { day, inputMode: "onscreen_keypad", elapsedMs: 800 },
  }).state;
}

test("a wrong answer makes a current mistake", () => {
  const state = answerOnce(emptyLearner(), "square-17", "1", "2026-10-01");
  const rel = state.relations["square-17"];
  assert.equal(isHistoricalMistake(rel), true);
  assert.equal(isCurrentMistake(rel), true);
  assert.deepEqual(listCurrentMistakeIds(catalog, state.relations), ["square-17"]);
});

test("only-correct learning is not a mistake; unpracticed is not a mistake", () => {
  const state = answerOnce(emptyLearner(), "square-17", "289", "2026-10-01");
  assert.equal(state.relations["square-17"].status, MASTERY.LEARNING);
  assert.equal(isCurrentMistake(state.relations["square-17"]), false);
  assert.equal(isCurrentMistake(undefined), false);
  assert.deepEqual(listCurrentMistakeIds(catalog, state.relations), []);
  // still unstable for scheduling (mastery unchanged by the print change)
  assert.deepEqual(listUnstableIds(catalog, state.relations), ["square-17"]);
});

test("recovered stable leaves the current list; stable then wrong returns", () => {
  let state = emptyLearner();
  state = answerOnce(state, "square-15", "1", "2026-10-01");
  assert.equal(isCurrentMistake(state.relations["square-15"]), true);
  for (const day of ["2026-10-02", "2026-10-03", "2026-10-05"]) {
    state = answerOnce(state, "square-15", "225", day);
  }
  const rel = state.relations["square-15"];
  assert.equal(rel.status, MASTERY.STABLE);
  assert.equal(isCurrentMistake(rel), false);
  assert.equal(isRecoveredMistake(rel), true, "history remembers the old mistake");
  assert.deepEqual(listCurrentMistakeIds(catalog, state.relations), []);
  state = answerOnce(state, "square-15", "226", "2026-10-12");
  assert.equal(state.relations["square-15"].status, MASTERY.SHAKY);
  assert.deepEqual(listCurrentMistakeIds(catalog, state.relations), ["square-15"]);
});

test("needs_simplification and empty submits never create mistake evidence", () => {
  let state = emptyLearner();
  state.relations["fraction-1-2"] = {
    status: MASTERY.STABLE,
    attempts: [
      { correct: true, day: "2026-09-01", slow: false },
      { correct: true, day: "2026-09-02", slow: false },
      { correct: true, day: "2026-09-03", slow: false },
    ],
    schedule: { due_day: "2026-09-08", bucket: "5-7d", reason: "became-stable" },
  };
  const before = JSON.stringify(state);
  state = answerOnce(state, "ifraction-1-2", "2/4", "2026-10-01");
  state = answerOnce(state, "ifraction-1-2", "", "2026-10-01");
  assert.equal(JSON.stringify(state), before);
  assert.deepEqual(listCurrentMistakeIds(catalog, state.relations), []);
});

test("mistake book view: grouped by domain, catalog order, no counts or due days", () => {
  const relations = {
    "fraction-1-8": { status: MASTERY.SHAKY, attempts: [{ correct: false, day: "2026-09-27" }], schedule: { due_day: "2026-09-27", bucket: "1d", reason: "stable-wrong" } },
    "square-17": { status: MASTERY.LEARNING, attempts: [{ correct: false, day: "2026-09-28" }], schedule: { due_day: "2026-09-29", bucket: "1d", reason: "wrong" } },
    "square-6": { status: MASTERY.LEARNING, attempts: [{ correct: false, day: "2026-09-28" }] },
    "square-7": { status: MASTERY.LEARNING, attempts: [{ correct: true, day: "2026-09-28" }] },
  };
  const book = buildMistakeBook(catalog, relations, studentLabel);
  assert.equal(book.empty, false);
  assert.deepEqual(book.groups.map((g) => g.domain), ["squares", "fraction_decimal"]);
  assert.deepEqual(book.groups[0].items.map((i) => i.id), ["square-6", "square-17"]);
  assert.deepEqual(book.groups[1].items.map((i) => i.label), ["再巩固一下"]);
  const text = JSON.stringify(book);
  for (const banned of ["due_day", "attempts", "动摇", "错了", "次"]) {
    assert.equal(text.includes(banned), false, banned);
  }
  const empty = buildMistakeBook(catalog, {}, studentLabel);
  assert.equal(empty.empty, true);
  assert.equal(empty.emptyMessage, "现在没有要再写的错题。");
});

function mistakeFixture() {
  return {
    // due (overdue / today)
    "square-17": { status: MASTERY.SHAKY, attempts: [{ correct: false, day: "2026-10-01" }], schedule: { due_day: "2026-10-01", bucket: "1d", reason: "stable-wrong" } },
    "product-12-7": { status: MASTERY.LEARNING, attempts: [{ correct: false, day: "2026-09-30" }], schedule: { due_day: "2026-10-01", bucket: "1d", reason: "wrong" } },
    "fraction-3-8": { status: MASTERY.LEARNING, attempts: [{ correct: false, day: "2026-09-29" }, { correct: true, day: "2026-09-30" }], schedule: { due_day: "2026-10-01", bucket: "1d", reason: "correct-new-day" } },
    // not yet due
    "square-13": { status: MASTERY.LEARNING, attempts: [{ correct: false, day: "2026-09-29" }, { correct: true, day: "2026-09-30" }], schedule: { due_day: "2026-10-03", bucket: "2-3d", reason: "correct-new-day" } },
    "product-15-8": { status: MASTERY.LEARNING, attempts: [{ correct: false, day: "2026-10-01" }, { correct: true, day: "2026-10-01" }], schedule: { due_day: "2026-10-02", bucket: "1d", reason: "correct-after-wrong" } },
    // excluded: recovered stable, only-correct learning, unpracticed
    "square-12": { status: MASTERY.STABLE, attempts: [{ correct: false, day: "2026-09-01" }, { correct: true, day: "2026-09-02" }, { correct: true, day: "2026-09-03" }, { correct: true, day: "2026-09-05" }], schedule: { due_day: "2026-09-30", bucket: "5-7d", reason: "became-stable" } },
    "square-6": { status: MASTERY.LEARNING, attempts: [{ correct: true, day: "2026-09-30" }], schedule: { due_day: "2026-10-01", bucket: "1d", reason: "first-correct" } },
  };
}

test("mistake practice: due before not-due, no unpracticed, no recovered stable", () => {
  const relations = mistakeFixture();
  for (const seed of [1, 2, 3, 42, "x"]) {
    const { ids, dueCount } = buildMistakeQueue(catalog, relations, { day: "2026-10-01", seed });
    assert.equal(ids.length, 5);
    assert.equal(dueCount, 3);
    assert.deepEqual(new Set(ids.slice(0, 3)), new Set(["square-17", "product-12-7", "fraction-3-8"]));
    assert.deepEqual(new Set(ids.slice(3)), new Set(["square-13", "product-15-8"]));
    for (const id of ids.slice(0, 3)) assert.equal(dueNow(relations[id], "2026-10-01"), true);
    assert.equal(ids.includes("square-12"), false);
    assert.equal(ids.includes("square-6"), false);
  }
});

test("mistake practice can start when every current mistake is not yet due", () => {
  const relations = {
    "square-13": mistakeFixture()["square-13"],
  };
  const session = startSession({ mode: "mistake_book", day: "2026-10-01", catalog, relations, seed: 3 });
  assert.deepEqual(session.queue, ["square-13"]);
  assert.equal(session.targetCount, 1);
  assert.equal(session.source, "mistake_book");
  assert.equal(session.finished, false);
  const none = startSession({ mode: "mistake_book", day: "2026-10-01", catalog, relations: {}, seed: 3 });
  assert.deepEqual(none.queue, [], "no stable fallback");
  assert.equal(none.finished, true);
});

test("daily and focused still never pull a not-yet-due mistake", () => {
  const relations = mistakeFixture();
  const daily = startSession({ mode: "daily", day: "2026-10-01", catalog, relations, seed: 9 });
  assert.equal(daily.queue.includes("square-13"), false);
  assert.equal(daily.queue.includes("product-15-8"), false);
  const focused = startSession({ mode: "focused", domain: "squares", day: "2026-10-01", catalog, relations, seed: 9 });
  assert.equal(focused.queue.includes("square-13"), false);
});

test("early correct in mistake practice keeps the future due_day and bucket", () => {
  const relations = { "square-13": mistakeFixture()["square-13"] };
  const state = { ...emptyLearner(), relations };
  const session = startSession({ mode: "mistake_book", day: "2026-10-01", catalog, relations, seed: 1 });
  const peeked = peekCurrent(session, catalog);
  const result = submitAnswer({ item: peeked.item, state, session: peeked.session, raw: "169", meta: { day: "2026-10-01", inputMode: "onscreen_keypad", elapsedMs: 900 } });
  const rel = result.state.relations["square-13"];
  assert.equal(rel.schedule.due_day, "2026-10-03");
  assert.equal(rel.schedule.bucket, "2-3d");
  assert.equal(rel.attempts.length, 3);
});

test("early wrong in mistake practice reschedules with the existing wrong rule", () => {
  const relations = { "square-13": mistakeFixture()["square-13"] };
  const state = { ...emptyLearner(), relations };
  const session = startSession({ mode: "mistake_book", day: "2026-10-01", catalog, relations, seed: 1 });
  const peeked = peekCurrent(session, catalog);
  const result = submitAnswer({ item: peeked.item, state, session: peeked.session, raw: "1", meta: { day: "2026-10-01", inputMode: "onscreen_keypad", elapsedMs: 900 } });
  assert.deepEqual(result.state.relations["square-13"].schedule, { due_day: "2026-10-02", bucket: "1d", reason: "wrong" });
  // in-session delayed reappear still applies (after 2 items, max once)
  assert.ok(result.session.reappearPlan["square-13"] >= result.session.answered + 2);
  assert.equal(result.session.reappearCount["square-13"], 1);
});

test("mistake practice keeps wrong → reappear after 2 items → max once", () => {
  const relations = mistakeFixture();
  let state = { ...emptyLearner(), relations };
  let session = startSession({ mode: "mistake_book", day: "2026-10-01", catalog, relations, seed: 5 });
  const seen = [];
  let wrongId = null;
  while (true) {
    const peeked = peekCurrent(session, catalog);
    session = peeked.session;
    if (!peeked.item) break;
    seen.push(peeked.item.id);
    const wrong = seen.length === 1;
    if (wrong) wrongId = peeked.item.id;
    const raw = wrong ? "7" : peeked.item.canonical_answer;
    const result = submitAnswer({ item: peeked.item, state, session, raw, meta: { day: "2026-10-01", inputMode: "onscreen_keypad", elapsedMs: 900 } });
    state = result.state;
    session = result.session;
    if (session.answered >= session.targetCount) break;
  }
  const again = seen.indexOf(wrongId, 1);
  assert.ok(again >= 3, "reappears only after at least 2 other items");
  assert.equal(seen.slice(1, again).includes(wrongId), false);
  assert.equal(seen.filter((id) => id === wrongId).length, 2, "max once more");
});

test("mistake print: 印这些题 defaults to current mistakes through the shared selector", () => {
  const relations = mistakeFixture();
  const selected = defaultPrintSelection(catalog, relations);
  assert.deepEqual(selected, listCurrentMistakeIds(catalog, relations));
  const sheet = buildA4Sheet(catalog, relations, { selectedIds: selected, day: "10月1日" });
  assert.deepEqual(sheet.prompts.map((p) => p.id), selected);
  assert.equal(sheet.prompts.some((p) => p.id === "square-12"), false, "no recovered by default");
  assert.equal(sheet.prompts.some((p) => p.id === "square-6"), false, "only-correct not by default");
  assert.equal(sheet.prompts.every((p) => !("answer" in p)), true, "answers on another page");
  assert.equal(sheet.subtitle, "选出要印的题。纸上没有答案。");
  assert.equal(`${sheet.title}${sheet.domain}`.includes("错题"), false, "paper never says 错题");
  // the student can still add a practiced non-mistake by hand
  const more = buildA4Sheet(catalog, relations, { selectedIds: [...selected, "square-6"] });
  assert.ok(more.prompts.some((p) => p.id === "square-6"));
  assert.equal(buildA4Sheet(catalog, {}, { selectedIds: defaultPrintSelection(catalog, {}) }).empty, true);
});

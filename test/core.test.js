import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { judgeAnswer } from "../src/core/answer.js";
import { square15 } from "../src/core/content.js";
import { feedbackFor } from "../src/core/feedback.js";
import { applyAttempt, emptyRelation, studentLabel } from "../src/core/mastery.js";
import { createMemoryStore, emptyState } from "../src/core/memory-store.js";
import { finishSession, submitAnswer } from "../src/core/session.js";

const day = "2026-09-28";

test("empty input is not a wrong answer", () => {
  const judged = judgeAnswer(square15, "  ");
  const feedback = feedbackFor(square15, judged.kind);
  assert.equal(judged.kind, "empty");
  assert.equal(feedback.message, "先写一个数");
  assert.equal(feedback.record, false);
});

test("15 squared accepts 225 and an equivalent integer spelling", () => {
  assert.equal(judgeAnswer(square15, "225").kind, "correct");
  assert.equal(judgeAnswer(square15, "0225").kind, "correct");
  assert.equal(judgeAnswer(square15, "215").kind, "wrong");
});

test("wrong feedback gives the memory hook and not a definition", () => {
  const feedback = feedbackFor(square15, "wrong");
  assert.equal(feedback.relation, "15² = 225");
  assert.equal(feedback.hook, "1 × 2 = 2，后面接 25。");
  assert.equal(feedback.pattern.family[1], "35² = 1225");
  assert.equal(feedback.frames.length, 4);
  assert.equal(JSON.stringify(feedback).includes("平方就是"), false);
  assert.equal(JSON.stringify(feedback).includes("你错了"), false);
});

test("one correct answer does not become stable", () => {
  const result = submitAnswer({
    item: square15,
    state: emptyState(),
    raw: "225",
    meta: { day, inputMode: "keypad", elapsedMs: 1400, slow: false },
  });
  assert.equal(result.state.relations["square-15"].status, "学习中");
  assert.equal(result.label, "正在熟悉");
  assert.equal(result.feedback.word, "对");
});

test("a slow correct does not demote a stable relation", () => {
  const stable = applyAttempt(emptyRelation(), {
    correct: true,
    day: "2026-09-26",
    slow: false,
    inputMode: "keypad",
    elapsedMs: 800,
  });
  const again = applyAttempt(stable, {
    correct: true,
    day: "2026-09-27",
    slow: false,
    inputMode: "keypad",
    elapsedMs: 700,
  });
  const ready = applyAttempt(again, {
    correct: true,
    day: "2026-09-28",
    slow: false,
    inputMode: "keypad",
    elapsedMs: 700,
  });
  assert.equal(ready.status, "稳定");
  const slow = applyAttempt(ready, {
    correct: true,
    day: "2026-09-29",
    slow: true,
    inputMode: "keypad",
    elapsedMs: 9000,
  });
  assert.equal(slow.status, "稳定");
  const missed = applyAttempt(slow, {
    correct: false,
    day: "2026-09-30",
    slow: false,
    inputMode: "keypad",
    elapsedMs: 1000,
  });
  assert.equal(missed.status, "动摇");
  assert.equal(studentLabel(missed.status), "再巩固一下");
  assert.equal(studentLabel(missed.status).includes("动摇"), false);
});

test("same-day repeats do not count as stable", () => {
  let relation = emptyRelation();
  for (let i = 0; i < 3; i += 1) {
    relation = applyAttempt(relation, {
      correct: true,
      day,
      slow: false,
      inputMode: "keyboard",
      elapsedMs: 500,
    });
  }
  assert.equal(relation.status, "学习中");
});

test("memory store round-trips a finished session without a browser", () => {
  const first = submitAnswer({
    item: square15,
    state: emptyState(),
    raw: "215",
    meta: { day, inputMode: "keypad", elapsedMs: 900, slow: false },
  });
  const saved = finishSession(first.state, { day, correct: 0, total: 1, completed: true });
  const store = createMemoryStore();
  store.write(saved);
  assert.equal(store.read().relations["square-15"].status, "学习中");
  assert.equal(store.read().sessions[0].total, 1);
});

test("core sources do not call platform APIs", () => {
  const banned = ["localStorage", "sessionStorage", "document.", "window.", "wx.", "tt.", "my."];
  const files = readdirSync(new URL("../src/core/", import.meta.url));
  for (const file of files) {
    const source = readFileSync(new URL(`../src/core/${file}`, import.meta.url), "utf8");
    for (const token of banned) assert.equal(source.includes(token), false, `${file} contains ${token}`);
  }
});

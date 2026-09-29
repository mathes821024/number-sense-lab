import assert from "node:assert/strict";
import test from "node:test";
import {
  applyAttempt,
  emptyRelation,
  studentLabel,
  isSlowAttempt,
  MASTERY,
} from "../src/core/mastery.js";

test("student labels never expose 动摇", () => {
  for (const status of Object.values(MASTERY)) {
    const label = studentLabel(status);
    assert.equal(label.includes("动摇"), false);
  }
  assert.equal(studentLabel(MASTERY.SHAKY), "再巩固一下");
  assert.equal(studentLabel(MASTERY.UNPRACTICED), "还没练到");
  assert.equal(studentLabel(MASTERY.LEARNING), "正在熟悉");
  assert.equal(studentLabel(MASTERY.STABLE), "已经很稳");
});

test("one correct answer does not become stable", () => {
  const next = applyAttempt(emptyRelation(), {
    correct: true,
    day: "2026-09-28",
    slow: false,
    inputMode: "onscreen_keypad",
    elapsedMs: 900,
  });
  assert.equal(next.status, MASTERY.LEARNING);
});

test("stable requires multi-day non-slow corrects", () => {
  let rel = emptyRelation();
  for (const day of ["2026-09-26", "2026-09-26", "2026-09-26"]) {
    rel = applyAttempt(rel, {
      correct: true,
      day,
      slow: false,
      inputMode: "physical_keyboard",
      elapsedMs: 700,
    });
  }
  assert.equal(rel.status, MASTERY.LEARNING);

  rel = emptyRelation();
  for (const day of ["2026-09-26", "2026-09-27", "2026-09-28"]) {
    rel = applyAttempt(rel, {
      correct: true,
      day,
      slow: false,
      inputMode: "physical_keyboard",
      elapsedMs: 700,
    });
  }
  assert.equal(rel.status, MASTERY.STABLE);
});

test("slow-but-correct alone cannot demote stable", () => {
  let rel = emptyRelation();
  for (const day of ["2026-09-26", "2026-09-27", "2026-09-28"]) {
    rel = applyAttempt(rel, {
      correct: true,
      day,
      slow: false,
      inputMode: "onscreen_keypad",
      elapsedMs: 800,
    });
  }
  assert.equal(rel.status, MASTERY.STABLE);
  rel = applyAttempt(rel, {
    correct: true,
    day: "2026-09-29",
    slow: true,
    inputMode: "onscreen_keypad",
    elapsedMs: 12000,
  });
  assert.equal(rel.status, MASTERY.STABLE);
});

test("wrong demotes stable to shaky", () => {
  let rel = {
    status: MASTERY.STABLE,
    attempts: [],
  };
  rel = applyAttempt(rel, {
    correct: false,
    day: "2026-09-29",
    slow: false,
    inputMode: "physical_keyboard",
    elapsedMs: 900,
  });
  assert.equal(rel.status, MASTERY.SHAKY);
  assert.equal(studentLabel(rel.status), "再巩固一下");
});

test("slow detection does not compare across input modes", () => {
  const prior = [
    { correct: true, inputMode: "physical_keyboard", elapsedMs: 600, mixedInput: false },
    { correct: true, inputMode: "physical_keyboard", elapsedMs: 700, mixedInput: false },
    { correct: true, inputMode: "physical_keyboard", elapsedMs: 650, mixedInput: false },
  ];
  assert.equal(
    isSlowAttempt(prior, {
      elapsedMs: 5000,
      inputMode: "onscreen_keypad",
      mixedInput: false,
    }),
    false,
  );
  assert.equal(
    isSlowAttempt(prior, {
      elapsedMs: 5000,
      inputMode: "physical_keyboard",
      mixedInput: false,
    }),
    true,
  );
  assert.equal(
    isSlowAttempt(prior, {
      elapsedMs: 5000,
      inputMode: "physical_keyboard",
      mixedInput: true,
    }),
    false,
  );
});

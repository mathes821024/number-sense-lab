import assert from "node:assert/strict";
import test from "node:test";

import { generateExercise } from "../src/core/grade7-rational-generator.js";
import { V2_REQUIRED_TEMPLATES } from "../src/core/grade7-rational-generator-v2.js";
import { SKILL_IDS } from "../src/core/skill-catalog.js";
import {
  finishSkillSession,
  peekSkillExercise,
  startSkillSession,
  submitSkillAnswer,
} from "../src/core/skill-session.js";
import { emptyLearner } from "../src/core/store.js";

const BANDS = ["foundation", "standard", "transfer"];

function assertCanonical(text) {
  assert.match(text, /^-?\d+(?:\/\d+)?$/);
  if (text.includes("/")) {
    const [n, d] = text.split("/").map(Number);
    assert.ok(d > 0);
    assert.notEqual(d, 0);
  }
}

function hasZeroDivisor(operands) {
  const values = [];
  const walk = (node) => {
    if (!node || typeof node !== "object") return;
    if (typeof node.numerator === "number" && typeof node.denominator === "number") {
      values.push(node);
    }
    for (const value of Object.values(node)) walk(value);
  };
  walk(operands);
  if (operands.operator === "divide" && operands.right) {
    return operands.right.numerator === 0;
  }
  if (operands.kind === "mul_div_chain" || operands.kind === "mixed_four") {
    const divisor = operands.right || operands.d;
    return divisor && divisor.numerator === 0;
  }
  return false;
}

test("v2 differs from v1 checksum payload and stamps generator_version 2", () => {
  const v1 = generateExercise({ skillId: "g7-integer-add-sub", band: "foundation", seed: "cmp", index: 0, generatorVersion: 1 });
  const v2 = generateExercise({ skillId: "g7-integer-add-sub", band: "foundation", seed: "cmp", index: 0, generatorVersion: 2 });
  assert.equal(v2.generator_version, 2);
  assert.ok(v2.operands.template);
  assert.notEqual(v1.id, v2.id);
});

test("v2 required templates appear in first 240 coordinates per skill-band", () => {
  for (const skillId of SKILL_IDS) {
    for (const band of BANDS) {
      const required = V2_REQUIRED_TEMPLATES[skillId][band];
      const seen = new Set();
      for (let index = 0; index < 240; index += 1) {
        const exercise = generateExercise({
          skillId,
          band,
          seed: "v2-coverage",
          index,
          generatorVersion: 2,
        });
        seen.add(exercise.operands.template);
      }
      for (const tag of required) {
        assert.ok(seen.has(tag), `${skillId}:${band} missing template ${tag}; saw ${[...seen]}`);
      }
    }
  }
});

test("v2 invariants over 1000 exercises per skill-band", () => {
  for (const skillId of SKILL_IDS) {
    for (const band of BANDS) {
      const ids = new Set();
      for (let index = 0; index < 1000; index += 1) {
        const exercise = generateExercise({
          skillId,
          band,
          seed: "v2-invariant",
          index,
          generatorVersion: 2,
        });
        assertCanonical(exercise.canonical_answer);
        assert.equal(hasZeroDivisor(exercise.operands), false);
        assert.ok(exercise.explanations.direct.available);
        assert.ok(exercise.explanations.structure.available);
        assert.ok(exercise.explanations.estimate.available);
        assert.equal(exercise.generator_version, 2);
        assert.ok(exercise.operands.template);
        assert.equal(ids.has(exercise.id), false);
        ids.add(exercise.id);

        if (index >= 9) {
          // rolling window uniqueness of prompt+answer for last 10
          const window = [];
          for (let back = 0; back < 10; back += 1) {
            const prior = generateExercise({
              skillId,
              band,
              seed: "v2-invariant",
              index: index - back,
              generatorVersion: 2,
            });
            window.push(`${prior.prompt}|${prior.canonical_answer}|${prior.id}`);
          }
          assert.equal(new Set(window).size, 10);
        }
      }
    }
  }
});

test("v2 session persistence restores pending wrong reappearance with same exercise_id", () => {
  let state = emptyLearner();
  let session = startSkillSession({
    skillId: "g7-fraction-mul-div",
    band: "standard",
    day: "2026-10-12",
    seed: "persist-v2",
    size: 6,
  });
  assert.ok(session.coordinates.every((c) => c.generator_version === 2));

  const first = peekSkillExercise(session);
  session = first.session;
  const wrongId = first.exercise.id;
  let result = submitSkillAnswer({
    state,
    session,
    raw: "0",
    meta: { day: "2026-10-12", inputMode: "onscreen_keypad", mixedInput: false, elapsedMs: 20 },
  });
  state = result.state;
  session = result.session;

  const serialized = JSON.parse(JSON.stringify(session));
  let restored = serialized;
  // WRONG_REAPPEAR_GAP = 2 → due when answered reaches 3. Answer two more, then peek.
  for (let i = 0; i < 2; i += 1) {
    const peeked = peekSkillExercise(restored);
    restored = peeked.session;
    result = submitSkillAnswer({
      state,
      session: restored,
      raw: peeked.exercise.canonical_answer,
      meta: { day: "2026-10-12", inputMode: "onscreen_keypad", mixedInput: false, elapsedMs: 15 },
    });
    state = result.state;
    restored = result.session;
  }
  const again = peekSkillExercise(restored);
  assert.equal(again.exercise.id, wrongId);
  assert.equal(again.exercise.generator_version, 2);
});

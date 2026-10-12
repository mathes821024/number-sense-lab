import assert from "node:assert/strict";
import test from "node:test";

import { generateExercise } from "../src/core/grade7-rational-generator.js";
import { SKILL_IDS, skillCatalog } from "../src/core/skill-catalog.js";

const BANDS = ["foundation", "standard", "transfer"];

function gcd(left, right) {
  let a = left < 0n ? -left : left;
  let b = right < 0n ? -right : right;
  while (b !== 0n) [a, b] = [b, a % b];
  return a || 1n;
}

function rat(numerator, denominator = 1n) {
  if (denominator === 0n) throw new Error("zero denominator");
  if (numerator === 0n) return [0n, 1n];
  const sign = denominator < 0n ? -1n : 1n;
  const divisor = gcd(numerator, denominator);
  return [(numerator / divisor) * sign, (denominator / divisor) * sign < 0n ? -(denominator / divisor) * sign : (denominator / divisor) * sign];
}

function fromValue(value) {
  return rat(BigInt(value.numerator), BigInt(value.denominator));
}

function format([numerator, denominator]) {
  return denominator === 1n ? String(numerator) : `${numerator}/${denominator}`;
}

function add([a, b], [c, d]) {
  return rat(a * d + c * b, b * d);
}

function multiply([a, b], [c, d]) {
  return rat(a * c, b * d);
}

function expectedAnswer(operands) {
  if (operands.kind === "unary") {
    const [numerator, denominator] = fromValue(operands.value);
    if (operands.operator === "abs") return format(rat(numerator < 0n ? -numerator : numerator, denominator));
    if (operands.operator === "opposite") return format(rat(-numerator, denominator));
  }
  if (operands.kind === "binary") {
    const left = fromValue(operands.left);
    const right = fromValue(operands.right);
    if (operands.operator === "add") return format(add(left, right));
    if (operands.operator === "subtract") return format(add(left, rat(-right[0], right[1])));
    if (operands.operator === "multiply") return format(multiply(left, right));
    if (operands.operator === "divide") return format(multiply(left, rat(right[1], right[0])));
  }
  if (operands.kind === "compare") {
    const left = fromValue(operands.left);
    const right = fromValue(operands.right);
    const difference = left[0] * right[1] - right[0] * left[1];
    return format(difference >= 0n ? left : right);
  }
  if (operands.kind === "power") {
    const base = fromValue(operands.base);
    let result = rat(1n);
    for (let index = 0; index < operands.exponent; index += 1) result = multiply(result, base);
    if (operands.outside_sign < 0) result = rat(-result[0], result[1]);
    return format(result);
  }
  if (operands.kind === "mixed") {
    const first = operands.first_operator === "add"
      ? add(fromValue(operands.left), fromValue(operands.middle))
      : add(fromValue(operands.left), rat(-fromValue(operands.middle)[0], fromValue(operands.middle)[1]));
    return format(multiply(first, fromValue(operands.right)));
  }
  throw new Error(`unknown operands kind ${operands.kind}`);
}

function assertCanonical(text) {
  assert.match(text, /^-?\d+(?:\/\d+)?$/);
  const parts = text.split("/");
  const numerator = BigInt(parts[0]);
  const denominator = BigInt(parts[1] || "1");
  assert.ok(denominator > 0n);
  assert.equal(gcd(numerator, denominator), 1n);
}

test("skill catalog freezes exactly eight IDs and three bands", () => {
  assert.deepEqual(SKILL_IDS, [
    "g7-rational-sign-opposite-absolute",
    "g7-rational-compare",
    "g7-integer-add-sub",
    "g7-integer-mul-div",
    "g7-fraction-add-sub",
    "g7-fraction-mul-div",
    "g7-rational-power",
    "g7-rational-mixed"
  ]);
  assert.equal(skillCatalog().length, 8);
  for (const skill of skillCatalog()) assert.deepEqual(skill.bands, BANDS);
});

test("same generator coordinates produce byte-for-byte equivalent exercises", () => {
  const input = { skillId: "g7-integer-add-sub", band: "standard", seed: "family-1", index: 4 };
  const first = generateExercise(input);
  assert.deepEqual(first, generateExercise(input));
  assert.match(first.id, /^gx:g7-integer-add-sub:standard:/);
});

test("mandatory signed arithmetic and precedence examples are pinned", () => {
  const pinned = [
    ["g7-rational-sign-opposite-absolute", 0, "|-7| = ?", "7"],
    ["g7-integer-add-sub", 0, "-7 + 12 = ?", "5"],
    ["g7-integer-add-sub", 1, "8 - (-3) = ?", "11"],
    ["g7-integer-mul-div", 0, "(-4) × (-6) = ?", "24"],
    ["g7-fraction-add-sub", 0, "(-3/4) + (5/6) = ?", "1/12"],
    ["g7-fraction-mul-div", 0, "(-2/3) ÷ (4/9) = ?", "-3/2"],
    ["g7-rational-power", 0, "(-3)^2 = ?", "9"],
    ["g7-rational-power", 1, "-3^2 = ?", "-9"]
  ];
  for (const [skillId, index, prompt, answer] of pinned) {
    const exercise = generateExercise({ skillId, band: "foundation", seed: "contract", index });
    assert.equal(exercise.prompt, prompt);
    assert.equal(exercise.canonical_answer, answer);
    assert.equal(expectedAnswer(exercise.operands), answer);
  }
});

test("24 skill bands pass 1,000 exact deterministic invariants", () => {
  for (const skillId of SKILL_IDS) {
    for (const band of BANDS) {
      for (let index = 0; index < 1000; index += 1) {
        const exercise = generateExercise({ skillId, band, seed: "invariant", index });
        assert.equal(exercise.skill_id, skillId);
        assert.equal(exercise.band, band);
        assert.equal(expectedAnswer(exercise.operands), exercise.canonical_answer, exercise.id);
        assertCanonical(exercise.canonical_answer);
        assert.ok(["signed_integer", "signed_fraction_fields"].includes(exercise.answer_type));
        assert.ok(exercise.prompt.length > 0);
        assert.ok(exercise.checksum.length >= 8);
        for (const tool of ["direct", "structure", "estimate"]) {
          assert.equal(exercise.explanations[tool].available, true, `${exercise.id}:${tool}`);
          assert.ok(exercise.explanations[tool].summary.length > 0);
          assert.ok(exercise.explanations[tool].steps.length > 0);
        }
        if (exercise.operands.kind === "binary" && exercise.operands.operator === "divide") {
          assert.notEqual(exercise.operands.right.numerator, 0);
        }
        for (const value of Object.values(exercise.operands)) {
          if (typeof value === "number") assert.ok(Number.isSafeInteger(value), exercise.id);
          if (value && typeof value === "object" && "numerator" in value) {
            assert.ok(Number.isSafeInteger(value.numerator), exercise.id);
            assert.ok(Number.isSafeInteger(value.denominator), exercise.id);
            assert.ok(value.denominator > 0, exercise.id);
          }
        }
      }

      const session = Array.from({ length: 10 }, (_, index) =>
        generateExercise({ skillId, band, seed: "one-session", index })
      );
      assert.equal(new Set(session.map((item) => `${item.prompt}\u0000${item.canonical_answer}`)).size, 10, `${skillId}:${band}`);
      assert.equal(new Set(session.map((item) => item.id)).size, 10, `${skillId}:${band}:ids`);
    }
  }
});

test("invalid skills, bands and generator coordinates fail closed", () => {
  assert.throws(() => generateExercise({ skillId: "missing", band: "foundation", seed: "x", index: 0 }), /unknown skill/);
  assert.throws(() => generateExercise({ skillId: SKILL_IDS[0], band: "expert", seed: "x", index: 0 }), /unknown band/);
  assert.throws(() => generateExercise({ skillId: SKILL_IDS[0], band: "foundation", seed: "x", index: -1 }), /index/);
});

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const goldenPath = join(dirname(fileURLToPath(import.meta.url)), "fixtures/grade7-v1-golden.json");
const V1_GOLDEN = JSON.parse(readFileSync(goldenPath, "utf8"));

test("v1 golden: missing generatorVersion regenerates byte-identical fixtures", () => {
  assert.equal(V1_GOLDEN.length, 480);
  for (const row of V1_GOLDEN) {
    const exercise = generateExercise({
      skillId: row.skillId,
      band: row.band,
      seed: row.seed,
      index: row.index,
    });
    assert.equal(exercise.id, row.id);
    assert.equal(exercise.checksum, row.checksum);
    assert.equal(exercise.prompt, row.prompt);
    assert.equal(exercise.canonical_answer, row.canonical_answer);
    assert.deepEqual(exercise.operands, row.operands);
    assert.deepEqual(exercise.explanations, row.explanations);
    assert.equal(exercise.generator_version, undefined);
  }
});

test("explicit generatorVersion 1 matches missing-version v1 path", () => {
  const a = generateExercise({ skillId: "g7-integer-add-sub", band: "foundation", seed: "v1-golden", index: 3 });
  const b = generateExercise({ skillId: "g7-integer-add-sub", band: "foundation", seed: "v1-golden", index: 3, generatorVersion: 1 });
  assert.deepEqual(a, b);
});

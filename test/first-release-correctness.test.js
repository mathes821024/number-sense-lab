import assert from "node:assert/strict";
import test from "node:test";

import {
  completeDomainCatalog,
  loadCoreCatalog,
  loadFactCatalog,
  practiceEntryCatalog,
  productPracticeVariantStats,
} from "../src/core/content.js";
import { exactDecimal, exactPercent, gcd } from "../src/core/reference-facts.js";
import { generateExercise } from "../src/core/grade7-rational-generator.js";
import {
  V2_REQUIRED_TEMPLATES,
  assertV2TemplateContract,
  selectUniqueV2Candidate,
} from "../src/core/grade7-rational-generator-v2.js";
import { SKILL_IDS } from "../src/core/skill-catalog.js";
import {
  finishReferenceSession,
  peekReferenceItem,
  startReferenceSession,
  submitReferenceAnswer,
} from "../src/core/reference-session.js";
import { emptyLearner } from "../src/core/store.js";
import { WRONG_REAPPEAR_GAP, planWrongReappear } from "../src/core/schedule.js";

const BANDS = ["foundation", "standard", "transfer"];

function finiteFractionValues() {
  const out = [];
  for (const d of [2, 4, 5, 8, 10, 20, 25]) {
    for (let n = 1; n < d; n += 1) {
      if (gcd(n, d) === 1) out.push([n, d]);
    }
  }
  return out;
}

function contentKey(exercise) {
  return `${exercise.prompt}\u0000${exercise.canonical_answer}`;
}

function decimalRatio(text) {
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(text);
  assert.ok(match, `invalid exact decimal ${text}`);
  const fractionDigits = match[3] || "";
  const denominator = 10n ** BigInt(fractionDigits.length);
  const magnitude = BigInt(`${match[2]}${fractionDigits}`);
  return {
    numerator: match[1] ? -magnitude : magnitude,
    denominator,
  };
}

function fractionRatio(text) {
  const match = /^(-?\d+)\/(\d+)$/.exec(text);
  assert.ok(match, `invalid fraction ${text}`);
  return { numerator: BigInt(match[1]), denominator: BigInt(match[2]) };
}

function assertEquivalent(leftNumerator, leftDenominator, right, label) {
  assert.equal(
    BigInt(leftNumerator) * right.denominator,
    right.numerator * BigInt(leftDenominator),
    label,
  );
}

function assertFiniteCatalogMath(catalog) {
  const byKey = new Map(catalog.map((item) => [item.semantic_key, item]));
  for (const [n, d] of finiteFractionValues()) {
    const frac = `${n}/${d}`;
    const toDec = byKey.get(`fraction_decimal:to_decimal:${frac}`);
    const toFrac = byKey.get(`fraction_decimal:to_fraction:${frac}`);
    const toPct = byKey.get(`fraction_decimal:to_percent:${frac}`);
    const fromPct = byKey.get(`fraction_decimal:from_percent:${frac}`);
    assert.ok(toDec && toFrac && toPct && fromPct, `missing directions for ${frac}`);
    assertEquivalent(n, d, decimalRatio(toDec.canonical_answer), `${frac} decimal`);
    assertEquivalent(n, d, fractionRatio(toFrac.canonical_answer), `${frac} reverse decimal`);
    const percent = decimalRatio(toPct.canonical_answer);
    assertEquivalent(n * 100, d, percent, `${frac} percent`);
    assertEquivalent(n, d, fractionRatio(fromPct.canonical_answer), `${frac} reverse percent`);
    assert.equal(toPct.prompt, `${frac} = ?%`);
    assert.equal(fromPct.prompt, `${toPct.canonical_answer}% = ?/?`);
  }
}

function hasCrossCancellation(operands) {
  const { left, right, operator } = operands;
  if (operator === "multiply") {
    return gcd(Math.abs(left.numerator), right.denominator) > 1
      || gcd(Math.abs(right.numerator), left.denominator) > 1;
  }
  if (operator === "divide") {
    return gcd(Math.abs(left.numerator), Math.abs(right.numerator)) > 1
      || gcd(right.denominator, left.denominator) > 1;
  }
  return false;
}

// ---------- P0: exact decimal / percent math ----------

test("P0 exactDecimal/exactPercent use integer rational math (sentinels)", () => {
  assert.equal(exactDecimal(1, 2), "0.5");
  assert.equal(exactPercent(1, 2), "50");
  assert.equal(exactDecimal(1, 5), "0.2");
  assert.equal(exactPercent(1, 5), "20");
  assert.equal(exactDecimal(1, 8), "0.125");
  assert.equal(exactPercent(1, 8), "12.5");
  assert.equal(exactDecimal(1, 20), "0.05");
  assert.equal(exactPercent(1, 20), "5");
});

test("P0 every finite fraction four directions have mathematically equivalent answers", () => {
  const catalog = loadFactCatalog({ includeReference: true });
  const byKey = new Map(catalog.map((item) => [item.semantic_key, item]));
  const values = finiteFractionValues();
  assert.equal(values.length, 43);
  assertFiniteCatalogMath(catalog);
  const sabotaged = catalog.map((item) => item.semantic_key === "fraction_decimal:to_percent:1/8"
    ? { ...item, canonical_answer: "5" }
    : item);
  assert.throws(() => assertFiniteCatalogMath(sabotaged), /1\/8 percent/);
  // Explicit sentinels against known prior bugs
  assert.equal(byKey.get("fraction_decimal:to_percent:1/8").canonical_answer, "12.5");
  assert.notEqual(byKey.get("fraction_decimal:to_percent:1/8").canonical_answer, "5");
  assert.equal(byKey.get("fraction_decimal:from_percent:1/20").canonical_answer, "1/20");
  assert.equal(byKey.get("fraction_decimal:from_percent:1/8").prompt, "12.5% = ?/?");
});

// ---------- P1: v2 ten-item content dedupe ----------

test("P1 v2 rolling ten-item windows have unique prompt+answer content keys", () => {
  const seeds = ["v2-dedupe-a", "v2-dedupe-b", "v2-dedupe-c", "v2-coverage", "persist-v2"];
  for (const skillId of SKILL_IDS) {
    for (const band of BANDS) {
      for (const seed of seeds) {
        for (let start = 0; start < 40; start += 1) {
          const keys = [];
          const ids = [];
          for (let offset = 0; offset < 10; offset += 1) {
            const exercise = generateExercise({
              skillId,
              band,
              seed,
              index: start + offset,
              generatorVersion: 2,
            });
            keys.push(contentKey(exercise));
            ids.push(exercise.id);
          }
          assert.equal(
            new Set(keys).size,
            10,
            `${skillId}:${band}:${seed}@${start} content dupe: ${keys}`,
          );
          assert.equal(new Set(ids).size, 10, `${skillId}:${band}:${seed}@${start} id dupe`);
        }
      }
    }
  }
});

test("P1 uniqueness exhaustion fails closed instead of silently returning a duplicate", () => {
  const duplicate = { prompt: "0 的相反数是？", canonical_answer: "0" };
  assert.throws(
    () => selectUniqueV2Candidate({
      usedKeys: new Set([contentKey(duplicate)]),
      maxAttempts: 64,
      candidateAtAttempt: () => duplicate,
    }),
    /CONTRACT_CONFLICT.*unique/i,
  );
});

test("P1 v1 missing-version output stays byte-identical for golden seed index 0..5", () => {
  for (const skillId of SKILL_IDS) {
    for (const band of BANDS) {
      for (let index = 0; index < 6; index += 1) {
        const a = generateExercise({ skillId, band, seed: "v1-golden", index });
        const b = generateExercise({ skillId, band, seed: "v1-golden", index, generatorVersion: 1 });
        assert.deepEqual(a, b);
        assert.equal(a.generator_version, undefined);
      }
    }
  }
});

// ---------- P1: template math predicates ----------

test("P1 template tags match operands and prompt mathematics", () => {
  const samples = [];
  for (const skillId of SKILL_IDS) {
    for (const band of BANDS) {
      for (let index = 0; index < 48; index += 1) {
        samples.push(generateExercise({
          skillId, band, seed: "v2-template-math", index, generatorVersion: 2,
        }));
      }
    }
  }
  for (const exercise of samples) {
    const { template } = exercise.operands;
    const { prompt, canonical_answer: answer, operands } = exercise;
    assert.ok(template);
    assert.ok(/[?？]/.test(prompt) || /较大的数/.test(prompt));
    assert.match(answer, /^-?\d+(?:\/\d+)?$/);

    if (template === "same_denominator") {
      assert.equal(operands.left.denominator, operands.right.denominator);
      assert.notEqual(operands.left.denominator, 1);
    }
    if (template === "unlike_denominator") {
      assert.notEqual(operands.left.denominator, operands.right.denominator);
    }
    if (template === "signed_unlike_denominator") {
      assert.notEqual(operands.left.denominator, operands.right.denominator);
      assert.ok(operands.left.numerator < 0 || operands.right.numerator < 0);
    }
    if (template === "signed_integer_result") {
      assert.equal(answer.includes("/"), false);
      assert.ok(operands.left.numerator < 0 || operands.right.numerator < 0);
    }
    if (template === "two_term_exact_div" && operands.operator === "divide") {
      assert.notEqual(operands.right.numerator, 0);
      assert.equal(operands.left.numerator % operands.right.numerator === 0, true);
    }
    if (template === "subtract_negative") {
      assert.ok(operands.right.numerator < 0);
      assert.match(prompt, /-/);
    }
    if (template === "exp_0_4_paren_vs_outside") {
      assert.ok(operands.exponent >= 0 && operands.exponent <= 4);
      if (operands.outside_sign < 0) assert.match(prompt, /^-/);
      if (operands.base.numerator < 0) assert.match(prompt, /\(-/);
    }
    if (template === "integer_base_exp_2_3") {
      assert.ok(operands.exponent === 2 || operands.exponent === 3);
      assert.equal(operands.base.denominator, 1);
    }
    if (template === "fraction_base_exp_le_6") {
      assert.ok(operands.exponent >= 0 && operands.exponent <= 6);
      assert.ok(operands.base.denominator > 1);
      assert.match(prompt, /\(/);
    }
    if (template === "three_term_parentheses") {
      assert.match(prompt, /^\(/);
      assert.equal(operands.parentheses, true);
    }
    if (template === "positive_simple_cancel") {
      assert.ok(operands.left.numerator > 0 && operands.right.numerator > 0);
      assert.equal(operands.operator, "multiply");
      assert.equal(hasCrossCancellation(operands), true);
    }
    if (template === "cross_cancel_improper") {
      assert.ok(Math.abs(operands.left.numerator) > operands.left.denominator
        || Math.abs(operands.right.numerator) > operands.right.denominator);
      assert.equal(hasCrossCancellation(operands), true);
    }
    if (template === "parentheses_multi_sign") {
      assert.ok((prompt.match(/\(/g) || []).length >= 2);
      assert.ok((prompt.match(/-/g) || []).length >= 2);
    }
    assert.doesNotThrow(() => assertV2TemplateContract(exercise));
  }
  // Required templates still appear
  for (const skillId of SKILL_IDS) {
    for (const band of BANDS) {
      const required = V2_REQUIRED_TEMPLATES[skillId][band];
      const seen = new Set(
        samples.filter((ex) => ex.skill_id === skillId && ex.band === band).map((ex) => ex.operands.template),
      );
      for (const tag of required) assert.ok(seen.has(tag), `${skillId}:${band} missing ${tag}`);
    }
  }
});

// ---------- P1: powers entry 54 ----------

test("P1 powers practice entry exposes exactly 54 direction slots", () => {
  const entry = practiceEntryCatalog("powers");
  assert.equal(entry.length, 54);
  const ids = new Set(entry.map((item) => item.id));
  assert.equal(ids.size, 54);
  // No duplicated mastery ids invented for overlaps
  const coreIds = new Set(loadCoreCatalog().map((item) => item.id));
  for (const item of entry) {
    if (coreIds.has(item.id)) {
      assert.equal(loadCoreCatalog().find((row) => row.id === item.id).id, item.id);
    }
  }
  const keys = new Set(entry.map((item) => item.semantic_key));
  for (const [base, end] of [[2, 10], [3, 6], [5, 5], [10, 6]]) {
    for (let exponent = 1; exponent <= end; exponent += 1) {
      const forward = exponent === 2
        ? `square:forward:${base}`
        : exponent === 3
          ? `cube:forward:${base}`
          : `power:forward:${base}:${exponent}`;
      assert.ok(keys.has(forward), `missing ${forward}`);
      assert.ok(keys.has(`power:inverse:${base}:${exponent}`), `missing power:inverse:${base}:${exponent}`);
    }
  }
});

// ---------- P2: squares 40 / cubes 18 entry filters ----------

test("P2 squares entry exposes only 1²..20² forward+inverse (40)", () => {
  const entry = practiceEntryCatalog("squares");
  assert.equal(entry.length, 40);
  for (const item of entry) {
    const match = /square:(forward|inverse):(\d+)/.exec(item.semantic_key);
    assert.ok(match);
    const value = Number(match[2]);
    assert.ok(value >= 1 && value <= 20);
  }
  // Warehouse may still be larger
  assert.ok(completeDomainCatalog("squares").length >= 40);
});

test("P2 cubes entry exposes only 1³..9³ forward+inverse (18)", () => {
  const entry = practiceEntryCatalog("cubes");
  assert.equal(entry.length, 18);
  for (const item of entry) {
    const match = /cube:(forward|inverse):(\d+)/.exec(item.semantic_key);
    assert.ok(match);
    const value = Number(match[2]);
    assert.ok(value >= 1 && value <= 9);
  }
  assert.ok(completeDomainCatalog("cubes").length >= 18);
});

// ---------- P2: reference wrong reappear exactly two answered ----------

test("P2 reference wrong reappear waits exactly two other answered items", () => {
  // Global mastery schedule must stay unchanged (answered+1+gap).
  const global = planWrongReappear({ answered: 1, reappearPlan: {}, reappearCount: {} }, "x");
  assert.equal(global.reappearPlan.x, 1 + 1 + WRONG_REAPPEAR_GAP);

  const catalog = practiceEntryCatalog("halves");
  let session = startReferenceSession({ domain: "halves", day: "2026-10-12", seed: "gap2", size: 10 });
  let state = emptyLearner();
  const first = peekReferenceItem(session, catalog);
  session = first.session;
  const wrongId = first.item.practice_variant_id || first.item.id;
  let result = submitReferenceAnswer({
    item: first.item,
    state,
    session,
    raw: "0",
    meta: { day: "2026-10-12", inputMode: "onscreen_keypad", mixedInput: false, elapsedMs: 40 },
    catalog,
  });
  state = result.state;
  session = result.session;
  assert.equal(result.judged.kind, "wrong");

  for (let i = 0; i < 2; i += 1) {
    const peeked = peekReferenceItem(session, catalog);
    session = peeked.session;
    const id = peeked.item.practice_variant_id || peeked.item.id;
    assert.notEqual(id, wrongId, `intervening ${i} must not be the wrong item`);
    result = submitReferenceAnswer({
      item: peeked.item,
      state,
      session,
      raw: peeked.item.canonical_answer,
      meta: { day: "2026-10-12", inputMode: "onscreen_keypad", mixedInput: false, elapsedMs: 30 },
      catalog,
    });
    state = result.state;
    session = result.session;
  }

  const again = peekReferenceItem(session, catalog);
  const againId = again.item.practice_variant_id || again.item.id;
  assert.equal(againId, wrongId);
  assert.equal(again.revisit, true);
  assert.deepEqual(state.relations, {});
});

test("regression: product family counts and mastery_core size", () => {
  assert.equal(loadCoreCatalog().length, 173);
  assert.deepEqual(productPracticeVariantStats(), {
    families: 190,
    multiply: 190,
    divide: 361,
    directions: 551,
  });
});

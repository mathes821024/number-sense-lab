import assert from "node:assert/strict";
import test from "node:test";

import {
  collectionOf,
  completeDomainCatalog,
  dailyCatalog,
  focusedCatalog,
  listProductPracticeVariants,
  loadCoreCatalog,
  loadFactCatalog,
  productPracticeVariantStats,
  practiceVariantsFor,
  referencePresentation,
  semanticKeyOf,
  verifyFactCollections,
  verifyContentCounts
} from "../src/core/content.js";

function productKey(a, b) {
  return `product:${Math.min(a, b)}:${Math.max(a, b)}`;
}

function gcd(a, b) {
  let x = a;
  let y = b;
  while (y) [x, y] = [y, x % y];
  return x;
}

function finiteFractionValues() {
  const out = [];
  for (const d of [2, 4, 5, 8, 10, 20, 25]) {
    for (let n = 1; n < d; n += 1) {
      if (gcd(n, d) === 1) out.push([n, d]);
    }
  }
  return out;
}

const REPEATING_VALUES = [
  [1, 3], [2, 3],
  [1, 6], [5, 6],
  [1, 9], [2, 9], [4, 9], [5, 9], [7, 9], [8, 9],
  [1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7],
];

function expectedKeys() {
  const products = [];
  for (let a = 1; a <= 19; a += 1) {
    for (let b = a; b <= 19; b += 1) products.push(productKey(a, b));
  }

  const complements = [];
  for (const target of [10, 20, 100]) {
    for (let operand = 1; operand < target; operand += 1) {
      complements.push(`complement:${target}:${operand}`);
    }
  }

  const squareForward = Array.from({ length: 100 }, (_, index) => `square:forward:${index + 1}`);
  const squareInverse = Array.from({ length: 100 }, (_, index) => `square:inverse:${index + 1}`);
  const cubeForward = Array.from({ length: 20 }, (_, index) => `cube:forward:${index + 1}`);
  const cubeInverse = Array.from({ length: 20 }, (_, index) => `cube:inverse:${index + 1}`);

  const powers = [];
  for (const [base, end] of [[2, 10], [3, 6], [5, 5], [10, 6]]) {
    for (let exponent = 1; exponent <= end; exponent += 1) {
      const forward = exponent === 2
        ? `square:forward:${base}`
        : exponent === 3
          ? `cube:forward:${base}`
          : `power:forward:${base}:${exponent}`;
      powers.push(forward, `power:inverse:${base}:${exponent}`);
    }
  }
  return { products, complements, squareForward, squareInverse, cubeForward, cubeInverse, powers };
}

test("all 173 historical items default to mastery_core", () => {
  const core = loadCoreCatalog();
  assert.equal(core.length, 173);
  assert.equal(core.filter((item) => collectionOf(item) === "mastery_core").length, 173);
  assert.equal(verifyContentCounts(core).total, 173);
  assert.deepEqual(dailyCatalog(loadFactCatalog({ includeReference: true })).map((item) => item.id), core.map((item) => item.id));
});

test("complete finite collections contain one semantic fact for every enumerated key", () => {
  const catalog = loadFactCatalog({ includeReference: true });
  const counts = new Map();
  for (const item of catalog) counts.set(item.semantic_key, (counts.get(item.semantic_key) || 0) + 1);

  const expected = expectedKeys();
  assert.equal(expected.products.length, 190);
  assert.equal(expected.complements.length, 127);
  assert.equal(expected.squareForward.length, 100);
  assert.equal(expected.squareInverse.length, 100);
  assert.equal(expected.cubeForward.length, 20);
  assert.equal(expected.cubeInverse.length, 20);
  assert.equal(expected.powers.length, 54);

  for (const key of Object.values(expected).flat()) assert.equal(counts.get(key), 1, key);
});

test("43 finite fractions expose four directions and 16 repeating fractions expose two", () => {
  const catalog = loadFactCatalog({ includeReference: true });
  const byKey = new Map(catalog.map((item) => [item.semantic_key, item]));
  const finite = finiteFractionValues();
  assert.equal(finite.length, 43);
  for (const [n, d] of finite) {
    const frac = `${n}/${d}`;
    for (const key of [
      `fraction_decimal:to_decimal:${frac}`,
      `fraction_decimal:to_fraction:${frac}`,
      `fraction_decimal:to_percent:${frac}`,
      `fraction_decimal:from_percent:${frac}`,
    ]) {
      assert.equal(byKey.has(key), true, key);
      assert.equal((byKey.get(key).semantic_key), key);
    }
  }
  assert.equal(REPEATING_VALUES.length, 16);
  for (const [n, d] of REPEATING_VALUES) {
    const frac = `${n}/${d}`;
    for (const key of [
      `fraction_decimal:repeating_to_decimal:${frac}`,
      `fraction_decimal:repeating_to_fraction:${frac}`,
    ]) {
      assert.equal(byKey.has(key), true, key);
    }
  }
});

test("50 half facts and 50 double facts cover the first-release halves domain", () => {
  const catalog = loadFactCatalog({ includeReference: true });
  const byKey = new Map(catalog.map((item) => [item.semantic_key, item]));
  for (let value = 2; value <= 100; value += 2) {
    assert.equal(byKey.get(`half:${value}`)?.domain, "halves", `half:${value}`);
  }
  for (let value = 1; value <= 50; value += 1) {
    assert.equal(byKey.get(`double:${value}`)?.domain, "halves", `double:${value}`);
  }
  assert.equal([...byKey.keys()].filter((key) => key.startsWith("half:")).length, 50);
  assert.equal([...byKey.keys()].filter((key) => key.startsWith("double:")).length, 50);
});

test("historical core ids win every semantic overlap with generated references", () => {
  const core = loadCoreCatalog();
  const complete = loadFactCatalog({ includeReference: true });
  const byKey = new Map(complete.map((item) => [item.semantic_key, item]));
  for (const historical of core) {
    assert.equal(byKey.get(historical.semantic_key)?.id, historical.id, historical.id);
  }
  const coreHalf = core.filter((item) => item.domain === "halves");
  assert.equal(coreHalf.length, 14);
  for (const item of coreHalf) {
    assert.match(item.semantic_key, /^half:\d+$/);
    assert.equal(byKey.get(item.semantic_key).id, item.id);
    assert.equal(collectionOf(byKey.get(item.semantic_key)), "mastery_core");
  }
  assert.equal(new Set(complete.map((item) => item.id)).size, complete.length);
  assert.equal(new Set(complete.map((item) => item.semantic_key)).size, complete.length);
});

test("completeDomainCatalog unions mastery_core and reference_practice by semantic key", () => {
  const products = completeDomainCatalog("products");
  assert.equal(products.length, 190);
  assert.ok(products.every((item) => item.domain === "products"));
  assert.equal(new Set(products.map((item) => item.semantic_key)).size, 190);
  const coreIds = new Set(loadCoreCatalog().filter((item) => item.domain === "products").map((item) => item.id));
  assert.ok([...coreIds].every((id) => products.some((item) => item.id === id)));

  const halves = completeDomainCatalog("halves");
  assert.equal(halves.length, 100);
  assert.equal(halves.filter((item) => semanticKeyOf(item).startsWith("half:")).length, 50);
  assert.equal(halves.filter((item) => semanticKeyOf(item).startsWith("double:")).length, 50);

  const fractions = completeDomainCatalog("fraction_decimal");
  assert.equal(fractions.length, 43 * 4 + 16 * 2);
});

test("reference collections are opt-in and focused filters never expand daily practice", () => {
  const core = loadCoreCatalog();
  const defaultFacts = loadFactCatalog({ includeReference: false });
  const completeFacts = loadFactCatalog({ includeReference: true });
  assert.deepEqual(defaultFacts.map((item) => item.id), core.map((item) => item.id));
  assert.ok(completeFacts.length > core.length);
  assert.ok(completeFacts.slice(core.length).every((item) => collectionOf(item) === "reference_practice"));
  assert.ok(focusedCatalog("products", "reference_practice").every((item) => item.domain === "products" && collectionOf(item) === "reference_practice"));
  assert.equal(dailyCatalog(completeFacts).length, 173);
});

test("unknown collection values fail closed", () => {
  assert.throws(() => collectionOf({ collection: "daily_plus" }), /unknown collection/);
});

test("manifest verifier reports historical, reference and coverage counts", () => {
  const report = verifyFactCollections();
  assert.equal(report.core, 173);
  assert.ok(report.reference > 510);
  assert.equal(report.combined, report.core + report.reference);
  assert.deepEqual(report.coverage.products, 190);
  assert.deepEqual(report.coverage.complements, 127);
  assert.equal(report.coverage.finiteFractions, 43);
  assert.equal(report.coverage.finiteFractionDirections, 172);
  assert.equal(report.coverage.repeatingFractions, 16);
  assert.equal(report.coverage.repeatingDirections, 32);
  assert.equal(report.coverage.halves, 50);
  assert.equal(report.coverage.doubles, 50);
});


// --- Owner product-family + reverse-root assertions (18) ---

test("1. product fact families cover exactly 190 exchange-deduped pairs", () => {
  const stats = productPracticeVariantStats();
  assert.equal(stats.families, 190);
  assert.equal(completeDomainCatalog("products").length, 190);
});

test("2. exactly 190 multiply practice variants are materialized", () => {
  const variants = listProductPracticeVariants();
  assert.equal(variants.filter((v) => v.direction === "multiply").length, 190);
  assert.equal(productPracticeVariantStats().multiply, 190);
});

test("3. exactly 361 exact-division practice variants are materialized", () => {
  const variants = listProductPracticeVariants();
  assert.equal(variants.filter((v) => v.direction === "divide-a" || v.direction === "divide-b").length, 361);
  assert.equal(productPracticeVariantStats().divide, 361);
});

test("4. total practice directions equal 551", () => {
  assert.equal(listProductPracticeVariants().length, 551);
  assert.equal(productPracticeVariantStats().directions, 551);
  assert.equal(verifyFactCollections().coverage.productPracticeDirections, 551);
});

test("5. every division divisor is nonzero and in 1..19", () => {
  for (const variant of listProductPracticeVariants()) {
    if (!String(variant.direction).startsWith("divide")) continue;
    const match = /^(\d+) ÷ (\d+) = \?$/.exec(variant.prompt);
    assert.ok(match, variant.prompt);
    const divisor = Number(match[2]);
    assert.ok(divisor >= 1 && divisor <= 19);
    assert.notEqual(divisor, 0);
  }
});

test("6. every division quotient is an integer in 1..19 with no remainder", () => {
  for (const variant of listProductPracticeVariants()) {
    if (!String(variant.direction).startsWith("divide")) continue;
    const match = /^(\d+) ÷ (\d+) = \?$/.exec(variant.prompt);
    assert.ok(match, variant.prompt);
    const product = Number(match[1]);
    const divisor = Number(match[2]);
    const quotient = Number(variant.canonical_answer);
    assert.equal(product % divisor, 0);
    assert.equal(quotient, product / divisor);
    assert.ok(Number.isInteger(quotient));
    assert.ok(quotient >= 1 && quotient <= 19);
  }
});

test("7. 7 × 8 = 56 exposes both 56 ÷ 7 = 8 and 56 ÷ 8 = 7", () => {
  const family = completeDomainCatalog("products").find((item) => item.semantic_key === "product:7:8");
  assert.ok(family);
  const variants = practiceVariantsFor(family.id);
  assert.equal(variants.length, 3);
  assert.deepEqual(
    variants.map((v) => v.prompt).sort(),
    ["56 ÷ 7 = ?", "56 ÷ 8 = ?", "7 × 8 = ?"].sort(),
  );
  assert.ok(variants.every((v) => v.practice_variant_id.startsWith(`${family.id}:`)));
});

test("8. 7 × 7 = 49 exposes only one division variant 49 ÷ 7 = 7", () => {
  const family = completeDomainCatalog("products").find((item) => item.semantic_key === "product:7:7");
  assert.ok(family);
  const variants = practiceVariantsFor(family.id);
  assert.equal(variants.length, 2);
  assert.equal(variants.filter((v) => v.direction === "divide-a").length, 1);
  assert.equal(variants.filter((v) => v.direction === "divide-b").length, 0);
  assert.equal(variants.find((v) => v.direction === "divide-a").prompt, "49 ÷ 7 = ?");
});

test("9. practice_variant_id suffixes are only :multiply / :divide-a / :divide-b", () => {
  const allowed = new Set(["multiply", "divide-a", "divide-b"]);
  for (const variant of listProductPracticeVariants()) {
    const suffix = variant.practice_variant_id.split(":").pop();
    assert.ok(allowed.has(suffix), variant.practice_variant_id);
    assert.equal(variant.practice_variant_id, `${variant.practice_variant_id.replace(/:(multiply|divide-a|divide-b)$/, "")}:${suffix}`);
  }
});

test("10. historical core product relation_ids are preserved as variant hosts", () => {
  const coreProducts = loadCoreCatalog().filter((item) => item.domain === "products");
  assert.equal(coreProducts.length, 32);
  for (const item of coreProducts) {
    const variants = practiceVariantsFor(item.id);
    assert.ok(variants.length >= 2, item.id);
    assert.ok(variants.every((v) => v.practice_variant_id.startsWith(`${item.id}:`)));
    assert.equal(completeDomainCatalog("products").find((row) => row.semantic_key === item.semantic_key).id, item.id);
  }
});

test("11. division variants are not new mastery relation_ids", () => {
  const coreIds = new Set(loadCoreCatalog().map((item) => item.id));
  for (const variant of listProductPracticeVariants()) {
    assert.equal(coreIds.has(variant.practice_variant_id), false);
    assert.match(variant.practice_variant_id, /:(multiply|divide-a|divide-b)$/);
  }
  assert.equal(loadCoreCatalog().length, 173);
});

test("12. product practice variants are sync-materialized, not absent", () => {
  const family = completeDomainCatalog("products")[0];
  assert.ok(Array.isArray(family.practice_variants));
  assert.ok(family.practice_variants.length >= 2);
  assert.equal(typeof family.practice_variants[0].practice_variant_id, "string");
});

test("13. arithmetic square-root reverse √144 = 12 is practiceable without ±", () => {
  const catalog = completeDomainCatalog("squares");
  const inverse = catalog.find((item) => item.semantic_key === "square:inverse:12");
  assert.ok(inverse);
  const presented = referencePresentation(inverse);
  assert.equal(presented.prompt, "√144 = ?");
  assert.equal(presented.canonical_answer, "12");
  assert.equal(presented.prompt.includes("±"), false);
  assert.equal(presented.prompt.includes("x²"), false);
});

test("14. arithmetic cube-root reverse ∛125 = 5 is practiceable", () => {
  const catalog = completeDomainCatalog("cubes");
  const inverse = catalog.find((item) => item.semantic_key === "cube:inverse:5");
  assert.ok(inverse);
  const presented = referencePresentation(inverse);
  assert.equal(presented.prompt, "∛125 = ?");
  assert.equal(presented.canonical_answer, "5");
});

test("15. common-power reverse keeps '几次方' wording without logarithms", () => {
  const catalog = completeDomainCatalog("powers");
  const inverse = catalog.find((item) => item.semantic_key === "power:inverse:2:5")
    || catalog.find((item) => /2 的几次方/.test(item.prompt) && item.canonical_answer === "5");
  assert.ok(inverse, "missing 2^5 inverse");
  assert.match(inverse.prompt, /几次方/);
  assert.equal(/log|ln|loga/i.test(inverse.prompt), false);
  assert.equal(inverse.canonical_answer, "5");
});

test("16. finite fractions expose four directions for each of 43 values", () => {
  const keys = new Set(loadFactCatalog({ includeReference: true }).map((item) => item.semantic_key));
  const values = finiteFractionValues();
  assert.equal(values.length, 43);
  for (const [n, d] of values) {
    const frac = `${n}/${d}`;
    assert.ok(keys.has(`fraction_decimal:to_decimal:${frac}`));
    assert.ok(keys.has(`fraction_decimal:to_fraction:${frac}`));
    assert.ok(keys.has(`fraction_decimal:to_percent:${frac}`));
    assert.ok(keys.has(`fraction_decimal:from_percent:${frac}`));
  }
});

test("17. repeating fractions expose two directions for each of 16 values", () => {
  const keys = new Set(loadFactCatalog({ includeReference: true }).map((item) => item.semantic_key));
  assert.equal(REPEATING_VALUES.length, 16);
  for (const [n, d] of REPEATING_VALUES) {
    const frac = `${n}/${d}`;
    assert.ok(keys.has(`fraction_decimal:repeating_to_decimal:${frac}`));
    assert.ok(keys.has(`fraction_decimal:repeating_to_fraction:${frac}`));
  }
});

test("18. halves and doubles cover 50 + 50 without polluting mastery_core counts", () => {
  const keys = new Set(loadFactCatalog({ includeReference: true }).map((item) => item.semantic_key));
  let halves = 0;
  let doubles = 0;
  for (const key of keys) {
    if (/^half:\d+$/.test(key)) halves += 1;
    if (/^double:\d+$/.test(key)) doubles += 1;
  }
  assert.equal(halves, 50);
  assert.equal(doubles, 50);
  assert.equal(loadCoreCatalog().length, 173);
  assert.equal(verifyContentCounts().total, 173);
});

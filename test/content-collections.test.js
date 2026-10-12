import assert from "node:assert/strict";
import test from "node:test";

import {
  collectionOf,
  dailyCatalog,
  focusedCatalog,
  loadCoreCatalog,
  loadFactCatalog,
  verifyFactCollections,
  verifyContentCounts
} from "../src/core/content.js";

function productKey(a, b) {
  return `product:${Math.min(a, b)}:${Math.max(a, b)}`;
}

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

test("historical semantic facts keep their old ids and generated references never collide", () => {
  const core = loadCoreCatalog();
  const complete = loadFactCatalog({ includeReference: true });
  const byKey = new Map(complete.map((item) => [item.semantic_key, item]));
  for (const historical of core) assert.equal(byKey.get(historical.semantic_key)?.id, historical.id, historical.id);
  assert.equal(new Set(complete.map((item) => item.id)).size, complete.length);
  assert.equal(new Set(complete.map((item) => item.semantic_key)).size, complete.length);
});

test("unknown collection values fail closed", () => {
  assert.throws(() => collectionOf({ collection: "daily_plus" }), /unknown collection/);
});

test("manifest verifier reports historical, reference and coverage counts", () => {
  assert.deepEqual(verifyFactCollections(), {
    core: 173,
    reference: 510,
    combined: 683,
    coverage: {
      products: 190,
      complements: 127,
      squareForward: 100,
      squareInverse: 100,
      cubeForward: 20,
      cubeInverse: 20,
      commonPowerForward: 27,
      commonPowerInverse: 27
    }
  });
});

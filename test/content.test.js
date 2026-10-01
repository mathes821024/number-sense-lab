import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  loadCoreCatalog,
  verifyContentCounts,
  getRelationById,
} from "../src/core/content.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("Core Recall counts match frozen contracts: 75 (v0.1) + 47 (v0.2C) + 51 (v0.4) = 173", () => {
  const counts = verifyContentCounts();
  assert.equal(counts.squares, 32);
  assert.equal(counts.products, 32);
  assert.equal(counts.fraction_decimal, 58);
  assert.equal(counts.v01, 75);
  assert.equal(counts.inverseSquares, 16);
  assert.equal(counts.decimalToFraction, 27);
  assert.equal(counts.repeating, 4);
  assert.equal(counts.v02c, 47);
  assert.equal(counts.halves, 14);
  assert.equal(counts.complements, 12);
  assert.equal(counts.cubes, 8);
  assert.equal(counts.powers, 9);
  assert.equal(counts.special_products, 8);
  assert.equal(counts.v04, 51);
  assert.equal(counts.total, 173);
});

test("the original 75 v0.1 relations keep their ids, order and content", () => {
  const catalog = loadCoreCatalog();
  const ids = new Set(catalog.map((r) => r.id));
  assert.equal(ids.size, 173);
  const v01 = [];
  for (const name of ["squares", "products", "fractions"]) {
    const raw = JSON.parse(
      readFileSync(join(root, `content/v0.1/${name}.core.json`), "utf8"),
    );
    for (const rel of raw.relations) {
      v01.push(rel.id);
      assert.ok(ids.has(rel.id), `missing ${rel.id}`);
      const item = getRelationById(rel.id, catalog);
      assert.equal(item.canonical_answer, rel.canonical_answer);
      assert.equal(item.hook, rel.hook);
      assert.equal(item.prompt, rel.prompt);
      assert.equal(item.tier, rel.tier);
    }
  }
  assert.equal(v01.length, 75);
  // v0.1 relations stay first, in their original order.
  assert.deepEqual(catalog.slice(0, 75).map((r) => r.id), v01);
});

test("catalog-data is synced with content/v0.2c JSON source of truth", () => {
  const catalog = loadCoreCatalog();
  const files = ["squares_inverse", "fractions_inverse", "fractions_repeating"];
  let count = 0;
  for (const name of files) {
    const raw = JSON.parse(
      readFileSync(join(root, `content/v0.2c/${name}.core.json`), "utf8"),
    );
    for (const rel of raw.relations) {
      count += 1;
      const item = getRelationById(rel.id, catalog);
      assert.ok(item, `missing ${rel.id}`);
      assert.equal(item.canonical_answer, rel.canonical_answer);
      assert.equal(item.hook, rel.hook);
      assert.equal(item.answer_type, rel.answer_type);
    }
  }
  assert.equal(count, 47);
});

test("supporting examples like 35² are not trainable catalog entries", () => {
  const catalog = loadCoreCatalog();
  assert.equal(
    catalog.some(
      (r) => r.canonical_answer === "1225" || r.prompt.includes("35²") || r.id === "square-35",
    ),
    false,
  );
  const fifteen = getRelationById("square-15", catalog);
  assert.ok(fifteen.pattern.family.some((line) => line.includes("35")));
});

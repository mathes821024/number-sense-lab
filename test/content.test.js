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

test("Core Recall counts match frozen contract: 16 / 32 / 27 = 75", () => {
  const counts = verifyContentCounts();
  assert.equal(counts.squares, 16);
  assert.equal(counts.products, 32);
  assert.equal(counts.fraction_decimal, 27);
  assert.equal(counts.total, 75);
});

test("catalog-data is synced with content/v0.1 JSON source of truth", () => {
  const catalog = loadCoreCatalog();
  const ids = new Set(catalog.map((r) => r.id));
  assert.equal(ids.size, 75);

  for (const name of ["squares", "products", "fractions"]) {
    const raw = JSON.parse(
      readFileSync(join(root, `content/v0.1/${name}.core.json`), "utf8"),
    );
    for (const rel of raw.relations) {
      assert.ok(ids.has(rel.id), `missing ${rel.id}`);
      const item = getRelationById(rel.id, catalog);
      assert.equal(item.canonical_answer, rel.canonical_answer);
      assert.equal(item.hook, rel.hook);
    }
  }
});

test("supporting examples like 35² are not trainable catalog entries", () => {
  const catalog = loadCoreCatalog();
  assert.equal(
    catalog.some((r) => r.canonical_answer === "1225" || r.prompt.includes("35")),
    false,
  );
  const fifteen = getRelationById("square-15", catalog);
  assert.ok(fifteen.pattern.family.some((line) => line.includes("35")));
});

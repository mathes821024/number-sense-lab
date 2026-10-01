import assert from "node:assert/strict";
import test from "node:test";
import { buildSessionQueue, buildMistakeQueue } from "../src/core/schedule.js";
import { createRng, pairCost, sequenceCost, numbersOf, arrangeBatch } from "../src/core/shuffle.js";
import { loadCoreCatalog, filterByDomain, getRelationById, sharesFamily } from "../src/core/content.js";
import { MASTERY } from "../src/core/mastery.js";

const catalog = loadCoreCatalog();
const byId = (id) => getRelationById(id, catalog);

/** True when `len` consecutive same-domain items go strictly up or down. */
function hasNumericRun(ids, len = 3) {
  for (let i = len - 1; i < ids.length; i += 1) {
    const window = ids.slice(i - len + 1, i + 1).map((id) => byId(id));
    if (window.some((item) => item.domain !== window[0].domain)) continue;
    const values = window.map((item) => numbersOf(item).value);
    const up = values.every((v, k) => k === 0 || values[k - 1] < v);
    const down = values.every((v, k) => k === 0 || values[k - 1] > v);
    if (up || down) return true;
  }
  return false;
}

function adjacentConflicts(ids) {
  let n = 0;
  for (let i = 1; i < ids.length; i += 1) if (pairCost(byId(ids[i - 1]), byId(ids[i])) > 0) n += 1;
  return n;
}

function stableFor(ids) {
  return Object.fromEntries(
    ids.map((id) => [
      id,
      {
        status: MASTERY.STABLE,
        attempts: [
          { correct: true, day: "2026-09-01" },
          { correct: true, day: "2026-09-02" },
          { correct: true, day: "2026-09-04" },
        ],
        schedule: { due_day: "2026-12-01", bucket: "maintenance", reason: "stable-maintenance" },
      },
    ]),
  );
}

test("deterministic: same seed → same queue; injectable rng is honoured", () => {
  const a = buildSessionQueue(catalog, {}, { size: 10, day: "2026-10-01", seed: 123 });
  const b = buildSessionQueue(catalog, {}, { size: 10, day: "2026-10-01", seed: 123 });
  assert.deepEqual(a, b);
  const c = buildSessionQueue(catalog, {}, { size: 10, day: "2026-10-01", rng: createRng(123) });
  assert.deepEqual(a, c);
  const orders = new Set();
  for (let seed = 1; seed <= 12; seed += 1) {
    orders.add(buildSessionQueue(filterByDomain("squares", catalog), {}, { size: 7, day: "2026-10-01", seed, interleave: false }).join(","));
  }
  assert.ok(orders.size > 1, "different seeds give different orders");
});

test("shuffle never changes which relations are selected", () => {
  const pool = filterByDomain("products", catalog);
  const sets = new Set();
  for (let seed = 1; seed <= 20; seed += 1) {
    sets.add(buildSessionQueue(pool, {}, { size: 8, day: "2026-10-01", seed, interleave: false }).slice().sort().join(","));
  }
  assert.equal(sets.size, 1);
});

test("focused squares: no ascending id/number order, no neighbours like 6², 7²", () => {
  // 7 = the whole tier-1 batch (6² 7² 8² 9² 10² 15² 20²): an order without neighbours exists.
  for (let seed = 1; seed <= 30; seed += 1) {
    const ids = buildSessionQueue(filterByDomain("squares", catalog), {}, { size: 7, day: "2026-10-01", seed, interleave: false });
    const numbers = ids.map((id) => numbersOf(byId(id)).n);
    const sortedUp = numbers.slice().sort((x, y) => x - y);
    assert.notDeepEqual(numbers, sortedUp);
    assert.equal(adjacentConflicts(ids), 0, `seed ${seed}: ${ids}`);
    assert.equal(hasNumericRun(ids), false, `seed ${seed}: ${ids}`);
  }
});

test("focused products: no shared-factor chain like 6×12, 7×12", () => {
  for (let seed = 1; seed <= 30; seed += 1) {
    const ids = buildSessionQueue(filterByDomain("products", catalog), {}, { size: 4, day: "2026-10-01", seed, interleave: false });
    assert.equal(adjacentConflicts(ids), 0, `seed ${seed}: ${ids}`);
  }
});

test("when a clash is unavoidable inside priority, the shuffle keeps it minimal", () => {
  // Selection (tier, then id) takes 11², 12², 13² into the tier-2 batch; any
  // order of those three has one neighbour pair. Priority is not broken to hide it.
  for (let seed = 1; seed <= 30; seed += 1) {
    const ids = buildSessionQueue(filterByDomain("squares", catalog), {}, { size: 10, day: "2026-10-01", seed, interleave: false });
    assert.ok(adjacentConflicts(ids) <= 1, `seed ${seed}: ${ids}`);
    const products = buildSessionQueue(filterByDomain("products", catalog), {}, { size: 10, day: "2026-10-01", seed, interleave: false });
    assert.ok(adjacentConflicts(products) <= 1, `seed ${seed}: ${products}`);
  }
});

test("priority preserved: shaky before learning-wrong before learning-right before unpracticed", () => {
  const relations = {
    "square-19": { status: MASTERY.LEARNING, attempts: [{ correct: true, day: "2026-09-30" }], schedule: { due_day: "2026-10-01", bucket: "1d", reason: "first-correct" } },
    "square-18": { status: MASTERY.LEARNING, attempts: [{ correct: false, day: "2026-09-30" }], schedule: { due_day: "2026-10-01", bucket: "1d", reason: "wrong" } },
    "square-17": { status: MASTERY.SHAKY, attempts: [{ correct: false, day: "2026-09-30" }], schedule: { due_day: "2026-09-30", bucket: "1d", reason: "stable-wrong" } },
    "square-11": { status: MASTERY.LEARNING, attempts: [{ correct: false, day: "2026-09-30" }], schedule: { due_day: "2026-10-01", bucket: "1d", reason: "wrong" } },
  };
  for (let seed = 1; seed <= 20; seed += 1) {
    const ids = buildSessionQueue(filterByDomain("squares", catalog), relations, { size: 8, day: "2026-10-01", seed, interleave: false });
    assert.equal(ids[0], "square-17");
    assert.deepEqual(new Set(ids.slice(1, 3)), new Set(["square-18", "square-11"]));
    assert.equal(ids[3], "square-19");
    for (const id of ids.slice(4)) assert.equal(relations[id], undefined);
  }
});

test("unpracticed tier order is kept: tier 1 before tier 2", () => {
  for (let seed = 1; seed <= 10; seed += 1) {
    const ids = buildSessionQueue(filterByDomain("squares", catalog), {}, { size: 10, day: "2026-10-01", seed, interleave: false });
    const tiers = ids.map((id) => byId(id).tier);
    assert.deepEqual(tiers, tiers.slice().sort((a, b) => a - b));
  }
});

test("daily keeps domain interleave with shuffle inside each domain", () => {
  const ids = buildSessionQueue(catalog, {}, { size: 12, day: "2026-10-01", seed: 77 });
  const domains = ids.map((id) => byId(id).domain);
  assert.deepEqual(domains.slice(0, 3), ["squares", "products", "fraction_decimal"]);
  for (let i = 1; i < domains.length; i += 1) assert.notEqual(domains[i], domains[i - 1]);
  assert.equal(adjacentConflicts(ids), 0);
});

test("inverse pair members are not adjacent when avoidable", () => {
  // Both directions of 15² and 12² are due learning items in one batch.
  const due = (correct) => ({ status: MASTERY.LEARNING, attempts: [{ correct, day: "2026-09-30" }], schedule: { due_day: "2026-10-01", bucket: "1d", reason: correct ? "first-correct" : "wrong" } });
  const relations = {
    "square-15": due(false),
    "isquare-15": due(false),
    "square-12": due(false),
    "isquare-12": due(false),
    "square-19": due(false),
  };
  for (let seed = 1; seed <= 40; seed += 1) {
    const ids = buildSessionQueue(filterByDomain("squares", catalog), relations, { size: 5, day: "2026-10-01", seed, interleave: false });
    assert.equal(ids.length, 5);
    for (let i = 1; i < ids.length; i += 1) {
      assert.equal(sharesFamily(byId(ids[i - 1]), byId(ids[i])), false, `seed ${seed}: ${ids}`);
    }
  }
});

test("mistake practice batches are shuffled but never cross", () => {
  const wrong = (id, due) => [id, { status: MASTERY.LEARNING, attempts: [{ correct: false, day: "2026-09-30" }], schedule: { due_day: due, bucket: "1d", reason: "wrong" } }];
  const relations = Object.fromEntries([
    wrong("square-6", "2026-10-01"), wrong("square-7", "2026-10-01"), wrong("square-8", "2026-10-01"), wrong("square-9", "2026-10-01"),
    wrong("square-10", "2026-10-05"), wrong("square-11", "2026-10-05"), wrong("square-12", "2026-10-05"),
  ]);
  const orders = new Set();
  for (let seed = 1; seed <= 20; seed += 1) {
    const { ids } = buildMistakeQueue(catalog, relations, { day: "2026-10-01", seed });
    assert.deepEqual(new Set(ids.slice(0, 4)), new Set(["square-6", "square-7", "square-8", "square-9"]));
    assert.deepEqual(new Set(ids.slice(4)), new Set(["square-10", "square-11", "square-12"]));
    orders.add(ids.join(","));
  }
  assert.ok(orders.size > 1);
});

test("arrangeBatch is a permutation and minimises cost", () => {
  const items = ["square-6", "square-7", "square-8", "square-9", "square-10", "square-11"].map(byId);
  const out = arrangeBatch(items, createRng(5));
  assert.deepEqual(out.map((i) => i.id).sort(), items.map((i) => i.id).sort());
  assert.ok(sequenceCost(out) < sequenceCost(items));
});

test("10+ consecutive items of a long daily session have no mechanical order", () => {
  const relations = stableFor([]);
  for (let seed = 1; seed <= 15; seed += 1) {
    const ids = buildSessionQueue(catalog, relations, { size: 15, day: "2026-10-01", seed });
    assert.equal(ids.length, 15);
    assert.equal(adjacentConflicts(ids), 0);
    const perDomain = {};
    for (const id of ids) (perDomain[byId(id).domain] ||= []).push(id);
    // A 3-long rise can be forced by priority; a 4-long run never appears.
    for (const list of Object.values(perDomain)) assert.equal(hasNumericRun(list, 4), false, `seed ${seed} ${list}`);
  }
});

/**
 * Controlled Shuffle (deterministic, injectable RNG).
 *
 * Priority batches are decided first by the scheduler. This module only
 * reorders items INSIDE one batch. It tries to avoid:
 *   - the same relation family next to each other (incl. inverse_pair)
 *   - numerically consecutive neighbours (6², 7²) / shared factor chains (6×12, 7×12)
 *   - three in a row going strictly up or down
 * It never moves an item into another batch.
 */
import { sharesFamily } from "./content.js";

/** FNV-1a 32-bit. */
export function hashSeed(value) {
  const text = String(value ?? "");
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/** mulberry32 — deterministic for a given seed. Returns () => [0, 1). */
export function createRng(seed = 1) {
  let a = (typeof seed === "number" ? seed : hashSeed(seed)) >>> 0;
  return function rng() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleWith(list, rng) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Numbers that describe what a relation "is about", from its id. */
export function numbersOf(item) {
  const id = String(item?.id || "");
  let match = /^i?square-(\d+)$/.exec(id);
  if (match) return { kind: "square", n: Number(match[1]), value: Number(match[1]) };
  match = /^product-(\d+)-(\d+)$/.exec(id);
  if (match) {
    const a = Number(match[1]);
    const b = Number(match[2]);
    return { kind: "product", factors: [a, b], value: a * b };
  }
  match = /^i?fraction-(\d+)-(\d+)$/.exec(id);
  if (match) {
    const num = Number(match[1]);
    const den = Number(match[2]);
    return { kind: "fraction", num, den, value: num / den };
  }
  return { kind: "other", value: null };
}

/** Cost of placing b directly after a. 0 = fine. */
export function pairCost(a, b) {
  if (!a || !b) return 0;
  let cost = 0;
  if (sharesFamily(a, b)) cost += 10;
  if (a.domain !== b.domain) return cost;
  const x = numbersOf(a);
  const y = numbersOf(b);
  if (x.kind === "square" && y.kind === "square") {
    if (Math.abs(x.n - y.n) === 1) cost += 5;
  } else if (x.kind === "product" && y.kind === "product") {
    if (x.factors.some((f) => y.factors.includes(f))) cost += 5;
  } else if (x.kind === "fraction" && y.kind === "fraction") {
    if (x.den === y.den) cost += 4;
    else if (x.num === y.num && Math.abs(x.den - y.den) <= 1) cost += 3;
  }
  return cost;
}

function monotoneCost(a, b, c) {
  if (!a || !b || !c) return 0;
  if (a.domain !== b.domain || b.domain !== c.domain) return 0;
  const x = numbersOf(a).value;
  const y = numbersOf(b).value;
  const z = numbersOf(c).value;
  if (x === null || y === null || z === null) return 0;
  if ((x < y && y < z) || (x > y && y > z)) return 2;
  return 0;
}

/** Total cost of a sequence (used by tests and by the arranger). */
export function sequenceCost(seq) {
  let cost = 0;
  for (let i = 1; i < seq.length; i += 1) {
    cost += pairCost(seq[i - 1], seq[i]);
    if (i >= 2) cost += monotoneCost(seq[i - 2], seq[i - 1], seq[i]);
  }
  return cost;
}

const TRIES = 32;

/** One randomized greedy pass over a single batch. */
function greedyPass(batch, rng, context) {
  const remaining = shuffleWith(batch, rng);
  const seq = [];
  const tail = context.slice(-2);
  while (remaining.length) {
    const prev = seq.length ? seq[seq.length - 1] : tail[tail.length - 1];
    const prev2 =
      seq.length >= 2 ? seq[seq.length - 2] : seq.length === 1 ? tail[tail.length - 1] : tail[tail.length - 2];
    let pick = 0;
    let pickCost = Infinity;
    for (let i = 0; i < remaining.length; i += 1) {
      const c = pairCost(prev, remaining[i]) + monotoneCost(prev2, prev, remaining[i]);
      if (c < pickCost) {
        pickCost = c;
        pick = i;
        if (c === 0) break;
      }
    }
    seq.push(remaining.splice(pick, 1)[0]);
  }
  return seq;
}

function splitBatches(items, batchKey) {
  const batches = [];
  let i = 0;
  while (i < items.length) {
    const key = batchKey(items[i]);
    let j = i;
    while (j < items.length && batchKey(items[j]) === key) j += 1;
    batches.push(items.slice(i, j));
    i = j;
  }
  return batches;
}

/**
 * Arrange a priority-ordered list. Consecutive items with the same batch key
 * form one batch; batches keep their order and never exchange items.
 * Several seeded restarts over the whole stream keep the lowest total cost,
 * so a batch boundary is also considered.
 * @param {object[]} items priority order
 * @param {(item: object) => string} batchKey
 * @param {() => number} rng
 * @param {object[]} [context] already-placed tail of the same stream
 */
export function arrangeByBatches(items, batchKey, rng, context = []) {
  if (items.length <= 1) return items.slice();
  const batches = splitBatches(items, batchKey);
  const tail = context.slice(-2);
  let best = null;
  let bestCost = Infinity;
  for (let attempt = 0; attempt < TRIES; attempt += 1) {
    const seq = [];
    for (const batch of batches) {
      seq.push(...(batch.length <= 1 ? batch : greedyPass(batch, rng, tail.concat(seq))));
    }
    const cost = sequenceCost(tail.concat(seq));
    if (cost < bestCost) {
      best = seq;
      bestCost = cost;
      if (cost === 0) break;
    }
  }
  return best;
}

/** Reorder a single batch (see arrangeByBatches). */
export function arrangeBatch(batch, rng, context = []) {
  return arrangeByBatches(batch, () => "one", rng, context);
}

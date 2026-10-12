/**
 * Content loader for Core Recall relations.
 * Source of truth: content/v0.1, content/v0.2c and content/v0.4 *.core.json
 * (synced into catalog-data.js by scripts/sync-content.mjs).
 * Supporting examples in pattern.family, knowledge maps and Structured
 * Practice entries are NOT trainable and have no mastery.
 */
import { CORE_RELATIONS } from "./catalog-data.js";
import { REFERENCE_RELATIONS } from "./reference-catalog-data.js";

/**
 * Released domains only (docs/architecture/03_v04_content_compatibility.md §2).
 * Labels are the specialist card names (docs/ux/04_v04_specialist_training.md §2).
 */
export const DOMAIN_LABELS = {
  squares: "平方",
  products: "常用乘积",
  fraction_decimal: "分数到小数",
  halves: "半数与翻倍",
  complements: "补数",
  cubes: "立方",
  powers: "常见幂",
  special_products: "凑整乘积家族",
};

/** Frozen catalog order; a registration list, not a domain-level unlock. */
export const DOMAIN_ORDER = [
  "squares",
  "products",
  "fraction_decimal",
  "halves",
  "complements",
  "cubes",
  "powers",
  "special_products",
];

export const ANSWER_TYPES = ["integer", "decimal", "fraction_fields", "decimal_repeating"];
export const COLLECTIONS = ["mastery_core", "reference_practice", "exploration_only"];

/** @typedef {{ id: string, type: 'inverse_pair'|'cyclic_rotation'|'scaling', role?: string, counterpart?: string }} RelationFamily */

/** @typedef {{
 *  id: string,
 *  domain: 'squares'|'products'|'fraction_decimal'|'halves'|'complements'|'cubes'|'powers'|'special_products',
 *  level: string,
 *  tier: number,
 *  hook_type: string,
 *  prompt: string,
 *  canonical_answer: string,
 *  answer_type: 'integer'|'decimal'|'fraction_fields'|'decimal_repeating',
 *  direction: 'forward'|'inverse',
 *  families: RelationFamily[],
 *  entry_after: string|null,
 *  relation: string,
 *  hook: string,
 *  pattern: { check: string, family: string[] },
 *  frames: { title: string, detail: string }[],
 *  integerOnly: boolean,
 *  needsDecimalPoint: boolean,
 *  fractionFields: boolean,
 *  repeatingBlock: boolean,
 * }} RelationItem */

let cachedCatalog = null;
let cachedReferenceCatalog = null;

function productKey(a, b) {
  return `product:${Math.min(a, b)}:${Math.max(a, b)}`;
}

export function semanticKeyOf(item) {
  if (typeof item?.semantic_key === "string" && item.semantic_key.length > 0) {
    return item.semantic_key;
  }
  let match = item?.prompt?.match(/^(\d+) × (\d+) = \?$/);
  if (item?.domain === "products" && match) return productKey(Number(match[1]), Number(match[2]));
  match = item?.prompt?.match(/^(\d+) \+ \? = (\d+)$/);
  if (item?.domain === "complements" && match) {
    return `complement:${Number(match[2])}:${Number(match[1])}`;
  }
  match = item?.id?.match(/^square-(\d+)$/);
  if (match) return `square:forward:${Number(match[1])}`;
  match = item?.id?.match(/^isquare-(\d+)$/);
  if (match) return `square:inverse:${Number(match[1])}`;
  match = item?.id?.match(/^cube-(\d+)$/);
  if (match) return `cube:forward:${Number(match[1])}`;
  match = item?.id?.match(/^icube-(\d+)$/);
  if (match) return `cube:inverse:${Number(match[1])}`;
  match = item?.id?.match(/^pow-(\d+)-(\d+)$/);
  if (match) return `power:forward:${Number(match[1])}:${Number(match[2])}`;
  match = item?.id?.match(/^ipow-(\d+)-(\d+)$/);
  if (match) return `power:inverse:${Number(match[1])}:${Number(match[2])}`;
  return `legacy:${item?.id}`;
}

export function collectionOf(item) {
  const collection = item?.collection || "mastery_core";
  if (!COLLECTIONS.includes(collection)) {
    throw new Error(`CONTRACT_CONFLICT: unknown collection ${collection}`);
  }
  return collection;
}

/**
 * @returns {RelationItem[]}
 */
export function loadCoreCatalog() {
  if (!cachedCatalog) cachedCatalog = CORE_RELATIONS.map(normalizeRelation);
  return cachedCatalog.map((item) => item);
}

export function loadFactCatalog({ includeReference = false } = {}) {
  const core = loadCoreCatalog();
  if (!includeReference) return core;
  if (!cachedReferenceCatalog) cachedReferenceCatalog = REFERENCE_RELATIONS.map(normalizeRelation);
  const combined = [...core, ...cachedReferenceCatalog];
  const ids = new Set();
  const semanticKeys = new Set();
  for (const item of combined) {
    if (ids.has(item.id)) throw new Error(`CONTENT_ID_CONFLICT: duplicate ${item.id}`);
    if (semanticKeys.has(item.semantic_key)) {
      throw new Error(`CONTENT_ID_CONFLICT: duplicate semantic fact ${item.semantic_key}`);
    }
    ids.add(item.id);
    semanticKeys.add(item.semantic_key);
  }
  return combined.map((item) => item);
}

export function dailyCatalog(catalog = loadCoreCatalog()) {
  return catalog.filter((item) => collectionOf(item) === "mastery_core");
}

export function focusedCatalog(domain, collection = "mastery_core") {
  if (!COLLECTIONS.includes(collection)) {
    throw new Error(`CONTRACT_CONFLICT: unknown collection ${collection}`);
  }
  return loadFactCatalog({ includeReference: collection === "reference_practice" })
    .filter((item) => item.domain === domain && collectionOf(item) === collection);
}

export function verifyFactCollections(catalog = loadFactCatalog({ includeReference: true })) {
  const keys = new Set(catalog.map((item) => item.semantic_key));
  const requireKey = (key) => {
    if (!keys.has(key)) throw new Error(`CONTRACT_CONFLICT: missing semantic fact ${key}`);
  };

  let products = 0;
  for (let a = 1; a <= 19; a += 1) {
    for (let b = a; b <= 19; b += 1) {
      requireKey(productKey(a, b));
      products += 1;
    }
  }
  let complements = 0;
  for (const target of [10, 20, 100]) {
    for (let operand = 1; operand < target; operand += 1) {
      requireKey(`complement:${target}:${operand}`);
      complements += 1;
    }
  }
  for (let value = 1; value <= 100; value += 1) {
    requireKey(`square:forward:${value}`);
    requireKey(`square:inverse:${value}`);
  }
  for (let value = 1; value <= 20; value += 1) {
    requireKey(`cube:forward:${value}`);
    requireKey(`cube:inverse:${value}`);
  }
  let commonPowers = 0;
  for (const [base, end] of [[2, 10], [3, 6], [5, 5], [10, 6]]) {
    for (let exponent = 1; exponent <= end; exponent += 1) {
      const forwardKey = exponent === 2
        ? `square:forward:${base}`
        : exponent === 3
          ? `cube:forward:${base}`
          : `power:forward:${base}:${exponent}`;
      requireKey(forwardKey);
      requireKey(`power:inverse:${base}:${exponent}`);
      commonPowers += 1;
    }
  }

  const core = catalog.filter((item) => collectionOf(item) === "mastery_core").length;
  const reference = catalog.filter((item) => collectionOf(item) === "reference_practice").length;
  return {
    core,
    reference,
    combined: catalog.length,
    coverage: {
      products,
      complements,
      squareForward: 100,
      squareInverse: 100,
      cubeForward: 20,
      cubeInverse: 20,
      commonPowerForward: commonPowers,
      commonPowerInverse: commonPowers
    }
  };
}

/**
 * @param {object} raw
 * @returns {RelationItem}
 */
export function normalizeRelation(raw) {
  const answerType = ANSWER_TYPES.includes(raw.answer_type) ? raw.answer_type : "integer";
  return {
    ...raw,
    collection: collectionOf(raw),
    semantic_key: semanticKeyOf(raw),
    answer_type: answerType,
    direction: raw.direction === "inverse" ? "inverse" : "forward",
    families: Array.isArray(raw.families) ? raw.families : [],
    entry_after: raw.entry_after || null,
    integerOnly: answerType === "integer",
    needsDecimalPoint: answerType === "decimal",
    fractionFields: answerType === "fraction_fields",
    repeatingBlock: answerType === "decimal_repeating",
  };
}

/**
 * @param {string} id
 * @param {RelationItem[]} [catalog]
 */
export function getRelationById(id, catalog = loadCoreCatalog()) {
  return catalog.find((item) => item.id === id) || null;
}

/**
 * @param {string|null|undefined} domain
 * @param {RelationItem[]} [catalog]
 */
export function filterByDomain(domain, catalog = loadCoreCatalog()) {
  if (!domain) return catalog.slice();
  return catalog.filter((item) => item.domain === domain);
}

/** Family ids a relation belongs to (content layer only). */
export function familyIds(item) {
  return (item?.families || []).map((family) => family.id);
}

/** Two relations are one relation family when any family id matches. */
export function sharesFamily(a, b) {
  if (!a || !b) return false;
  const ids = new Set(familyIds(a));
  return familyIds(b).some((id) => ids.has(id));
}

/**
 * entry_after is a first-entry unlock only (v0.2C OQ2):
 * - no entry_after → always available
 * - the relation already has any attempt → independent, always available
 * - otherwise the counterpart must be stable
 * @param {RelationItem} item
 * @param {Record<string, {status?: string, attempts?: object[]}>} relations
 */
export function isEntryUnlocked(item, relations = {}) {
  if (!item?.entry_after) return true;
  const own = relations[item.id];
  if (own && Array.isArray(own.attempts) && own.attempts.length > 0) return true;
  return relations[item.entry_after]?.status === "stable";
}

export const FROZEN_COUNTS = {
  squares: 32,
  products: 32,
  fraction_decimal: 58,
  halves: 14,
  complements: 12,
  cubes: 8,
  powers: 9,
  special_products: 8,
  total: 173,
  v01: 75,
  v02c: 47,
  v04: 51,
};

/** The v0.4 domains (whole domains only; docs/curriculum/06_v04_content_contract.md §6). */
const V04_DOMAINS = ["halves", "complements", "cubes", "powers", "special_products"];

/**
 * Verify frozen Core Recall counts. Throws on mismatch for CONTRACT_CONFLICT.
 * Exact per released domain; unknown domains are rejected.
 * v0.1: squares 16, products 32, fraction→decimal 27 (= 75)
 * v0.2C: inverse squares 16, decimal→fraction 27, repeating 4 (= 47)
 * v0.4: halves 14, complements 12, cubes 8, powers 9, special_products 8 (= 51)
 */
export function verifyContentCounts(catalog = loadCoreCatalog()) {
  const counts = Object.fromEntries(DOMAIN_ORDER.map((domain) => [domain, 0]));
  const parts = { inverseSquares: 0, decimalToFraction: 0, repeating: 0 };
  const ids = new Set();
  for (const item of catalog) {
    if (!Object.hasOwn(counts, item.domain)) {
      throw new Error(`CONTRACT_CONFLICT: unknown domain ${item.domain}`);
    }
    if (ids.has(item.id)) throw new Error(`CONTENT_ID_CONFLICT: duplicate ${item.id}`);
    ids.add(item.id);
    counts[item.domain] += 1;
    if (item.direction === "inverse" && item.domain === "squares") parts.inverseSquares += 1;
    if (item.direction === "inverse" && item.answer_type === "fraction_fields") parts.decimalToFraction += 1;
    if (item.answer_type === "decimal_repeating") parts.repeating += 1;
  }
  const expected = Object.fromEntries(DOMAIN_ORDER.map((domain) => [domain, FROZEN_COUNTS[domain]]));
  for (const key of Object.keys(expected)) {
    if (counts[key] !== expected[key]) {
      throw new Error(
        `CONTRACT_CONFLICT: ${key} expected ${expected[key]}, got ${counts[key]}`,
      );
    }
  }
  const expectedParts = { inverseSquares: 16, decimalToFraction: 27, repeating: 4 };
  for (const key of Object.keys(expectedParts)) {
    if (parts[key] !== expectedParts[key]) {
      throw new Error(
        `CONTRACT_CONFLICT: ${key} expected ${expectedParts[key]}, got ${parts[key]}`,
      );
    }
  }
  const total = catalog.length;
  if (total !== FROZEN_COUNTS.total) {
    throw new Error(`CONTRACT_CONFLICT: total expected ${FROZEN_COUNTS.total}, got ${total}`);
  }
  const v02c = parts.inverseSquares + parts.decimalToFraction + parts.repeating;
  const v04 = V04_DOMAINS.reduce((sum, domain) => sum + counts[domain], 0);
  return { ...counts, ...parts, v01: total - v02c - v04, v02c, v04, total };
}

export function domainLabel(domain) {
  return DOMAIN_LABELS[domain] || domain;
}

/**
 * Content loader for Core Recall relations.
 * Source of truth: content/v0.1, content/v0.2c and content/v0.4 *.core.json
 * (synced into catalog-data.js by scripts/sync-content.mjs).
 * Supporting examples in pattern.family, knowledge maps and Structured
 * Practice entries are NOT trainable and have no mastery.
 */
import { CORE_RELATIONS } from "./catalog-data.js";

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

export const ANSWER_TYPES = ["integer", "decimal", "fraction", "decimal_repeating"];

/** @typedef {{ id: string, type: 'inverse_pair'|'cyclic_rotation'|'scaling', role?: string, counterpart?: string }} RelationFamily */

/** @typedef {{
 *  id: string,
 *  domain: 'squares'|'products'|'fraction_decimal'|'halves'|'complements'|'cubes'|'powers'|'special_products',
 *  level: string,
 *  tier: number,
 *  hook_type: string,
 *  prompt: string,
 *  canonical_answer: string,
 *  answer_type: 'integer'|'decimal'|'fraction'|'decimal_repeating',
 *  direction: 'forward'|'inverse',
 *  families: RelationFamily[],
 *  entry_after: string|null,
 *  relation: string,
 *  hook: string,
 *  pattern: { check: string, family: string[] },
 *  frames: { title: string, detail: string }[],
 *  integerOnly: boolean,
 *  needsDecimalPoint: boolean,
 *  needsSlash: boolean,
 *  repeatingBlock: boolean,
 * }} RelationItem */

let cachedCatalog = null;

/**
 * @returns {RelationItem[]}
 */
export function loadCoreCatalog() {
  if (!cachedCatalog) cachedCatalog = CORE_RELATIONS.map(normalizeRelation);
  return cachedCatalog.map((item) => item);
}

/**
 * @param {object} raw
 * @returns {RelationItem}
 */
export function normalizeRelation(raw) {
  const answerType = ANSWER_TYPES.includes(raw.answer_type) ? raw.answer_type : "integer";
  return {
    ...raw,
    answer_type: answerType,
    direction: raw.direction === "inverse" ? "inverse" : "forward",
    families: Array.isArray(raw.families) ? raw.families : [],
    entry_after: raw.entry_after || null,
    integerOnly: answerType === "integer",
    needsDecimalPoint: answerType === "decimal",
    needsSlash: answerType === "fraction",
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
    if (item.direction === "inverse" && item.answer_type === "fraction") parts.decimalToFraction += 1;
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

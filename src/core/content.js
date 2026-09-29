/**
 * Content loader for Core Recall relations.
 * Source of truth: content/v0.1/*.core.json (synced into catalog-data.js).
 * Supporting examples in pattern.family are NOT trainable and have no mastery.
 */
import { CORE_RELATIONS } from "./catalog-data.js";

export const DOMAIN_LABELS = {
  squares: "平方",
  products: "常用乘积",
  fraction_decimal: "分数到小数",
};

export const DOMAIN_ORDER = ["squares", "products", "fraction_decimal"];

/** @typedef {{
 *  id: string,
 *  domain: 'squares'|'products'|'fraction_decimal',
 *  level: string,
 *  tier: number,
 *  hook_type: string,
 *  prompt: string,
 *  canonical_answer: string,
 *  answer_type: 'integer'|'decimal',
 *  relation: string,
 *  hook: string,
 *  pattern: { check: string, family: string[] },
 *  frames: { title: string, detail: string }[],
 *  integerOnly: boolean,
 *  needsDecimalPoint: boolean,
 * }} RelationItem */

/**
 * @returns {RelationItem[]}
 */
export function loadCoreCatalog() {
  return CORE_RELATIONS.map(normalizeRelation);
}

/**
 * @param {object} raw
 * @returns {RelationItem}
 */
export function normalizeRelation(raw) {
  const answerType = raw.answer_type === "decimal" ? "decimal" : "integer";
  return {
    ...raw,
    answer_type: answerType,
    integerOnly: answerType === "integer",
    needsDecimalPoint: answerType === "decimal",
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

/**
 * Verify frozen Core Recall counts. Throws on mismatch for CONTRACT_CONFLICT.
 */
export function verifyContentCounts(catalog = loadCoreCatalog()) {
  const counts = {
    squares: 0,
    products: 0,
    fraction_decimal: 0,
  };
  for (const item of catalog) {
    if (!(item.domain in counts)) {
      throw new Error(`CONTRACT_CONFLICT: unknown domain ${item.domain}`);
    }
    counts[item.domain] += 1;
  }
  const expected = { squares: 16, products: 32, fraction_decimal: 27 };
  for (const key of Object.keys(expected)) {
    if (counts[key] !== expected[key]) {
      throw new Error(
        `CONTRACT_CONFLICT: ${key} expected ${expected[key]}, got ${counts[key]}`,
      );
    }
  }
  const total = catalog.length;
  if (total !== 75) {
    throw new Error(`CONTRACT_CONFLICT: total expected 75, got ${total}`);
  }
  return { ...counts, total };
}

export function domainLabel(domain) {
  return DOMAIN_LABELS[domain] || domain;
}

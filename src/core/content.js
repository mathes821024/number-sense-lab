/**
 * Content loader for Core Recall relations.
 * Source of truth: content/v0.1, content/v0.2c and content/v0.4 *.core.json
 * (synced into catalog-data.js by scripts/sync-content.mjs).
 * Supporting examples in pattern.family, knowledge maps and Structured
 * Practice entries are NOT trainable and have no mastery.
 */
import { CORE_RELATIONS } from "./catalog-data.js";
import { REFERENCE_RELATIONS } from "./reference-catalog-data.js";
import {
  PRODUCT_PRACTICE_VARIANTS,
  PRODUCT_PRACTICE_VARIANT_STATS,
} from "./practice-variants-data.js";

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

export const ANSWER_TYPES = ["integer", "decimal", "fraction_fields", "decimal_repeating", "percent_number"];
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
  match = item?.id?.match(/^square-(\d+)$/) || item?.id?.match(/^ref-square-(\d+)$/);
  if (match) return `square:forward:${Number(match[1])}`;
  match = item?.id?.match(/^isquare-(\d+)$/) || item?.id?.match(/^ref-isquare-(\d+)$/);
  if (match) return `square:inverse:${Number(match[1])}`;
  match = item?.id?.match(/^cube-(\d+)$/) || item?.id?.match(/^ref-cube-(\d+)$/);
  if (match) return `cube:forward:${Number(match[1])}`;
  match = item?.id?.match(/^icube-(\d+)$/) || item?.id?.match(/^ref-icube-(\d+)$/);
  if (match) return `cube:inverse:${Number(match[1])}`;
  match = item?.id?.match(/^pow-(\d+)-(\d+)$/) || item?.id?.match(/^ref-power-(\d+)-(\d+)$/);
  if (match) return `power:forward:${Number(match[1])}:${Number(match[2])}`;
  match = item?.id?.match(/^ipow-(\d+)-(\d+)$/) || item?.id?.match(/^ref-ipower-(\d+)-(\d+)$/);
  if (match) return `power:inverse:${Number(match[1])}:${Number(match[2])}`;
  match = item?.id?.match(/^half-(\d+)$/) || item?.id?.match(/^ref-half-(\d+)$/);
  if (match) return `half:${Number(match[1])}`;
  match = item?.id?.match(/^double-(\d+)$/) || item?.id?.match(/^ref-double-(\d+)$/);
  if (match) return `double:${Number(match[1])}`;
  match = item?.prompt?.match(/^(\d+) 的一半是？$/);
  if (item?.domain === "halves" && match) return `half:${Number(match[1])}`;
  match = item?.prompt?.match(/^(\d+) 翻倍是？$/);
  if (item?.domain === "halves" && match) return `double:${Number(match[1])}`;

  match = item?.id?.match(/^i?fraction-(\d+)-(\d+)$/)
    || item?.id?.match(/^ref-(?:i)?fraction-(\d+)-(\d+)$/)
    || item?.id?.match(/^ref-(?:i)?rep-(\d+)-(\d+)$/)
    || item?.id?.match(/^ref-(?:i)?pct-(\d+)-(\d+)$/);
  if (match && item?.domain === "fraction_decimal") {
    const frac = `${Number(match[1])}/${Number(match[2])}`;
    if (item.answer_type === "percent_number" || /^ref-pct-/.test(item.id || "")) {
      return `fraction_decimal:to_percent:${frac}`;
    }
    if (/^ref-ipct-/.test(item.id || "") || (item.answer_type === "fraction_fields" && String(item.prompt || "").includes("%"))) {
      return `fraction_decimal:from_percent:${frac}`;
    }
    if (item.answer_type === "decimal_repeating" || /^ref-rep-/.test(item.id || "")) {
      return `fraction_decimal:repeating_to_decimal:${frac}`;
    }
    if (/^ref-irep-/.test(item.id || "") || (item.answer_type === "fraction_fields" && /\.\(/.test(String(item.prompt || "")))) {
      return `fraction_decimal:repeating_to_fraction:${frac}`;
    }
    if (item.answer_type === "fraction_fields" || /^i?fraction-/.test(item.id || "") && item.direction === "inverse" || /^ref-ifraction-/.test(item.id || "")) {
      return `fraction_decimal:to_fraction:${frac}`;
    }
    return `fraction_decimal:to_decimal:${frac}`;
  }
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

function loadReferenceCatalog() {
  if (!cachedReferenceCatalog) {
    cachedReferenceCatalog = REFERENCE_RELATIONS.map((item) => normalizeRelation({
      ...item,
      collection: item.collection || "reference_practice",
      answer_type: item.answer_type || "integer",
    }));
  }
  return cachedReferenceCatalog;
}

function expandProductVariantRow(relationId, row) {
  const [suffix, prompt, canonical_answer] = row;
  let family_key = null;
  const multiply = /^(\d+) × (\d+) = \?$/.exec(prompt);
  const divide = /^(\d+) ÷ (\d+) = \?$/.exec(prompt);
  if (multiply) {
    const a = Number(multiply[1]);
    const b = Number(multiply[2]);
    family_key = `product:${Math.min(a, b)}:${Math.max(a, b)}`;
  } else if (divide) {
    // family_key recovered from relationId host via multiply sibling when needed;
    // parse product÷divisor and use canonical quotient to rebuild pair.
    const product = Number(divide[1]);
    const divisor = Number(divide[2]);
    const quotient = Number(canonical_answer);
    family_key = `product:${Math.min(divisor, quotient)}:${Math.max(divisor, quotient)}`;
  }
  return {
    practice_variant_id: `${relationId}:${suffix}`,
    direction: suffix,
    prompt,
    canonical_answer: String(canonical_answer),
    answer_type: "integer",
    family_key,
  };
}

/** Materialized multiply/divide practice directions for one product relation. */
export function practiceVariantsFor(relationId) {
  const rows = PRODUCT_PRACTICE_VARIANTS[relationId];
  if (!rows) return [];
  return rows.map((row) => expandProductVariantRow(relationId, row));
}

export function listProductPracticeVariants() {
  const out = [];
  for (const relationId of Object.keys(PRODUCT_PRACTICE_VARIANTS)) {
    out.push(...practiceVariantsFor(relationId));
  }
  return out;
}

export function productPracticeVariantStats() {
  return { ...PRODUCT_PRACTICE_VARIANT_STATS };
}

/**
 * Resolve a practice_variant_id to a presentable practice item.
 * The variant keeps the family's historical relation_id; practice_variant_id
 * is never a mastery identity.
 */
export function resolvePracticeVariant(practiceVariantId, catalog) {
  if (typeof practiceVariantId !== "string" || !practiceVariantId.includes(":")) return null;
  const colon = practiceVariantId.lastIndexOf(":");
  const relationId = practiceVariantId.slice(0, colon);
  const variants = practiceVariantsFor(relationId);
  const variant = variants.find((entry) => entry.practice_variant_id === practiceVariantId);
  if (! variant) return null;
  const base = getRelationById(relationId, catalog) || {
    id: relationId,
    domain: relationId.includes("cube") ? "cubes" : relationId.includes("square") || relationId.includes("isquare") ? "squares" : "products",
    collection: relationId.startsWith("ref-") ? "reference_practice" : "mastery_core",
    answer_type: "integer",
    direction: "forward",
    families: [],
    entry_after: null,
    pattern: { check: "先判断结果范围，再用逆运算或相邻事实检查。", family: [] },
    frames: [],
    hook: "",
    relation: "",
    level: "reference_practice",
    tier: 3,
    hook_type: "definition",
  };
  return normalizeRelation({
    ...base,
    prompt: variant.prompt,
    canonical_answer: variant.canonical_answer,
    answer_type: variant.answer_type || base.answer_type || "integer",
    direction: variant.direction === "forward" || variant.direction === "multiply" ? "forward" : "inverse",
    practice_variant_id: variant.practice_variant_id,
    family_key: variant.family_key,
    practice_direction: variant.direction,
    relation_id: relationId,
  });
}

/**
 * Present inverse squares/cubes as arithmetic roots during reference practice.
 * Does not rewrite mastery relation prompts or ids.
 */
export function referencePresentation(item) {
  if (!item) return null;
  if (item.practice_variant_id) return item;
  if (item.domain === "squares" && item.direction === "inverse") {
    const n = Number(item.canonical_answer);
    if (Number.isInteger(n) && n > 0) {
      const square = n * n;
      return {
        ...item,
        prompt: `√${square} = ?`,
        relation: `√${square} = ${n}`,
        hook: item.hook?.includes("±") ? item.hook : `${square} 的算术平方根是 ${n}，不是 ±${n}。`,
      };
    }
  }
  if (item.domain === "cubes" && item.direction === "inverse") {
    const n = Number(item.canonical_answer);
    if (Number.isInteger(n) && n > 0) {
      const cube = n * n * n;
      return {
        ...item,
        prompt: `∛${cube} = ?`,
        relation: `∛${cube} = ${n}`,
        hook: item.hook || `${cube} 的算术立方根是 ${n}。`,
      };
    }
  }
  return item;
}

export function loadFactCatalog({ includeReference = false } = {}) {
  const core = loadCoreCatalog();
  if (!includeReference) return core;
  const combined = [...core, ...loadReferenceCatalog()];
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

/**
 * Semantic-key union of mastery_core + reference_practice for one domain.
 * Historical core ids win every overlap.
 */
export function completeDomainCatalog(domain) {
  if (!DOMAIN_ORDER.includes(domain)) {
    throw new Error(`CONTRACT_CONFLICT: unknown domain ${domain}`);
  }
  const byKey = new Map();
  for (const item of loadFactCatalog({ includeReference: true })) {
    if (item.domain !== domain) continue;
    const existing = byKey.get(item.semantic_key);
    if (!existing || collectionOf(item) === "mastery_core") {
      byKey.set(item.semantic_key, item);
    }
  }
  return [...byKey.values()].map((item) => {
    const variants = practiceVariantsFor(item.id);
    if (!variants.length) return item;
    return { ...item, practice_variants: variants };
  });
}


/** Power-entry semantic keys: 27 forward + 27 inverse = 54 slots. */
export function powerEntrySemanticKeys() {
  const keys = [];
  for (const [base, end] of [[2, 10], [3, 6], [5, 5], [10, 6]]) {
    for (let exponent = 1; exponent <= end; exponent += 1) {
      const forward = exponent === 2
        ? `square:forward:${base}`
        : exponent === 3
          ? `cube:forward:${base}`
          : `power:forward:${base}:${exponent}`;
      keys.push(forward, `power:inverse:${base}:${exponent}`);
    }
  }
  return keys;
}

/**
 * First-release student entry catalog for complete/reference practice.
 * Warehouse may be larger; entry filters squares to 1..20 and cubes to 1..9.
 * Powers entry exposes all 54 slots, reusing square/cube identities (no new mastery ids).
 */
export function practiceEntryCatalog(domain) {
  if (!DOMAIN_ORDER.includes(domain)) {
    throw new Error(`CONTRACT_CONFLICT: unknown domain ${domain}`);
  }
  if (domain === "squares") {
    return completeDomainCatalog("squares").filter((item) => {
      const match = /^square:(?:forward|inverse):(\d+)$/.exec(item.semantic_key);
      if (!match) return false;
      const value = Number(match[1]);
      return value >= 1 && value <= 20;
    });
  }
  if (domain === "cubes") {
    return completeDomainCatalog("cubes").filter((item) => {
      const match = /^cube:(?:forward|inverse):(\d+)$/.exec(item.semantic_key);
      if (!match) return false;
      const value = Number(match[1]);
      return value >= 1 && value <= 9;
    });
  }
  if (domain === "powers") {
    const byKey = new Map();
    for (const item of loadFactCatalog({ includeReference: true })) {
      byKey.set(item.semantic_key, item);
    }
    const out = [];
    for (const key of powerEntrySemanticKeys()) {
      const item = byKey.get(key);
      if (!item) throw new Error(`CONTRACT_CONFLICT: missing power entry fact ${key}`);
      out.push(item);
    }
    return out;
  }
  return completeDomainCatalog(domain);
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

  let finiteFractions = 0;
  let finiteFractionDirections = 0;
  let repeatingFractions = 0;
  let repeatingDirections = 0;
  let halves = 0;
  let doubles = 0;
  const finiteSeen = new Set();
  const repeatingSeen = new Set();
  for (const key of keys) {
    let match = /^fraction_decimal:(to_decimal|to_fraction|to_percent|from_percent):(\d+\/\d+)$/.exec(key);
    if (match) {
      finiteFractionDirections += 1;
      finiteSeen.add(match[2]);
      continue;
    }
    match = /^fraction_decimal:(repeating_to_decimal|repeating_to_fraction):(\d+\/\d+)$/.exec(key);
    if (match) {
      repeatingDirections += 1;
      repeatingSeen.add(match[2]);
      continue;
    }
    if (/^half:\d+$/.test(key)) halves += 1;
    if (/^double:\d+$/.test(key)) doubles += 1;
  }
  finiteFractions = finiteSeen.size;
  repeatingFractions = repeatingSeen.size;

  const core = catalog.filter((item) => collectionOf(item) === "mastery_core").length;
  const reference = catalog.filter((item) => collectionOf(item) === "reference_practice").length;
  const variantStats = productPracticeVariantStats();
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
      commonPowerInverse: commonPowers,
      finiteFractions,
      finiteFractionDirections,
      repeatingFractions,
      repeatingDirections,
      halves,
      doubles,
      productFamilies: variantStats.families,
      productMultiplyVariants: variantStats.multiply,
      productDivideVariants: variantStats.divide,
      productPracticeDirections: variantStats.directions,
    }
  };
}

/**
 * @param {object} raw
 * @returns {RelationItem}
 */
export function normalizeRelation(raw) {
  const answerType = ANSWER_TYPES.includes(raw.answer_type) ? raw.answer_type : "integer";
  const pattern = raw.pattern && typeof raw.pattern === "object"
    ? { check: raw.pattern.check || "", family: Array.isArray(raw.pattern.family) ? raw.pattern.family : [] }
    : { check: "先判断结果范围，再用逆运算或相邻事实检查。", family: [] };
  const frames = Array.isArray(raw.frames) && raw.frames.length
    ? raw.frames
    : [
      { title: "直接算", detail: raw.hook || "" },
      { title: "检查", detail: pattern.check },
    ];
  return {
    ...raw,
    collection: collectionOf(raw),
    semantic_key: semanticKeyOf({ ...raw, answer_type: answerType }),
    answer_type: answerType,
    direction: raw.direction === "inverse" ? "inverse" : "forward",
    families: Array.isArray(raw.families) ? raw.families : [],
    entry_after: raw.entry_after || null,
    pattern,
    frames,
    level: raw.level || (collectionOf(raw) === "reference_practice" ? "reference_practice" : raw.level),
    tier: raw.tier ?? (collectionOf(raw) === "reference_practice" ? 3 : raw.tier),
    hook_type: raw.hook_type || (collectionOf(raw) === "reference_practice" ? "definition" : raw.hook_type),
    integerOnly: answerType === "integer" || answerType === "signed_integer",
    needsDecimalPoint: answerType === "decimal" || answerType === "percent_number",
    fractionFields: answerType === "fraction_fields" || answerType === "signed_fraction_fields",
    repeatingBlock: answerType === "decimal_repeating",
    percentNumber: answerType === "percent_number",
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

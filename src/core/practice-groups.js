/**
 * 练习 · 主题训练: the grouped two-column grid (docs/ux/05_specialist_grouped_grid.md).
 *
 * The three groups are NAVIGATION ONLY (05 §2, §4): they are not domains, not a
 * knowledge map, and never reach the scheduler, mastery or the Mistake Book (which
 * still groups by domain). Every card is still exactly one `domain_id`. Pure: both
 * clients' practice pages render exactly this model, so both clients show the same
 * groups, the same order, the same card content and the same asset slots (05 §8).
 */
import { DOMAIN_ORDER, domainLabel, filterByDomain } from "./content.js";
import { summarizeDomain } from "./mastery.js";

/**
 * 05 §2 table: group, cards in reading order (left → right, then the next row), tint.
 * `tone` names the light tint under the icon only (05 §7): sky = color.accent.sky,
 * amber = color.accent.amber, mint = color.brand.secondary.
 */
export const PRACTICE_GROUPS = Object.freeze([
  Object.freeze({ id: "exponents", label: "幂与乘方", tone: "sky", domains: Object.freeze(["squares", "cubes", "powers"]) }),
  Object.freeze({ id: "multiplication", label: "乘法与凑整", tone: "amber", domains: Object.freeze(["products", "special_products"]) }),
  Object.freeze({ id: "number-forms", label: "数与分数", tone: "mint", domains: Object.freeze(["fraction_decimal", "halves", "complements"]) }),
]);

/** 05 §3: the only status words a card uses (the four mastery phrases). */
export const CARD_STATUS_WORDS = Object.freeze(["还没怎么练", "正在熟悉", "有几题要再巩固", "大多已经很稳"]);

/** A card whose domain has no released content yet: shown, but it only answers 敬请期待 (05 §3). */
export const SOON_STATUS = "敬请期待";

/**
 * 05 §5: one fixed symbol per domain, as an interface glyph. It stands in whenever the
 * theme has no file for `domain.<id>` (07: 缺文件时可用形状顶上), so no tile is ever empty.
 *   平方 2×2 grid (never the cube) · 立方 cube · 常见幂 xⁿ · 常用乘积 dot array ·
 *   凑整乘积家族 pieces that fit together (not 常用乘积's dot array) ·
 *   半数与翻倍 two joined circles · 补数 a ring made whole · 分数到小数 = (fallback only:
 *   the theme file draws the stacked fraction and the decimal).
 */
export const DOMAIN_GLYPHS = Object.freeze({
  squares: "grid-four",
  cubes: "cube",
  powers: "text-superscript",
  products: "dots-nine",
  special_products: "puzzle-piece",
  fraction_decimal: "equals",
  halves: "intersect",
  complements: "chart-donut",
});

/** The theme asset slot of a domain's icon: `domain.<domain_id>` on every client (07, 05 §5). */
export function domainSlot(domain) {
  return `domain.${domain}`;
}

/** The group tint of a domain's icon ("" for a domain in no group). */
export function domainTone(domain) {
  const group = PRACTICE_GROUPS.find((g) => g.domains.includes(domain));
  return group ? group.tone : "";
}

/** One card: icon (slot + glyph + tint), name, one status line; the whole card is the button (05 §3, §9). */
export function practiceCard(domain, catalog, relations = {}) {
  const items = DOMAIN_ORDER.includes(domain) ? filterByDomain(domain, catalog) : [];
  const released = items.length > 0;
  const label = domainLabel(domain);
  const status = released ? summarizeDomain(items, relations || {}) : SOON_STATUS;
  return {
    domain,
    label,
    status,
    released,
    tone: domainTone(domain),
    slot: domainSlot(domain),
    glyph: DOMAIN_GLYPHS[domain] || "",
    aria: `${label}，${status}`,
  };
}

/** The whole 主题训练 grid: the three groups, each with its cards in order. */
export function practiceGroups(catalog, relations = {}) {
  return PRACTICE_GROUPS.map((g) => ({
    id: g.id,
    label: g.label,
    tone: g.tone,
    cards: g.domains.map((domain) => practiceCard(domain, catalog, relations)),
  }));
}

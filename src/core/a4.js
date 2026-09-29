/**
 * A4 review sheet content — prompts only (no answers on the same view).
 */
import { listUnstableIds } from "./schedule.js";
import { emptyRelation, studentLabel, isUnstable } from "./mastery.js";
import { domainLabel } from "./content.js";

/**
 * @param {object[]} catalog
 * @param {Record<string, object>} relations
 * @param {{ domain?: string|null, day?: string }} opts
 */
export function buildA4Sheet(catalog, relations, opts = {}) {
  const domain = opts.domain || null;
  const day = opts.day || "";
  const pool = domain
    ? catalog.filter((item) => item.domain === domain)
    : catalog;

  const items = pool.filter((item) => {
    const status = (relations[item.id] || emptyRelation()).status;
    return isUnstable(status);
  });

  return {
    title: "数感训练场 · 纸上再写一次",
    subtitle: "印的是现在还要再写的题。纸上没有答案。",
    day,
    domain: domain ? domainLabel(domain) : "全部还不稳定的",
    empty: items.length === 0,
    emptyMessage: "先练一小段，之后才能把还要再写的题印出来。",
    prompts: items.map((item, index) => ({
      n: index + 1,
      id: item.id,
      prompt: item.prompt,
      domain: domainLabel(item.domain),
      statusLabel: studentLabel((relations[item.id] || emptyRelation()).status),
    })),
    // Answers kept separate — never shown in the same preview.
    answerKey: items.map((item) => ({
      id: item.id,
      prompt: item.prompt,
      answer: item.canonical_answer,
      relation: item.relation,
    })),
  };
}

export function unstableCount(catalog, relations) {
  return listUnstableIds(catalog, relations).length;
}

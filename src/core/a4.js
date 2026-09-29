/**
 * A4 review sheet content — prompts only (no answers on the same view).
 * One renderer, two scopes:
 *   scope "unstable" (default, home 「印到纸上」): learning + shaky, unchanged
 *   scope "mistakes" (Mistake Book 「印这些题」): current mistakes only
 */
import { listUnstableIds } from "./schedule.js";
import { emptyRelation, studentLabel, isUnstable } from "./mastery.js";
import { domainLabel } from "./content.js";
import { isCurrentMistake } from "./mistakes.js";

/**
 * @param {object[]} catalog
 * @param {Record<string, object>} relations
 * @param {{ domain?: string|null, day?: string, scope?: 'unstable'|'mistakes' }} opts
 */
export function buildA4Sheet(catalog, relations, opts = {}) {
  const domain = opts.domain || null;
  const day = opts.day || "";
  const scope = opts.scope === "mistakes" ? "mistakes" : "unstable";
  const pool = domain
    ? catalog.filter((item) => item.domain === domain)
    : catalog;

  const items = pool.filter((item) => {
    const relation = relations[item.id] || emptyRelation();
    return scope === "mistakes" ? isCurrentMistake(relation) : isUnstable(relation.status);
  });

  return {
    scope,
    title: "数感训练场 · 纸上再写一次",
    subtitle:
      scope === "mistakes"
        ? "印的是错题本里这些题。纸上没有答案。"
        : "印的是现在还要再写的题。纸上没有答案。",
    day,
    // Paper header never says 「错题」.
    domain: domain ? domainLabel(domain) : scope === "mistakes" ? "全部" : "全部还不稳定的",
    empty: items.length === 0,
    emptyMessage:
      scope === "mistakes"
        ? "现在没有要再写的错题。"
        : "先练一小段，之后才能把还要再写的题印出来。",
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

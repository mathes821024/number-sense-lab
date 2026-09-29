/**
 * Mistake Book is a VIEW over learner relations. Nothing here is persisted.
 *
 * historical mistake: at least one attempt with correct === false
 * current mistake:    historical AND status in [learning, shaky]
 * recovered mistake:  historical AND status === stable
 * not a mistake:      no wrong attempt (unpracticed, or learning with only corrects)
 *
 * Empty / invalid submissions and needs_simplification never become attempts,
 * so they can never create mistake evidence.
 */
import { MASTERY, emptyRelation } from "./mastery.js";
import { DOMAIN_ORDER } from "./content.js";

export function isHistoricalMistake(relation) {
  return (relation?.attempts || []).some((attempt) => attempt && attempt.correct === false);
}

export function isCurrentMistake(relation) {
  if (!relation) return false;
  return (
    isHistoricalMistake(relation) &&
    (relation.status === MASTERY.LEARNING || relation.status === MASTERY.SHAKY)
  );
}

export function isRecoveredMistake(relation) {
  if (!relation) return false;
  return isHistoricalMistake(relation) && relation.status === MASTERY.STABLE;
}

/**
 * Current mistakes in catalog order (same order as listUnstableIds).
 * @param {object[]} catalog
 * @param {Record<string, object>} relations
 */
export function listCurrentMistakeIds(catalog, relations = {}) {
  return catalog
    .filter((item) => isCurrentMistake(relations[item.id]))
    .map((item) => item.id);
}

export function currentMistakeCount(catalog, relations = {}) {
  return listCurrentMistakeIds(catalog, relations).length;
}

/**
 * Mistake Book page model: grouped by domain, catalog order inside a group,
 * empty groups omitted. Only prompt + student label; no counts, no due days.
 */
export function buildMistakeBook(catalog, relations = {}, labelFor = (status) => status) {
  const groups = [];
  for (const domain of DOMAIN_ORDER) {
    const items = catalog
      .filter((item) => item.domain === domain && isCurrentMistake(relations[item.id]))
      .map((item) => {
        const status = (relations[item.id] || emptyRelation()).status;
        return { id: item.id, prompt: item.prompt, status, label: labelFor(status) };
      });
    if (items.length) groups.push({ domain, items });
  }
  const total = groups.reduce((sum, group) => sum + group.items.length, 0);
  return {
    title: "错题本",
    lede: "这里是还要再写熟的题。已经稳住的会先离开这里。",
    emptyMessage: "现在没有要再写的错题。",
    empty: total === 0,
    total,
    groups,
  };
}

/**
 * Print: ONE shared selector + ONE A4 renderer (prompts only; answers on a
 * separate page). Home 「印到纸上」, Progress 「选题打印」 and Mistake Book
 * 「印这些题」 all use these same functions.
 *
 * - Candidates: practiced relations only (attempts.length > 0), catalog order.
 * - Default selection: current mistakes (the approved Mistake Book predicate,
 *   not "latest attempt wrong").
 * - The selection itself is transient UI state owned by the shell. Nothing here
 *   writes to relations, mastery, attempts, schedule or any persisted state.
 * - The sheet contains exactly the selected ids that are real, practiced
 *   catalog relations; anything else is ignored.
 */
import { listUnstableIds } from "./schedule.js";
import { domainLabel } from "./content.js";
import { isCurrentMistake } from "./mistakes.js";

export const PRINT_COPY = Object.freeze({
  title: "印到纸上",
  lede: "选出要印的题。纸上没有答案。",
  noCandidates: "先练一小段，之后才能选题打印。",
  labelCurrentMistake: "当前错题",
  labelLatestCorrect: "最近答对",
});

function isPracticed(relation) {
  return Array.isArray(relation?.attempts) && relation.attempts.length > 0;
}

function latestAttempt(relation) {
  const attempts = relation?.attempts || [];
  return attempts.length ? attempts[attempts.length - 1] : null;
}

/**
 * Practiced relations that may be printed, in catalog order.
 * @param {object[]} catalog
 * @param {Record<string, object>} relations
 */
export function listPrintCandidates(catalog, relations = {}) {
  return catalog
    .filter((item) => isPracticed(relations[item.id]))
    .map((item) => {
      const relation = relations[item.id];
      const currentMistake = isCurrentMistake(relation);
      const latest = latestAttempt(relation);
      const latestCorrect = latest ? latest.correct === true : null;
      return {
        id: item.id,
        domain: item.domain,
        prompt: item.prompt,
        currentMistake,
        latestCorrect,
        label: currentMistake
          ? PRINT_COPY.labelCurrentMistake
          : latestCorrect
            ? PRINT_COPY.labelLatestCorrect
            : "",
      };
    });
}

/** Default selection = current mistakes (catalog order). */
export function defaultPrintSelection(catalog, relations = {}) {
  return listPrintCandidates(catalog, relations)
    .filter((candidate) => candidate.currentMistake)
    .map((candidate) => candidate.id);
}

/**
 * Keep only ids that are practiced catalog relations; catalog order, no
 * duplicates. Unknown or unpracticed ids cannot be injected.
 * @param {Iterable<string>} ids
 */
export function sanitizePrintSelection(catalog, relations = {}, ids = []) {
  const wanted = new Set(ids ? [...ids].filter((id) => typeof id === "string") : []);
  return listPrintCandidates(catalog, relations)
    .filter((candidate) => wanted.has(candidate.id))
    .map((candidate) => candidate.id);
}

/**
 * Selector page model. The domain filter only narrows what is visible; the
 * selection (and its count) always covers every domain.
 * @param {{ selectedIds?: Iterable<string>, domain?: string|null }} opts
 */
export function buildPrintSelector(catalog, relations = {}, opts = {}) {
  const candidates = listPrintCandidates(catalog, relations);
  const selected = new Set(sanitizePrintSelection(catalog, relations, opts.selectedIds || []));
  const domain = opts.domain || null;
  const visible = domain ? candidates.filter((c) => c.domain === domain) : candidates;
  const withSel = (c) => ({ ...c, selected: selected.has(c.id) });
  return {
    ...PRINT_COPY,
    empty: candidates.length === 0,
    domain,
    selectedCount: selected.size,
    selectedLabel: `已选 ${selected.size} 题`,
    currentMistakes: visible.filter((c) => c.currentMistake).map(withSel),
    others: visible.filter((c) => !c.currentMistake).map(withSel),
  };
}

/** "Select all current mistakes" inside the visible scope; others untouched. */
export function selectCurrentMistakes(catalog, relations, selectedIds, domain = null) {
  const next = new Set(sanitizePrintSelection(catalog, relations, selectedIds));
  for (const c of listPrintCandidates(catalog, relations)) {
    if (c.currentMistake && (!domain || c.domain === domain)) next.add(c.id);
  }
  return sanitizePrintSelection(catalog, relations, next);
}

/** "Clear" inside the visible scope; selections in other domains stay. */
export function clearPrintSelection(catalog, relations, selectedIds, domain = null) {
  if (!domain) return [];
  const byId = new Map(catalog.map((item) => [item.id, item]));
  return sanitizePrintSelection(catalog, relations, selectedIds).filter(
    (id) => byId.get(id)?.domain !== domain,
  );
}

/** Toggle one id; unknown / unpracticed ids are ignored. */
export function togglePrintSelection(catalog, relations, selectedIds, id) {
  const next = new Set(sanitizePrintSelection(catalog, relations, selectedIds));
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return sanitizePrintSelection(catalog, relations, next);
}

/**
 * A4 sheet for exactly the selected, practiced relations.
 * @param {object[]} catalog
 * @param {Record<string, object>} relations
 * @param {{ selectedIds?: Iterable<string>, day?: string }} opts
 */
export function buildA4Sheet(catalog, relations = {}, opts = {}) {
  const day = opts.day || "";
  const ids = sanitizePrintSelection(catalog, relations, opts.selectedIds || []);
  const byId = new Map(catalog.map((item) => [item.id, item]));
  const items = ids.map((id) => byId.get(id));
  const domains = [...new Set(items.map((item) => item.domain))];
  return {
    title: "数感训练场 · 纸上再写一次",
    subtitle: PRINT_COPY.lede,
    day,
    // Only a domain name when every selected item is from one domain; the
    // paper never says 「错题」, never shows accuracy or counts of mistakes.
    domain: domains.length === 1 ? domainLabel(domains[0]) : "",
    empty: items.length === 0,
    emptyMessage: PRINT_COPY.lede,
    prompts: items.map((item, index) => ({
      n: index + 1,
      id: item.id,
      prompt: item.prompt,
      domain: domainLabel(item.domain),
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

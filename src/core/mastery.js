/**
 * Mastery states (internal English keys):
 *   unpracticed | learning | stable | shaky
 *
 * Student-facing Chinese never uses 「动摇」.
 * Accuracy > Speed: slow-but-correct alone cannot fail or demote stable.
 */

export const MASTERY = {
  UNPRACTICED: "unpracticed",
  LEARNING: "learning",
  STABLE: "stable",
  SHAKY: "shaky",
};

const STUDENT_LABELS = {
  unpracticed: "还没练到",
  learning: "正在熟悉",
  stable: "已经很稳",
  shaky: "再巩固一下",
};

/** Domain-level summary phrases for focused practice entry. */
const DOMAIN_SUMMARY = {
  unpracticed: "还没怎么练",
  learning: "正在熟悉",
  stable: "大多已经很稳",
  shaky: "有几题要再巩固",
};

export function studentLabel(status) {
  return STUDENT_LABELS[status] || STUDENT_LABELS.unpracticed;
}

export function domainSummaryLabel(status) {
  return DOMAIN_SUMMARY[status] || DOMAIN_SUMMARY.unpracticed;
}

export function emptyRelation() {
  return { status: MASTERY.UNPRACTICED, attempts: [] };
}

function dayCount(attempts) {
  return new Set(attempts.map((a) => a.day)).size;
}

/**
 * Suggested stable entry (PRD starting point, not frozen counts):
 * ≥3 non-slow corrects across ≥2 days, and last 2 attempts both correct.
 */
function meetsSuggestedStable(attempts) {
  const counted = attempts.filter((a) => a.correct && !a.slow);
  if (counted.length < 3 || dayCount(counted) < 2) return false;
  const recent = attempts.slice(-2);
  return recent.length === 2 && recent.every((a) => a.correct);
}

/**
 * @param {{ status: string, attempts: object[] }} relation
 * @param {{ correct: boolean, day: string, slow?: boolean, inputMode?: string, elapsedMs?: number, mixedInput?: boolean }} attempt
 */
export function applyAttempt(relation, attempt) {
  const next = {
    status: relation.status,
    attempts: relation.attempts.concat({
      correct: Boolean(attempt.correct),
      day: attempt.day,
      slow: Boolean(attempt.slow),
      inputMode: attempt.inputMode || null,
      elapsedMs:
        typeof attempt.elapsedMs === "number" ? attempt.elapsedMs : null,
      mixedInput: Boolean(attempt.mixedInput),
    }),
  };

  if (!attempt.correct) {
    next.status =
      relation.status === MASTERY.STABLE ? MASTERY.SHAKY : MASTERY.LEARNING;
    return next;
  }

  // Correct: never demote solely for being slow.
  if (relation.status === MASTERY.STABLE) {
    next.status = MASTERY.STABLE;
    return next;
  }

  if (relation.status === MASTERY.SHAKY) {
    // Return to stable only via the same multi-day rule.
    next.status = meetsSuggestedStable(next.attempts)
      ? MASTERY.STABLE
      : MASTERY.LEARNING;
    return next;
  }

  next.status = meetsSuggestedStable(next.attempts)
    ? MASTERY.STABLE
    : MASTERY.LEARNING;
  return next;
}

/**
 * Decide if this correct attempt is "slow" relative to the learner's
 * same input_mode history. Never compares across modes. Mixed input skipped.
 * @param {object[]} priorAttempts attempts already recorded for this relation
 * @param {{ elapsedMs: number, inputMode: string, mixedInput?: boolean }} current
 */
export function isSlowAttempt(priorAttempts, current) {
  if (!current || current.mixedInput) return false;
  if (!current.inputMode || typeof current.elapsedMs !== "number") return false;
  const peers = priorAttempts.filter(
    (a) =>
      a.correct &&
      !a.mixedInput &&
      a.inputMode === current.inputMode &&
      typeof a.elapsedMs === "number",
  );
  if (peers.length < 3) return false;
  const sorted = peers.map((a) => a.elapsedMs).sort((a, b) => a - b);
  const mid = sorted[Math.floor(sorted.length / 2)];
  // Slow if clearly above 2× median of own same-mode corrects
  return current.elapsedMs > mid * 2 && current.elapsedMs > 4000;
}

/**
 * Summarize a domain's overall student-facing status.
 * @param {object[]} items
 * @param {Record<string, {status:string}>} relations
 */
export function summarizeDomain(items, relations) {
  let shaky = 0;
  let learning = 0;
  let stable = 0;
  let unpracticed = 0;
  for (const item of items) {
    const status = (relations[item.id] || emptyRelation()).status;
    if (status === MASTERY.SHAKY) shaky += 1;
    else if (status === MASTERY.LEARNING) learning += 1;
    else if (status === MASTERY.STABLE) stable += 1;
    else unpracticed += 1;
  }
  if (shaky > 0) return domainSummaryLabel(MASTERY.SHAKY);
  if (learning > 0) return domainSummaryLabel(MASTERY.LEARNING);
  if (stable > 0 && unpracticed === 0) return domainSummaryLabel(MASTERY.STABLE);
  if (unpracticed === items.length) return domainSummaryLabel(MASTERY.UNPRACTICED);
  if (learning === 0 && shaky === 0 && stable > 0)
    return domainSummaryLabel(MASTERY.STABLE);
  return domainSummaryLabel(MASTERY.LEARNING);
}

export function unstableStatuses() {
  return [MASTERY.LEARNING, MASTERY.SHAKY];
}

export function isUnstable(status) {
  return status === MASTERY.LEARNING || status === MASTERY.SHAKY;
}

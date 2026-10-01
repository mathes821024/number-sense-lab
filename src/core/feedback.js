/**
 * Feedback layers:
 * L1 Correct Relation (default on wrong)
 * L2 Short Memory Hook (default on wrong)
 * L3 pattern / frames (available; student expands)
 *
 * Hook, pattern and frames are always read from the relation content by id.
 * They are never copied into learner state.
 */

/**
 * @param {object} item relation content
 * @param {string} kind judged kind
 * @param {{ normalized?: string|null, simplest?: string }} [judged]
 */
export function feedbackFor(item, kind, judged = {}) {
  if (kind === "empty" || kind === "invalid") {
    const message = item?.answer_type === "fraction" ? "先写一个分数" : "先写一个数";
    return { message, record: false, level: 0, stay: true };
  }
  if (kind === "needs_simplification") {
    const written = judged.normalized || "";
    const simplest = judged.simplest || item.canonical_answer;
    return {
      message: `${written} 和 ${simplest} 一样大，再约到最简：${simplest}。`,
      record: false,
      level: 0,
      stay: true,
      needsSimplification: true,
    };
  }
  if (kind === "correct") {
    return {
      relation: item.relation,
      canonical_answer: item.canonical_answer,
      word: "对",
      record: true,
      level: 1,
    };
  }
  return {
    relation: item.relation,
    canonical_answer: item.canonical_answer,
    hook: item.hook,
    pattern: item.pattern,
    frames: item.frames,
    record: true,
    level: 2,
    // L3 payloads available for optional expand
    level3: {
      check: item.pattern?.check || "",
      family: item.pattern?.family || [],
      frames: item.frames || [],
    },
  };
}

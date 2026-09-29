/**
 * Feedback layers:
 * L1 Correct Relation (default on wrong)
 * L2 Short Memory Hook (default on wrong)
 * L3 pattern / frames (available; student expands)
 */

export function feedbackFor(item, kind) {
  if (kind === "empty" || kind === "invalid") {
    return { message: "先写一个数", record: false, level: 0 };
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
    level3: {
      check: item.pattern?.check || "",
      family: item.pattern?.family || [],
      frames: item.frames || [],
    },
  };
}

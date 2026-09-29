export function feedbackFor(item, kind) {
  if (kind === "empty" || kind === "invalid") {
    return { message: "先写一个数", record: false };
  }
  if (kind === "correct") {
    return { relation: item.relation, word: "对", record: true };
  }
  return {
    relation: item.relation,
    hook: item.hook,
    pattern: item.pattern,
    frames: item.frames,
    record: true,
  };
}

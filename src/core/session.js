import { judgeAnswer } from "./answer.js";
import { feedbackFor } from "./feedback.js";
import { applyAttempt, emptyRelation, studentLabel } from "./mastery.js";

export function submitAnswer({ item, state, raw, meta }) {
  const judged = judgeAnswer(item, raw);
  const feedback = feedbackFor(item, judged.kind);
  if (!feedback.record) return { judged, feedback, state };
  const current = state.relations[item.id] || emptyRelation();
  const relation = applyAttempt(current, {
    correct: judged.kind === "correct",
    day: meta.day,
    slow: Boolean(meta.slow),
    inputMode: meta.inputMode,
    elapsedMs: meta.elapsedMs,
  });
  return {
    judged,
    feedback,
    label: studentLabel(relation.status),
    state: {
      ...state,
      relations: { ...state.relations, [item.id]: relation },
    },
  };
}

export function finishSession(state, summary) {
  return {
    ...state,
    sessions: state.sessions.concat(summary),
  };
}

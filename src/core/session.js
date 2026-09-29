import { judgeAnswer } from "./answer.js";
import { feedbackFor } from "./feedback.js";
import {
  applyAttempt,
  emptyRelation,
  studentLabel,
  isSlowAttempt,
  MASTERY,
} from "./mastery.js";
import {
  buildSessionQueue,
  nextItem,
  planWrongReappear,
  DEFAULT_SESSION_SIZE,
} from "./schedule.js";
import { getRelationById, loadCoreCatalog, filterByDomain } from "./content.js";

/**
 * @param {{
 *   mode: 'daily'|'focused',
 *   domain?: string|null,
 *   day: string,
 *   size?: number,
 *   catalog?: object[],
 *   relations?: Record<string, object>,
 * }} opts
 */
export function startSession(opts) {
  const catalog = opts.catalog || loadCoreCatalog();
  const pool = filterByDomain(opts.domain || null, catalog);
  const size = opts.size ?? DEFAULT_SESSION_SIZE;
  const queue = buildSessionQueue(pool, opts.relations || {}, {
    size,
    day: opts.day,
    interleave: opts.mode === "daily",
  });

  return {
    id: `s-${opts.day}-${Date.now()}`,
    mode: opts.mode,
    domain: opts.domain || null,
    day: opts.day,
    queue,
    cursor: 0,
    answered: 0,
    correctCount: 0,
    targetCount: Math.min(size, queue.length || size),
    finished: queue.length === 0,
    earlyStop: false,
    reappearPlan: {},
    reappearCount: {},
    outcomes: [],
    grewFamiliar: [],
  };
}

/**
 * Submit one answer against the current session + global state.
 */
export function submitAnswer({
  item,
  state,
  session,
  raw,
  meta,
  catalog = loadCoreCatalog(),
}) {
  const judged = judgeAnswer(item, raw);
  const feedback = feedbackFor(item, judged.kind);
  if (!feedback.record) {
    return { judged, feedback, state, session, label: null };
  }

  const current = state.relations[item.id] || emptyRelation();
  const priorStatus = current.status;
  const slow =
    judged.kind === "correct"
      ? isSlowAttempt(current.attempts, {
          elapsedMs: meta.elapsedMs,
          inputMode: meta.inputMode,
          mixedInput: meta.mixedInput,
        })
      : false;

  const relation = applyAttempt(current, {
    correct: judged.kind === "correct",
    day: meta.day,
    slow: Boolean(meta.slow) || slow,
    inputMode: meta.inputMode,
    elapsedMs: meta.elapsedMs,
    mixedInput: meta.mixedInput,
  });

  let nextSession = {
    ...session,
    answered: session.answered + 1,
    correctCount:
      session.correctCount + (judged.kind === "correct" ? 1 : 0),
    cursor: session.cursor + 1,
    outcomes: session.outcomes.concat({
      id: item.id,
      correct: judged.kind === "correct",
      elapsedMs: meta.elapsedMs,
      inputMode: meta.inputMode,
    }),
  };

  if (judged.kind === "wrong") {
    nextSession = planWrongReappear(nextSession, item.id);
  }

  const grewFamiliar = [...(session.grewFamiliar || [])];
  if (
    priorStatus !== MASTERY.STABLE &&
    relation.status === MASTERY.STABLE
  ) {
    grewFamiliar.push(item.relation);
  } else if (
    priorStatus === MASTERY.UNPRACTICED &&
    relation.status === MASTERY.LEARNING
  ) {
    // lightly note first contact — end page uses "更熟了" only for meaningful gains
  } else if (
    (priorStatus === MASTERY.SHAKY || priorStatus === MASTERY.LEARNING) &&
    judged.kind === "correct" &&
    !grewFamiliar.includes(item.relation)
  ) {
    // Correct on an unstable item — candidate for "更熟了"
    grewFamiliar.push(item.relation);
  }

  nextSession.grewFamiliar = grewFamiliar;

  const nextState = {
    ...state,
    relations: { ...state.relations, [item.id]: relation },
    activeSession: nextSession,
  };

  return {
    judged,
    feedback,
    label: studentLabel(relation.status),
    state: nextState,
    session: nextSession,
  };
}

export function peekCurrent(session, catalog = loadCoreCatalog()) {
  const { itemId, session: s, nearEnd } = nextItem(session);
  if (!itemId) return { item: null, session: s, nearEnd: false };
  return {
    item: getRelationById(itemId, catalog),
    session: s,
    nearEnd,
    revisit: (s.reappearCount && s.reappearCount[itemId] > 0) || false,
  };
}

export function finishSession(state, session, { earlyStop = false } = {}) {
  const summary = {
    id: session.id,
    day: session.day,
    mode: session.mode,
    domain: session.domain,
    correct: session.correctCount,
    total: session.answered,
    completed: !earlyStop && (session.finished || session.answered >= session.targetCount),
    earlyStop,
    grewFamiliar: (session.grewFamiliar || []).slice(0, 5),
  };

  return {
    state: {
      ...state,
      sessions: state.sessions.concat(summary),
      activeSession: null,
      lastResult: summary,
    },
    summary,
  };
}

export function abandonSession(state) {
  if (!state.activeSession) return state;
  const { state: next } = finishSession(state, state.activeSession, {
    earlyStop: true,
  });
  return next;
}

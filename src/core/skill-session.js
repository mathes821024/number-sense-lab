import { judgeAnswer } from "./answer.js";
import { checksumText } from "./exercise-rng.js";
import { generateExercise } from "./grade7-rational-generator.js";
import { MASTERY } from "./mastery.js";
import { addDays } from "./scheduler.js";
import { skillById } from "./skill-catalog.js";
import { displayRelationFor } from "./formula-first-display.js";

const DEFAULT_SIZE = 10;
const WRONG_REAPPEAR_GAP = 2;

function coordinateOf(skillId, band, seed, index) {
  return Object.freeze({ skill_id: skillId, band, seed: String(seed), index });
}

function generate(coordinate) {
  return generateExercise({
    skillId: coordinate.skill_id,
    band: coordinate.band,
    seed: coordinate.seed,
    index: coordinate.index,
  });
}

export function emptySkill() {
  return { status: MASTERY.UNPRACTICED, attempts: [], schedule: null };
}

function statusAfter(previous, attempts) {
  const last = attempts[attempts.length - 1];
  if (!last) return MASTERY.UNPRACTICED;
  if (last.outcome !== "correct") {
    return previous.status === MASTERY.STABLE ? MASTERY.SHAKY : MASTERY.LEARNING;
  }
  if (previous.status === MASTERY.STABLE) return MASTERY.STABLE;
  let evidenceStart = 0;
  for (let index = attempts.length - 2; index >= 0; index -= 1) {
    if (attempts[index].outcome !== "correct") {
      evidenceStart = index + 1;
      break;
    }
  }
  const evidence = attempts.slice(evidenceStart);
  const recent = evidence.slice(-2);
  const correct = evidence.filter((attempt) => attempt.outcome === "correct");
  const correctDays = new Set(correct.map((attempt) => attempt.day));
  return correct.length >= 3 && correctDays.size >= 2 && recent.length === 2 && recent.every((attempt) => attempt.outcome === "correct")
    ? MASTERY.STABLE
    : MASTERY.LEARNING;
}

function scheduleAfter(previous, next, day) {
  const last = next.attempts[next.attempts.length - 1];
  if (last.outcome !== "correct") {
    return { due_day: addDays(day, 1), bucket: "1d", reason: "wrong" };
  }
  if (next.status === MASTERY.STABLE) {
    return { due_day: addDays(day, 5), bucket: "5-7d", reason: "became-stable" };
  }
  const priorCorrectDays = new Set(
    previous.attempts.filter((attempt) => attempt.outcome === "correct").map((attempt) => attempt.day),
  );
  if (priorCorrectDays.size > 0 && !priorCorrectDays.has(day)) {
    return { due_day: addDays(day, 2), bucket: "2-3d", reason: "correct-new-day" };
  }
  return { due_day: addDays(day, 1), bucket: "1d", reason: "first-correct" };
}

function feedbackForExercise(exercise, judged) {
  const relation = displayRelationFor(exercise);
  if (judged.kind === "empty" || judged.kind === "invalid") {
    return {
      message: exercise.answer_type === "signed_fraction_fields" ? "先写一个分数" : "先写一个数",
      record: false,
      stay: true,
    };
  }
  if (judged.kind === "needs_simplification") {
    return {
      message: `${judged.normalized} 和 ${judged.simplest} 一样大，再约到最简：${judged.simplest}。`,
      record: false,
      stay: true,
      needsSimplification: true,
    };
  }
  if (judged.kind === "correct") {
    return {
      relation,
      canonical_answer: exercise.canonical_answer,
      word: "对",
      record: true,
      level: 1,
    };
  }
  return {
    relation,
    canonical_answer: exercise.canonical_answer,
    hook: exercise.explanations.structure.summary,
    pattern: { check: exercise.explanations.estimate.summary, family: [] },
    frames: [],
    record: true,
    level: 2,
    level3: {
      check: exercise.explanations.estimate.summary,
      family: [],
      frames: [],
    },
  };
}

export function startSkillSession({ skillId, band, day, seed, size = DEFAULT_SIZE, id } = {}) {
  const skill = skillById(skillId);
  if (!skill) throw new Error(`unknown skill: ${skillId}`);
  if (!skill.bands.includes(band)) throw new Error(`unknown band: ${band}`);
  if (!day || typeof day !== "string") throw new Error("day is required");
  if (!Number.isSafeInteger(size) || size <= 0) throw new Error("size must be a positive safe integer");
  const normalizedSeed = String(seed ?? `${day}|${skillId}|${band}`);
  const coordinates = Array.from({ length: size }, (_, index) => coordinateOf(skillId, band, normalizedSeed, index));
  const sessionId = id || `ss:${skillId}:${band}:${day}:${checksumText(normalizedSeed)}`;
  return {
    id: sessionId,
    kind: "skill",
    skill_id: skillId,
    band,
    day,
    seed: normalizedSeed,
    coordinates,
    cursor: 0,
    answered: 0,
    correctCount: 0,
    targetCount: size,
    finished: false,
    earlyStop: false,
    reappearPlan: {},
    reappearCount: {},
    outcomes: [],
  };
}

export function peekSkillExercise(original) {
  if (!original || original.finished || original.answered >= original.targetCount) {
    return { exercise: null, session: original ? { ...original, finished: true } : original, nearEnd: false, revisit: false };
  }
  let session = original;
  let coordinates = session.coordinates.slice();
  const plan = { ...(session.reappearPlan || {}) };
  const due = Object.entries(plan).filter(([, entry]) => entry.at <= session.answered);
  let revisit = false;
  for (const [exerciseId, entry] of due) {
    delete plan[exerciseId];
    coordinates.splice(session.cursor, 0, entry.coordinate);
    revisit = true;
  }
  if (due.length) session = { ...session, coordinates, reappearPlan: plan };
  const coordinate = session.coordinates[session.cursor];
  if (!coordinate) return { exercise: null, session: { ...session, finished: true }, nearEnd: false, revisit: false };
  return {
    exercise: generate(coordinate),
    session,
    nearEnd: session.targetCount - session.answered <= 2,
    revisit,
  };
}

export function submitSkillAnswer({ state, session: original, raw, meta }) {
  const current = peekSkillExercise(original);
  const session = current.session;
  const exercise = current.exercise;
  if (!exercise) throw new Error("skill session has no current exercise");
  const judged = judgeAnswer(exercise, raw);
  const feedback = feedbackForExercise(exercise, judged);
  if (!feedback.record) return { judged, feedback, state, session: original, exercise };

  const previous = state.skills?.[session.skill_id] || emptySkill();
  const attempt = {
    exercise_id: exercise.id,
    band: exercise.band,
    outcome: judged.outcome,
    normalized: judged.normalized,
    day: meta.day,
    elapsedMs: typeof meta.elapsedMs === "number" ? meta.elapsedMs : null,
    inputMode: meta.inputMode || null,
    mixedInput: Boolean(meta.mixedInput),
  };
  const attempts = previous.attempts.concat(attempt);
  const nextSkill = { status: statusAfter(previous, attempts), attempts, schedule: null };
  nextSkill.schedule = scheduleAfter(previous, nextSkill, meta.day);

  let nextSession = {
    ...session,
    cursor: session.cursor + 1,
    answered: session.answered + 1,
    correctCount: session.correctCount + (judged.kind === "correct" ? 1 : 0),
    outcomes: session.outcomes.concat({ exercise_id: exercise.id, outcome: judged.outcome }),
  };
  if (judged.kind === "wrong" && !(nextSession.reappearCount[exercise.id] > 0)) {
    nextSession = {
      ...nextSession,
      reappearPlan: {
        ...nextSession.reappearPlan,
        [exercise.id]: {
          at: nextSession.answered + WRONG_REAPPEAR_GAP,
          coordinate: session.coordinates[session.cursor],
        },
      },
      reappearCount: { ...nextSession.reappearCount, [exercise.id]: 1 },
    };
  }
  const nextState = {
    ...state,
    skills: { ...(state.skills || {}), [session.skill_id]: nextSkill },
    activeSkillSession: nextSession,
  };
  return { judged, feedback, state: nextState, session: nextSession, exercise, status: nextSkill.status };
}

export function finishSkillSession(state, session, { earlyStop = false } = {}) {
  const summary = {
    id: session.id,
    kind: "skill",
    skill_id: session.skill_id,
    band: session.band,
    day: session.day,
    correct: session.correctCount,
    total: session.answered,
    completed: !earlyStop && (session.finished || session.answered >= session.targetCount),
    earlyStop,
  };
  return {
    state: { ...state, activeSkillSession: null },
    summary,
  };
}

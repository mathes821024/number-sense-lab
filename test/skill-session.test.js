import assert from "node:assert/strict";
import test from "node:test";
import {
  finishSkillSession,
  peekSkillExercise,
  startSkillSession,
  submitSkillAnswer,
} from "../src/core/skill-session.js";
import { emptyState, getActiveLearner } from "../src/core/store.js";
import { createMemoryStore } from "../src/core/store.js";
import { createTrainingFlow } from "../app/pages/train/flow.js";
import { trainingIntent } from "../app/pages/train/intent.js";

const DAY = "2026-10-12";
const SKILL = "g7-integer-add-sub";

function learner() {
  return getActiveLearner(emptyState({ learnerId: "L", createdOn: DAY }));
}

test("a 10-question skill session stores coordinates and regenerates the same exercise", () => {
  const session = startSkillSession({ skillId: SKILL, band: "foundation", day: DAY, seed: "family", id: "ss-1" });
  assert.equal(session.targetCount, 10);
  assert.equal(session.coordinates.length, 10);
  assert.deepEqual(session.coordinates[0], { skill_id: SKILL, band: "foundation", seed: "family", index: 0 });
  assert.equal(JSON.stringify(session).includes("explanations"), false);
  assert.deepEqual(peekSkillExercise(session).exercise, peekSkillExercise(structuredClone(session)).exercise);
});

test("empty submission never advances or records evidence", () => {
  const state = learner();
  const session = startSkillSession({ skillId: SKILL, band: "foundation", day: DAY, seed: "empty" });
  const out = submitSkillAnswer({ state, session, raw: "", meta: { day: DAY, elapsedMs: 100, inputMode: "onscreen_keypad" } });
  assert.equal(out.feedback.record, false);
  assert.deepEqual(out.state, state);
  assert.deepEqual(out.session, session);
});

test("correct skill evidence never writes relation state and stores only the frozen attempt fields", () => {
  const state = learner();
  const session = startSkillSession({ skillId: SKILL, band: "foundation", day: DAY, seed: "correct" });
  const { exercise } = peekSkillExercise(session);
  const out = submitSkillAnswer({
    state,
    session,
    raw: exercise.canonical_answer,
    meta: { day: DAY, elapsedMs: 850, inputMode: "onscreen_keypad", mixedInput: false },
  });
  assert.deepEqual(out.state.relations, state.relations);
  assert.equal(out.state.activeSession, state.activeSession);
  const skill = out.state.skills[SKILL];
  assert.equal(skill.status, "learning");
  assert.deepEqual(Object.keys(skill.attempts[0]).sort(), [
    "band", "day", "elapsedMs", "exercise_id", "inputMode", "mixedInput", "normalized", "outcome"
  ].sort());
  assert.equal(skill.attempts[0].outcome, "correct");
  assert.equal(JSON.stringify(out.state).includes("explanations"), false);
});

test("wrong answer plans one later reappearance inside the same skill", () => {
  let state = learner();
  let session = startSkillSession({ skillId: SKILL, band: "foundation", day: DAY, seed: "wrong" });
  const first = peekSkillExercise(session).exercise;
  let out = submitSkillAnswer({ state, session, raw: "999999", meta: { day: DAY, elapsedMs: 1200, inputMode: "onscreen_keypad" } });
  state = out.state;
  session = out.session;
  assert.equal(state.skills[SKILL].attempts[0].outcome, "incorrect");
  assert.equal(session.reappearPlan[first.id].at, 3);
  for (let step = 0; step < 2; step += 1) {
    const current = peekSkillExercise(session);
    session = current.session;
    out = submitSkillAnswer({ state, session, raw: current.exercise.canonical_answer, meta: { day: DAY, elapsedMs: 800, inputMode: "onscreen_keypad" } });
    state = out.state;
    session = out.session;
  }
  const reappeared = peekSkillExercise(session);
  assert.equal(reappeared.exercise.id, first.id);
});

test("finishing a skill session clears only activeSkillSession", () => {
  const state = { ...learner(), activeSession: { id: "relation-session" } };
  const session = startSkillSession({ skillId: SKILL, band: "standard", day: DAY, seed: "finish", size: 1, id: "ss-finish" });
  const next = { ...state, activeSkillSession: session };
  const finished = finishSkillSession(next, session, { earlyStop: false });
  assert.equal(finished.state.activeSkillSession, null);
  assert.deepEqual(finished.state.activeSession, state.activeSession);
  assert.equal(finished.summary.kind, "skill");
});

test("shared training flow resumes the same generated exercise without touching a relation session", () => {
  const root = emptyState({ learnerId: "L-flow", createdOn: DAY });
  root.learners["L-flow"].activeSession = { id: "relation-kept" };
  const store = createMemoryStore(root);
  const first = createTrainingFlow({ store, today: () => DAY, clock: () => 42, now: () => 100 });
  first.beginSkill(SKILL, "foundation", "resume-seed");
  const exercise = first.view().item;
  assert.equal(first.view().sessionKind, "skill");
  assert.deepEqual(first.state.activeSession, { id: "relation-kept" });

  const resumed = createTrainingFlow({ store, today: () => DAY, clock: () => 99, now: () => 200 });
  resumed.resumeSkill();
  assert.deepEqual(resumed.view().item, exercise);
  assert.deepEqual(resumed.state.activeSession, { id: "relation-kept" });
});

test("shared training flow advances to the next skill exercise after a correct answer", () => {
  const store = createMemoryStore(emptyState({ learnerId: "L-advance", createdOn: DAY }));
  const flow = createTrainingFlow({ store, today: () => DAY, clock: () => 42, now: () => 100 });
  flow.beginSkill(SKILL, "foundation", "advance-seed");
  const first = flow.view().item;
  const answer = first.canonical_answer;
  if (answer.startsWith("-")) flow.toggleSign();
  for (const digit of answer.replace("-", "")) flow.input(digit);

  assert.equal(flow.submit(), "correct");
  assert.equal(flow.advance(), "train");
  assert.notEqual(flow.view().item.id, first.id);
  assert.equal(flow.view().position, 2);
});

test("training intent validates skill id and band before entering skill practice", () => {
  assert.deepEqual(trainingIntent({ intent: "start-skill", skill: SKILL, band: "standard" }), {
    kind: "begin-skill",
    skillId: SKILL,
    band: "standard",
  });
  assert.deepEqual(trainingIntent({ intent: "start-skill", skill: SKILL, band: "nope" }), {
    kind: "begin-skill",
    skillId: SKILL,
    band: "foundation",
  });
  assert.deepEqual(trainingIntent({ intent: "start-skill", skill: "unknown" }), {
    kind: "begin",
    mode: "daily",
    domain: null,
  });
});

test("skill mastery becomes stable across days and a later wrong demotes only skill mastery", () => {
  let state = learner();
  for (const [offset, day] of [["a", "2026-10-12"], ["b", "2026-10-13"], ["c", "2026-10-14"]]) {
    const session = startSkillSession({ skillId: SKILL, band: "foundation", day, seed: offset, size: 1 });
    const exercise = peekSkillExercise(session).exercise;
    state = submitSkillAnswer({
      state,
      session,
      raw: exercise.canonical_answer,
      meta: { day, elapsedMs: 700, inputMode: "onscreen_keypad", mixedInput: false },
    }).state;
  }
  assert.equal(state.skills[SKILL].status, "stable");
  const relationSnapshot = structuredClone(state.relations);
  const wrongSession = startSkillSession({ skillId: SKILL, band: "foundation", day: "2026-10-15", seed: "wrong-after-stable", size: 1 });
  state = submitSkillAnswer({
    state,
    session: wrongSession,
    raw: "999999",
    meta: { day: "2026-10-15", elapsedMs: 900, inputMode: "onscreen_keypad", mixedInput: false },
  }).state;
  assert.equal(state.skills[SKILL].status, "shaky");
  assert.deepEqual(state.relations, relationSnapshot);
});

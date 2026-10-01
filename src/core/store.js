/**
 * In-memory learning state. Core must not touch platform storage APIs,
 * clocks for identity, or UUID generation. The Adapter creates learner_id
 * and passes it (and the local day) in.
 *
 * state v3:
 * {
 *   version: 3,
 *   active_learner_id: "<uuid>",
 *   learners: {
 *     "<uuid>": { profile: { learner_id, created_on }, relations, sessions,
 *                 activeSession, prefs, lastResult? }
 *   }
 * }
 */

import { cloneJson } from "./json-clone.js";

export const STATE_VERSION = 3;

/** One learner's learning record (the v2 payload, minus version). */
export function emptyLearner() {
  return {
    relations: {},
    sessions: [],
    activeSession: null,
    prefs: { sound: true },
  };
}

/**
 * A brand-new v3 state. Never written as v2 first.
 * @param {{ learnerId: string, createdOn: string }} opts
 */
export function emptyState({ learnerId, createdOn } = {}) {
  if (!learnerId || typeof learnerId !== "string") {
    throw new Error("emptyState needs a learnerId created by the Adapter");
  }
  return {
    version: STATE_VERSION,
    active_learner_id: learnerId,
    learners: {
      [learnerId]: {
        profile: { learner_id: learnerId, created_on: createdOn || null },
        ...emptyLearner(),
      },
    },
  };
}

/** True when the value has the v3 shape with a usable active learner. */
export function isValidV3(state) {
  if (!state || typeof state !== "object" || state.version !== STATE_VERSION) return false;
  const id = state.active_learner_id;
  if (!id || typeof id !== "string") return false;
  if (!state.learners || typeof state.learners !== "object") return false;
  const learner = state.learners[id];
  return Boolean(learner && typeof learner === "object");
}

/** The active learner's record. Reads and writes only touch this one. */
export function getActiveLearner(state) {
  if (!isValidV3(state)) throw new Error("not a v3 state");
  return state.learners[state.active_learner_id];
}

export function activeLearnerId(state) {
  return isValidV3(state) ? state.active_learner_id : null;
}

/** Put an updated learner record back under the active learner id. */
export function withActiveLearner(state, learner) {
  const id = state.active_learner_id;
  const previous = state.learners[id] || {};
  return {
    ...state,
    learners: {
      ...state.learners,
      [id]: {
        ...learner,
        // profile is identity; a learner update never replaces it
        profile: previous.profile || learner.profile || { learner_id: id, created_on: null },
      },
    },
  };
}

export function createMemoryStore(initial = null) {
  let state = initial ? cloneJson(initial) : null;
  return {
    read() {
      return state ? cloneJson(state) : null;
    },
    write(next) {
      state = cloneJson(next);
    },
  };
}

/**
 * Versioned learner-state migrations. Each hop only knows two adjacent
 * versions:  v1 → migrateV1toV2 → v2 → migrateV2toV3 → v3
 *
 * Never: clear records, recompute stored mastery, drop attempts / sessions /
 * schedule, rebuild activeSession.queue, or regenerate an existing learner_id.
 * Core never creates the id — the Adapter passes `createLearnerId`.
 */
import { migrateState, projectSchedule } from "./scheduler.js";
import { STATE_VERSION, emptyState, isValidV3 } from "./store.js";

export class MigrationError extends Error {
  constructor(message) {
    super(message);
    this.name = "MigrationError";
  }
}

/** v0.2A frozen hop (status kept, schedule projected once, history kept). */
export function migrateV1toV2(v1) {
  if (!v1 || v1.version !== 1) throw new MigrationError("expected version 1");
  return migrateState(v1);
}

/**
 * Wrap a v2 record into v3 under ONE newly created learner_id.
 * @param {object} v2
 * @param {{ learnerId: string, createdOn?: string }} opts
 */
export function migrateV2toV3(v2, { learnerId, createdOn } = {}) {
  if (!v2 || v2.version !== 2) throw new MigrationError("expected version 2");
  if (!learnerId || typeof learnerId !== "string") {
    throw new MigrationError("learnerId is required from the Adapter");
  }
  const learner = {
    profile: { learner_id: learnerId, created_on: createdOn || null },
    relations: v2.relations || {},
    sessions: Array.isArray(v2.sessions) ? v2.sessions : [],
    activeSession: v2.activeSession ?? null,
    prefs: { sound: true, ...(v2.prefs || {}) },
  };
  if (v2.lastResult) learner.lastResult = v2.lastResult;
  // No parallel top-level relations remain after the move.
  return {
    version: STATE_VERSION,
    active_learner_id: learnerId,
    learners: { [learnerId]: learner },
  };
}

function hasValidSchedule(relation) {
  const s = relation?.schedule;
  return Boolean(s && s.due_day && s.bucket && s.reason);
}

/**
 * Repair a legal v3 record in place-equivalent fashion: keep learner_id,
 * keep every field; only a practiced relation that lacks a schedule gets one
 * projected (the frozen v0.2A table). Returns { state, changed }.
 */
export function normalizeV3(v3) {
  if (!isValidV3(v3)) throw new MigrationError("invalid version 3 record");
  let changed = false;
  const learners = {};
  for (const [id, learner] of Object.entries(v3.learners)) {
    if (!learner || typeof learner !== "object") {
      learners[id] = learner;
      continue;
    }
    const relations = {};
    for (const [rid, relation] of Object.entries(learner.relations || {})) {
      if (
        relation &&
        typeof relation === "object" &&
        Array.isArray(relation.attempts) &&
        relation.attempts.length > 0 &&
        !hasValidSchedule(relation)
      ) {
        relations[rid] = { ...relation, schedule: projectSchedule(relation) };
        changed = true;
      } else {
        relations[rid] = relation;
      }
    }
    let profile = learner.profile;
    if (!profile || profile.learner_id !== id) {
      profile = { created_on: null, ...(profile || {}), learner_id: id };
      changed = true;
    }
    learners[id] = {
      ...learner,
      profile,
      relations,
      sessions: Array.isArray(learner.sessions) ? learner.sessions : [],
      activeSession: learner.activeSession ?? null,
      prefs: { sound: true, ...(learner.prefs || {}) },
    };
  }
  return { state: { ...v3, learners }, changed };
}

/**
 * Upgrade whatever was stored to v3, one hop at a time.
 * @param {object|null} stored parsed JSON (null = nothing stored)
 * @param {{ createLearnerId: () => string, today: string }} deps
 * @returns {{ state: object, changed: boolean, from: number|null }}
 * @throws {MigrationError} unknown version / unusable record — caller must
 *   NOT overwrite the original storage.
 */
export function upgradeState(stored, { createLearnerId, today } = {}) {
  const newId = () => {
    const id = typeof createLearnerId === "function" ? createLearnerId() : null;
    if (!id || typeof id !== "string") throw new MigrationError("Adapter did not supply a learner_id");
    return id;
  };
  if (stored === null || stored === undefined) {
    return { state: emptyState({ learnerId: newId(), createdOn: today }), changed: true, from: null };
  }
  if (typeof stored !== "object") throw new MigrationError("stored value is not an object");
  const from = stored.version;
  if (from !== 1 && from !== 2 && from !== 3) {
    throw new MigrationError(`unknown version ${String(from)}`);
  }
  let current = stored;
  if (current.version === 1) current = migrateV1toV2(current);
  if (current.version === 2) {
    // v2 → v2 repair keeps legal schedules and projects only missing ones.
    current = migrateV2toV3(migrateState(current), { learnerId: newId(), createdOn: today });
    return { state: current, changed: true, from };
  }
  const normalized = normalizeV3(current);
  return { state: normalized.state, changed: normalized.changed, from };
}

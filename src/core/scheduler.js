/**
 * Local due dates for v0.2A.
 * Mastery status stays on the existing rules. This file only sets schedule.
 * Core does not read the clock or any platform store.
 */
import { MASTERY } from "./mastery.js";

const OFFSET = {
  "1d": 1,
  "2-3d": 2,
  "5-7d": 5,
  maintenance: 7,
};

export function addDays(iso, days) {
  const [year, month, day] = String(iso).split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function sched(dueDay, bucket, reason) {
  return { due_day: dueDay, bucket, reason };
}

function stepBucket(bucket) {
  if (bucket === "1d") return "2-3d";
  if (bucket === "2-3d") return "5-7d";
  if (bucket === "5-7d" || bucket === "maintenance") return "maintenance";
  return "2-3d";
}

/**
 * Next schedule after one recorded attempt.
 * `previous` is the relation before this attempt. `next` already has the new
 * status and the attempt appended.
 */
export function scheduleAfterAttempt(previous, next, day) {
  const last = next.attempts[next.attempts.length - 1];
  const prior = previous.attempts || [];
  const prev = prior[prior.length - 1] || null;
  const prevSchedule = previous.schedule || null;

  if (!last.correct) {
    if (previous.status === MASTERY.STABLE) return sched(day, "1d", "stable-wrong");
    return sched(addDays(day, 1), "1d", "wrong");
  }

  if (prev && prev.day === day && !prev.correct) {
    return sched(addDays(day, 1), "1d", "correct-after-wrong");
  }

  if (last.slow) {
    const bucket = prevSchedule?.bucket || "1d";
    if (!prevSchedule?.due_day || prevSchedule.due_day <= day) {
      return sched(addDays(day, 1), bucket, "slow-correct");
    }
    return sched(prevSchedule.due_day, bucket, "slow-correct");
  }

  if (prev && prev.day === day && prev.correct) {
    if (prevSchedule?.due_day) {
      return sched(prevSchedule.due_day, prevSchedule.bucket || "1d", "same-day-correct");
    }
    return sched(addDays(day, 1), "1d", "same-day-correct");
  }

  if (prevSchedule?.due_day && prevSchedule.due_day > day) {
    return { ...prevSchedule };
  }

  if (previous.status !== MASTERY.STABLE && next.status === MASTERY.STABLE) {
    return sched(addDays(day, 5), "5-7d", "became-stable");
  }

  if (next.status === MASTERY.STABLE) {
    return sched(addDays(day, 7), "maintenance", "stable-maintenance");
  }

  if (!prev) return sched(addDays(day, 1), "1d", "first-correct");

  const bucket = stepBucket(prevSchedule?.bucket || "1d");
  return sched(addDays(day, OFFSET[bucket]), bucket, "correct-new-day");
}

function distinctCorrectDays(attempts) {
  return new Set(
    attempts.filter((attempt) => attempt.correct && !attempt.slow).map((attempt) => attempt.day),
  ).size;
}

/**
 * One-shot projection for a v0.1 relation. Does not change status.
 * Rows are first-match, in the frozen order.
 */
export function projectSchedule(relation) {
  const attempts = relation.attempts || [];
  if (attempts.length === 0) return null;
  const last = attempts[attempts.length - 1];
  const day = last.day;
  const status = relation.status;

  if (!last.correct && status === MASTERY.SHAKY) {
    return sched(day, "1d", "stable-wrong");
  }
  if (!last.correct) return sched(addDays(day, 1), "1d", "wrong");

  const sameDayWrong = attempts
    .slice(0, -1)
    .some((attempt) => attempt.day === day && !attempt.correct);
  if (sameDayWrong && status !== MASTERY.STABLE) {
    return sched(addDays(day, 1), "1d", "correct-after-wrong");
  }
  if (last.slow) return sched(addDays(day, 1), "1d", "slow-correct");
  if (status === MASTERY.STABLE) {
    return sched(addDays(day, 7), "maintenance", "stable-maintenance");
  }

  const days = distinctCorrectDays(attempts);
  if (days <= 1) return sched(addDays(day, 1), "1d", "first-correct");
  if (days === 2) return sched(addDays(day, 2), "2-3d", "correct-new-day");
  return sched(addDays(day, 5), "5-7d", "correct-new-day");
}

function migrateRelation(relation) {
  const status = relation.status || MASTERY.UNPRACTICED;
  const attempts = Array.isArray(relation.attempts) ? relation.attempts : [];
  const kept = { status, attempts };
  if (attempts.length === 0) return { ...kept, schedule: null };
  if (
    relation.schedule &&
    relation.schedule.due_day &&
    relation.schedule.bucket &&
    relation.schedule.reason
  ) {
    return { ...kept, schedule: relation.schedule };
  }
  return { ...kept, schedule: projectSchedule(kept) };
}

/** Upgrade a stored blob to version 2 without dropping history or mastery. */
export function migrateState(input) {
  const state = input && typeof input === "object" ? input : {};
  const relations = {};
  for (const [id, relation] of Object.entries(state.relations || {})) {
    if (!relation || typeof relation !== "object") continue;
    relations[id] = migrateRelation(relation);
  }
  return {
    version: 2,
    relations,
    sessions: Array.isArray(state.sessions) ? state.sessions : [],
    activeSession: state.activeSession ?? null,
    prefs: { sound: true, ...(state.prefs || {}) },
    ...(state.lastResult ? { lastResult: state.lastResult } : {}),
  };
}

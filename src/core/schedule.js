/**
 * Review scheduling.
 * Tier = content entry / teaching suggestion ONLY — not review interval.
 * Priority driven by correctness, mastery, cross-session, wrong reappear.
 */
import { MASTERY, emptyRelation, isUnstable } from "./mastery.js";

export const DEFAULT_SESSION_SIZE = 10;
export const WRONG_REAPPEAR_GAP = 2;
export const MAX_REAPPEARS_PER_ITEM = 1;

function priority(item, relation, today) {
  const status = relation.status;
  const attempts = relation.attempts || [];
  const last = attempts[attempts.length - 1];
  const missedRecently = last && !last.correct;

  if (status === MASTERY.SHAKY) return 1000 + (missedRecently ? 50 : 0);
  if (status === MASTERY.LEARNING) {
    return 700 + (missedRecently ? 80 : 0) + Math.min(attempts.length, 20);
  }
  if (status === MASTERY.UNPRACTICED) {
    return 400 - (item.tier || 3) * 10;
  }
  const daysSince =
    last && last.day ? Math.max(0, dayDiff(last.day, today)) : 99;
  return 50 + Math.min(daysSince, 30);
}

function dayDiff(a, b) {
  const ms = Date.parse(b) - Date.parse(a);
  if (!Number.isFinite(ms)) return 0;
  return Math.floor(ms / 86400000);
}

export function buildSessionQueue(catalog, relations, opts = {}) {
  const size = opts.size ?? DEFAULT_SESSION_SIZE;
  const day = opts.day || "1970-01-01";
  const interleave = opts.interleave !== false;

  const scored = catalog.map((item) => {
    const rel = relations[item.id] || emptyRelation();
    return { item, score: priority(item, rel, day), status: rel.status };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.item.tier !== b.item.tier) return a.item.tier - b.item.tier;
    return a.item.id.localeCompare(b.item.id);
  });

  const nonStable = scored.filter((s) => s.status !== MASTERY.STABLE);
  const pool = nonStable.length > 0 ? nonStable : scored;
  let picked = pool.slice(0, size).map((s) => s.item);

  if (interleave && picked.length > 2) {
    picked = interleaveDomains(picked);
  }

  return picked.map((item) => item.id);
}

function interleaveDomains(items) {
  const buckets = new Map();
  for (const item of items) {
    if (!buckets.has(item.domain)) buckets.set(item.domain, []);
    buckets.get(item.domain).push(item);
  }
  const keys = [...buckets.keys()];
  const out = [];
  let guard = 0;
  while (out.length < items.length && guard < 200) {
    guard += 1;
    for (const key of keys) {
      const bucket = buckets.get(key);
      if (bucket && bucket.length) out.push(bucket.shift());
    }
  }
  return out;
}

export function planWrongReappear(session, itemId) {
  const count = session.reappearCount[itemId] || 0;
  if (count >= MAX_REAPPEARS_PER_ITEM) return session;

  const insertAt = session.answered + 1 + WRONG_REAPPEAR_GAP;
  const nextPlan = { ...session.reappearPlan, [itemId]: insertAt };
  const nextCount = { ...session.reappearCount, [itemId]: count + 1 };
  return {
    ...session,
    reappearPlan: nextPlan,
    reappearCount: nextCount,
  };
}

export function nextItem(session) {
  if (!session || session.finished) {
    return { itemId: null, session, nearEnd: false };
  }

  let queue = session.queue.slice();
  const due = Object.entries(session.reappearPlan || {})
    .filter(([, at]) => at <= session.answered)
    .map(([id]) => id);

  if (due.length) {
    const plan = { ...session.reappearPlan };
    for (const id of due) {
      delete plan[id];
      const head = queue[session.cursor];
      if (id !== head) {
        queue.splice(session.cursor, 0, id);
      } else {
        queue.splice(session.cursor + 1, 0, id);
      }
    }
    session = { ...session, queue, reappearPlan: plan };
  }

  if (session.answered >= session.targetCount) {
    return {
      itemId: null,
      session: { ...session, finished: true },
      nearEnd: false,
    };
  }

  if (session.cursor >= session.queue.length) {
    return {
      itemId: null,
      session: { ...session, finished: true },
      nearEnd: false,
    };
  }

  const itemId = session.queue[session.cursor];
  const remaining = session.targetCount - session.answered;
  const nearEnd = remaining <= 2 && remaining > 0;
  return { itemId, session, nearEnd };
}

export function listUnstableIds(catalog, relations) {
  return catalog
    .filter((item) => {
      const status = (relations[item.id] || emptyRelation()).status;
      return isUnstable(status);
    })
    .map((item) => item.id);
}

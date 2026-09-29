/**
 * Review scheduling.
 * Tier = content entry / teaching suggestion ONLY — not review interval.
 * Priority driven by correctness, mastery, cross-session, wrong reappear.
 */
import { MASTERY, emptyRelation, isUnstable } from "./mastery.js";
import { DOMAIN_ORDER } from "./content.js";

export const DEFAULT_SESSION_SIZE = 10;
export const WRONG_REAPPEAR_GAP = 2;
export const MAX_REAPPEARS_PER_ITEM = 1;

/**
 * Priority score: higher = sooner.
 * shaky > recent-wrong learning > learning > unpracticed (by tier) > stable maintenance
 */
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
    // Lower tier number first (teaching suggestion order)
    return 400 - (item.tier || 3) * 10;
  }
  // stable: light maintenance only when queue is short
  const daysSince =
    last && last.day
      ? Math.max(0, dayDiff(last.day, today))
      : 99;
  return 50 + Math.min(daysSince, 30);
}

function dayDiff(a, b) {
  const ms = Date.parse(b) - Date.parse(a);
  if (!Number.isFinite(ms)) return 0;
  return Math.floor(ms / 86400000);
}

/**
 * Build an ordered queue of relation ids for a session.
 * @param {object[]} catalog filtered items
 * @param {Record<string,{status:string,attempts:object[]}>} relations
 * @param {{ size?: number, day?: string, interleave?: boolean }} opts
 * @returns {string[]}
 */
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

  // Prefer non-stable first; if everything stable, still allow short confirmation.
  const nonStable = scored.filter((s) => s.status !== MASTERY.STABLE);
  const pool = (nonStable.length > 0 ? nonStable : scored).map((s) => s.item);
  const picked = interleave ? pickAcrossDomains(pool, size) : pool.slice(0, size);
  return picked.map((item) => item.id);
}

/**
 * Round-robin the highest-priority item from each domain before truncating.
 * Pool is already sorted by priority, so each bucket stays in that order.
 */
function pickAcrossDomains(pool, size) {
  const buckets = new Map();
  for (const item of pool) {
    if (!buckets.has(item.domain)) buckets.set(item.domain, []);
    buckets.get(item.domain).push(item);
  }
  const order = [
    ...DOMAIN_ORDER.filter((domain) => buckets.has(domain)),
    ...[...buckets.keys()].filter((domain) => !DOMAIN_ORDER.includes(domain)),
  ];
  const picked = [];
  while (picked.length < size) {
    let added = false;
    for (const domain of order) {
      const bucket = buckets.get(domain);
      if (!bucket || bucket.length === 0) continue;
      picked.push(bucket.shift());
      added = true;
      if (picked.length >= size) break;
    }
    if (!added) break;
  }
  return picked;
}

/**
 * After a wrong answer, schedule a later reappear index (not next item).
 * @param {{ queue: string[], answered: number, reappearPlan: Record<string,number>, reappearCount: Record<string,number> }} session
 * @param {string} itemId
 */
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

/**
 * Resolve next item id, injecting planned reappears when due.
 * @returns {{ itemId: string|null, session: object, nearEnd: boolean }}
 */
export function nextItem(session) {
  if (!session || session.finished) {
    return { itemId: null, session, nearEnd: false };
  }

  // Inject reappears that are due
  let queue = session.queue.slice();
  const due = Object.entries(session.reappearPlan || {})
    .filter(([, at]) => at <= session.answered)
    .map(([id]) => id);

  if (due.length) {
    const plan = { ...session.reappearPlan };
    for (const id of due) {
      delete plan[id];
      // Avoid immediate duplicate of current head
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

/**
 * List relation ids currently unstable (for A4 / progress).
 */
export function listUnstableIds(catalog, relations) {
  return catalog
    .filter((item) => {
      const status = (relations[item.id] || emptyRelation()).status;
      return isUnstable(status);
    })
    .map((item) => item.id);
}

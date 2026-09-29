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

function dueNow(relation, today) {
  const due = relation.schedule?.due_day;
  if (!due) return relation.status === MASTERY.SHAKY || relation.status === MASTERY.LEARNING;
  return due <= today;
}

function rankOf(relation, today) {
  const status = relation.status;
  const attempts = relation.attempts || [];
  const last = attempts[attempts.length - 1];
  const due = dueNow(relation, today);
  if (status === MASTERY.SHAKY && due) return 1;
  if (status === MASTERY.LEARNING && due && last && !last.correct) return 2;
  if (status === MASTERY.LEARNING && due) return 3;
  if (status === MASTERY.UNPRACTICED) return 4;
  return 0;
}

function compareRows(a, b) {
  const da = a.rel.schedule?.due_day || "";
  const db = b.rel.schedule?.due_day || "";
  if (da && db && da !== db) return da < db ? -1 : 1;
  if (da !== db) return da ? -1 : 1;
  const tierA = a.item.tier ?? 99;
  const tierB = b.item.tier ?? 99;
  if (tierA !== tierB) return tierA - tierB;
  return a.item.id.localeCompare(b.item.id);
}

function take(items, size, interleave) {
  if (size <= 0 || items.length === 0) return [];
  return interleave ? pickAcrossDomains(items, size) : items.slice(0, size);
}

/**
 * Build an ordered queue of relation ids for a session.
 * Due shaky, then due learning (wrong last, then correct last), then
 * unpracticed. Due stable fills only the seats those groups leave empty.
 * @param {object[]} catalog filtered items
 * @param {Record<string,{status:string,attempts:object[]}>} relations
 * @param {{ size?: number, day?: string, interleave?: boolean }} opts
 * @returns {string[]}
 */
export function buildSessionQueue(catalog, relations, opts = {}) {
  const size = opts.size ?? DEFAULT_SESSION_SIZE;
  const day = opts.day || "1970-01-01";
  const interleave = opts.interleave !== false;
  const rows = catalog.map((item) => ({
    item,
    rel: relations[item.id] || emptyRelation(),
  }));

  const primary = [];
  for (const rank of [1, 2, 3, 4]) {
    const group = rows.filter((row) => rankOf(row.rel, day) === rank).sort(compareRows);
    primary.push(...group.map((row) => row.item));
  }

  const picked = take(primary, size, interleave);
  if (picked.length < size) {
    const stableDue = rows
      .filter((row) => row.rel.status === MASTERY.STABLE && row.rel.schedule?.due_day && row.rel.schedule.due_day <= day)
      .sort(compareRows)
      .map((row) => row.item);
    const seen = new Set(picked.map((item) => item.id));
    for (const item of take(stableDue, size - picked.length, interleave)) {
      if (seen.has(item.id)) continue;
      picked.push(item);
    }
  }

  if (picked.length === 0) {
    const fallback = rows
      .filter((row) => row.rel.status === MASTERY.STABLE)
      .sort((a, b) => {
        const da = a.rel.schedule?.due_day || "9999-99-99";
        const db = b.rel.schedule?.due_day || "9999-99-99";
        if (da !== db) return da < db ? -1 : 1;
        return compareRows(a, b);
      })
      .map((row) => row.item);
    return take(fallback, size, interleave).map((item) => item.id);
  }

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

/**
 * Opt-in complete-domain reference practice.
 * Reuses answer judging and wrong-reappear spacing, but never writes mastery,
 * Mistake Book evidence, scheduler due days, or daily-training queues.
 *
 * Product sessions queue materialized practice_variant_id values
 * (:multiply / :divide-a / :divide-b), never anonymous runtime prompts.
 */
import { judgeAnswer } from "./answer.js";
import { feedbackFor } from "./feedback.js";
import {
  getRelationById,
  listProductPracticeVariants,
  practiceEntryCatalog,
  referencePresentation,
  resolvePracticeVariant,
} from "./content.js";
import { createRng, shuffleWith } from "./shuffle.js";
import {
  DEFAULT_SESSION_SIZE,
  MAX_REAPPEARS_PER_ITEM,
  nextItem,
} from "./schedule.js";

export const REFERENCE_MODE = "reference";
export const REFERENCE_SOURCE = "reference_practice";

/** Minimum answered items between two variants from the same product family. */
export const FAMILY_SPACING_GAP = 2;

/**
 * Reference-practice wrong reappear: exactly WRONG_REAPPEAR_GAP (=2) other
 * answered items between the wrong answer and the revisit.
 * insertAt = answered + gap (not answered + 1 + gap). Leaves global mastery
 * schedule.planWrongReappear untouched.
 */
export function planReferenceWrongReappear(session, itemId, gap = FAMILY_SPACING_GAP) {
  const count = session.reappearCount[itemId] || 0;
  if (count >= MAX_REAPPEARS_PER_ITEM) return session;
  const insertAt = session.answered + gap;
  return {
    ...session,
    reappearPlan: { ...session.reappearPlan, [itemId]: insertAt },
    reappearCount: { ...session.reappearCount, [itemId]: count + 1 },
  };
}

export function referenceTitleFor(domain) {
  return domain === "products" ? "乘除关系练习" : "完整关系练习";
}

export function referenceSubtitleFor(domain) {
  return domain === "products" ? "从乘积反推因数，也从因数得到乘积" : null;
}

/**
 * Build a size-limited queue of practice_variant_id values with family spacing.
 * Same-family variants in one segment must be separated by ≥ FAMILY_SPACING_GAP
 * intervening slots (j - i >= gap + 1).
 */
export function buildSpacedVariantQueue(variants, size, rng) {
  const shuffled = shuffleWith(variants.slice(), rng);
  const queue = [];
  const remaining = shuffled.slice();
  let guard = 0;
  while (queue.length < size && remaining.length && guard < size * remaining.length + 32) {
    guard += 1;
    let picked = -1;
    for (let i = 0; i < remaining.length; i += 1) {
      const candidate = remaining[i];
      const family = candidate.family_key;
      let ok = true;
      for (let back = 1; back <= FAMILY_SPACING_GAP; back += 1) {
        const prior = queue[queue.length - back];
        if (prior && prior.family_key === family) {
          ok = false;
          break;
        }
      }
      if (ok) {
        picked = i;
        break;
      }
    }
    if (picked < 0) {
      // If every remaining candidate collides, take the first and continue;
      // deterministic sessions still prefer spacing whenever possible.
      picked = 0;
    }
    queue.push(remaining.splice(picked, 1)[0]);
  }
  return queue.map((entry) => entry.practice_variant_id);
}

/**
 * @param {{
 *   domain: string,
 *   day: string,
 *   size?: number,
 *   seed?: string|number,
 *   catalog?: object[],
 *   id?: string,
 * }} opts
 */
export function startReferenceSession(opts) {
  const domain = opts.domain;
  if (!domain) throw new Error("CONTRACT_CONFLICT: reference session requires a domain");
  const catalog = opts.catalog || practiceEntryCatalog(domain);
  if (!catalog.length) {
    throw new Error(`CONTRACT_CONFLICT: no complete catalog for ${domain}`);
  }
  const size = opts.size ?? DEFAULT_SESSION_SIZE;
  const seed = opts.seed ?? `${opts.day}|reference|${domain}`;
  const rng = createRng(seed);

  let queue;
  let usesVariants = false;
  if (domain === "products") {
    const variants = listProductPracticeVariants();
    if (!variants.length) {
      throw new Error("CONTRACT_CONFLICT: product practice variants missing — run sync-content");
    }
    queue = buildSpacedVariantQueue(variants, Math.min(size, variants.length), rng);
    usesVariants = true;
  } else {
    const shuffled = shuffleWith(catalog, rng);
    queue = shuffled.slice(0, Math.min(size, shuffled.length)).map((item) => item.id);
  }

  return {
    id: opts.id || `r-${opts.day}-${domain}-${String(seed).slice(0, 24)}`,
    mode: REFERENCE_MODE,
    source: REFERENCE_SOURCE,
    domain,
    day: opts.day,
    queue,
    cursor: 0,
    answered: 0,
    correctCount: 0,
    targetCount: queue.length,
    finished: queue.length === 0,
    earlyStop: false,
    reappearPlan: {},
    reappearCount: {},
    outcomes: [],
    grewFamiliar: [],
    reference: true,
    usesVariants,
    title: referenceTitleFor(domain),
    subtitle: referenceSubtitleFor(domain),
  };
}

export function peekReferenceItem(session, catalog) {
  const domainCatalog = catalog || practiceEntryCatalog(session.domain);
  const { itemId, session: next, nearEnd } = nextItem(session);
  if (!itemId) return { item: null, session: next, nearEnd: false, revisit: false };

  let item;
  if (session.usesVariants || String(itemId).includes(":multiply") || String(itemId).includes(":divide-") || /:(forward|root)$/.test(String(itemId))) {
    item = resolvePracticeVariant(itemId, domainCatalog);
  } else {
    item = referencePresentation(getRelationById(itemId, domainCatalog));
  }

  return {
    item,
    session: next,
    nearEnd,
    revisit: (next.reappearCount && next.reappearCount[itemId] > 0) || false,
  };
}

/**
 * Judge without touching relations / skills / schedules.
 */
export function submitReferenceAnswer({ item, state, session, raw, meta, catalog }) {
  const judged = judgeAnswer(item, raw);
  const feedback = feedbackFor(item, judged.kind, judged);
  if (!feedback.record) {
    return { judged, feedback, state, session, label: null };
  }

  const outcomeId = item.practice_variant_id || item.id;
  let nextSession = {
    ...session,
    answered: session.answered + 1,
    correctCount: session.correctCount + (judged.kind === "correct" ? 1 : 0),
    cursor: session.cursor + 1,
    outcomes: session.outcomes.concat({
      id: outcomeId,
      relation_id: item.relation_id || item.id,
      practice_variant_id: item.practice_variant_id || null,
      correct: judged.kind === "correct",
      elapsedMs: meta.elapsedMs,
      inputMode: meta.inputMode,
    }),
  };
  if (judged.kind === "wrong") {
    nextSession = planReferenceWrongReappear(nextSession, outcomeId);
  }

  // Persist only the transient active session. Relations / skills stay byte-identical.
  const nextState = {
    ...state,
    activeSession: nextSession,
  };

  return {
    judged,
    feedback,
    label: null,
    state: nextState,
    session: nextSession,
  };
}

export function finishReferenceSession(state, session, { earlyStop = false } = {}) {
  const title = session.title || referenceTitleFor(session.domain);
  const summary = {
    id: session.id,
    day: session.day,
    mode: REFERENCE_MODE,
    source: REFERENCE_SOURCE,
    domain: session.domain,
    correct: session.correctCount,
    total: session.answered,
    completed: !earlyStop && session.answered >= session.targetCount,
    earlyStop,
    grewFamiliar: [],
    title,
    subtitle: session.subtitle || referenceSubtitleFor(session.domain),
    reference: true,
  };

  return {
    state: {
      ...state,
      // Keep a short end summary visible, but do not pretend this advanced mastery.
      sessions: state.sessions.concat(summary),
      activeSession: null,
      lastResult: summary,
    },
    summary,
  };
}

export function isReferenceSession(session) {
  return Boolean(session && (session.reference || session.mode === REFERENCE_MODE || session.source === REFERENCE_SOURCE));
}

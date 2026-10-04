/**
 * One short training set, as shared UI orchestration over the V0.3 core.
 *
 * This is main's h5/app.js training path (beginSession / showQuestion /
 * appendDigit / doSubmit / advanceAfterFeedback / endCurrent) with the DOM
 * taken out, so H5 and the Mini Program run the same steps. It decides
 * nothing about learning: judging, the needs_simplification / empty / invalid
 * "no record" rule, mastery, schedule, entry_after unlock, controlled shuffle,
 * the reappearance plan and the session summary all come from src/core
 * (startSession, submitAnswer, peekCurrent, finishSession).
 *
 * State is the full v3 record. The flow only reads and writes the active
 * learner, exactly like h5/app.js (getActiveLearner / withActiveLearner).
 */
import { loadCoreCatalog, domainLabel } from "../../../src/core/content.js";
import { getActiveLearner, withActiveLearner } from "../../../src/core/store.js";
import { startSession, submitAnswer, peekCurrent, finishSession } from "../../../src/core/session.js";
import { MISTAKE_BOOK_SOURCE } from "../../../src/core/schedule.js";
import { localDay } from "../../../src/adapter/storage-contract.js";
import {
  emptyFields,
  focusField,
  typeDigit,
  eraseDigit,
  fieldsAnswer,
} from "../../../src/core/fraction-fields.js";

/** UX contract: 400–700ms. Same value as h5/app.js (correctTimer). */
export const CORRECT_PAUSE_MS = 700;
/** Same answer length cap as h5/app.js appendDigit (digits, not "."). */
const MAX_DIGITS = 8;

/** Which key sits left of 0: 「.」 for decimals, else empty (fractions have no 「/」 key). */
export function extraKeyFor(item) {
  if (item?.needsDecimalPoint) return ".";
  return null;
}

/** h5/app.js resolveInputMode. */
export function resolveInputMode(modes) {
  const hasKey = modes.has("physical_keyboard");
  const hasPad = modes.has("onscreen_keypad");
  if (hasKey && hasPad) return { inputMode: "onscreen_keypad", mixedInput: true };
  if (hasKey) return { inputMode: "physical_keyboard", mixedInput: false };
  return { inputMode: "onscreen_keypad", mixedInput: false };
}

/** h5/app.js appendDigit rules. Returns the new answer, or null when the key is ignored. */
export function appendKey(answer, key, item) {
  if (key === ".") {
    if (!item?.needsDecimalPoint || answer.includes(".")) return null;
    return `${answer}.`;
  }
  if (!/^\d$/.test(key)) return null;
  if (answer.replace(/\./g, "").length >= MAX_DIGITS) return null;
  return answer + key;
}

/**
 * @param {{
 *   store: { read(): object, write(root: object): boolean },
 *   catalog?: object[],
 *   today?: () => string,
 *   now?: () => number,
 *   clock?: () => number,
 * }} deps
 *   now: monotonic ms for answer timing (the platform's clock, as in h5/app.js)
 *   clock: wall-clock ms for the session seed (Date.now, as in h5/app.js)
 */
export function createTrainingFlow({
  store,
  catalog = loadCoreCatalog(),
  today = () => localDay(),
  now = () => Date.now(),
  clock = () => Date.now(),
}) {
  let root = store.read();
  let state = getActiveLearner(root);
  let session = null;
  let item = null;
  let nearEnd = false;
  let revisit = false;
  let answer = "";
  /** fraction_fields items: the shared numerator / denominator boxes. */
  let fields = emptyFields();
  let nudge = "";
  let nudgeSticky = false;
  let modes = new Set();
  let startedAt = 0;
  let submitting = false;
  /** train | correct | wrong | pause | end | empty */
  let screen = "empty";
  let feedback = null;
  let lastOutcome = null;
  /** Screen the pause dialog was opened from. */
  let pausedFrom = null;

  function persist(next) {
    state = next;
    root = withActiveLearner(root, next);
    store.write(root);
  }

  function sessionSeed(mode, domain) {
    // Shell-provided seed: a new order each session, reproducible inside Core.
    return `${today()}|${mode}|${domain || ""}|${(state.sessions || []).length}|${clock()}`;
  }

  function showQuestion() {
    const peeked = peekCurrent(session, catalog);
    session = peeked.session;
    persist({ ...state, activeSession: session });
    item = peeked.item;
    nearEnd = peeked.nearEnd;
    revisit = peeked.revisit;
    if (!item) {
      end(false);
      return;
    }
    answer = "";
    fields = emptyFields();
    nudge = "";
    nudgeSticky = false;
    modes = new Set();
    startedAt = now();
    submitting = false;
    feedback = null;
    screen = "train";
  }

  function end(earlyStop) {
    if (!session) {
      screen = "end";
      return;
    }
    const finished = finishSession(state, session, { earlyStop });
    persist(finished.state);
    lastOutcome = earlyStop ? "stopped" : "finished";
    session = null;
    item = null;
    screen = "end";
  }

  function begin(mode = "daily", domain = null) {
    session = startSession({
      mode,
      domain,
      day: today(),
      relations: state.relations,
      catalog,
      seed: sessionSeed(mode, domain),
    });
    if (mode === MISTAKE_BOOK_SOURCE && session.queue.length === 0) {
      // No current mistakes: nothing to start, no fallback queue.
      session = null;
      screen = "empty";
      return;
    }
    persist({ ...state, activeSession: session });
    if (session.finished || session.queue.length === 0) {
      // All stable or empty — still a short confirmation queue from the catalog.
      session = startSession({
        mode,
        domain,
        day: today(),
        relations: {},
        catalog,
        size: 6,
        seed: sessionSeed(mode, domain),
      });
      persist({ ...state, activeSession: session });
    }
    showQuestion();
  }

  const api = {
    /** Home 「开始今天的练习」 / 「再练一小段」. */
    begin,
    /** 「重新开始一小段」 (pause screen; was on Home): drop the unfinished set, start a new one. */
    restart(mode = "daily", domain = null) {
      persist({ ...state, activeSession: null });
      session = null;
      begin(mode, domain);
    },
    /** Home 「继续刚才的练习」. */
    resume() {
      if (!state.activeSession) {
        begin();
        return;
      }
      session = state.activeSession;
      showQuestion();
    },
    /** Home 「看看这次」: the stored end summary. */
    showLast() {
      session = null;
      item = null;
      lastOutcome = null;
      screen = "end";
    },
    /** One key from the on-screen keypad or (H5 only) the physical keyboard. */
    input(key, inputMode = "onscreen_keypad") {
      if (screen !== "train" || submitting) return false;
      modes.add(inputMode);
      if (item?.fractionFields) {
        const nextFields = typeDigit(fields, key);
        if (nextFields === null) return false;
        fields = nextFields;
      } else {
        const next = appendKey(answer, key, item);
        if (next === null) return false;
        answer = next;
      }
      if (!nudgeSticky) nudge = "";
      return true;
    },
    erase(inputMode = "onscreen_keypad") {
      if (screen !== "train" || submitting) return false;
      modes.add(inputMode);
      if (item?.fractionFields) {
        // Only the focused box; an empty box stays focused (no jump).
        const nextFields = eraseDigit(fields);
        if (nextFields) fields = nextFields;
      } else {
        answer = answer.slice(0, -1);
      }
      if (!nudgeSticky) nudge = "";
      return true;
    },
    /** Tap the numerator or the denominator box (fraction_fields only). */
    focus(which) {
      if (screen !== "train" || submitting || !item?.fractionFields) return false;
      const next = focusField(fields, which);
      if (next === null) return false;
      fields = next;
      return true;
    },
    /** Judge once through Core. "correct" | "wrong" | "nudge" | null (ignored). */
    submit() {
      if (submitting || screen !== "train" || !item) return null;
      submitting = true;
      const mode = resolveInputMode(modes);
      const result = submitAnswer({
        item,
        state,
        session,
        // fraction_fields: both boxes → ONE judging string (or "" = not an attempt).
        raw: item.fractionFields ? fieldsAnswer(fields) : answer,
        catalog,
        meta: {
          day: today(),
          inputMode: mode.inputMode,
          mixedInput: mode.mixedInput,
          elapsedMs: Math.round(now() - startedAt),
        },
      });
      if (!result.feedback.record) {
        // Not an attempt (empty / malformed / needs_simplification): stay
        // here, keep the answer editable, nothing recorded.
        submitting = false;
        nudge = result.feedback.message;
        nudgeSticky = Boolean(result.feedback.needsSimplification);
        return "nudge";
      }
      nudge = "";
      nudgeSticky = false;
      persist(result.state);
      session = result.session;
      feedback = result.feedback;
      screen = result.judged.kind === "correct" ? "correct" : "wrong";
      return screen;
    },
    /** Leave the feedback: after the short pause on correct, 「下一题」 on wrong. */
    advance() {
      if (screen !== "correct" && screen !== "wrong") return screen;
      submitting = false;
      const done = session.answered >= session.targetCount || session.cursor >= session.queue.length;
      if (done) end(false);
      else showQuestion();
      return screen;
    },
    /** 「先停一下」 from the question or the wrong feedback. */
    pause() {
      if (screen !== "train" && screen !== "wrong") return false;
      pausedFrom = screen;
      screen = "pause";
      return true;
    },
    /**
     * 「继续做」: back to where the student was — the same question (answer
     * kept, still editable) or the same wrong feedback.
     */
    unpause() {
      if (screen !== "pause") return false;
      // Pausing preserves the feedback context: paused from Wrong → 继续做 returns to that same Wrong feedback.
      screen = pausedFrom || "train";
      pausedFrom = null;
      return true;
    },
    /** 「先停」: keep what was done, end the set early. */
    stop() {
      end(true);
    },
    view() {
      const total = Math.max(1, session?.targetCount || 1);
      const position = Math.min(total, (session?.answered || 0) + 1);
      return {
        screen,
        item,
        answer,
        fields: item?.fractionFields ? fields : null,
        nudge,
        nudgeSticky,
        feedback,
        pill: nearEnd ? "快完成了" : revisit ? "再试一次" : item ? domainLabel(item.domain) : "",
        position,
        total,
        extraKey: extraKeyFor(item),
        result: state.lastResult || null,
        lastOutcome,
        writeProtected: Boolean(store.writeProtected),
      };
    },
    get state() {
      return state;
    },
    get root() {
      return root;
    },
    get session() {
      return session;
    },
  };
  return api;
}

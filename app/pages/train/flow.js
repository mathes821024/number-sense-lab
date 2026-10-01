/**
 * One short training set, as shared UI session logic over src/core.
 * Mirrors the behaviour of main's h5/app.js (beginSession / showQuestion /
 * doSubmit / advanceAfterFeedback / endCurrent) without any rendering or
 * platform call. The page owns the correct-answer pause timer; this file
 * only says how long it is.
 */
import { loadCoreCatalog, domainLabel } from "../../../src/core/content.js";
import { startSession, submitAnswer, peekCurrent, finishSession } from "../../../src/core/session.js";

/** UX contract: 400–700ms. Same value as main's h5/app.js. */
export const CORRECT_PAUSE_MS = 700;
const MAX_DIGITS = 8;

export function isoDay(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * @param {{ store: {read(): object, write(s: object): void}, catalog?: object[],
 *           today?: () => string, now?: () => number }} deps
 */
export function createTrainingFlow({ store, catalog = loadCoreCatalog(), today = () => isoDay(), now = () => Date.now() }) {
  let state = store.read();
  let session = null;
  let item = null;
  let nearEnd = false;
  let revisit = false;
  let answer = "";
  let nudge = "";
  let modes = new Set();
  let startedAt = 0;
  let screen = "idle"; // idle | train | correct | wrong | done
  let feedback = null;
  let lastSummary = null;

  function persist(next) {
    state = next;
    store.write(next);
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
    nudge = "";
    modes = new Set();
    startedAt = now();
    feedback = null;
    screen = "train";
  }

  function end(earlyStop) {
    if (session) {
      const finished = finishSession(state, session, { earlyStop });
      persist(finished.state);
      lastSummary = finished.summary;
    }
    session = null;
    item = null;
    screen = "done";
  }

  function resolveInputMode() {
    const key = modes.has("physical_keyboard");
    const pad = modes.has("onscreen_keypad");
    if (key && pad) return { inputMode: "onscreen_keypad", mixedInput: true };
    if (key) return { inputMode: "physical_keyboard", mixedInput: false };
    return { inputMode: "onscreen_keypad", mixedInput: false };
  }

  return {
    /** Start today's set (or a focused one), exactly like main's beginSession. */
    begin(mode = "daily", domain = null) {
      session = startSession({ mode, domain, day: today(), relations: state.relations, catalog });
      persist({ ...state, activeSession: session });
      if (session.finished || session.queue.length === 0) {
        session = startSession({ mode, domain, day: today(), relations: {}, catalog, size: 6 });
        persist({ ...state, activeSession: session });
      }
      showQuestion();
    },
    /** Continue the stored unfinished set. */
    resume() {
      if (!state.activeSession) return this.begin();
      session = state.activeSession;
      showQuestion();
    },
    input(digit, inputMode = "onscreen_keypad") {
      if (screen !== "train") return false;
      modes.add(inputMode);
      if (digit === ".") {
        if (!item?.needsDecimalPoint || answer.includes(".")) return false;
        answer += ".";
      } else {
        if (!/^\d$/.test(digit) || answer.replace(".", "").length >= MAX_DIGITS) return false;
        answer += digit;
      }
      nudge = "";
      return true;
    },
    erase(inputMode = "onscreen_keypad") {
      if (screen !== "train") return false;
      modes.add(inputMode);
      answer = answer.slice(0, -1);
      nudge = "";
      return true;
    },
    /** Judge once. Returns "correct" | "wrong" | "nudge" | null (ignored). */
    submit() {
      if (screen !== "train" || !item) return null;
      const mode = resolveInputMode();
      const result = submitAnswer({
        item,
        state,
        session,
        raw: answer,
        catalog,
        meta: { day: today(), inputMode: mode.inputMode, mixedInput: mode.mixedInput, elapsedMs: Math.round(now() - startedAt) },
      });
      if (!result.feedback.record) {
        nudge = result.feedback.message;
        return "nudge";
      }
      persist(result.state);
      session = result.session;
      feedback = result.feedback;
      screen = result.judged.kind === "correct" ? "correct" : "wrong";
      return screen;
    },
    /** Leave the feedback (auto after the pause on correct, 下一题 on wrong). */
    advance() {
      if (screen !== "correct" && screen !== "wrong") return screen;
      const done = session.answered >= session.targetCount || session.cursor >= session.queue.length;
      if (done) end(false);
      else showQuestion();
      return screen;
    },
    /** 先停一下 → 先停: keep what was done, end the set early. */
    stop() {
      end(true);
    },
    view() {
      const total = Math.max(1, session?.targetCount || 1);
      const answered = session?.answered || 0;
      const shownIndex = screen === "train" ? answered + 1 : answered;
      return {
        screen,
        item,
        answer,
        nudge,
        feedback,
        pill: nearEnd ? "快完成了" : revisit ? "再试一次" : item ? domainLabel(item.domain) : "",
        position: Math.min(total, Math.max(1, shownIndex)),
        total,
        needsDecimalPoint: Boolean(item?.needsDecimalPoint),
        summary: lastSummary,
      };
    },
    get state() {
      return state;
    },
  };
}

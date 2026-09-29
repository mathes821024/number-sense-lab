/**
 * Motion for Number Sense Lab.
 * Learning (structure appearing) comes before press feedback.
 * No bounce, particles, or delay before the next question.
 * prefers-reduced-motion skips every animation; the text stays.
 */
import { animate, stagger } from "motion";

const ease = [0.16, 1, 0.3, 1];

function reduced() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function nodes(selector) {
  return [...document.querySelectorAll(selector)];
}

function shift(selector, { y = 8, duration = 0.24, delay = 0 } = {}) {
  const list = nodes(selector);
  if (!list.length || reduced()) return;
  for (const el of list) {
    el.style.opacity = "0.45";
    el.style.transform = `translateY(${y}px)`;
  }
  animate(list, { opacity: [0.45, 1], y: [y, 0] }, { duration, ease, delay });
}

function reveal(selector, { y = 8, duration = 0.26, delay = 0 } = {}) {
  const list = nodes(selector);
  if (!list.length || reduced()) return;
  for (const el of list) el.style.opacity = "0";
  try {
    animate(list, { opacity: [0, 1], y: [y, 0] }, { duration, ease, delay });
  } catch {
    for (const el of list) el.style.opacity = "";
  }
}

/**
 * @param {string} name
 * @param {"enter" | "frames" | "pattern"} intent
 */
export function playScreen(name, intent = "enter") {
  if (reduced()) return;

  if (intent === "frames") {
    reveal("#wrong .frame", { y: 6, duration: 0.24, delay: stagger(0.08) });
    return;
  }
  if (intent === "pattern") {
    reveal("#wrong .pattern .check", { y: 4, duration: 0.2 });
    reveal("#wrong .kin", { y: 6, duration: 0.22, delay: stagger(0.07, { startDelay: 0.05 }) });
    return;
  }

  if (name === "home") {
    shift("#home .home-headline", { y: 12, duration: 0.36 });
    shift("#home .home-note, #home .home-cta, #home .home-secondary", { y: 8, duration: 0.28, delay: 0.05 });
    shift("#home .domain", { y: 8, duration: 0.28, delay: stagger(0.045, { startDelay: 0.08 }) });
    return;
  }
  if (name === "train") {
    shift("#train .question", { y: 10, duration: 0.26 });
    return;
  }
  if (name === "wrong") {
    reveal("#wrong .eq", { y: 10, duration: 0.3 });
    reveal("#wrong .hook", { y: 6, duration: 0.24, delay: 0.08 });
    shift("#wrong .see", { y: 4, duration: 0.2, delay: 0.12 });
    return;
  }
  if (name === "correct") {
    shift("#correct .correct-eq", { y: 6, duration: 0.22 });
    shift("#correct .ok, #correct .word", { y: 0, duration: 0.16 });
    return;
  }
  if (name === "a4") {
    shift("#a4 .sheet", { y: 8, duration: 0.26 });
    return;
  }
  if (name === "pause") {
    shift("#pause .ask", { y: 6, duration: 0.2 });
    return;
  }
  if (name === "end") {
    shift("#end h1", { y: 8, duration: 0.26 });
    return;
  }
  if (name === "progress") {
    shift("#progress .title", { y: 8, duration: 0.26 });
    return;
  }
  if (name === "focus-confirm") {
    shift("#focus .title", { y: 8, duration: 0.26 });
  }
}

/** Keypad press. A short scale, no overshoot. The typed number stays still. */
export function pressControl(el) {
  if (!el || reduced()) return;
  animate(el, { scale: [0.97, 1] }, { duration: 0.12, ease });
}

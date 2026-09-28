import { firstSliceCatalog } from "../src/core/content.js";
import { createMemoryStore } from "../src/core/memory-store.js";
import { finishSession, submitAnswer } from "../src/core/session.js";
import { createBrowserStore } from "./browser-store.js";

const item = firstSliceCatalog[0];
const memory = createMemoryStore();
const browserStore = createBrowserStore(window.localStorage, "nsl-slice-01");
let state = browserStore.read();
memory.write(state);

const screens = ["home", "train", "pause", "wrong", "correct", "end"];
let answer = "";
let inputModes = new Set();
let startedAt = 0;
let returnTo = "train";
let correctTimer = 0;
let outcome = null;

function show(name) {
  for (const id of screens) document.getElementById(id).hidden = id !== name;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function inputMode() {
  if (inputModes.size > 1) return "mixed";
  return inputModes.values().next().value || "keypad";
}

function persist(next) {
  state = next;
  memory.write(next);
  browserStore.write(next);
}

function resetQuestion() {
  answer = "";
  inputModes = new Set();
  startedAt = performance.now();
  document.getElementById("answer").textContent = "";
  document.getElementById("nudge").textContent = "";
  document.getElementById("pattern").hidden = true;
  document.getElementById("frames").hidden = true;
}

function renderFeedback(feedback) {
  document.querySelector("#wrong .eq").textContent = feedback.relation;
  document.querySelector("#wrong .hook").textContent = feedback.hook;
  document.querySelector("#pattern .check").textContent = feedback.pattern.check;
  document.querySelector("#pattern .family").innerHTML = feedback.pattern.family
    .map((line) => `<b>${line}</b>`)
    .join("<br>");
  document.getElementById("frames").innerHTML = feedback.frames
    .map((frame, index) => `<div class="frame"><span class="n">${index + 1}</span><div><b>${frame.title}</b><span>${frame.detail}</span></div></div>`)
    .join("");
}

function endCopy() {
  if (!outcome) return "先到这里。";
  if (outcome.judged.kind === "correct") return `${item.relation}。这一次想起来了。`;
  return `${item.prompt.replace(" = ?", "")} 留下了一个记法：${outcome.feedback.hook}`;
}

function goEnd() {
  const correct = outcome && outcome.judged.kind === "correct" ? 1 : 0;
  const total = outcome ? 1 : 0;
  persist(finishSession(state, { day: today(), correct, total, completed: true }));
  document.getElementById("end-copy").textContent = endCopy();
  show("end");
}

document.getElementById("start").addEventListener("click", () => {
  outcome = null;
  resetQuestion();
  show("train");
});

document.querySelectorAll("[data-digit]").forEach((button) => {
  button.addEventListener("click", () => {
    if (answer.length >= 6) return;
    inputModes.add("keypad");
    answer += button.dataset.digit;
    document.getElementById("answer").textContent = answer;
    document.getElementById("nudge").textContent = "";
  });
});

document.getElementById("del").addEventListener("click", () => {
  inputModes.add("keypad");
  answer = answer.slice(0, -1);
  document.getElementById("answer").textContent = answer;
});

document.addEventListener("keydown", (event) => {
  if (document.getElementById("train").hidden) return;
  if (/^\d$/.test(event.key)) {
    inputModes.add("keyboard");
    if (answer.length < 6) answer += event.key;
    document.getElementById("answer").textContent = answer;
    document.getElementById("nudge").textContent = "";
  } else if (event.key === "Backspace") {
    inputModes.add("keyboard");
    answer = answer.slice(0, -1);
    document.getElementById("answer").textContent = answer;
  } else if (event.key === "Enter") {
    document.getElementById("submit").click();
  }
});

document.getElementById("submit").addEventListener("click", () => {
  const result = submitAnswer({
    item,
    state,
    raw: answer,
    meta: {
      day: today(),
      inputMode: inputMode(),
      elapsedMs: Math.round(performance.now() - startedAt),
      slow: false,
    },
  });
  if (!result.feedback.record) {
    document.getElementById("nudge").textContent = result.feedback.message;
    return;
  }
  persist(result.state);
  outcome = result;
  if (result.judged.kind === "correct") {
    document.querySelector("#correct .correct-eq").textContent = result.feedback.relation;
    show("correct");
    window.clearTimeout(correctTimer);
    correctTimer = window.setTimeout(goEnd, 550);
    return;
  }
  renderFeedback(result.feedback);
  show("wrong");
});

document.querySelectorAll("[data-pause]").forEach((button) => {
  button.addEventListener("click", () => {
    returnTo = button.closest(".screen").id;
    show("pause");
  });
});
document.getElementById("resume").addEventListener("click", () => show(returnTo));
document.getElementById("stop").addEventListener("click", () => show("home"));
document.getElementById("show-pattern").addEventListener("click", () => {
  document.getElementById("pattern").hidden = false;
});
document.getElementById("show-frames").addEventListener("click", () => {
  document.getElementById("frames").hidden = false;
});
document.getElementById("next").addEventListener("click", goEnd);
document.getElementById("home-again").addEventListener("click", () => show("home"));

/* PT0 human-validation prototype.
 * Sample questions, fake history, and localStorage are prototype-only.
 * They are not a content contract, data contract, or mini program architecture.
 */

const STORAGE_KEY = "nsl-pt0-prototype";

const SQUARES = [
  item("sq12", "平方", "12² = ?", "12²", "144", "12 × 12 = 144", "平方就是这个数乘自己。", "int"),
  item("sq15", "平方", "15² = ?", "15²", "225", "15 × 15 = 225", "平方就是这个数乘自己。", "int"),
  item("sq17", "平方", "17² = ?", "17²", "289", "17 × 17 = 289", "平方就是这个数乘自己。", "int"),
  item("sq18", "平方", "18² = ?", "18²", "324", "18 × 18 = 324", "平方就是这个数乘自己。", "int"),
];

const PRODUCTS = [
  item("p176", "常用乘积", "17 × 6 = ?", "17 × 6", "102", "17 × 6 = 102", "这是两个数相乘，不是相加。", "int"),
  item("p187", "常用乘积", "18 × 7 = ?", "18 × 7", "126", "18 × 7 = 126", "这是两个数相乘，不是相加。", "int"),
  item("p148", "常用乘积", "14 × 8 = ?", "14 × 8", "112", "14 × 8 = 112", "这是两个数相乘，不是相加。", "int"),
  item("p169", "常用乘积", "16 × 9 = ?", "16 × 9", "144", "16 × 9 = 144", "这是两个数相乘，不是相加。", "int"),
];

const FRACTIONS = [
  item("f12", "分数到小数", "1/2 = ?", "1/2", "0.5", "1/2 = 0.5", "把整体看成 1，再看其中的一份有多大。", "dec"),
  item("f14", "分数到小数", "1/4 = ?", "1/4", "0.25", "1/4 = 0.25", "把整体分成四份，再看其中的一份。", "dec"),
  item("f34", "分数到小数", "3/4 = ?", "3/4", "0.75", "3/4 = 0.75", "把整体分成四份，再看其中的三份。", "dec"),
  item("f15", "分数到小数", "1/5 = ?", "1/5", "0.2", "1/5 = 0.2", "把整体分成五份，再看其中的一份。", "dec"),
  item("f25", "分数到小数", "2/5 = ?", "2/5", "0.4", "2/5 = 0.4", "把整体分成五份，再看其中的两份。", "dec"),
  item("f35", "分数到小数", "3/5 = ?", "3/5", "0.6", "3/5 = 0.6", "把整体分成五份，再看其中的三份。", "dec"),
];

const DAILY_IDS = ["sq12", "p176", "sq15", "f12", "p187", "f34", "sq17", "p148", "f25", "sq18"];
const PRINT_PROMPTS = ["17 × 6 = ?", "15² = ?", "3/4 = ?", "14 × 8 = ?"];

const params = readParams();
let store = loadStore();
let session = null;
let screen = { name: "home" };
let advanceTimer = null;

const app = document.querySelector("#app");

document.addEventListener("click", onClick);
document.addEventListener("keydown", onKey);

boot();

function item(id, domain, prompt, short, answer, relation, hint, kind) {
  return { id, domain, prompt, short, answer, relation, hint, kind };
}

function readParams() {
  const q = new URLSearchParams(location.search);
  const delay = Number(q.get("correctDelay"));
  return {
    delay: delay === 400 || delay === 550 || delay === 700 ? delay : 550,
    wrongShow: q.get("wrongShow") === "B" ? "B" : "A",
    revisit: q.get("revisit") === "A" ? "A" : "B",
    home: q.get("home"),
    printEmpty: q.get("printEmpty") === "1",
    fresh: q.get("fresh") === "1",
  };
}

function sampleStore() {
  return {
    v: 1,
    sound: true,
    homeMode: "first",
    lastResult: null,
    saved: null,
    history: [
      { date: "9月28日", status: "做完了", correct: 8, total: 10, sample: true },
      { date: "9月27日", status: "先停了", correct: 5, total: 7, sample: true },
    ],
  };
}

function loadStore() {
  if (params.fresh) {
    try { localStorage.removeItem(STORAGE_KEY); } catch (err) { /* prototype-only */ }
    return sampleStore();
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return sampleStore();
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.v !== 1) return sampleStore();
    return parsed;
  } catch (err) {
    return sampleStore();
  }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    /* Closing the page may drop this prototype state. That is allowed. */
  }
}

function boot() {
  if (params.home === "first" || params.home === "done" || params.home === "paused") {
    store.homeMode = params.home;
  }
  if (store.homeMode === "done" && !store.lastResult) {
    store.lastResult = { kind: "done", correct: 8, total: 10, familiar: ["12²", "1/2", "18 × 7"], date: "9月28日" };
  }
  if (store.homeMode === "paused" && !store.saved) {
    store.saved = demoSaved();
  }
  if (params.fresh) store.history = [];
  render();
}

function demoSaved() {
  const queue = queueFromIds(DAILY_IDS);
  return {
    kind: "daily",
    queue,
    index: 2,
    correct: 1,
    total: 2,
    familiar: ["12²"],
    phase: "ask",
    answer: "",
    wrongValue: "",
  };
}

function allItems() {
  return [...SQUARES, ...PRODUCTS, ...FRACTIONS];
}

function byId(id) {
  return allItems().find((entry) => entry.id === id);
}

function queueFromIds(ids) {
  return ids.map((id) => ({ ...byId(id), revisit: false, requeued: false }));
}

function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function finePointer() {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

function esc(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]));
}

function todayLabel() {
  const now = new Date();
  return `${now.getMonth() + 1}月${now.getDate()}日`;
}

function checkSvg() {
  return '<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path d="M4 13 l5 5 L20 6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>';
}

function ringSvg() {
  return '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><circle cx="8" cy="8" r="5.25" fill="none" stroke="currentColor" stroke-width="1.5"></circle></svg>';
}

function starSvg() {
  return '<svg class="star" viewBox="0 0 16 16" aria-hidden="true"><polygon points="8,1.2 9.8,6 15,6.2 11,9.4 12.4,14.6 8,11.8 3.6,14.6 5,9.4 1,6.2 6.2,6" fill="currentColor"></polygon></svg>';
}

function onClick(event) {
  const target = event.target.closest("[data-act]");
  if (!target) return;
  const act = target.dataset.act;
  if (act === "start-daily") startSession("daily", DAILY_IDS);
  else if (act === "resume") resumeSession();
  else if (act === "restart") startSession("daily", DAILY_IDS);
  else if (act === "review") openLastResult();
  else if (act === "focus") openFocus(target.dataset.domain);
  else if (act === "start-focus") startSession("focus", focusIds(target.dataset.domain));
  else if (act === "progress") openProgress();
  else if (act === "print") openPrint();
  else if (act === "home") goHome();
  else if (act === "pause") openPause();
  else if (act === "resume-question") closePause();
  else if (act === "stop") stopSession();
  else if (act === "digit") typeChar(target.dataset.key);
  else if (act === "back") backspace();
  else if (act === "submit") submit();
  else if (act === "skip") skipCorrect();
  else if (act === "next") nextAfterWrong();
  else if (act === "sound") toggleSound();
  else if (act === "do-print") doPrint();
}

function onKey(event) {
  if (!session || session.phase !== "ask" || screen.name !== "train") return;
  const target = event.target;
  if (target instanceof Element && target.closest("button") && event.key === "Enter") return;
  if (/^[0-9]$/.test(event.key)) {
    event.preventDefault();
    typeChar(event.key);
  } else if (event.key === ".") {
    event.preventDefault();
    typeChar(".");
  } else if (event.key === "Backspace") {
    event.preventDefault();
    backspace();
  } else if (event.key === "Enter") {
    event.preventDefault();
    submit();
  }
}

function focusIds(domain) {
  if (domain === "平方") return SQUARES.map((entry) => entry.id);
  if (domain === "常用乘积") return PRODUCTS.map((entry) => entry.id);
  return FRACTIONS.map((entry) => entry.id);
}

function focusStatus(domain) {
  if (domain === "平方") return "正在熟悉";
  if (domain === "常用乘积") return "有几题要再巩固";
  return "还没怎么练";
}

function startSession(kind, ids) {
  clearAdvance();
  session = {
    kind,
    queue: queueFromIds(ids),
    index: 0,
    correct: 0,
    total: 0,
    familiar: [],
    phase: "ask",
    answer: "",
    emptyHint: false,
    wrongValue: "",
  };
  screen = { name: "train" };
  rememberProgress();
  render();
}

function resumeSession() {
  if (!store.saved) {
    startSession("daily", DAILY_IDS);
    return;
  }
  clearAdvance();
  const saved = store.saved;
  const phase = saved.phase === "correct" || saved.phase === "wrong" ? saved.phase : "ask";
  session = {
    kind: saved.kind,
    queue: saved.queue,
    index: saved.index,
    correct: saved.correct,
    total: saved.total,
    familiar: saved.familiar || [],
    phase,
    answer: saved.answer || "",
    emptyHint: false,
    wrongValue: saved.wrongValue || "",
  };
  screen = { name: "train" };
  render();
  if (phase === "correct") scheduleAdvance();
}

/* Prototype-only snapshot. Not a data contract or architecture decision. */
function snapshotSession() {
  return {
    kind: session.kind,
    queue: session.queue,
    index: session.index,
    correct: session.correct,
    total: session.total,
    familiar: session.familiar,
    phase: session.phase,
    answer: session.answer,
    wrongValue: session.wrongValue,
  };
}

function rememberProgress() {
  store.homeMode = "paused";
  store.saved = snapshotSession();
  persist();
}

function scheduleAdvance() {
  const wait = reducedMotion() ? 80 : params.delay;
  clearAdvance();
  advanceTimer = setTimeout(advance, wait);
}

function current() {
  return session.queue[session.index];
}

function typeChar(key) {
  if (!session || session.phase !== "ask") return;
  const currentItem = current();
  if (key === ".") {
    if (currentItem.kind !== "dec" || session.answer.includes(".")) return;
  } else if (!/^[0-9]$/.test(key)) {
    return;
  }
  if (session.answer.length >= 8) return;
  session.answer += key;
  session.emptyHint = false;
  rememberProgress();
  render();
}

function backspace() {
  if (!session || session.phase !== "ask" || !session.answer) return;
  session.answer = session.answer.slice(0, -1);
  session.emptyHint = false;
  rememberProgress();
  render();
}

function submit() {
  if (!session || session.phase !== "ask") return;
  const value = session.answer.trim();
  const currentItem = current();
  if (!value || value === ".") {
    session.emptyHint = true;
    render();
    return;
  }
  session.emptyHint = false;
  if (isCorrect(currentItem, value)) showCorrect(currentItem);
  else showWrong(currentItem);
}

function isCorrect(entry, value) {
  if (entry.kind === "int") return value === entry.answer;
  if (!/^\d*\.\d+$|^\d+\.\d*$/.test(value) && value !== entry.answer) return false;
  const given = Number(value);
  const expected = Number(entry.answer);
  return Number.isFinite(given) && given === expected;
}

function showCorrect(entry) {
  session.phase = "correct";
  session.correct += 1;
  session.total += 1;
  if (!session.familiar.includes(entry.short) && session.familiar.length < 3) {
    session.familiar.push(entry.short);
  }
  rememberProgress();
  render();
  if (store.sound) beep();
  scheduleAdvance();
}

function showWrong(entry) {
  session.phase = "wrong";
  session.total += 1;
  session.wrongValue = session.answer;
  if (!entry.requeued) {
    entry.requeued = true;
    const again = { ...entry, revisit: true, requeued: true };
    const at = Math.min(session.index + 3, session.queue.length);
    session.queue.splice(at, 0, again);
  }
  rememberProgress();
  render();
}

function skipCorrect() {
  if (!session || session.phase !== "correct") return;
  clearAdvance();
  advance();
}

function advance() {
  clearAdvance();
  session.index += 1;
  session.phase = "ask";
  session.answer = "";
  session.emptyHint = false;
  session.wrongValue = "";
  if (session.index >= session.queue.length) finish("done");
  else {
    rememberProgress();
    render();
  }
}

function nextAfterWrong() {
  if (!session || session.phase !== "wrong") return;
  advance();
}

function openPause() {
  if (!session) return;
  clearAdvance();
  session.pausedFrom = session.phase;
  rememberProgress();
  screen = { name: "pause" };
  render();
}

function closePause() {
  if (!session) return;
  screen = { name: "train" };
  if (session.pausedFrom === "correct") {
    session.phase = "correct";
    scheduleAdvance();
  }
  render();
}

function stopSession() {
  finish("stop");
}

function finish(kind) {
  clearAdvance();
  const result = {
    kind,
    correct: session.correct,
    total: session.total,
    familiar: session.familiar.slice(0, 3),
    date: todayLabel(),
  };
  store.history.unshift({
    date: result.date,
    status: kind === "done" ? "做完了" : "先停了",
    correct: result.correct,
    total: result.total,
    sample: false,
  });
  store.lastResult = result;
  store.homeMode = kind === "done" ? "done" : "paused";
  store.saved = kind === "done" ? null : snapshotSession();
  persist();
  session = null;
  screen = { name: "end", result };
  render();
}

function clearAdvance() {
  if (advanceTimer) {
    clearTimeout(advanceTimer);
    advanceTimer = null;
  }
}

function beep() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = 660;
  gain.gain.value = 0.04;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.08);
  osc.onended = () => ctx.close();
}

function toggleSound() {
  store.sound = !store.sound;
  persist();
  render();
}

function goHome() {
  clearAdvance();
  screen = { name: "home" };
  render();
}

function openFocus(domain) {
  screen = { name: "focus", domain };
  render();
}

function openProgress() {
  screen = { name: "progress" };
  render();
}

function openPrint() {
  screen = { name: "print" };
  render();
}

function openLastResult() {
  if (!store.lastResult) return;
  screen = { name: "end", result: store.lastResult };
  render();
}

function doPrint() {
  const printable = !params.printEmpty && PRINT_PROMPTS.length > 0;
  if (!printable || typeof window.print !== "function") {
    screen = { name: "print", failed: true };
    render();
    return;
  }
  window.print();
}

function slotLabel(entry) {
  const left = session.queue.length - session.index;
  if (entry.revisit && params.revisit === "B") return "再试一次";
  if (left <= 2 && session.total > 0) return "快完成了";
  return entry.domain;
}

function render() {
  const html = {
    home: renderHome,
    focus: renderFocus,
    train: renderTrain,
    pause: renderPause,
    end: renderEnd,
    progress: renderProgress,
    print: renderPrint,
  }[screen.name]();
  app.innerHTML = html;
  const input = document.getElementById("answer");
  if (input && session && session.phase === "ask" && finePointer()) {
    input.focus();
  }
}

function renderHome() {
  const mode = store.homeMode;
  const title = mode === "done" ? "今天这段练完了" : "数感训练场";
  let action;
  if (mode === "done") {
    action = '<button class="primary" data-act="review">看看这次</button><button class="quiet weaker" data-act="restart">再练一小段</button>';
  } else if (mode === "paused") {
    action = '<button class="primary" data-act="resume">继续刚才的练习</button><button class="quiet" data-act="restart">重新开始一小段</button>';
  } else {
    action = '<button class="primary" data-act="start-daily">开始今天的练习<small>大约 5～10 分钟</small></button>';
  }
  return `<div class="wrap stack gap-32">
    <div class="stack gap-8">
      <h1 class="title">${title}</h1>
      <p class="body soft">把常会用到的数字关系，练到能直接想起来。</p>
    </div>
    <div class="stack gap-16">${action}</div>
    <div class="domains">
      <button data-act="focus" data-domain="平方">平方</button>
      <button data-act="focus" data-domain="常用乘积">常用乘积</button>
      <button data-act="focus" data-domain="分数到小数">分数到小数</button>
    </div>
    <div class="stack">
      <button class="quiet" data-act="progress">最近练得怎么样</button>
      <button class="quiet" data-act="print">印到纸上</button>
    </div>
    <p class="label">练习记录只保存在当前设备，不会自动同步到其他设备。</p>
    <button class="quiet" data-act="sound">${store.sound ? "声音开" : "声音关"}</button>
  </div>`;
}

function renderFocus() {
  const domain = screen.domain;
  return `<div class="wrap stack gap-32">
    <button class="quiet" data-act="home">回到首页</button>
    <div class="stack gap-8">
      <h1 class="title">${esc(domain)}</h1>
      <p class="body">只练这一块，同样会结束。</p>
      <p class="label">${esc(focusStatus(domain))}</p>
    </div>
    <button class="primary" data-act="start-focus" data-domain="${esc(domain)}">开始这一小段</button>
  </div>`;
}

function renderTrain() {
  const entry = current();
  const locked = session.phase !== "ask";
  const showCorrectMark = session.phase === "correct";
  const asking = session.phase === "ask" || session.phase === "correct";
  if (!asking) return renderWrong(entry);
  return `<div class="wrap train-pad stack">
    <button class="quiet" data-act="pause">先停一下</button>
    <p class="label">${esc(slotLabel(entry))}</p>
    <h1 class="question">${esc(entry.prompt)}</h1>
    <div class="answer-row">
      <input id="answer" class="answer" inputmode="none" readonly aria-label="答案" value="${esc(session.answer)}">
      ${showCorrectMark ? `<p class="correct-mark" role="status">${checkSvg()}对</p>` : ""}
    </div>
    ${session.emptyHint ? '<p class="body soft" role="status">先写一个数。</p>' : ""}
    ${showCorrectMark ? '<button class="quiet" data-act="skip">继续</button>' : ""}
    ${renderKeypad(entry, locked)}
  </div>`;
}

function renderWrong(entry) {
  const prior = params.wrongShow === "B"
    ? `<p class="prior">你刚才写：${esc(session.wrongValue)}</p>`
    : "";
  return `<div class="wrap stack gap-24">
    <button class="quiet" data-act="pause">先停一下</button>
    <p class="question demoted">${esc(entry.prompt)}</p>
    ${prior}
    <div class="relation">
      <h1 class="relation-text">${esc(entry.relation)}</h1>
      <p class="body hint">${esc(entry.hint)}</p>
      <p class="notice-mark">${ringSvg()}看这里</p>
    </div>
    <button class="primary" data-act="next">下一题</button>
  </div>`;
}

function renderKeypad(entry, locked) {
  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
  const keys = digits.map((digit) => keyButton(digit, digit, locked)).join("");
  const dot = entry.kind === "dec"
    ? keyButton(".", ".", locked)
    : '<span class="key-slot"></span>';
  return `<div class="keypad keypad-fixed no-print">
    <div class="keypad-grid">
      ${keys}
      ${dot}
      ${keyButton("0", "0", locked)}
      ${keyButton("删除", "back", locked, true)}
    </div>
    ${locked ? "" : '<div class="stack" style="margin-top:8px"><button class="primary" data-act="submit">提交</button></div>'}
  </div>`;
}

function keyButton(label, key, locked, word) {
  if (key === "back") {
    return `<button class="key key-word" data-act="back" ${locked ? "disabled" : ""}>${label}</button>`;
  }
  return `<button class="key ${word ? "key-word" : ""}" data-act="digit" data-key="${esc(key)}" ${locked ? "disabled" : ""}>${esc(label)}</button>`;
}

function renderPause() {
  return `<div class="wrap stack gap-24">
    <h1 class="title">先停在这里？</h1>
    <p class="body">已经做的会留下。</p>
    <button class="primary" data-act="resume-question">继续做</button>
    <button class="quiet" data-act="stop">先停</button>
  </div>`;
}

function renderEnd() {
  const result = screen.result;
  const stopped = result.kind === "stop";
  const familiar = !stopped && result.familiar.length
    ? `<div class="stack gap-8"><p class="label" style="color:var(--ink)">这几个更熟了</p>${result.familiar.map((name) => `<p class="body">${esc(name)}</p>`).join("")}</div>`
    : "";
  return `<div class="wrap end stack gap-24">
    <div class="stack gap-8">
      ${stopped ? "" : starSvg()}
      <h1 class="title">${stopped ? "先停在这里了" : "练完了"}</h1>
      <p class="body">${stopped ? "已经做的留下了" : `对了 ${result.correct} 题，做了 ${result.total} 题`}</p>
    </div>
    ${familiar}
    <button class="primary" data-act="home">先到这里</button>
    ${stopped ? "" : '<button class="quiet" data-act="progress">看看最近练得怎么样</button><button class="quiet weaker" data-act="restart">再练一小段</button>'}
  </div>`;
}

function renderProgress() {
  if (!store.history.length) {
    return `<div class="wrap stack gap-32">
      <button class="quiet" data-act="home">回到首页</button>
      <h1 class="title">最近练得怎么样</h1>
      <p class="body">还没有练习</p>
      <button class="primary" data-act="start-daily">开始今天的练习</button>
    </div>`;
  }
  const rows = store.history.map((row) => `<div class="session-block">
    <div class="session-row"><span class="body">${esc(row.date)}</span><span class="label">${esc(row.status)}</span></div>
    <p class="body">对了 ${row.correct} 题 / 做了 ${row.total} 题</p>
  </div>`).join("");
  return `<div class="wrap stack gap-24">
    <button class="quiet" data-act="home">回到首页</button>
    <h1 class="title">最近练得怎么样</h1>
    <div class="list">${rows}</div>
    <p class="body"><span class="dot" aria-hidden="true"></span>有一些已经很稳</p>
    <div>
      <p class="label" style="color:var(--ink)">还要再见到</p>
      <div class="mastery-row"><span class="body">17 × 6</span><span class="label">正在熟悉</span></div>
      <div class="mastery-row"><span class="body">15²</span><span class="label"><span class="ring" aria-hidden="true"></span>再巩固一下</span></div>
    </div>
    <button class="quiet" data-act="print">印到纸上</button>
    <button class="quiet" data-act="sound">${store.sound ? "声音开" : "声音关"}</button>
  </div>`;
}

function renderPrint() {
  if (params.printEmpty) {
    return `<div class="wrap stack gap-32 no-print">
      <button class="quiet" data-act="home">回到首页</button>
      <h1 class="title">印到纸上</h1>
      <p class="body">现在没有需要印的题。</p>
      <p class="body">可以先练一小段。</p>
      <button class="primary" data-act="start-daily">开始今天的练习</button>
    </div>`;
  }
  const failed = screen.failed
    ? '<p class="body">这个环境完不成打印。</p>'
    : "";
  const lines = PRINT_PROMPTS.map((prompt) => `<li>${esc(prompt)}</li>`).join("");
  return `<div class="wrap stack gap-24">
    <div class="no-print stack gap-16">
      <button class="quiet" data-act="home">回到首页</button>
      <h1 class="title">印到纸上</h1>
      <p class="body">印的是现在还要再写的题。纸上没有答案。</p>
    </div>
    <div class="preview-frame">
      <article class="sheet">
        <h2>${esc(todayLabel())}</h2>
        <p>今天可以在纸上再写的题</p>
        <ul>${lines}</ul>
      </article>
    </div>
    <div class="no-print stack gap-16">
      ${failed}
      <button class="primary" data-act="do-print">打印</button>
    </div>
  </div>`;
}

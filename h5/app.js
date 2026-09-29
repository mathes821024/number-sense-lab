/**
 * H5 / PC Client Shell for Number Sense Lab v0.1
 * Core Learning Engine stays platform-free; persistence via adapter.
 */
import {
  loadCoreCatalog,
  verifyContentCounts,
  domainLabel,
  DOMAIN_ORDER,
  filterByDomain,
} from "../src/core/content.js";
import { createMemoryStore, emptyState } from "../src/core/store.js";
import {
  startSession,
  submitAnswer,
  peekCurrent,
  finishSession,
} from "../src/core/session.js";
import {
  studentLabel,
  emptyRelation,
  summarizeDomain,
  isUnstable,
  MASTERY,
} from "../src/core/mastery.js";
import { buildA4Sheet } from "../src/core/a4.js";
import { createBrowserStore } from "../src/adapter/browser-store.js";
import { createCue } from "./sound.js";
import { formatMath } from "./math-text.js";
import { playScreen, pressControl } from "./motion-ui.js";

const DOMAIN_ICONS = {
  squares: "square",
  products: "x",
  fraction_decimal: "percent",
};

function icon(name) {
  return `<i class="ph ph-${name}" aria-hidden="true"></i>`;
}

function mark(name) {
  return `<span class="mark">${icon(name)}</span>`;
}

const catalog = loadCoreCatalog();
verifyContentCounts(catalog);

const memory = createMemoryStore();
const browserStore = createBrowserStore();
let state = browserStore.read();
memory.write(state);
const cue = createCue(() => state.prefs?.sound !== false);

const app = document.getElementById("app");

/** @type {null | object} */
let session = state.activeSession || null;
let currentItem = null;
let answer = "";
let inputModes = new Set();
let startedAt = 0;
let nearEnd = false;
let revisit = false;
let submitting = false;
let correctTimer = 0;
let screenName = "home";
let focusedDomain = null;
let a4Domain = null;
let showAnswers = false;
let expandedPattern = false;
let expandedFrames = false;
let lastFeedback = null;

function today() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function persist(next) {
  state = next;
  memory.write(next);
  browserStore.write(next);
}

function resolveInputMode() {
  const hasKey = inputModes.has("physical_keyboard");
  const hasPad = inputModes.has("onscreen_keypad");
  if (hasKey && hasPad) {
    return { inputMode: "onscreen_keypad", mixedInput: true };
  }
  if (hasKey) return { inputMode: "physical_keyboard", mixedInput: false };
  return { inputMode: "onscreen_keypad", mixedInput: false };
}

function homeMode() {
  if (state.activeSession && state.activeSession.answered > 0) return "paused";
  const last = state.lastResult;
  if (last && last.day === today() && last.completed) return "done";
  return "default";
}

function formatDay(iso) {
  if (!iso) return "";
  const [, m, d] = iso.split("-");
  return `${Number(m)}月${Number(d)}日`;
}

function render(intent = "enter") {
  if (screenName === "home") app.innerHTML = renderHome();
  else if (screenName === "focus-confirm") app.innerHTML = renderFocusConfirm();
  else if (screenName === "train") app.innerHTML = renderTrain();
  else if (screenName === "correct") app.innerHTML = renderCorrect();
  else if (screenName === "wrong") app.innerHTML = renderWrong();
  else if (screenName === "pause") app.innerHTML = renderPause();
  else if (screenName === "end") app.innerHTML = renderEnd();
  else if (screenName === "progress") app.innerHTML = renderProgress();
  else if (screenName === "a4") app.innerHTML = renderA4();
  else app.innerHTML = renderHome();
  bind();
  playScreen(screenName, intent);
}

function renderHome() {
  const mode = homeMode();
  let title = "数感训练场";
  let lede = "把常会用到的数字关系，<br>练到能直接想起来。";
  let ctaLabel = "开始今天的练习";
  let ctaSub = "大约 5～10 分钟";
  let ctaAction = "start-daily";

  if (mode === "paused") {
    title = "还有一小段";
    lede = "刚才做到一半。已经做的会留下。";
    ctaLabel = "继续刚才的练习";
    ctaSub = "";
    ctaAction = "resume";
  } else if (mode === "done") {
    title = "今天这段练完了";
    lede = "可以停在这里，也可以再看一眼结果。";
    ctaLabel = "看看这次";
    ctaSub = "";
    ctaAction = "see-last";
  }

  const domains = DOMAIN_ORDER.map((domain) => {
    const items = filterByDomain(domain, catalog);
    const summary = summarizeDomain(items, state.relations);
    return `<button class="domain" type="button" data-action="focus" data-domain="${domain}">
      ${icon(DOMAIN_ICONS[domain])}
      <span class="domain-name">${domainLabel(domain)}</span>
      <small>${summary}</small>
    </button>`;
  }).join("");

  const extra =
    mode === "paused"
      ? `<button class="home-secondary" type="button" data-action="restart-daily">重新开始一小段</button>`
      : mode === "done"
        ? `<button class="home-secondary" type="button" data-action="start-daily">再练一小段</button>`
        : "";

  const headline = mode === "default" ? "把关系<br>练成直觉。" : title;
  const soundOn = state.prefs?.sound !== false;

  return `<section class="screen home" id="home">
    <header class="home-bar">
      <p class="home-kicker">数感训练场</p>
      <button class="sound-toggle" type="button" data-action="toggle-sound" aria-pressed="${soundOn}">${icon(soundOn ? "speaker-high" : "speaker-slash")}<span>${soundOn ? "声音开" : "声音关"}</span></button>
    </header>
    <h1 class="home-headline">${headline}</h1>
    <p class="lede home-note">${lede}</p>
    <button class="cta home-cta" type="button" data-action="${ctaAction}"><span>${ctaLabel}</span>${
      ctaSub ? `<small>${ctaSub}</small>` : ""
    }</button>
    ${extra}
    <div class="domains">${domains}</div>
    <nav class="home-links">
      <button type="button" data-action="progress">最近练得怎么样</button>
      <button type="button" data-action="a4">印到纸上</button>
    </nav>
    <p class="fine">练习记录只保存在当前设备，不会自动同步到其他设备。</p>
  </section>`;
}

function renderFocusConfirm() {
  const items = filterByDomain(focusedDomain, catalog);
  const summary = summarizeDomain(items, state.relations);
  return `<section class="screen" id="focus">
    <button class="quiet back" type="button" data-action="home">${mark("house")}回首页</button>
    <h1 class="title">${domainLabel(focusedDomain)}</h1>
    <p class="lede">只练这一块，同样是一小段，不是一直刷。</p>
    <p class="body">${summary}</p>
    <button class="cta" type="button" data-action="start-focus">开始这一小段</button>
  </section>`;
}

function renderTrain() {
  if (!currentItem) {
    return `<section class="screen"><p class="lede">这一段没有题目了。</p>
      <button class="cta" type="button" data-action="home">回首页</button></section>`;
  }
  const pill = nearEnd ? "快完成了" : revisit ? "再试一次" : domainLabel(currentItem.domain);
  const needsDot = currentItem.needsDecimalPoint;
  const dotKey = needsDot
    ? `<button class="key" type="button" data-digit=".">.</button>`
    : `<span class="key ghost" aria-hidden="true"></span>`;

  return `<section class="screen" id="train">
    <div class="top">
      <button class="quiet" type="button" data-action="pause">${mark("pause")}先停一下</button>
      <span class="pill">${pill}</span>
    </div>
    <h1 class="question">${formatMath(currentItem.prompt)}</h1>
    <div class="answer" id="answer" aria-live="polite">${escapeHtml(answer)}</div>
    <p class="nudge" id="nudge"></p>
    <div class="keys" id="keys">
      ${[1,2,3,4,5,6,7,8,9].map((n) => `<button class="key" type="button" data-digit="${n}">${n}</button>`).join("")}
      ${dotKey}
      <button class="key" type="button" data-digit="0">0</button>
      <button class="key" type="button" data-action="del">删除</button>
      <button class="key go" type="button" data-action="submit">提交</button>
    </div>
  </section>`;
}

function renderCorrect() {
  const relation = lastFeedback?.relation || currentItem?.relation || "";
  return `<section class="screen" id="correct">
    <div class="ok" aria-hidden="true">✓</div>
    <p class="correct-eq">${formatMath(relation)}</p>
    <p class="word">对</p>
    <button class="cta secondary" type="button" data-action="advance">继续</button>
  </section>`;
}

function renderWrong() {
  const fb = lastFeedback || {};
  const pattern = fb.level3 || fb.pattern || {};
  const frames = fb.level3?.frames || fb.frames || [];
  return `<section class="screen" id="wrong">
    <button class="quiet" type="button" data-action="pause">${mark("pause")}先停一下</button>
    <p class="demoted">${formatMath(currentItem?.prompt || "")}</p>
    <div class="panel">
      <p class="eq">${formatMath(fb.relation || "")}</p>
      <p class="hook">${formatMath(fb.hook || "")}</p>
      <p class="see">○ 看这里</p>
      <div class="pattern" ${expandedPattern ? "" : "hidden"}>
        <p class="check">${formatMath(pattern.check || "")}</p>
        <p class="family">${(pattern.family || []).map((l) => `<b class="kin">${formatMath(l)}</b>`).join("")}</p>
      </div>
      <div class="frames" ${expandedFrames ? "" : "hidden"}>
        ${frames
          .map(
            (f, i) =>
              `<div class="frame"><span class="n">${i + 1}</span><div><b>${formatMath(f.title)}</b><span>${formatMath(f.detail)}</span></div></div>`,
          )
          .join("")}
      </div>
    </div>
    <button class="more" type="button" data-action="expand-pattern">看看这个规律</button>
    <button class="more" type="button" data-action="expand-frames">看看这几步</button>
    <button class="cta" type="button" data-action="advance">下一题</button>
  </section>`;
}

function renderPause() {
  return `<section class="screen" id="pause">
    <div class="dialog">
      <p class="ask">先停在这里？</p>
      <p class="stay">已经做的会留下。</p>
      <button class="cta" type="button" data-action="resume-train">继续做</button>
      <button class="cta secondary" type="button" data-action="stop-session">先停</button>
    </div>
  </section>`;
}

function renderEnd() {
  const result = state.lastResult;
  if (!result) {
    return `<section class="screen"><p class="lede">还没有结束记录。</p>
      <button class="cta" type="button" data-action="home">回首页</button></section>`;
  }
  const heading = result.earlyStop ? "先停在这里了" : "先到这里";
  const stay = result.earlyStop
    ? "已经做的留下了。"
    : "这一小段练完了。";
  const score = `对了 ${result.correct} 题，做了 ${result.total} 题。`;
  const familiar =
    result.grewFamiliar && result.grewFamiliar.length
      ? `<p class="body">这几个更熟了：${result.grewFamiliar
          .map(formatMath)
          .join("、")}。</p>`
      : "";
  return `<section class="screen" id="end">
    <div class="star" aria-hidden="true">★</div>
    <h1>${heading}</h1>
    <p class="lede">${stay}</p>
    <p class="body">${score}</p>
    ${familiar}
    <button class="cta" type="button" data-action="home">先到这里</button>
    <div class="links">
      <button class="link row tone-sky" type="button" data-action="progress">${mark("chart-line")}看看最近练得怎么样</button>
    </div>
  </section>`;
}

function renderProgress() {
  const sessions = [...(state.sessions || [])].slice(-8).reverse();
  const unstable = catalog.filter((item) => {
    const status = (state.relations[item.id] || emptyRelation()).status;
    return isUnstable(status);
  });
  const stableCount = catalog.filter(
    (item) => (state.relations[item.id] || emptyRelation()).status === MASTERY.STABLE,
  ).length;

  const history =
    sessions.length === 0
      ? `<p class="lede">还没有练习。回首页开始一小段吧。</p>`
      : `<ul class="list">${sessions
          .map((s) => {
            const status = s.earlyStop || !s.completed ? "先停了" : "做完了";
            return `<li><span>${formatDay(s.day)} · ${status}</span><span class="meta">对了 ${s.correct}/${s.total}</span></li>`;
          })
          .join("")}</ul>`;

  const unstableList =
    unstable.length === 0
      ? `<p class="body">暂时没有特别要再巩固的题。</p>`
      : `<ul class="list">${unstable
          .slice(0, 20)
          .map((item) => {
            const st = (state.relations[item.id] || emptyRelation()).status;
            return `<li><span>${formatMath(item.prompt.replace(" = ?", ""))}</span><span class="meta">${studentLabel(st)}</span></li>`;
          })
          .join("")}</ul>`;

  return `<section class="screen" id="progress">
    <button class="quiet back" type="button" data-action="home">${mark("house")}回首页</button>
    <h1 class="title">最近练得怎么样</h1>
    ${history}
    <p class="section-kicker">还要再见到的</p>
    ${unstableList}
    <p class="fine">有一些已经很稳：${stableCount} 条。</p>
    <div class="links">
      <button class="link row tone-leaf" type="button" data-action="a4">${mark("printer")}印到纸上</button>
    </div>
  </section>`;
}

function renderA4() {
  const sheet = buildA4Sheet(catalog, state.relations, {
    domain: a4Domain,
    day: formatDay(today()),
  });

  if (sheet.empty) {
    return `<section class="screen no-print" id="a4">
      <button class="quiet back" type="button" data-action="home">${mark("house")}回首页</button>
      <h1 class="title">印到纸上</h1>
      <p class="lede">${sheet.emptyMessage}</p>
      <button class="cta" type="button" data-action="home">先练一小段</button>
    </section>`;
  }

  const filters = [
    ["", "全部"],
    ...DOMAIN_ORDER.map((d) => [d, domainLabel(d)]),
  ]
    .map(
      ([value, label]) =>
        `<button class="chip${(a4Domain || "") === value ? " is-on" : ""}" type="button" aria-pressed="${(a4Domain || "") === value}" data-action="a4-domain" data-domain="${value}">${icon(value ? DOMAIN_ICONS[value] : "squares-four")}${label}</button>`,
    )
    .join("");

  const prompts = sheet.prompts
    .map(
      (p) =>
        `<li><span>${formatMath(p.prompt.replace(" = ?", " = "))}</span><span class="blank"></span></li>`,
    )
    .join("");

  const questionSheet = `<div class="sheet" id="a4-sheet">
      <h2>${sheet.title}</h2>
      <p class="sub">${sheet.day} · ${sheet.domain}</p>
      <ol>${prompts}</ol>
    </div>`;

  const answerSheet = `<div class="sheet sheet-answers" id="a4-answers">
      <h2>答案（写完再看）</h2>
      <p class="sub">${sheet.day} · ${sheet.domain}</p>
      <ol>${sheet.answerKey
        .map((a) => `<li>${formatMath(a.relation)}</li>`)
        .join("")}</ol>
    </div>`;

  return `<section class="screen" id="a4">
    <div class="no-print">
      <button class="quiet back" type="button" data-action="home">${mark("house")}回首页</button>
      <h1 class="title">印到纸上</h1>
      <p class="lede">${showAnswers ? "这一页只有答案。写完题目再看。" : sheet.subtitle}</p>
      <div class="filters" role="group" aria-label="打印范围">${filters}</div>
    </div>
    ${showAnswers ? answerSheet : questionSheet}
    <div class="no-print">
      <button class="cta" type="button" data-action="print">打印 / 保存为 PDF</button>
      <button class="cta secondary" type="button" data-action="toggle-answers">${
        showAnswers ? "收起答案" : "答案单独一页（写完再看）"
      }</button>
      <p class="fine">若当前环境打不开打印，可用浏览器的「打印」或「存储为 PDF」把题目带出去。</p>
    </div>
  </section>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function bind() {
  app.querySelectorAll("[data-action]").forEach((el) => {
    el.addEventListener("click", onAction);
  });
  app.querySelectorAll("[data-digit]").forEach((el) => {
    el.addEventListener("click", onDigit);
  });
}

function onAction(event) {
  const action = event.currentTarget.getAttribute("data-action");
  const domain = event.currentTarget.getAttribute("data-domain");

  if (action === "toggle-sound") {
    const sound = state.prefs?.sound === false;
    persist({ ...state, prefs: { ...state.prefs, sound } });
    if (sound) cue.tap();
    render();
    return;
  }
  if (action === "home") {
    screenName = "home";
    render();
    return;
  }
  if (action === "start-daily") {
    beginSession("daily", null);
    return;
  }
  if (action === "restart-daily") {
    persist({ ...state, activeSession: null });
    session = null;
    beginSession("daily", null);
    return;
  }
  if (action === "resume") {
    session = state.activeSession;
    showQuestion();
    return;
  }
  if (action === "see-last") {
    screenName = "end";
    render();
    return;
  }
  if (action === "focus") {
    focusedDomain = domain;
    screenName = "focus-confirm";
    render();
    return;
  }
  if (action === "start-focus") {
    beginSession("focused", focusedDomain);
    return;
  }
  if (action === "progress") {
    screenName = "progress";
    render();
    return;
  }
  if (action === "a4") {
    a4Domain = null;
    showAnswers = false;
    screenName = "a4";
    render();
    return;
  }
  if (action === "a4-domain") {
    a4Domain = domain || null;
    showAnswers = false;
    render();
    return;
  }
  if (action === "toggle-answers") {
    showAnswers = !showAnswers;
    render();
    return;
  }
  if (action === "print") {
    window.print();
    return;
  }
  if (action === "pause") {
    screenName = "pause";
    render();
    return;
  }
  if (action === "resume-train") {
    screenName = "train";
    render();
    return;
  }
  if (action === "stop-session") {
    endCurrent(true);
    return;
  }
  if (action === "submit") {
    doSubmit();
    return;
  }
  if (action === "del") {
    inputModes.add("onscreen_keypad");
    pressControl(event.currentTarget);
    answer = answer.slice(0, -1);
    syncAnswer();
    return;
  }
  if (action === "advance") {
    window.clearTimeout(correctTimer);
    advanceAfterFeedback();
    return;
  }
  if (action === "expand-pattern") {
    expandedPattern = true;
    render("pattern");
    return;
  }
  if (action === "expand-frames") {
    expandedFrames = true;
    render("frames");
    return;
  }
}

function onDigit(event) {
  const digit = event.currentTarget.getAttribute("data-digit");
  inputModes.add("onscreen_keypad");
  pressControl(event.currentTarget);
  appendDigit(digit);
}

function appendDigit(digit) {
  if (screenName !== "train" || submitting) return;
  if (digit === ".") {
    if (!currentItem?.needsDecimalPoint) return;
    if (answer.includes(".")) return;
    answer += ".";
  } else {
    if (answer.replace(".", "").length >= 8) return;
    answer += digit;
  }
  syncAnswer();
  cue.tap();
}

function syncAnswer() {
  const el = document.getElementById("answer");
  if (el) {
    el.textContent = answer;
  }
  const nudge = document.getElementById("nudge");
  if (nudge) nudge.textContent = "";
}

function beginSession(mode, domain) {
  session = startSession({
    mode,
    domain,
    day: today(),
    relations: state.relations,
    catalog,
  });
  persist({ ...state, activeSession: session });
  if (session.finished || session.queue.length === 0) {
    // All stable or empty — still create a short confirmation queue from catalog
    session = startSession({
      mode,
      domain,
      day: today(),
      relations: {},
      catalog,
      size: 6,
    });
    persist({ ...state, activeSession: session });
  }
  showQuestion();
}

function showQuestion() {
  const peeked = peekCurrent(session, catalog);
  session = peeked.session;
  persist({ ...state, activeSession: session });
  currentItem = peeked.item;
  nearEnd = peeked.nearEnd;
  revisit = peeked.revisit;
  if (!currentItem) {
    endCurrent(false);
    return;
  }
  answer = "";
  inputModes = new Set();
  startedAt = performance.now();
  submitting = false;
  expandedPattern = false;
  expandedFrames = false;
  lastFeedback = null;
  screenName = "train";
  render();
}

function doSubmit() {
  if (submitting || screenName !== "train" || !currentItem) return;
  submitting = true;
  const mode = resolveInputMode();
  const result = submitAnswer({
    item: currentItem,
    state,
    session,
    raw: answer,
    meta: {
      day: today(),
      inputMode: mode.inputMode,
      mixedInput: mode.mixedInput,
      elapsedMs: Math.round(performance.now() - startedAt),
    },
  });

  if (!result.feedback.record) {
    submitting = false;
    const nudge = document.getElementById("nudge");
    if (nudge) nudge.textContent = result.feedback.message;
    return;
  }

  persist(result.state);
  session = result.session;
  lastFeedback = result.feedback;

  if (result.judged.kind === "correct") {
    cue.correct();
    screenName = "correct";
    render();
    window.clearTimeout(correctTimer);
    correctTimer = window.setTimeout(() => advanceAfterFeedback(), 700);
    return;
  }

  cue.wrong();
  screenName = "wrong";
  render();
}

function advanceAfterFeedback() {
  submitting = false;
  const done =
    session.answered >= session.targetCount ||
    session.cursor >= session.queue.length;
  if (done) {
    endCurrent(false);
    return;
  }
  showQuestion();
}

function endCurrent(earlyStop) {
  if (!session) {
    screenName = "home";
    render();
    return;
  }
  const finished = finishSession(state, session, { earlyStop });
  persist(finished.state);
  if (!earlyStop) cue.done();
  session = null;
  currentItem = null;
  screenName = "end";
  render();
}

document.addEventListener("keydown", (event) => {
  if (screenName !== "train") return;
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  if (/^\d$/.test(event.key)) {
    event.preventDefault();
    inputModes.add("physical_keyboard");
    appendDigit(event.key);
  } else if (event.key === "." || event.key === "Decimal") {
    event.preventDefault();
    inputModes.add("physical_keyboard");
    appendDigit(".");
  } else if (event.key === "Backspace") {
    event.preventDefault();
    inputModes.add("physical_keyboard");
    answer = answer.slice(0, -1);
    syncAnswer();
  } else if (event.key === "Enter") {
    event.preventDefault();
    doSubmit();
  }
});

render();

/**
 * H5 / PC Client Shell for Number Sense Lab (v0.3)
 * Core Learning Engine stays platform-free; persistence via adapter.
 * State v3: one active learner; this shell only reads/writes that learner.
 */
import {
  loadCoreCatalog,
  verifyContentCounts,
  domainLabel,
  DOMAIN_ORDER,
  filterByDomain,
} from "../src/core/content.js";
import {
  createMemoryStore,
  getActiveLearner,
  withActiveLearner,
} from "../src/core/store.js";
import {
  startSession,
  submitAnswer,
  peekCurrent,
  finishSession,
} from "../src/core/session.js";
import { studentLabel, summarizeDomain } from "../src/core/mastery.js";
import {
  buildA4Sheet,
  buildPrintSelector,
  defaultPrintSelection,
  selectCurrentMistakes,
  clearPrintSelection,
  togglePrintSelection,
} from "../src/core/a4.js";
import { listLatestOutcomes } from "../src/core/progress.js";
import { buildMistakeBook } from "../src/core/mistakes.js";
import { MISTAKE_BOOK_SOURCE } from "../src/core/schedule.js";
import { createBrowserStore, localDay } from "../app/platform/h5/browser-store.js";
import { createCue } from "./sound.js";
import {
  emptyFields,
  focusField,
  typeDigit,
  eraseDigit,
  fieldsAnswer,
  fieldSize,
  promptStem,
} from "../src/core/fraction-fields.js";
import { setPositionLabel } from "../src/core/progress-label.js";
import { formatMath, repeatingHtml, listPromptHtml, printPromptHtml } from "./math-text.js";
import { activeTheme, applyTheme, asset, loadTheme, preloadAssets } from "./theme.js";

// Theme layer: math-lab is the only runtime theme (no picker, no switching).
// Pictures resolve through the theme manifest; if it cannot load, screens
// still work with words and shapes only.
applyTheme(document);
await loadTheme();
// Home needs the welcome picture first; feedback pictures wait for training.
preloadAssets([activeTheme().mascot.welcome], { priority: "high" });

/** v0.4 domains have no theme picture yet: an interface glyph sits in the same tile. */
const DOMAIN_GLYPHS = {
  halves: "circle-half",
  complements: "puzzle-piece",
  cubes: "cube",
  powers: "text-superscript",
  special_products: "x-square",
};

/** Domain icon from the theme's asset slot; falls back to text only. */
function domainArt(domain) {
  const art = asset(activeTheme().icons[domain] || "");
  const glyph = DOMAIN_GLYPHS[domain] ? `<span class="tile-glyph">${icon(DOMAIN_GLYPHS[domain])}</span>` : "";
  return `<span class="tile tile-${domain}" aria-hidden="true">${art || glyph}</span>`;
}

/**
 * Mascot from the theme manifest (welcome on Home / empty states, correct and
 * thinking on feedback, end of a set). Never on the question screen or above
 * the keypad. Decorative: hidden from readers.
 */
function mascot(pose, extraClass = "") {
  const art = asset(activeTheme().mascot[pose] || "");
  return art ? `<span class="mascot ${extraClass}" aria-hidden="true">${art}</span>` : "";
}

/** N mark from the brand slot (optional in 07; the words carry the name). */
function brandMark() {
  const art = asset(activeTheme().brand.logo);
  return art ? `<span class="logo" aria-hidden="true">${art}</span>` : "";
}

/** Edge decoration (07 decor.*). Home only; feedback uses sparkle / question. Never training. */
function homeDecor() {
  const d = activeTheme().background;
  return `<div class="page-decor home-decor" aria-hidden="true">
    <span class="deco deco-cloud1">${asset(d.cloud1)}</span>
    <span class="deco deco-cloud2">${asset(d.cloud2)}</span>
    <span class="deco deco-hill">${asset(d.hill)}</span>
    <span class="deco deco-leaf">${asset(d.leaf1)}</span>
    <span class="deco deco-leaf2">${asset(d.leaf2)}</span>
    <span class="deco deco-sprout">${asset(d.sprout)}</span>
  </div>`;
}

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
/** Full v3 record (all learners). */
let root = browserStore.read();
/** The active learner's record: relations / sessions / activeSession / prefs. */
let state = getActiveLearner(root);
memory.write(root);
const cue = createCue(() => state.prefs?.sound !== false);

const app = document.getElementById("app");

/** @type {null | object} */
let session = state.activeSession || null;
let currentItem = null;
let answer = "";
/** fraction_fields items: the shared numerator / denominator boxes (src/core/fraction-fields.js). */
let fields = emptyFields();
let inputModes = new Set();
let startedAt = 0;
let nearEnd = false;
let revisit = false;
let submitting = false;
let correctTimer = 0;
let screenName = "home";
let focusedDomain = null;
/**
 * Shared print selector (transient UI state only — never persisted, never
 * written into learner state). Source: "home" | "progress" | "mistakes".
 */
let printSource = "home";
let printDomain = null;
/** @type {string[]} */
let selectedPrintIds = [];
let printShowOthers = true;
/** Nudge under the answer box; the simplification hint stays until resubmit. */
let nudgeHtml = "";
let nudgeSticky = false;
let showAnswers = false;
let expandedPattern = false;
let expandedFrames = false;
let lastFeedback = null;

function today() {
  return localDay();
}

function persist(next) {
  state = next;
  root = withActiveLearner(root, next);
  memory.write(root);
  browserStore.write(root);
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
  // A voluntary Mistake Book session does not count as today's practice.
  const sessions = state.sessions || [];
  const last =
    [...sessions].reverse().find((s) => s.mode !== MISTAKE_BOOK_SOURCE) ||
    (state.lastResult && state.lastResult.mode !== MISTAKE_BOOK_SOURCE ? state.lastResult : null);
  if (last && last.day === today() && last.completed) return "done";
  return "default";
}

function formatDay(iso) {
  if (!iso) return "";
  const [, m, d] = iso.split("-");
  return `${Number(m)}月${Number(d)}日`;
}

/** Screens where the student is answering: no bottom navigation (02_ux_spec §4). */
const FOCUS_SCREENS = new Set(["train", "correct", "wrong", "pause"]);

/** Which of the four entries a screen belongs to (none for end / print from home). */
function navTab() {
  if (screenName === "home" || screenName === "progress") return "home";
  if (screenName === "explore" || screenName === "focus-confirm") return "explore";
  if (screenName === "mistakes") return "mistakes";
  if (screenName === "me" || screenName === "about") return "me";
  if (screenName === "print-select" || screenName === "a4") {
    return printSource === "mistakes" ? "mistakes" : "home";
  }
  return "";
}

/** Ordinary-page bottom navigation: 首页 / 练习 / 错题本 / 我的. */
function renderNav() {
  const current = navTab();
  const tab = (id, action, iconName, label) =>
    `<button class="tab${current === id ? " is-on" : ""}" type="button" data-action="${action}"${
      current === id ? ' aria-current="page"' : ""
    }>${icon(iconName)}<span>${label}</span></button>`;
  return `<nav class="tabbar no-print" id="tabbar" aria-label="主要入口">
    ${tab("home", "home", "house", "首页")}
    ${tab("explore", "explore", "pencil-simple-line", "练习")}
    ${tab("mistakes", "mistakes", "book-open-text", "错题本")}
    ${tab("me", "me", "user", "我的")}
  </nav>`;
}

function render() {
  let html;
  if (screenName === "home") html = renderHome();
  else if (screenName === "explore") html = renderExplore();
  else if (screenName === "me") html = renderMe();
  else if (screenName === "about") html = renderAbout();
  else if (screenName === "focus-confirm") html = renderFocusConfirm();
  else if (screenName === "train") html = renderTrain();
  else if (screenName === "correct") html = renderCorrect();
  else if (screenName === "wrong") html = renderWrong();
  else if (screenName === "pause") html = renderPause();
  else if (screenName === "end") html = renderEnd();
  else if (screenName === "progress") html = renderProgress();
  else if (screenName === "print-select") html = renderPrintSelect();
  else if (screenName === "a4") html = renderA4();
  else if (screenName === "mistakes") html = renderMistakes();
  else html = renderHome();
  // Once training starts, fetch the feedback pictures before the first answer.
  if (screenName === "train") preloadAssets([activeTheme().mascot.correct, activeTheme().mascot.thinking]);
  const withNav = !FOCUS_SCREENS.has(screenName);
  app.classList.toggle("has-nav", withNav);
  app.innerHTML = html + (withNav ? renderNav() : "");
  document.getElementById("toast")?.classList.remove("is-on");
  bind();
  // The correct pause has no button: move focus onto the result so it is not
  // lost on <body>; the next question follows by itself after ~700ms.
  if (screenName === "correct") app.querySelector(".feedback-card")?.focus({ preventScroll: true });
}

let toastTimer = 0;
/** Placeholder answer for future features: a short spoken/visible 敬请期待. */
function showSoon(name) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = name ? `${name} · 敬请期待` : "敬请期待";
  toast.classList.add("is-on");
  // Screen readers hear it once; it changes no state and navigates nowhere.
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("is-on"), 1800);
}

function renderHome() {
  const mode = homeMode();
  let title = "和数字做朋友";
  let lede = "把常会用到的数字关系，练到能直接想起来。";
  // One block per line; the resume lede is two fixed lines (Owner Plan B).
  let ledeLines = [lede];
  let ctaLabel = "开始今天的练习";
  let ctaSub = "大约 5～10 分钟";
  let ctaAction = "start-daily";

  if (mode === "paused") {
    title = "还有一小段";
    lede = "刚才练到一半，继续就好。";
    ledeLines = ["刚才练到一半，", "继续就好。"];
    ctaLabel = "继续刚才的练习";
    ctaSub = "";
    ctaAction = "resume";
  } else if (mode === "done") {
    title = "今天这段练完了";
    lede = "可以停在这里，也可以再看一眼结果。";
    ledeLines = [lede];
    ctaLabel = "看看这次";
    ctaSub = "";
    ctaAction = "see-last";
  }

  // One clear action on the resume hero; 重新开始一小段 lives on the pause screen.
  const extra =
    mode === "done" ? `<button class="home-secondary" type="button" data-action="start-daily">再练一小段</button>` : "";

  // Four entry cards (03_ui_spec §5 v0.3; 02_ux_spec §5). 开始今天的练习 (05 §6) is the main path.
  const entry = (action, tone, iconName, label, sub, extraClass = "") =>
    `<button class="entry entry-${tone}${extraClass}" type="button" data-action="${action}">
      <span class="entry-tile" aria-hidden="true">${icon(iconName)}</span>
      <span class="entry-copy"><span class="entry-name">${label}</span>${sub ? `<small>${sub}</small>` : ""}</span>
      <span class="chev" aria-hidden="true">${icon("caret-right")}</span>
    </button>`;

  return `<section class="screen home" id="home">
    ${homeDecor()}
    <header class="home-bar">
      <p class="home-kicker">${brandMark()}<span class="wordmark"><span class="wordmark-zh">数感训练场</span><span class="wordmark-en">Number Sense Lab</span></span></p>
    </header>
    <div class="home-hero${mode === "paused" ? " is-resume" : ""}">
      ${mascot("welcome", "mascot-hero")}
      <div class="bubble">
        <h1 class="bubble-title">${title}</h1>
        <p class="bubble-text${ledeLines.length > 1 ? " is-split" : ""}">${ledeLines.map((l) => `<span class="bubble-line">${l}</span>`).join("")}</p>
      </div>
    </div>
    <div class="entries">
      ${entry(ctaAction, "start", "play", ctaLabel, ctaSub, " home-cta")}
      ${extra}
      ${entry("explore", "explore", "target", "专项练习", "按你需要的主题练习")}
      ${entry("mistakes", "mistakes", "book-open-text", "错题本", "把容易出错的题再练一练")}
      ${entry("progress", "progress", "chart-bar", "最近练得怎么样", "看看自己的进步")}
    </div>
    <p class="fine device-note">练习记录只保存在当前设备，不会自动同步到其他设备。</p>
  </section>`;
}

/**
 * Placeholder names shown as the board shows them; every one answers 敬请期待.
 * v0.4: cubes and complements are released domains now, and halves replaces the
 * old multiples-and-factors placeholder (docs/ux/04_v04_specialist_training.md §2).
 */
const SOON_DOMAINS = [["lightbulb", "规律探索"]];

function soonButton(name, iconName, className = "soon-tile") {
  return `<button class="${className}" type="button" data-action="soon" data-soon="${name}">
      <span class="soon-icon" aria-hidden="true">${icon(iconName)}</span>
      <span class="soon-copy"><span class="soon-name">${name}</span><span class="soon-badge">敬请期待</span></span>
    </button>`;
}

/** 练习: pick one of the released domains (DOMAIN_ORDER); the rest are placeholders. */
function renderExplore() {
  const domains = DOMAIN_ORDER.map((domain) => {
    const items = filterByDomain(domain, catalog);
    const summary = summarizeDomain(items, state.relations);
    return `<button class="domain" type="button" data-action="focus" data-domain="${domain}">
      ${domainArt(domain)}
      <span class="domain-copy"><span class="domain-name">${domainLabel(domain)}</span>
      <small>${summary}</small></span>
      <span class="chev" aria-hidden="true">${icon("caret-right")}</span>
    </button>`;
  }).join("");
  const soon = SOON_DOMAINS.map(([ic, name]) => soonButton(name, ic)).join("");
  const extras = [
    ["lightbulb-filament", "概念"],
    ["notebook", "例题"],
    ["play-circle", "动画"],
  ]
    .map(([ic, name]) => soonButton(name, ic, "soon-chip"))
    .join("");
  return `<section class="screen" id="explore">
    <h1 class="title">探索数学世界</h1>
    <p class="lede">从一个主题开始，走更远的路</p>
    <div class="segmented" role="group" aria-label="练习方式">
      <button class="seg is-on" type="button" aria-pressed="true">主题训练</button>
      <button class="seg" type="button" aria-pressed="false" data-action="soon" data-soon="知识地图">知识地图</button>
    </div>
    <div class="domains">${domains}</div>
    <p class="section-label">更多方向</p>
    <div class="soon">${soon}</div>
    <div class="soon-row">${extras}</div>
  </section>`;
}

function renderFocusConfirm() {
  const items = filterByDomain(focusedDomain, catalog);
  const summary = summarizeDomain(items, state.relations);
  return `<section class="screen" id="focus-confirm">
    <button class="quiet back" type="button" data-action="explore">${mark("arrow-left")}返回练习</button>
    <div class="card focus-card">
      ${domainArt(focusedDomain)}
      <h1 class="title">${domainLabel(focusedDomain)}</h1>
      <p class="lede">只练这一块，同样是一小段，不是一直刷。</p>
      <p class="body">${summary}</p>
    </div>
    <button class="cta" type="button" data-action="start-focus">开始这一小段</button>
  </section>`;
}

/** 我的: only the sound switch is real; the rest answer 敬请期待. */
function renderMe() {
  const soundOn = state.prefs?.sound !== false;
  const avatar = asset(activeTheme().brand.avatar);
  const row = (iconName, name) =>
    `<button class="setting" type="button" data-action="soon" data-soon="${name}">
      <span class="setting-icon" aria-hidden="true">${icon(iconName)}</span>
      <span class="setting-name">${name}</span>
      <span class="soon-badge">敬请期待</span>
    </button>`;
  return `<section class="screen" id="me">
    <h1 class="title">我的</h1>
    <div class="card me-card">
      <span class="avatar" aria-hidden="true">${avatar}</span>
      <div class="me-copy">
        <p class="me-name">数感训练场</p>
        <p class="lede">昵称和档案还没有。记录只在这台设备上。</p>
      </div>
    </div>
    <div class="card settings">
      <div class="setting">
        <span class="setting-icon" aria-hidden="true">${icon(soundOn ? "speaker-high" : "speaker-slash")}</span>
        <span class="setting-name" id="sound-label">声音</span>
        <button class="switch" type="button" role="switch" aria-checked="${soundOn}" aria-labelledby="sound-label" data-action="toggle-sound"><span class="switch-knob"></span><span class="switch-text">${soundOn ? "开" : "关"}</span></button>
      </div>
      ${row("user-circle", "昵称")}
      ${row("trash", "清空练习记录")}
      <button class="setting" type="button" data-action="about">
        <span class="setting-icon" aria-hidden="true">${icon("info")}</span>
        <span class="setting-name">关于数感训练场</span>
        <span class="chev" aria-hidden="true">${icon("caret-right")}</span>
      </button>
    </div>
    <p class="fine">练习记录只保存在当前设备，不会自动同步到其他设备。</p>
  </section>`;
}

/** App version shown on 关于. The build sha comes from the deploy's version.json when present. */
const APP_VERSION = "v0.3";
const VERSION_URL = new URL("../version.json", import.meta.url).href;
let buildInfo = null; // transient: { sha } | { missing: true }; never stored

/** Reads version.json once. Offline or local (no file) simply shows no sha. */
async function loadBuildInfo() {
  if (buildInfo) return;
  try {
    const res = await fetch(VERSION_URL, { cache: "no-cache" });
    const json = res.ok ? await res.json() : null;
    buildInfo = json && typeof json.sha === "string" ? { sha: json.sha.slice(0, 7) } : { missing: true };
  } catch {
    buildInfo = { missing: true };
  }
  const el = document.getElementById("about-version");
  if (el) el.textContent = versionLine();
}

function versionLine() {
  if (buildInfo && buildInfo.sha) return `${APP_VERSION} · ${buildInfo.sha}`;
  return APP_VERSION;
}

/** 关于数感训练场: static Owner copy (Owner-approved 2026-09-30). No storage, no account. */
function renderAbout() {
  const avatar = asset(activeTheme().brand.avatar);
  return `<section class="screen no-print" id="about">
    <button class="quiet back" type="button" data-action="me">${mark("arrow-left")}返回我的</button>
    <div class="about-head">
      <span class="avatar" aria-hidden="true">${avatar}</span>
      <h1 class="title">关于数感训练场</h1>
    </div>
    <div class="card about-card">
      <h2 class="about-h">为什么做它</h2>
      <p class="about-p">我是一个程序员，也是一个陪孩子学数学的家长。<br>我一直觉得，很多孩子不是“不会数学”，而是一些最基础、最常用的数字关系还没有真正熟悉。</p>
      <p class="about-p">所以我想做一个简单的小工具：每天花几分钟，把这些关系练到能直接想起来。<br>不追求刷很多题，不催速度，也不做排名。</p>
      <p class="about-p">我更希望它像一段长期陪伴——<br>今天多熟一点，明天再熟一点。</p>
      <p class="about-p">陪孩子一起成长，也陪自己重新理解学习。</p>
    </div>
    <div class="card about-card">
      <h2 class="about-h">我们的学习理念</h2>
      <p class="about-p">不是替孩子学习，而是帮孩子把“会”练成“熟”。</p>
    </div>
    <div class="card about-card">
      <h2 class="about-h">隐私与数据</h2>
      <p class="about-p">练习记录默认只保存在当前设备，不自动上传。</p>
    </div>
    <div class="card about-card">
      <h2 class="about-h">版本信息</h2>
      <p class="about-p about-version" id="about-version">${versionLine()}</p>
    </div>
    <div class="card about-card">
      <h2 class="about-h">项目与许可</h2>
      <p class="about-p">项目代码托管于 GitHub。</p>
    </div>
    <footer class="about-foot">
      <p class="about-foot-name">Number Sense Lab｜数感训练场</p>
      <p class="fine">一个从真实家庭学习场景里长出来的小项目。</p>
    </footer>
  </section>`;
}

function renderTrain() {
  if (!currentItem) {
    return `<section class="screen"><p class="lede">这一段没有题目了。</p>
      <button class="cta" type="button" data-action="home">回首页</button></section>`;
  }
  const pill = nearEnd ? "快完成了" : revisit ? "再试一次" : domainLabel(currentItem.domain);
  // Integer: empty slot. Plain decimal: 「.」. Fraction: no 「/」 — the digits
  // go into the focused numerator / denominator box.
  // Repeating decimal: no new key; the answer box itself is 0.( … ).
  const dotKey = currentItem.needsDecimalPoint
    ? `<button class="key" type="button" data-digit=".">.</button>`
    : `<span class="key ghost" aria-hidden="true"></span>`;
  const answerClass = currentItem.repeatingBlock ? "answer answer-repeating" : "answer";
  // Calm position in this short set (02_ux_spec §3 step 7): a count and a
  // still bar. Not a timer; nothing animates or counts down.
  const total = Math.max(1, session?.targetCount || 1);
  const position = Math.min(total, (session?.answered || 0) + 1);

  return `<section class="screen${currentItem.fractionFields ? " is-fields" : ""}" id="train">
    <div class="top">
      <button class="quiet" type="button" data-action="pause">先停一下</button>
      <span class="pill">${pill}</span>
    </div>
    <div class="set-progress">
      <span class="set-count" id="set-count">${setPositionLabel(position, total)}</span>
      <progress class="set-bar" max="${total}" value="${position - 1}" aria-labelledby="set-count"></progress>
    </div>
    <div class="practice-zone">
      <p class="practice-label">看清关系，再写答案</p>
      ${
        currentItem.fractionFields
          ? `<div class="question-fields">
        <h1 class="question">${formatMath(promptStem(currentItem.prompt))}</h1>
        <div class="fraction-fields" id="answer" aria-live="polite" data-focus="${fields.focus}">${fieldsHtml()}</div>
      </div>`
          : `<h1 class="question">${formatMath(currentItem.prompt)}</h1>
      <div class="${answerClass}" id="answer" aria-live="polite">${answerHtml()}</div>`
      }
      <p class="nudge" id="nudge">${nudgeHtml}</p>
    </div>
    <div class="keys" id="keys">
      ${[1,2,3,4,5,6,7,8,9].map((n) => `<button class="key" type="button" data-digit="${n}">${n}</button>`).join("")}
      ${dotKey}
      <button class="key" type="button" data-digit="0">0</button>
      <button class="key key-word" type="button" data-action="del">删除</button>
      <button class="key go" type="button" data-action="submit">提交</button>
    </div>
  </section>`;
}

function renderCorrect() {
  const relation = lastFeedback?.relation || currentItem?.relation || "";
  return `<section class="screen" id="correct">
    <div class="feedback-hero">
      ${mascot("correct", "mascot-feedback")}
      <span class="hero-spark" aria-hidden="true">${asset(activeTheme().background.sparkle)}</span>
    </div>
    <p class="feedback-title is-correct">太棒了！</p>
    <div class="card feedback-card is-correct" tabindex="-1">
      <div class="relation-row">
        <p class="correct-eq">${formatMath(relation)}</p>
        <span class="ok" aria-hidden="true">${asset("mark.correct") || "✓"}</span>
      </div>
      <p class="word">对</p>
    </div>
  </section>`;
}

function renderWrong() {
  const fb = lastFeedback || {};
  const pattern = fb.level3 || fb.pattern || {};
  const frames = fb.level3?.frames || fb.frames || [];
  return `<section class="screen" id="wrong">
    <button class="quiet" type="button" data-action="pause">先停一下</button>
    <div class="wrong-head">
      <p class="demoted">${formatMath(currentItem?.prompt || "")}</p>
      <span class="wrong-art">${mascot("thinking", "mascot-side")}<span class="hero-question" aria-hidden="true">${asset(activeTheme().background.question)}</span></span>
    </div>
    <div class="panel">
      <p class="eq">${formatMath(fb.relation || "")}</p>
      <p class="hook"><span class="hint-label">${icon("lightbulb")}小提示</span>${formatMath(fb.hook || "")}</p>
      <p class="see"><span class="see-mark" aria-hidden="true">○</span> 看这里</p>
      <div class="pattern" ${expandedPattern ? "" : "hidden"}>
        <p class="check">${formatMath(pattern.check || "")}</p>
        <p class="family">${(pattern.family || []).map((l) => `<b>${formatMath(l)}</b>`).join("<br>")}</p>
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
      <button class="quiet pause-restart" type="button" data-action="restart-daily">重新开始一小段</button>
    </div>
  </section>`;
}

function renderEnd() {
  const result = state.lastResult;
  if (!result) {
    return `<section class="screen" id="end-empty"><p class="lede">还没有结束记录。</p>
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
  const art = mascot(result.earlyStop ? "welcome" : "correct", "mascot-end");
  return `<section class="screen" id="end">
    <div class="end-art">${art}${
      result.earlyStop ? "" : `<span class="hero-spark" aria-hidden="true">${asset(activeTheme().background.sparkle)}</span>`
    }</div>
    <h1>${heading}</h1>
    <p class="lede">${stay}</p>
    <div class="card end-card">
      <p class="body">${score}</p>
      ${familiar}
    </div>
    <button class="cta" type="button" data-action="home">先到这里</button>
    <div class="links">
      <button class="link row" type="button" data-action="progress">${mark("chart-line")}看看最近练得怎么样</button>
    </div>
  </section>`;
}

function renderProgress() {
  const sessions = [...(state.sessions || [])].slice(-8).reverse();
  // Latest recorded outcome per practiced relation. Mastery is not the label.
  const outcomes = listLatestOutcomes(catalog, state.relations);

  const history =
    sessions.length === 0
      ? `<div class="empty">${mascot("welcome", "mascot-empty")}<p class="lede">还没有练习。回首页开始一小段吧。</p></div>`
      : `<ul class="list sessions">${sessions
          .map((s) => {
            const status = s.earlyStop || !s.completed ? "先停了" : "做完了";
            return `<li><span>${formatDay(s.day)} · ${status}</span><span class="meta">对了 ${s.correct}/${s.total}</span></li>`;
          })
          .join("")}</ul>`;

  const recent = outcomes.length
    ? `<p class="body section-label">最近练过的题</p>
    <p class="fine section-note">显示最近一次作答的对错</p>
    <ul class="list outcomes" id="recent-outcomes">${outcomes
      .map(
        (row) =>
          `<li data-id="${row.id}" data-outcome="${row.latestCorrect ? "right" : "wrong"}"><span>${listPromptHtml(row.prompt)}</span><span class="outcome ${row.latestCorrect ? "is-right" : "is-wrong"}"><span class="om" aria-hidden="true">${
            row.latestCorrect ? "✓" : "×"
          }</span>${row.latestCorrect ? "对" : "错"}</span></li>`,
      )
      .join("")}</ul>`
    : "";

  return `<section class="screen" id="progress">
    <button class="quiet back" type="button" data-action="home">${mark("house")}回首页</button>
    <h1 class="title">最近练得怎么样</h1>
    ${history}
    ${recent}
    <button class="cta secondary with-icon" type="button" data-action="a4-progress">${mark("printer")}选题打印</button>
  </section>`;
}

function renderMistakes() {
  const book = buildMistakeBook(catalog, state.relations, studentLabel);
  // Only 当前错题 is real; 已掌握 / 全部 answer 敬请期待 (05 §11 screen 8).
  const tabs = `<div class="segmented" role="group" aria-label="错题范围">
      <button class="seg is-on" type="button" aria-pressed="true">当前错题</button>
      <button class="seg seg-soon" type="button" aria-disabled="true" data-action="soon" data-soon="已掌握">已掌握<span class="seg-note">敬请期待</span></button>
      <button class="seg seg-soon" type="button" aria-disabled="true" data-action="soon" data-soon="全部">全部<span class="seg-note">敬请期待</span></button>
    </div>`;
  if (book.empty) {
    return `<section class="screen" id="mistakes">
      <h1 class="title">${book.title}</h1>
      ${tabs}
      <div class="empty">${mascot("welcome", "mascot-empty")}<p class="lede">${book.emptyMessage}</p></div>
      <button class="cta" type="button" data-action="home">回首页</button>
    </section>`;
  }
  const groups = book.groups
    .map(
      (group) => `<p class="body group-label">${domainLabel(group.domain)}</p>
      <ul class="list">${group.items
        .map(
          (item) =>
            `<li data-id="${item.id}"><span>${listPromptHtml(item.prompt)}</span><span class="meta">${item.label}</span></li>`,
        )
        .join("")}</ul>`,
    )
    .join("");
  return `<section class="screen" id="mistakes">
    <h1 class="title">${book.title}</h1>
    ${tabs}
    <p class="lede">${book.lede}</p>
    ${groups}
    <div class="action-pair">
      <button class="cta secondary with-icon" type="button" data-action="a4-mistakes">${mark("printer")}印这些题</button>
      <button class="cta" type="button" data-action="start-mistakes">练这些错题</button>
    </div>
  </section>`;
}

function printBackLink() {
  if (printSource === "mistakes") {
    return `<button class="quiet back" type="button" data-action="mistakes">${mark("arrow-left")}回错题本</button>`;
  }
  if (printSource === "progress") {
    return `<button class="quiet back" type="button" data-action="progress">${mark("arrow-left")}返回最近练习</button>`;
  }
  return `<button class="quiet back" type="button" data-action="home">${mark("house")}回首页</button>`;
}

function printRow(c) {
  return `<li data-id="${c.id}"><label class="pick">
      <input type="checkbox" data-print-id="${c.id}"${c.selected ? " checked" : ""}>
      <span class="pick-text">${listPromptHtml(c.prompt)}</span>
      ${c.label ? `<span class="meta">${c.label}</span>` : ""}
    </label></li>`;
}

/** ONE selector for progress 「选题打印」 and 错题本 「印这些题」. */
function renderPrintSelect() {
  const sel = buildPrintSelector(catalog, state.relations, {
    selectedIds: selectedPrintIds,
    domain: printDomain,
  });
  if (sel.empty) {
    return `<section class="screen no-print" id="print-select" data-source="${printSource}">
      ${printBackLink()}
      <h1 class="title">${sel.title}</h1>
      <div class="empty">${mascot("welcome", "mascot-empty")}<p class="lede">${sel.noCandidates}</p></div>
      <button class="cta" type="button" data-action="home">先练一小段</button>
    </section>`;
  }
  const filters = [["", "全部"], ...DOMAIN_ORDER.map((d) => [d, domainLabel(d)])]
    .map(
      ([value, label]) =>
        `<button class="chip text-chip${(printDomain || "") === value ? " is-on" : ""}" type="button" aria-pressed="${
          (printDomain || "") === value
        }" data-action="print-domain" data-domain="${value}">${label}</button>`,
    )
    .join("");
  const mistakesHtml = sel.currentMistakes.map(printRow).join("");
  const hiddenOthers = !printShowOthers && sel.others.length > 0;
  const othersHtml = hiddenOthers ? "" : sel.others.map(printRow).join("");
  const list =
    sel.currentMistakes.length + (hiddenOthers ? 0 : sel.others.length) > 0
      ? `<ul class="list picks" id="print-list">${mistakesHtml}${othersHtml}</ul>`
      : "";
  const revealOthers = hiddenOthers
    ? `<button class="quiet more-picks" type="button" data-action="print-show-others">${mark("plus")}也看看其他练过的题</button>`
    : "";
  const nothingHere =
    sel.currentMistakes.length + sel.others.length === 0
      ? `<p class="body">这一类还没有练过的题。</p>`
      : "";
  return `<section class="screen no-print" id="print-select" data-source="${printSource}">
    ${printBackLink()}
    <h1 class="title">${sel.title}</h1>
    <p class="lede">${sel.lede}</p>
    <div class="filters" role="group" aria-label="按块看">${filters}</div>
    <div class="pick-bar">
      <button class="quiet" type="button" data-action="print-select-mistakes">错题全选</button>
      <button class="quiet" type="button" data-action="print-clear">清空</button>
      <span class="label pick-count" id="print-count" aria-live="polite">${sel.selectedLabel}</span>
    </div>
    ${list}
    ${nothingHere}
    ${revealOthers}
    <button class="cta" type="button" data-action="print-preview"${sel.selectedCount === 0 ? " disabled" : ""}>预览题目</button>
  </section>`;
}

function renderA4() {
  const sheet = buildA4Sheet(catalog, state.relations, {
    selectedIds: selectedPrintIds,
    day: formatDay(today()),
  });
  const backToSelect = `<button class="quiet back" type="button" data-action="print-back">${mark("arrow-left")}返回选题</button>`;

  if (sheet.empty) {
    // Zero selected never produces an empty paper page.
    return `<section class="screen no-print" id="a4">
      ${backToSelect}
      <h1 class="title">印到纸上</h1>
      <p class="lede">${sheet.emptyMessage}</p>
    </section>`;
  }

  const sub = [sheet.day, sheet.domain].filter(Boolean).join(" · ");
  const prompts = sheet.prompts.map((p) => `<li data-id="${p.id}">${printPromptHtml(p.prompt)}</li>`).join("");

  const questionSheet = `<div class="sheet" id="a4-sheet">
      <h2>${sheet.title}</h2>
      <p class="sub">${sub}</p>
      <ol>${prompts}</ol>
    </div>`;

  const answerSheet = `<div class="sheet sheet-answers" id="a4-answers">
      <h2>答案（写完再看）</h2>
      <p class="sub">${sub}</p>
      <ol>${sheet.answerKey
        .map((a) => `<li data-id="${a.id}">${formatMath(a.relation)}</li>`)
        .join("")}</ol>
    </div>`;

  return `<section class="screen" id="a4" data-source="${printSource}">
    <div class="no-print">
      ${backToSelect}
      <h1 class="title">印到纸上</h1>
      <p class="lede">${showAnswers ? "这一页只有答案。写完题目再看。" : sheet.subtitle}</p>
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

/** The numerator box over a bar over the denominator box. */
function fieldsHtml() {
  const box = (which, label) => {
    const value = fields[which];
    const focused = fields.focus === which;
    const size = fieldSize(value);
    return `<button class="ff-box ff-${which}${focused ? " is-focus" : ""}${value ? "" : " is-empty"}${size ? ` is-${size}` : ""}" type="button" data-field="${which}" data-value="${value}" aria-label="${label}" aria-pressed="${focused}"><span class="ff-digits">${escapeHtml(
      value,
    )}</span>${focused ? '<span class="ff-caret" aria-hidden="true"></span>' : ""}</button>`;
  };
  return `${box("numerator", "分子")}<span class="ff-bar" aria-hidden="true"></span>${box("denominator", "分母")}`;
}

/** Answer box content: plain digits or a dotted repeating block. */
function answerHtml() {
  if (currentItem?.repeatingBlock) {
    // Student types only the block; the box shows textbook dots, no brackets.
    const intPart = (/^(\d+)\.\(/.exec(currentItem.canonical_answer || "") || [])[1] || "0";
    if (!answer) {
      return `<span class="rep-int">${intPart}.</span><span class="rep-slot" aria-hidden="true"></span>`;
    }
    return repeatingHtml(intPart, answer);
  }
  return escapeHtml(answer);
}

function setNudge(html, sticky = false) {
  nudgeHtml = html;
  nudgeSticky = sticky;
  const nudge = document.getElementById("nudge");
  if (nudge) nudge.innerHTML = html;
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
  const fieldBox = document.getElementById("answer");
  if (fieldBox && fieldBox.classList.contains("fraction-fields")) {
    // One listener on the container: the boxes are redrawn on every key.
    fieldBox.addEventListener("click", onField);
  }
  app.querySelectorAll("input[data-print-id]").forEach((el) => {
    el.addEventListener("change", onPrintToggle);
  });
}

function onPrintToggle(event) {
  const id = event.currentTarget.getAttribute("data-print-id");
  selectedPrintIds = togglePrintSelection(catalog, state.relations, selectedPrintIds, id);
  render();
}

function openPrint(source) {
  printSource = source;
  printDomain = null;
  // Default: current mistakes checked. From the Mistake Book the other
  // practiced relations start folded away, and can be revealed.
  selectedPrintIds = defaultPrintSelection(catalog, state.relations);
  printShowOthers = source !== "mistakes";
  showAnswers = false;
  screenName = "print-select";
  render();
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
  if (action === "explore") {
    screenName = "explore";
    render();
    return;
  }
  if (action === "me") {
    screenName = "me";
    render();
    return;
  }
  if (action === "about") {
    screenName = "about";
    render();
    loadBuildInfo();
    return;
  }
  if (action === "soon") {
    showSoon(event.currentTarget.getAttribute("data-soon"));
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
  if (action === "a4-progress") {
    openPrint("progress");
    return;
  }
  if (action === "mistakes") {
    screenName = "mistakes";
    render();
    return;
  }
  if (action === "start-mistakes") {
    beginSession(MISTAKE_BOOK_SOURCE, null);
    return;
  }
  if (action === "a4-mistakes") {
    openPrint("mistakes");
    return;
  }
  if (action === "print-domain") {
    // Narrows what is visible only; selections in other domains stay.
    printDomain = domain || null;
    render();
    return;
  }
  if (action === "print-select-mistakes") {
    selectedPrintIds = selectCurrentMistakes(catalog, state.relations, selectedPrintIds, printDomain);
    render();
    return;
  }
  if (action === "print-clear") {
    selectedPrintIds = clearPrintSelection(catalog, state.relations, selectedPrintIds, printDomain);
    render();
    return;
  }
  if (action === "print-show-others") {
    printShowOthers = true;
    render();
    return;
  }
  if (action === "print-preview") {
    if (!selectedPrintIds.length) return;
    showAnswers = false;
    screenName = "a4";
    window.scrollTo(0, 0);
    render();
    return;
  }
  if (action === "print-back") {
    showAnswers = false;
    screenName = "print-select";
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
    if (screenName !== "train" || submitting) return;
    inputModes.add("onscreen_keypad");
    eraseOne();
    return;
  }
  if (action === "advance") {
    window.clearTimeout(correctTimer);
    advanceAfterFeedback();
    return;
  }
  if (action === "expand-pattern") {
    expandedPattern = true;
    render();
    return;
  }
  if (action === "expand-frames") {
    expandedFrames = true;
    render();
    return;
  }
}

function onDigit(event) {
  const digit = event.currentTarget.getAttribute("data-digit");
  inputModes.add("onscreen_keypad");
  appendDigit(digit);
}

/** Tap the numerator or the denominator box. */
function onField(event) {
  const target = event.target instanceof Element ? event.target.closest("[data-field]") : null;
  if (!target || screenName !== "train" || submitting || !currentItem?.fractionFields) return;
  const next = focusField(fields, target.getAttribute("data-field"));
  if (!next) return;
  fields = next;
  syncAnswer(false);
}

function appendDigit(digit) {
  if (screenName !== "train" || submitting) return;
  if (currentItem?.fractionFields) {
    // Digits only, into the focused box only.
    const next = typeDigit(fields, digit);
    if (!next) return;
    fields = next;
  } else if (digit === ".") {
    if (!currentItem?.needsDecimalPoint) return;
    if (answer.includes(".")) return;
    answer += ".";
  } else {
    if (!/^\d$/.test(digit)) return;
    if (answer.replace(/\./g, "").length >= 8) return;
    answer += digit;
  }
  syncAnswer();
  cue.tap();
}

/** Backspace: the last digit of the answer, or of the focused fraction box only. */
function eraseOne() {
  if (currentItem?.fractionFields) {
    // An empty box stays focused; nothing jumps to the other box.
    const next = eraseDigit(fields);
    if (next) fields = next;
  } else {
    answer = answer.slice(0, -1);
  }
  syncAnswer();
}

function syncAnswer(tick = true) {
  const el = document.getElementById("answer");
  if (el) {
    if (currentItem?.fractionFields) {
      el.innerHTML = fieldsHtml();
      el.setAttribute("data-focus", fields.focus);
    } else {
      el.innerHTML = answerHtml();
    }
    if (tick) {
      el.classList.remove("tick");
      void el.offsetWidth;
      el.classList.add("tick");
    }
  }
  if (tick && !nudgeSticky) setNudge("");
}

function sessionSeed(mode, domain) {
  // Shell-provided seed: a new order each session, reproducible inside Core.
  return `${today()}|${mode}|${domain || ""}|${(state.sessions || []).length}|${Date.now()}`;
}

function beginSession(mode, domain) {
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
    screenName = "mistakes";
    render();
    return;
  }
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
      seed: sessionSeed(mode, domain),
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
  fields = emptyFields();
  nudgeHtml = "";
  nudgeSticky = false;
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
    // fraction_fields: both boxes → ONE judging string (or "" = not an attempt).
    raw: currentItem.fractionFields ? fieldsAnswer(fields) : answer,
    meta: {
      day: today(),
      inputMode: mode.inputMode,
      mixedInput: mode.mixedInput,
      elapsedMs: Math.round(performance.now() - startedAt),
    },
  });

  if (!result.feedback.record) {
    // Not an attempt (empty / malformed / needs_simplification): stay here,
    // keep the answer editable, nothing recorded.
    submitting = false;
    setNudge(formatMath(result.feedback.message), Boolean(result.feedback.needsSimplification));
    return;
  }
  setNudge("");

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
    if (submitting) return;
    inputModes.add("physical_keyboard");
    eraseOne();
  } else if (event.key === "Enter") {
    event.preventDefault();
    doSubmit();
  }
});

render();

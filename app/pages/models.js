/**
 * Page models for 专项练习, 错题本, 最近练得怎么样 and the shared print
 * selector + A4 page — the same words, order and rules as main's h5/app.js
 * (renderExplore / renderFocusConfirm / renderMistakes / renderProgress /
 * renderPrintSelect / renderA4). Pure: they only read the active learner's
 * record through src/core (summarizeDomain, buildMistakeBook,
 * listLatestOutcomes, buildPrintSelector, buildA4Sheet). Nothing here
 * decides anything about learning, and nothing is written.
 */
import { DOMAIN_ORDER, domainLabel } from "../../src/core/content.js";
import { studentLabel } from "../../src/core/mastery.js";
import { practiceCard, practiceGroups } from "../../src/core/practice-groups.js";
import { buildMistakeBook } from "../../src/core/mistakes.js";
import { listLatestOutcomes } from "../../src/core/progress.js";
import { buildA4Sheet, buildPrintSelector } from "../../src/core/a4.js";

/**
 * 专项练习 · 主题训练 is the shared grouped grid (src/core/practice-groups.js,
 * docs/ux/05_specialist_grouped_grid.md): three navigation groups, two-column
 * cards, one `domain.<domain_id>` slot per card with its glyph as the stand-in.
 * h5/app.js renders the same model.
 */
export { DOMAIN_GLYPHS, PRACTICE_GROUPS, domainSlot } from "../../src/core/practice-groups.js";

export const FOCUS_LEDE = "只练这一块，同样是一小段，不是一直刷。";

function relationsOf(state) {
  return (state && state.relations) || {};
}

/** 主题训练: the three groups with their cards (shared model; the groups are navigation only). */
export function exploreView(state, catalog) {
  return practiceGroups(catalog, relationsOf(state));
}

/** The focused-practice confirmation for one domain; null for anything that is not a released domain. */
export function focusView(domain, state, catalog) {
  if (typeof domain !== "string" || !DOMAIN_ORDER.includes(domain)) return null;
  const card = practiceCard(domain, catalog, relationsOf(state));
  if (!card.released) return null;
  return {
    domain,
    label: card.label,
    summary: card.status,
    lede: FOCUS_LEDE,
    slot: card.slot,
    glyph: card.glyph,
    tone: card.tone,
  };
}

/** Mistake Book: core's grouping by domain (empty groups already left out) plus the group names. */
export function mistakesView(state, catalog) {
  const book = buildMistakeBook(catalog, relationsOf(state), studentLabel);
  return { ...book, groups: book.groups.map((g) => ({ ...g, label: domainLabel(g.domain) })) };
}

/** 「10月2日」 (h5/app.js formatDay). */
export function formatDay(iso) {
  if (!iso) return "";
  const [, m, d] = String(iso).split("-");
  return `${Number(m)}月${Number(d)}日`;
}

/** Progress: the last 8 sets (newest first) and the latest outcome per practiced relation. */
export function progressView(state, catalog) {
  const sessions = [...((state && state.sessions) || [])]
    .slice(-8)
    .reverse()
    .map((s) => ({
      day: formatDay(s.day),
      status: s.earlyStop || !s.completed ? "先停了" : "做完了",
      score: `对了 ${s.correct}/${s.total}`,
    }));
  const outcomes = listLatestOutcomes(catalog, relationsOf(state)).map((row) => ({
    id: row.id,
    prompt: row.prompt,
    right: row.latestCorrect,
  }));
  return { sessions, outcomes };
}

/** Where the print selector was opened from: 首页 / 最近练得怎么样 / 错题本. */
export const PRINT_SOURCES = Object.freeze(["home", "progress", "mistakes"]);

export function printSource(value) {
  return PRINT_SOURCES.includes(value) ? value : "home";
}

/** The shared print selector (selection itself is transient page state, never stored). */
export function printSelectView(state, catalog, { selectedIds, domain, showOthers }) {
  const sel = buildPrintSelector(catalog, relationsOf(state), { selectedIds, domain });
  const hiddenOthers = !showOthers && sel.others.length > 0;
  return {
    ...sel,
    filters: [{ value: "", label: "全部" }, ...DOMAIN_ORDER.map((d) => ({ value: d, label: domainLabel(d) }))],
    rows: [...sel.currentMistakes, ...(hiddenOthers ? [] : sel.others)],
    hiddenOthers,
    nothingHere: sel.currentMistakes.length + sel.others.length === 0,
  };
}

/** A4 page for exactly the selected, practiced relations; answers on their own page. */
export function a4View(state, catalog, { selectedIds, day }) {
  const sheet = buildA4Sheet(catalog, relationsOf(state), { selectedIds, day: formatDay(day) });
  return { ...sheet, sub: [sheet.day, sheet.domain].filter(Boolean).join(" · ") };
}

/** Under the A4 page on a client that prints (H5): the h5/ line. */
export const PRINT_NOTE = "若当前环境打不开打印，可用浏览器的「打印」或「存储为 PDF」把题目带出去。";
/** On a client that cannot print (the Mini Program has no print API): the A4 page is a preview, and this line says so. */
export const NO_PRINT_NOTE = "小程序里不能直接打印。可以照着这一页写在纸上，或在电脑浏览器里打开再打印。";

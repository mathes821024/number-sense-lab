import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { profileView } from "../app/pages/me/model.js";
import { homeView } from "../app/pages/home/model.js";
import { SKILL_IDS } from "../src/core/skill-catalog.js";
import { GRADE7_STAGES, structureKindForSkill } from "../app/pages/explore/structure.js";
import { grade7PathView, grade7View } from "../app/pages/models.js";
import theme from "../app/theme/math-lab/index.js";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("profile view is calm evidence, not a score", () => {
  const view = profileView({
    profile: { learner_id: "L1", created_on: "2026-10-01", nickname: "晨曦" },
    relations: {
      a: { status: "stable", attempts: [{ correct: true }] },
      b: { status: "learning", attempts: [{ correct: false }] },
      c: { status: "unseen", attempts: [] },
    },
    prefs: { sound: true },
  });
  assert.equal(view.nickname, "晨曦");
  assert.equal(view.displayName, "晨曦");
  assert.equal(view.practicedRelations, 2);
  assert.equal(view.stableRelations, 1);
  assert.equal(view.sound, true);
  assert.doesNotMatch(JSON.stringify(view), /排名|击败|连续打卡|落后/);
});

test("profile view has a gentle fallback name", () => {
  const view = profileView({ profile: {}, relations: {}, prefs: { sound: false } });
  assert.equal(view.displayName, "小研究员");
  assert.equal(view.sound, false);
});

test("real My and About routes replace the placeholder tab", () => {
  const config = read("app/app.config.js");
  const tabs = read("app/pages/tabs.js");
  assert.match(config, /pages\/me\/index/);
  assert.match(config, /pages\/about\/index/);
  assert.match(tabs, /me:\s*"me"/);
  assert.doesNotMatch(tabs, /else showSoon\(label\)/);
});

test("My saves optional local identity without offering destructive reset", () => {
  const page = read("app/pages/me/index.jsx");
  assert.match(page, /withActiveLearnerNickname/);
  assert.match(page, /withActiveLearnerPrefs/);
  assert.match(page, /保存称呼/);
  assert.match(page, /只保存在当前设备/);
  assert.doesNotMatch(page, /清空|reset|removeItem/);
});

test("about page carries the approved parent-companion story", () => {
  const page = read("app/pages/about/index.jsx");
  for (const line of [
    "父母陪孩子一起做的一间数学实验室",
    "不催速度，不比排名，不用题量制造压力",
    "更可靠的计算直觉",
    "错误不是惩罚的理由",
  ]) assert.match(page, new RegExp(line));
  assert.doesNotMatch(page, /https?:|www\.|href=|MIT|开源项目/);
});

test("completed home has one primary action and no duplicate re-practice action", () => {
  const home = homeView({
    sessions: [{ day: "2026-10-12", completed: true, mode: "daily" }],
    activeSession: null,
  }, "2026-10-12");
  assert.equal(home.cta.label, "看看这次");
  assert.equal(home.secondary, null);
});

test("home next steps are a compact path and the data note lives in My", () => {
  const page = read("app/pages/home/index.jsx");
  assert.match(page, /home-next/);
  assert.doesNotMatch(page, /device-note|DEVICE_NOTE/);
});

test("the four Grade 7 stages contain every stable skill id exactly once", () => {
  const ids = GRADE7_STAGES.flatMap((stage) => stage.skills);
  assert.deepEqual([...ids].sort(), [...SKILL_IDS].sort());
  assert.equal(new Set(ids).size, SKILL_IDS.length);
  assert.deepEqual(GRADE7_STAGES.map((stage) => stage.label), [
    "认识有理数", "掌握四则", "进入分数", "综合运用",
  ]);
});

test("every Grade 7 skill has a mathematical structure kind", () => {
  for (const id of SKILL_IDS) assert.ok(structureKindForSkill(id), id);
});

test("Grade 7 path changes presentation only", () => {
  const learner = {
    relations: {},
    skills: { "g7-integer-add-sub": { status: "learning", next_band: "standard" } },
  };
  const cards = grade7View(learner).cards;
  const flat = grade7PathView(learner).stages.flatMap((stage) => stage.skills);
  assert.deepEqual(flat.map((skill) => skill.skillId).sort(), [...SKILL_IDS].sort());
  for (const skill of flat) {
    assert.equal(skill.band, cards.find((card) => card.skillId === skill.skillId).band);
  }
  assert.equal(flat.find((skill) => skill.skillId === "g7-integer-add-sub").label, "有理数加减");
  assert.equal(flat.find((skill) => skill.skillId === "g7-integer-mul-div").label, "有理数乘除");
  assert.equal(cards.find((card) => card.skillId === "g7-integer-add-sub").label, "整数加减");
  assert.equal(cards.find((card) => card.skillId === "g7-integer-mul-div").label, "整数乘除");
});

test("four semantic mascot states reuse the existing three runtime slots", () => {
  assert.equal(theme.mascot.welcome, "mascot.welcome");
  assert.equal(theme.mascot.thinking, "mascot.thinking");
  assert.equal(theme.mascot.discover, "mascot.correct");
  assert.equal(theme.mascot.rest, "mascot.thinking");
  assert.equal(new Set(Object.values(theme.mascot)).size, 3);
});

test("the quiet companion is interactive only when explicitly requested", () => {
  const component = read("app/components/MascotCompanion.jsx");
  assert.match(component, /interactive === true/);
  assert.match(component, /先看关系，再决定怎么算。/);
  assert.doesNotMatch(component, /setTimeout|setInterval|record\.write|localStorage|wx\./);
  const correct = read("app/components/CorrectFeedback.jsx");
  const wrong = read("app/components/WrongFeedback.jsx");
  assert.doesNotMatch(correct, /Mascot|MascotCompanion/);
  assert.doesNotMatch(wrong, /Mascot|MascotCompanion/);
});

import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { profileView } from "../app/pages/me/model.js";

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

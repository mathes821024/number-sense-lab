import assert from "node:assert/strict";
import test from "node:test";
import { normalizeNickname } from "../src/core/learner-profile.js";
import { withActiveLearnerNickname, withActiveLearnerPrefs } from "../src/core/store.js";

function learnerState() {
  return {
    version: 4,
    active_learner_id: "L1",
    learners: {
      L1: {
        profile: { learner_id: "L1", created_on: "2026-10-01" },
        relations: { r1: { status: "learning", attempts: [{ correct: false }] } },
        sessions: [{ id: "s1" }],
        activeSession: { id: "active" },
        skills: { g7: { status: "learning" } },
        activeSkillSession: { skill_id: "g7" },
        prefs: { sound: true },
      },
    },
  };
}

test("nickname is optional, trimmed, control-free and limited to 12 code points", () => {
  assert.equal(normalizeNickname("  小研究员晨曦  "), "小研究员晨曦");
  assert.equal(normalizeNickname("\u0000小\n明\u007f"), "小明");
  assert.equal(normalizeNickname("   "), "");
  assert.equal(normalizeNickname(null), "");
  assert.equal(Array.from(normalizeNickname("一二三四五六七八九十十一十二十三")).length, 12);
  assert.equal(Array.from(normalizeNickname("😀一二三四五六七八九十十一十二")).length, 12);
});

test("saving nickname preserves identity and every learning record", () => {
  const before = learnerState();
  const after = withActiveLearnerNickname(before, "  晨曦  ");
  assert.notEqual(after, before);
  assert.notEqual(after.learners.L1, before.learners.L1);
  assert.equal(after.active_learner_id, before.active_learner_id);
  assert.equal(after.learners.L1.profile.learner_id, "L1");
  assert.equal(after.learners.L1.profile.created_on, "2026-10-01");
  assert.equal(after.learners.L1.profile.nickname, "晨曦");
  for (const key of ["relations", "sessions", "activeSession", "skills", "activeSkillSession"]) {
    assert.deepEqual(after.learners.L1[key], before.learners.L1[key], key);
  }
});

test("saving preferences merges the patch without changing the profile or learning data", () => {
  const before = learnerState();
  const after = withActiveLearnerPrefs(before, { sound: false, motion: "low" });
  assert.deepEqual(after.learners.L1.profile, before.learners.L1.profile);
  assert.deepEqual(after.learners.L1.relations, before.learners.L1.relations);
  assert.deepEqual(after.learners.L1.prefs, { sound: false, motion: "low" });
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { migrateV3toV4, upgradeState, MigrationError } from "../src/core/migrate.js";
import { emptyState, getActiveLearner, isValidV4, STATE_VERSION } from "../src/core/store.js";

const fixture = JSON.parse(readFileSync(new URL("./fixtures/state-v3-grade7-empty.json", import.meta.url), "utf8"));

test("v3 → v4 adds only skill state and preserves every existing field", () => {
  const migrated = migrateV3toV4(fixture);
  assert.equal(migrated.version, 4);
  assert.equal(migrated.active_learner_id, fixture.active_learner_id);
  assert.equal(migrated.device_note, fixture.device_note);
  const learner = migrated.learners[fixture.active_learner_id];
  const { skills, activeSkillSession, ...preserved } = learner;
  assert.deepEqual(preserved, fixture.learners[fixture.active_learner_id]);
  assert.deepEqual(skills, {});
  assert.equal(activeSkillSession, null);
});

test("upgradeState migrates v3 exactly once without creating another learner id", () => {
  let calls = 0;
  const out = upgradeState(structuredClone(fixture), {
    createLearnerId: () => { calls += 1; return "must-not-be-used"; },
    today: "2026-10-12",
  });
  assert.equal(out.from, 3);
  assert.equal(out.changed, true);
  assert.equal(calls, 0);
  assert.equal(out.state.version, 4);
  assert.deepEqual(out.state.learners["learner-grade7"].activeSession, fixture.learners["learner-grade7"].activeSession);
});

test("a legal v4 round-trips without changing relations or skill evidence", () => {
  const v4 = migrateV3toV4(fixture);
  v4.learners["learner-grade7"].skills["g7-integer-add-sub"] = {
    status: "learning",
    attempts: [{ exercise_id: "gx:1", band: "foundation", outcome: "correct", normalized: "5", day: "2026-10-12", elapsedMs: 900, inputMode: "onscreen_keypad", mixedInput: false }],
    schedule: { due_day: "2026-10-13", bucket: "1d", reason: "first-correct" }
  };
  const out = upgradeState(structuredClone(v4), { createLearnerId: () => "never" });
  assert.equal(out.changed, false);
  assert.deepEqual(out.state, v4);
});

test("fresh state is v4 and future versions still fail closed", () => {
  assert.equal(STATE_VERSION, 4);
  const fresh = emptyState({ learnerId: "fresh", createdOn: "2026-10-12" });
  assert.equal(isValidV4(fresh), true);
  assert.deepEqual(getActiveLearner(fresh).skills, {});
  assert.equal(getActiveLearner(fresh).activeSkillSession, null);
  assert.throws(() => upgradeState({ version: 5 }, { createLearnerId: () => "x" }), MigrationError);
});

test("a reserved v4-field collision in legacy data fails instead of overwriting evidence", () => {
  const collided = structuredClone(fixture);
  collided.learners["learner-grade7"].skills = { imported: "unknown" };
  assert.throws(() => migrateV3toV4(collided), /DATA_MIGRATION_RISK/);
});

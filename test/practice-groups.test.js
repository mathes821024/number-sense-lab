import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { focusView } from "../app/pages/models.js";
import { loadCoreCatalog, practiceEntryCatalog, DOMAIN_ORDER } from "../src/core/content.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("focus confirm keeps the core CTA primary and exposes complete practice metadata", () => {
  const catalog = loadCoreCatalog();
  for (const domain of DOMAIN_ORDER) {
    const view = focusView(domain, { relations: {} }, catalog);
    assert.ok(view);
    assert.equal(view.hasCompletePractice, true);
    if (domain === "products") {
      assert.equal(view.completeCount, 551);
      assert.equal(view.referenceLabel, "乘除关系练习");
      assert.equal(view.referenceSubtitle, "从乘积反推因数，也从因数得到乘积");
      assert.match(view.referenceAria, /乘除关系练习/);
    } else if (domain === "squares") {
      assert.equal(view.completeCount, 40);
      assert.equal(view.referenceLabel, "完整关系练习");
    } else if (domain === "cubes") {
      assert.equal(view.completeCount, 18);
      assert.equal(view.referenceLabel, "完整关系练习");
    } else if (domain === "powers") {
      assert.equal(view.completeCount, 54);
      assert.equal(view.referenceLabel, "完整关系练习");
    } else {
      assert.equal(view.completeCount, practiceEntryCatalog(domain).length);
      assert.equal(view.referenceLabel, "完整关系练习");
      assert.match(view.referenceAria, new RegExp(`${view.label}·完整关系练习`));
    }
    assert.match(view.referenceAria, new RegExp(String(view.completeCount)));
  }
});

test("explore source keeps start-focus primary and adds start-reference secondary action", () => {
  const source = readFileSync(join(root, "app/pages/explore/index.jsx"), "utf8");
  assert.match(source, /data-action="start-focus"/);
  assert.match(source, /data-action="start-reference"/);
  assert.match(source, /referenceLabel/);
  assert.match(source, /referenceSubtitle/);
  const focusIdx = source.indexOf('data-action="start-focus"');
  const refIdx = source.indexOf('data-action="start-reference"');
  assert.ok(focusIdx > 0 && refIdx > focusIdx);
});

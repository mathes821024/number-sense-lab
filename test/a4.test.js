import assert from "node:assert/strict";
import test from "node:test";
import { buildA4Sheet } from "../src/core/a4.js";
import { loadCoreCatalog } from "../src/core/content.js";
import { MASTERY } from "../src/core/mastery.js";

const catalog = loadCoreCatalog();

test("A4 lists only unstable prompts and keeps answers separate", () => {
  const relations = {
    "square-15": { status: MASTERY.LEARNING, attempts: [] },
    "square-17": { status: MASTERY.SHAKY, attempts: [] },
    "square-10": { status: MASTERY.STABLE, attempts: [] },
  };
  const sheet = buildA4Sheet(catalog, relations, { day: "9月29日" });
  assert.equal(sheet.empty, false);
  const ids = sheet.prompts.map((p) => p.id).sort();
  assert.deepEqual(ids, ["square-15", "square-17"]);
  assert.equal(sheet.prompts.every((p) => !("answer" in p)), true);
  assert.equal(sheet.answerKey.length, 2);
  assert.ok(sheet.subtitle.includes("没有答案"));
});

test("A4 is empty when nothing is unstable", () => {
  const relations = Object.fromEntries(
    catalog.map((item) => [item.id, { status: MASTERY.STABLE, attempts: [] }]),
  );
  const sheet = buildA4Sheet(catalog, relations);
  assert.equal(sheet.empty, true);
});

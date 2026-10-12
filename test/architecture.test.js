import assert from "node:assert/strict";
import test from "node:test";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const coreDir = join(dirname(fileURLToPath(import.meta.url)), "../src/core");
const repoRoot = join(coreDir, "../..");
const read = (path) => readFileSync(join(repoRoot, path), "utf8");

test("core sources do not call platform APIs", () => {
  const banned = [
    "localStorage",
    "sessionStorage",
    "document.",
    "window.",
    "wx.",
    "tt.",
    "my.",
    "indexedDB",
  ];
  const files = readdirSync(coreDir).filter((f) => f.endsWith(".js"));
  assert.ok(files.length >= 6);
  for (const file of files) {
    const source = readFileSync(join(coreDir, file), "utf8");
    for (const token of banned) {
      assert.equal(source.includes(token), false, `${file} contains ${token}`);
    }
  }
});

test("prototype firstSliceCatalog is not the formal content source", () => {
  const files = readdirSync(coreDir).filter((f) => f.endsWith(".js"));
  for (const file of files) {
    const source = readFileSync(join(coreDir, file), "utf8");
    assert.equal(source.includes("firstSliceCatalog"), false, file);
  }
});

test("core never creates learner ids or reads randomness on its own", () => {
  const banned = ["randomUUID", "getRandomValues", "crypto", "Math.random", "openid"];
  const files = readdirSync(coreDir).filter((f) => f.endsWith(".js"));
  for (const file of files) {
    const source = readFileSync(join(coreDir, file), "utf8");
    for (const token of banned) {
      assert.equal(source.includes(token), false, `${file} contains ${token}`);
    }
  }
});

test("the frozen product, UX and UI contracts define the Math Exploration Desk", () => {
  const prd = read("docs/product/01_prd.md");
  const ux = read("docs/ux/02_ux_spec.md");
  const mistakesUx = read("docs/ux/03_mistake_book_ux.md");
  const specialistUx = read("docs/ux/05_specialist_grouped_grid.md");
  const ui = read("docs/ui/03_ui_spec.md");
  const specialistUi = read("docs/ui/08_fb_specialist_visual.md");
  const scientificUi = read("docs/ui/09_scientific_visual_language.md");

  assert.match(ux, /完成态不显示「再练一小段」/);
  assert.match(ux, /「我的」是可用页面/);
  assert.match(mistakesUx, /只显示「当前错题」/);
  assert.match(specialistUx, /四个学习阶段/);
  assert.match(specialistUi, /事实领域使用实验架/);
  assert.match(ui, /数学探索台/);
  assert.match(scientificUi, /欢迎.*思考.*发现.*休息/s);
  assert.match(prd, /父母陪孩子一起做的一间数学实验室/);
  for (const text of [prd, ux, ui]) {
    assert.match(text, /不催速度/);
    assert.match(text, /不比排名/);
  }
});

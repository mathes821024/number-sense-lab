import assert from "node:assert/strict";
import test from "node:test";
import { formatMath } from "../h5/math-text.js";

test("fraction slash becomes a horizontal bar", () => {
  const html = formatMath("1/2 = ?");
  assert.match(html, /<span class="num">1<\/span><span class="den">2<\/span>/);
  assert.equal(html.replace(/aria-label="[^"]*"/g, "").includes("1/2"), false);
  assert.match(html, /aria-label="1\/2"/);
});

test("several fractions in one line all convert", () => {
  const html = formatMath("1/2 的一半，也可以 1 − 1/4");
  assert.equal(html.match(/class="frac"/g).length, 2);
  assert.match(html, /aria-label="1\/4"/);
  assert.match(html, /class="den">4</);
});

test("products and markup stay plain", () => {
  assert.equal(formatMath("6 × 12 = 72"), "6 × 12 = 72");
  assert.equal(formatMath("9月29日"), "9月29日");
  assert.match(formatMath("a < b"), /&lt;/);
});

import { repeatingHtml, repeatingLabel } from "../h5/math-text.js";
import { loadCoreCatalog, getRelationById } from "../src/core/content.js";
import { judgeAnswer, repeatingBlockOf } from "../src/core/answer.js";

const dots = (html) => (html.match(/class="rd"/g) || []).length;
const visible = (html) => html.replace(/<[^>]+>/g, "");

test("repeating: one digit gets one dot, no parentheses", () => {
  const html = formatMath("0.(6)");
  assert.equal(dots(html), 1);
  assert.match(html, /0\.<span class="rd">6<\/span>/);
  assert.equal(visible(html), "0.6");
  assert.equal(/[()]/.test(visible(html)), false);
  assert.match(html, /aria-label="0\.6，6 循环"/);
});

test("repeating: several digits get dots on the first and last digit only", () => {
  const html = formatMath("1/7 = 0.(142857)");
  assert.equal(dots(html), 2);
  assert.match(html, /0\.<span class="rd">1<\/span>4285<span class="rd">7<\/span>/);
  assert.equal(visible(html).includes("0.142857"), true);
  assert.equal(/[()]/.test(visible(html)), false);
  assert.match(html, /aria-label="0\.142857，142857 循环"/);
  assert.match(html, /class="frac" aria-label="1\/7"/, "fractions still render in the same line");
});

test("repeating: accessible label is derivable and dots are not the only carrier", () => {
  assert.equal(repeatingLabel("0", "3"), "0.3，3 循环");
  const html = repeatingHtml("0", "142857");
  assert.match(html, /role="math"/);
  assert.match(html, /aria-label="0\.142857，142857 循环"/);
  assert.match(html, /<span aria-hidden="true">0\./);
});

test("repeating: every student-facing text field of the 4 new relations renders dotted", () => {
  const catalog = loadCoreCatalog();
  for (const id of ["fraction-1-3", "fraction-2-3", "fraction-1-9", "fraction-1-7"]) {
    const item = getRelationById(id, catalog);
    const texts = [item.relation, item.hook, item.pattern?.check, ...(item.pattern?.family || []), ...(item.frames || []).flatMap((f) => [f.title, f.detail])];
    for (const text of texts.filter(Boolean)) {
      const html = formatMath(text);
      assert.equal(/\d\.\(/.test(visible(html)), false, `${id}: ${text}`);
    }
  }
});

test("repeating: canonical stays 0.(6) / 0.(142857) and judging is unchanged", () => {
  const catalog = loadCoreCatalog();
  const twoThirds = getRelationById("fraction-2-3", catalog);
  const oneSeventh = getRelationById("fraction-1-7", catalog);
  assert.equal(twoThirds.canonical_answer, "0.(6)");
  assert.equal(oneSeventh.canonical_answer, "0.(142857)");
  assert.equal(repeatingBlockOf(oneSeventh.canonical_answer), "142857");
  assert.equal(judgeAnswer(twoThirds, "6").kind, "correct");
  assert.equal(judgeAnswer(oneSeventh, "142857").kind, "correct");
  assert.equal(judgeAnswer(oneSeventh, "142857").normalized, "0.(142857)");
  assert.equal(judgeAnswer(oneSeventh, "285714").kind, "wrong");
  assert.equal(judgeAnswer(oneSeventh, "").kind, "empty");
});

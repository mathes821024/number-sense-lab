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

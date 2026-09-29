import assert from "node:assert/strict";
import test from "node:test";
import { judgeAnswer, normalizeAnswer } from "../src/core/answer.js";
import { getRelationById, loadCoreCatalog } from "../src/core/content.js";

const catalog = loadCoreCatalog();
const sq17 = getRelationById("square-17", catalog);
const half = getRelationById("fraction-1-2", catalog);
const f18 = getRelationById("fraction-1-8", catalog);

test("integer equivalence: 289 and 0289 and 289.0", () => {
  assert.equal(normalizeAnswer("289", "integer"), "289");
  assert.equal(normalizeAnswer("0289", "integer"), "289");
  assert.equal(normalizeAnswer("289.0", "integer"), "289");
  assert.equal(judgeAnswer(sq17, "289").kind, "correct");
  assert.equal(judgeAnswer(sq17, "0289").kind, "correct");
  assert.equal(judgeAnswer(sq17, "289.0").kind, "correct");
  assert.equal(judgeAnswer(sq17, "288").kind, "wrong");
});

test("decimal equivalence: 0.5 / 0.50 / .5", () => {
  assert.equal(normalizeAnswer("0.5", "decimal"), "0.5");
  assert.equal(normalizeAnswer("0.50", "decimal"), "0.5");
  assert.equal(normalizeAnswer(".5", "decimal"), "0.5");
  assert.equal(judgeAnswer(half, "0.5").kind, "correct");
  assert.equal(judgeAnswer(half, "0.50").kind, "correct");
  assert.equal(judgeAnswer(half, ".5").kind, "correct");
  assert.equal(judgeAnswer(half, "0.500").kind, "correct");
  assert.equal(judgeAnswer(f18, "0.125").kind, "correct");
  assert.equal(judgeAnswer(f18, ".125").kind, "correct");
  assert.equal(judgeAnswer(f18, "0.1250").kind, "correct");
});

test("empty and lone decimal point are not recorded wrongs", () => {
  assert.equal(judgeAnswer(half, "  ").kind, "empty");
  assert.equal(judgeAnswer(half, ".").kind, "empty");
  assert.equal(judgeAnswer(sq17, "").kind, "empty");
});

test("display answer remains canonical_answer", () => {
  assert.equal(half.canonical_answer, "0.5");
  assert.equal(sq17.canonical_answer, "289");
});

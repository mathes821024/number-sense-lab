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

test("percent_number: exact decimal strings, no floating compare, % typed is invalid", () => {
  const item = {
    id: "ref-pct-1-8",
    prompt: "1/8 = ?%",
    canonical_answer: "12.5",
    answer_type: "percent_number",
    percentNumber: true,
  };
  assert.equal(judgeAnswer(item, "12.5").kind, "correct");
  assert.equal(judgeAnswer(item, "12.50").kind, "correct");
  assert.equal(judgeAnswer(item, "12.500").kind, "correct");
  assert.equal(judgeAnswer(item, "12.4").kind, "wrong");
  assert.equal(judgeAnswer(item, "12.5%").kind, "invalid");
  assert.equal(judgeAnswer(item, "%").kind, "invalid");
  assert.equal(judgeAnswer(item, "").kind, "empty");
  assert.equal(judgeAnswer(item, ".").kind, "empty");
  assert.equal(item.canonical_answer.includes("%"), false);
});

test("repeating: mixed form 0.1(6) judges the block only", () => {
  const item = {
    id: "ref-rep-1-6",
    prompt: "1/6 = ?",
    canonical_answer: "0.1(6)",
    answer_type: "decimal_repeating",
    repeatingBlock: true,
  };
  assert.equal(judgeAnswer(item, "6").kind, "correct");
  assert.equal(judgeAnswer(item, "0.1(6)").kind, "correct");
  assert.equal(judgeAnswer(item, "1").kind, "wrong");
  assert.equal(judgeAnswer(item, "").kind, "empty");
});

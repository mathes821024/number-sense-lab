/**
 * Display-layer formulas for Grade 7 unary opposite / abs.
 * Derived only from operands (+ canonical for reveal). Never parses or
 * writes back prompt; never enters checksum / exercise_id payloads.
 * Contract: docs/curriculum/11_grade7_rational_skills_contract.md §§10–12.
 */
import { formatRational, rational } from "./rational.js";

const DIGIT_WORDS = Object.freeze(["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"]);

function asRational(value) {
  return rational(value.numerator, value.denominator);
}

/** Known term as in the identity prompt: negatives wrapped in parentheses. */
export function formatOperandTerm(value) {
  const normalized = asRational(value);
  const text = formatRational(normalized);
  return normalized.numerator < 0 ? `(${text})` : text;
}

/** Answer as an addend in 「a + □ = 0」: negatives wrapped in parentheses. */
export function formatAddendTerm(canonicalAnswer) {
  const text = String(canonicalAnswer ?? "");
  return text.startsWith("-") ? `(${text})` : text;
}

export function isUnaryOpposite(itemOrOperands) {
  const operands = itemOrOperands?.operands ?? itemOrOperands;
  return Boolean(operands && operands.kind === "unary" && operands.operator === "opposite");
}

export function isUnaryAbs(itemOrOperands) {
  const operands = itemOrOperands?.operands ?? itemOrOperands;
  return Boolean(operands && operands.kind === "unary" && operands.operator === "abs");
}

/** Common Chinese reading for non-negative integers (十、十一、二十…). */
export function speakNonNegativeInteger(value) {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 0) throw new Error("speakNonNegativeInteger expects a non-negative safe integer");
  if (n < 10) return DIGIT_WORDS[n];
  if (n === 10) return "十";
  if (n < 20) return `十${DIGIT_WORDS[n % 10]}`;
  if (n < 100) {
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    return `${DIGIT_WORDS[tens]}十${ones ? DIGIT_WORDS[ones] : ""}`;
  }
  if (n < 1000) {
    const hundreds = Math.floor(n / 100);
    const rest = n % 100;
    if (rest === 0) return `${DIGIT_WORDS[hundreds]}百`;
    if (rest < 10) return `${DIGIT_WORDS[hundreds]}百零${DIGIT_WORDS[rest]}`;
    return `${DIGIT_WORDS[hundreds]}百${speakNonNegativeInteger(rest)}`;
  }
  // Bound operands stay small; fall back to digit-by-digit rather than inventing 万+.
  return String(n).split("").map((ch) => DIGIT_WORDS[Number(ch)]).join("");
}

/** Spoken form of a rational: 4/5 → 五分之四；-2/5 → 负五分之二；6 → 六. */
export function speakRational(value) {
  const normalized = asRational(value);
  const negative = normalized.numerator < 0;
  const absNum = Math.abs(normalized.numerator);
  const den = normalized.denominator;
  let body;
  if (den === 1) body = speakNonNegativeInteger(absNum);
  else body = `${speakNonNegativeInteger(den)}分之${speakNonNegativeInteger(absNum)}`;
  return negative ? `负${body}` : body;
}

/**
 * @returns {{
 *   kind: "unary_opposite",
 *   knownText: string,
 *   visibleFormula: string,
 *   revealedRelation: string,
 *   ariaLabel: string,
 * } | null}
 */
export function oppositeDisplayModel(operands, canonicalAnswer) {
  if (!isUnaryOpposite(operands)) return null;
  const knownText = formatOperandTerm(operands.value);
  const revealedAddend = formatAddendTerm(canonicalAnswer);
  return {
    kind: "unary_opposite",
    knownText,
    visibleFormula: `${knownText} + □ = 0`,
    revealedRelation: `${knownText} + ${revealedAddend} = 0`,
    ariaLabel: `${speakRational(operands.value)}加上一个数等于零。`,
  };
}

/**
 * Abs stays the vertical-bar identity form.
 * @returns {{
 *   kind: "unary_abs",
 *   knownText: string,
 *   visibleFormula: string,
 *   ariaLabel: string,
 * } | null}
 */
export function absDisplayModel(operands) {
  if (!isUnaryAbs(operands)) return null;
  const normalized = asRational(operands.value);
  const inner = formatRational(normalized);
  return {
    kind: "unary_abs",
    knownText: inner,
    visibleFormula: `|${inner}| = ?`,
    ariaLabel: `${speakRational(normalized)}的绝对值等于多少。`,
  };
}

/** Train / feedback display prompt for a generated exercise (never mutates identity). */
export function displayPromptFor(exercise) {
  if (isUnaryOpposite(exercise)) {
    return oppositeDisplayModel(exercise.operands, exercise.canonical_answer).visibleFormula;
  }
  if (isUnaryAbs(exercise)) {
    return absDisplayModel(exercise.operands).visibleFormula;
  }
  return exercise?.prompt ?? "";
}

/** Correct / wrong reveal relation for a generated exercise. */
export function displayRelationFor(exercise) {
  if (isUnaryOpposite(exercise)) {
    return oppositeDisplayModel(exercise.operands, exercise.canonical_answer).revealedRelation;
  }
  if (isUnaryAbs(exercise)) {
    return String(exercise.prompt ?? "").replace(/\?\s*$/, exercise.canonical_answer);
  }
  return String(exercise?.prompt ?? "").replace(/\?\s*$/, exercise?.canonical_answer ?? "");
}

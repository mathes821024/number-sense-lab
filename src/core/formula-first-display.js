/**
 * Display-layer formulas for Grade 7 unary opposite / abs.
 * Derived only from skill_id + operands (+ canonical for reveal). Never parses or
 * writes back prompt; never enters checksum / exercise_id payloads.
 * Contract: docs/curriculum/11_grade7_rational_skills_contract.md §§10–12.
 */
import { formatRational, parseRational, rational } from "./rational.js";

/** Only this skill may use formula-first stems / SR (contract §10). */
export const FORMULA_FIRST_SKILL_ID = "g7-rational-sign-opposite-absolute";

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

/** Operands-only predicate (pure format helpers). */
export function isUnaryOpposite(itemOrOperands) {
  const operands = itemOrOperands?.operands ?? itemOrOperands;
  return Boolean(operands && operands.kind === "unary" && operands.operator === "opposite");
}

/** Operands-only predicate (pure format helpers). */
export function isUnaryAbs(itemOrOperands) {
  const operands = itemOrOperands?.operands ?? itemOrOperands;
  return Boolean(operands && operands.kind === "unary" && operands.operator === "abs");
}

/**
 * Runtime gate: formula-first only for the frozen skill + unary opposite/abs.
 * Train, feedback, displayPromptFor / displayRelationFor must use this.
 */
export function isFormulaFirstExercise(exercise) {
  if (!exercise || exercise.skill_id !== FORMULA_FIRST_SKILL_ID) return false;
  return isUnaryOpposite(exercise) || isUnaryAbs(exercise);
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

function speakCanonicalAnswer(canonicalAnswer) {
  return speakRational(parseRational(String(canonicalAnswer ?? "")));
}

/**
 * @returns {{
 *   kind: "unary_opposite",
 *   knownText: string,
 *   visibleFormula: string,
 *   revealedRelation: string,
 *   ariaLabel: string,
 *   revealedAriaLabel: string,
 * } | null}
 */
export function oppositeDisplayModel(operands, canonicalAnswer) {
  if (!isUnaryOpposite(operands)) return null;
  const knownText = formatOperandTerm(operands.value);
  const revealedAddend = formatAddendTerm(canonicalAnswer);
  const revealedAriaLabel = canonicalAnswer == null || canonicalAnswer === ""
    ? ""
    : `${speakRational(operands.value)}加上${speakCanonicalAnswer(canonicalAnswer)}等于零。`;
  return {
    kind: "unary_opposite",
    knownText,
    visibleFormula: `${knownText} + □ = 0`,
    revealedRelation: `${knownText} + ${revealedAddend} = 0`,
    ariaLabel: `${speakRational(operands.value)}加上一个数等于零。`,
    revealedAriaLabel,
  };
}

/**
 * Abs stays the vertical-bar identity form. Relation is built from operands.value
 * and canonical_answer only — never by parsing prompt.
 * @returns {{
 *   kind: "unary_abs",
 *   knownText: string,
 *   visibleFormula: string,
 *   revealedRelation: string,
 *   ariaLabel: string,
 *   revealedAriaLabel: string,
 * } | null}
 */
export function absDisplayModel(operands, canonicalAnswer) {
  if (!isUnaryAbs(operands)) return null;
  const normalized = asRational(operands.value);
  const inner = formatRational(normalized);
  const answerText = canonicalAnswer == null || canonicalAnswer === ""
    ? ""
    : String(canonicalAnswer);
  const revealedRelation = answerText ? `|${inner}| = ${answerText}` : `|${inner}| = ?`;
  const revealedAriaLabel = answerText
    ? `${speakRational(normalized)}的绝对值等于${speakCanonicalAnswer(answerText)}。`
    : "";
  return {
    kind: "unary_abs",
    knownText: inner,
    visibleFormula: `|${inner}| = ?`,
    revealedRelation,
    ariaLabel: `${speakRational(normalized)}的绝对值等于多少。`,
    revealedAriaLabel,
  };
}

/**
 * Single runtime entry for formula-first display models.
 * Requires skill_id === FORMULA_FIRST_SKILL_ID.
 */
export function formulaFirstDisplayFor(exercise) {
  if (!isFormulaFirstExercise(exercise)) return null;
  if (isUnaryOpposite(exercise)) {
    return oppositeDisplayModel(exercise.operands, exercise.canonical_answer);
  }
  if (isUnaryAbs(exercise)) {
    return absDisplayModel(exercise.operands, exercise.canonical_answer);
  }
  return null;
}

/** Train / demoted stem aria-label from operands (null if not formula-first). */
export function displayAriaLabelFor(exercise) {
  return formulaFirstDisplayFor(exercise)?.ariaLabel ?? null;
}

/** Correct / wrong reveal relation aria-label from operands + canonical. */
export function displayRelationAriaLabelFor(exercise) {
  return formulaFirstDisplayFor(exercise)?.revealedAriaLabel || null;
}

/** Train / feedback display prompt for a generated exercise (never mutates identity). */
export function displayPromptFor(exercise) {
  const model = formulaFirstDisplayFor(exercise);
  if (model) return model.visibleFormula;
  return exercise?.prompt ?? "";
}

/** Correct / wrong reveal relation for a generated exercise. */
export function displayRelationFor(exercise) {
  const model = formulaFirstDisplayFor(exercise);
  if (model) return model.revealedRelation;
  return String(exercise?.prompt ?? "").replace(/\?\s*$/, exercise?.canonical_answer ?? "");
}

/**
 * Bindings the train page and feedback screens pass into MathText.
 * Verifies data flow without relying on JSX source string matching alone.
 * @returns {{
 *   kind: "unary_opposite" | "unary_abs",
 *   stemText: string,
 *   stemAriaLabel: string,
 *   relationText: string,
 *   relationAriaLabel: string,
 * } | null}
 */
export function formulaFirstUiBindings(exercise) {
  const model = formulaFirstDisplayFor(exercise);
  if (!model) return null;
  return {
    kind: model.kind,
    stemText: model.visibleFormula,
    stemAriaLabel: model.ariaLabel,
    relationText: model.revealedRelation,
    relationAriaLabel: model.revealedAriaLabel,
  };
}

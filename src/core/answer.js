/**
 * Mathematical answer judging via unified normalization.
 * Display always uses canonical_answer from content.
 *
 * Judged kinds:
 *   empty | invalid          → not an attempt (no record)
 *   needs_simplification     → not an attempt (fraction value right, not lowest terms)
 *   correct | wrong          → recorded attempt (outcome correct | incorrect)
 */

/**
 * Normalize a student answer for equivalence checks.
 * Integers: "0289" → "289", ignore trailing ".0"
 * Decimals: "0.50" / ".5" / "0.5" → same canonical decimal string
 * @param {string} raw
 * @param {'integer'|'decimal'} answerType
 * @returns {string|null} normalized form, or null if empty/invalid for judging
 */
export function normalizeAnswer(raw, answerType) {
  let text = String(raw ?? "").trim();
  if (!text) return null;

  if (answerType === "integer") {
    if (!/^\d+(\.0+)?$/.test(text)) return null;
    text = text.replace(/\.0+$/, "");
    // Strip leading zeros but keep a single zero
    text = text.replace(/^0+(?=\d)/, "");
    if (!/^\d+$/.test(text)) return null;
    return text;
  }

  // decimal
  if (text === "." || text === "-") return null;
  if (!/^\d*\.?\d+$/.test(text)) return null;
  if ((text.match(/\./g) || []).length > 1) return null;

  // Leading dot → 0.
  if (text.startsWith(".")) text = `0${text}`;
  // Trailing dot alone already rejected; "1." → "1"
  if (text.endsWith(".")) text = text.slice(0, -1);

  const [wholeRaw, fracRaw = ""] = text.split(".");
  const whole = wholeRaw.replace(/^0+(?=\d)/, "") || "0";
  // Trim trailing zeros in fractional part
  const frac = fracRaw.replace(/0+$/, "");
  if (!frac) return whole;
  return `${whole}.${frac}`;
}

function gcd(a, b) {
  let x = a;
  let y = b;
  while (y) [x, y] = [y, x % y];
  return x;
}

/**
 * Parse "numerator/denominator". Both parts must be positive integers,
 * exactly one "/", denominator ≠ 0.
 * @returns {{ numerator: number, denominator: number, text: string }|null}
 */
export function parseFraction(raw) {
  const text = String(raw ?? "").trim();
  if ((text.match(/\//g) || []).length !== 1) return null;
  const match = /^(\d+)\/(\d+)$/.exec(text);
  if (!match) return null;
  const numerator = Number(match[1]);
  const denominator = Number(match[2]);
  if (!Number.isSafeInteger(numerator) || !Number.isSafeInteger(denominator)) return null;
  if (numerator <= 0 || denominator <= 0) return null;
  return { numerator, denominator, text: `${numerator}/${denominator}` };
}

/**
 * fraction_fields: the numerator box and the denominator box become ONE
 * judging string 「numerator/denominator」, read by integer value (01 → 1).
 * Either box empty, not a positive integer, or a zero denominator → "" —
 * no judging string, so no attempt (docs/curriculum/09 §5).
 * @param {string} numerator
 * @param {string} denominator
 * @returns {string}
 */
export function composeFractionFields(numerator, denominator) {
  const n = String(numerator ?? "").trim();
  const d = String(denominator ?? "").trim();
  if (!/^\d+$/.test(n) || !/^\d+$/.test(d)) return "";
  const parsed = parseFraction(`${n}/${d}`);
  return parsed ? parsed.text : "";
}

/** "0.(142857)" → "142857"; null when not a repeating canonical form. */
export function repeatingBlockOf(canonical) {
  const match = /^0\.\((\d+)\)$/.exec(String(canonical ?? "").trim());
  return match ? match[1] : null;
}

function judgeFraction(item, text) {
  if (!text) return { kind: "empty", normalized: null };
  const given = parseFraction(text);
  if (!given) return { kind: "invalid", normalized: null };
  const expected = parseFraction(item.canonical_answer);
  if (!expected) return { kind: "invalid", normalized: given.text };
  const sameValue =
    given.numerator * expected.denominator === expected.numerator * given.denominator;
  if (!sameValue) return { kind: "wrong", normalized: given.text };
  if (gcd(given.numerator, given.denominator) === 1) {
    return { kind: "correct", normalized: given.text };
  }
  return {
    kind: "needs_simplification",
    normalized: given.text,
    simplest: expected.text,
  };
}

function judgeRepeating(item, text) {
  const expected = repeatingBlockOf(item.canonical_answer);
  // The student types only the repeating block. A full "0.(3)" is also read.
  const block = repeatingBlockOf(text) ?? text;
  if (!block) return { kind: "empty", normalized: null };
  if (!/^\d+$/.test(block)) return { kind: "invalid", normalized: null };
  if (expected === null) return { kind: "invalid", normalized: null };
  const normalized = `0.(${block})`;
  return block === expected
    ? { kind: "correct", normalized }
    : { kind: "wrong", normalized };
}

/** Frozen outcome names for recorded / unrecorded submissions. */
export function outcomeOf(kind) {
  if (kind === "correct") return "correct";
  if (kind === "wrong") return "incorrect";
  if (kind === "needs_simplification") return "needs_simplification";
  return null;
}

/**
 * @param {{ answer_type?: string, canonical_answer: string, integerOnly?: boolean, needsDecimalPoint?: boolean }} item
 * @param {string} raw
 * @returns {{ kind: 'empty'|'invalid'|'correct'|'wrong'|'needs_simplification', normalized: string|null, simplest?: string, outcome: string|null }}
 */
export function judgeAnswer(item, raw) {
  const result = judgeRaw(item, raw);
  return { ...result, outcome: outcomeOf(result.kind) };
}

function judgeRaw(item, raw) {
  const text = String(raw ?? "").trim();
  if (item.answer_type === "fraction_fields") return judgeFraction(item, text);
  if (item.answer_type === "decimal_repeating") return judgeRepeating(item, text);

  const answerType =
    item.answer_type === "decimal" || item.needsDecimalPoint
      ? "decimal"
      : "integer";

  if (!text || text === ".") {
    return { kind: "empty", normalized: null };
  }

  const normalized = normalizeAnswer(text, answerType);
  if (normalized === null) {
    return { kind: "invalid", normalized: null };
  }

  const expected = normalizeAnswer(item.canonical_answer, answerType);
  if (expected === null) {
    return { kind: "invalid", normalized };
  }

  if (normalized === expected) {
    return { kind: "correct", normalized };
  }
  return { kind: "wrong", normalized };
}

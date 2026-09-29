/**
 * Mathematical answer judging via unified normalization.
 * Display always uses canonical_answer from content.
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

/**
 * @param {{ answer_type?: string, canonical_answer: string, integerOnly?: boolean }} item
 * @param {string} raw
 * @returns {{ kind: 'empty'|'invalid'|'correct'|'wrong', normalized: string|null }}
 */
export function judgeAnswer(item, raw) {
  const answerType =
    item.answer_type === "decimal" || item.needsDecimalPoint
      ? "decimal"
      : "integer";

  const text = String(raw ?? "").trim();
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

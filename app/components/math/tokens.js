/**
 * Pure split of student-facing math text into render tokens — the same
 * reading as main's h5/math-text.js formatMath(), without any markup. The
 * MathText component draws the fraction bar and the repeating dots from
 * these. Stored text stays `1/2` and `0.(6)` (docs/architecture/02 共用界面规则).
 *
 *   { type: "text", text }
 *   { type: "fraction", numerator, denominator, label }   3/4
 *   { type: "repeating", intPart, digits, label }         0.(142857)
 *       digits: [{ ch, dot }] — a dot over the first and the last digit of
 *       the block (one digit: a dot over it). No brackets are shown.
 */

// Same pattern as h5/math-text.js MATH_TOKEN: 0.(6), 0.(142857), a single
// letter block such as 0.(n) in a pattern line, and n/d with 1–3 digits.
const MATH_TOKEN = /(\d+)\.\((\d+|[a-z])\)|(\d{1,3})\/(\d{1,3})/g;

/** Screen-reader text, e.g. "0.6，6 循环" (h5/math-text.js repeatingLabel). */
export function repeatingLabel(intPart, block) {
  return `${intPart}.${block}，${block} 循环`;
}

/** Digits of a repeating block, dotted on the first and the last. */
export function dottedDigits(block) {
  const chars = [...String(block ?? "")];
  return chars.map((ch, i) => ({ ch, dot: i === 0 || i === chars.length - 1 }));
}

export function repeatingToken(intPart, block) {
  return { type: "repeating", intPart, digits: dottedDigits(block), label: repeatingLabel(intPart, block) };
}

export function mathTokens(value) {
  const text = String(value ?? "");
  const tokens = [];
  let last = 0;
  for (const match of text.matchAll(MATH_TOKEN)) {
    if (match.index > last) tokens.push({ type: "text", text: text.slice(last, match.index) });
    if (match[1] !== undefined) {
      tokens.push(repeatingToken(match[1], match[2]));
    } else {
      tokens.push({ type: "fraction", numerator: match[3], denominator: match[4], label: `${match[3]}/${match[4]}` });
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) tokens.push({ type: "text", text: text.slice(last) });
  return tokens;
}

/** Plain reading of the same text, for accessible names. */
export function mathLabel(value) {
  return mathTokens(value)
    .map((t) => (t.type === "text" ? t.text : t.label))
    .join("");
}

/**
 * What the answer box shows (h5/app.js answerHtml): the typed digits; a
 * textbook fraction once 「n/d」 is complete; for a repeating decimal the
 * fixed 「0.」 and the dotted block the student types (or an empty slot).
 *   { kind: "plain", text } | { kind: "fraction", numerator, denominator }
 *   | { kind: "repeating", intPart, token | null }
 */
export function answerDisplay(item, answer) {
  if (item?.repeatingBlock) {
    const intPart = (/^(\d+)\.\(/.exec(item.canonical_answer || "") || [])[1] || "0";
    return { kind: "repeating", intPart, token: answer ? repeatingToken(intPart, answer) : null };
  }
  if (item?.needsSlash) {
    const match = /^(\d+)\/(\d+)$/.exec(answer);
    if (match) return { kind: "fraction", numerator: match[1], denominator: match[2] };
  }
  return { kind: "plain", text: answer };
}

/**
 * Pure split of student-facing math text into render tokens. No markup here:
 * the MathText component draws fraction bars and repeating dots from these.
 * Stored text stays as `1/2` and `0.(6)` (docs/architecture/02 共用界面规则).
 *
 *   { type: "text", text }
 *   { type: "fraction", numerator, denominator, label }       e.g. 3/4
 *   { type: "repeating", lead, block, label }                 e.g. 0.(6) → lead "0.", block "6"
 */
const PATTERN = /(\d+\.\d*)\((\d+)\)|(\d{1,3})\/(\d{1,3})/g;

export function mathTokens(value) {
  const text = String(value ?? "");
  const tokens = [];
  let last = 0;
  for (const match of text.matchAll(PATTERN)) {
    if (match.index > last) tokens.push({ type: "text", text: text.slice(last, match.index) });
    if (match[1] !== undefined) {
      tokens.push({
        type: "repeating",
        lead: match[1],
        block: match[2],
        label: `${match[1]}${match[2]}，${match[2]} 循环`,
      });
    } else {
      tokens.push({
        type: "fraction",
        numerator: match[3],
        denominator: match[4],
        label: `${match[3]}/${match[4]}`,
      });
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

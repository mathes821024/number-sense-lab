/**
 * Student-facing math text — ONE shared renderer for every screen
 * (question, answer box, correct relation, wrong feedback, hook, pattern,
 * frames, mistake book, progress, print).
 *
 * - Fractions render with a horizontal bar. Stored prompts stay as 1/2.
 * - Repeating decimals are stored canonically as 0.(6) / 0.(142857). Students
 *   see textbook dots instead: one digit → a dot above it; several digits →
 *   dots above the first and the last digit of the block. No parentheses are
 *   shown. The canonical string, content files and judging do not change.
 */

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Screen-reader text, e.g. "0.6，6 循环" / "0.142857，142857 循环". */
export function repeatingLabel(intPart, block) {
  return `${intPart}.${block}，${block} 循环`;
}

/** Digits of a repeating block with dots over the first and the last digit. */
export function dottedBlockHtml(block) {
  const chars = [...String(block ?? "")];
  return chars
    .map((ch, i) =>
      i === 0 || i === chars.length - 1
        ? `<span class="rd">${escapeHtml(ch)}</span>`
        : escapeHtml(ch),
    )
    .join("");
}

/**
 * Textbook repeating decimal. The dots are not the only carrier of meaning:
 * the element has an accessible label that says which block repeats.
 * @param {string} intPart e.g. "0"
 * @param {string} block   e.g. "6" or "142857"
 */
export function repeatingHtml(intPart, block) {
  const label = repeatingLabel(intPart, block);
  return `<span class="rep" role="math" aria-label="${escapeHtml(label)}"><span aria-hidden="true">${escapeHtml(
    intPart,
  )}.${dottedBlockHtml(block)}</span></span>`;
}

// 0.(6), 0.(142857); a single letter block such as 0.(n) in a pattern line.
const MATH_TOKEN = /(\d+)\.\((\d+|[a-z])\)|(\d{1,3})\/(\d{1,3})/g;

export function formatMath(value) {
  const safe = escapeHtml(value);
  return safe.replace(MATH_TOKEN, (_, intPart, block, numerator, denominator) => {
    if (intPart !== undefined) return repeatingHtml(intPart, block);
    return `<span class="frac" aria-label="${numerator}/${denominator}"><span class="num">${numerator}</span><span class="den">${denominator}</span></span>`;
  });
}

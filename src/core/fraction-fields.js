/**
 * fraction_fields input — ONE shared model for the numerator box and the
 * denominator box (docs/curriculum/09_fraction_fields_contract.md §4–§5).
 * Every shell (h5/, the app/ pages on H5 and in the Mini Program) only hands
 * keys to it; none keeps its own fraction-box rules.
 *
 * - Focus starts on the numerator; tapping a box focuses it.
 * - Digits go only into the focused box. No 「.」, 「-」 or 「/」.
 * - A box shows a normalized integer: leading zeros go as soon as another
 *   digit follows (「02」 → 「2」, 「004」 → 「4」); a lone 「0」 may stay while
 *   editing. Nothing is ever reduced: 2 over 4 stays 2 over 4.
 * - Backspace deletes only in the focused box; an empty box stays focused.
 * - Submit reads both boxes as ONE judging string 「numerator/denominator」
 *   (integer value: 01 → 1). An empty box, a non-positive integer or a zero
 *   denominator gives "" — not an attempt.
 *
 * Pure: no platform API, no DOM.
 */
import { composeFractionFields } from "./answer.js";

export const NUMERATOR = "numerator";
export const DENOMINATOR = "denominator";
/** Stored prompt mark for the empty fraction: 「0.125 = ?/?」. Never shown as text. */
export const BLANK_FRACTION = "?/?";
/**
 * TECHNICAL SAFETY GUARD ONLY — not a product, curriculum or UX rule, and
 * never shown to students. fraction_fields is built for common middle-school
 * fractions: real numerators/denominators are short integers (1–3 digits; the
 * catalog test pins this). The guard only keeps judging exact: every 15-digit
 * integer is below Number.MAX_SAFE_INTEGER, and Core parseFraction rejects
 * non-safe integers, so a 16th digit is simply ignored (the key is a no-op).
 * If future content ever needs larger integers, move judging to string/BigInt
 * parsing — do not turn this number into a curriculum or UX limit.
 */
export const FIELD_DIGITS = 15;

/** Display / storage form of one box: strip leading zeros once another digit follows. */
export function normalizeField(value) {
  return String(value ?? "").replace(/^0+(?=\d)/, "");
}

/** @typedef {{ numerator: string, denominator: string, focus: 'numerator'|'denominator' }} FractionFields */

/** @returns {FractionFields} */
export function emptyFields() {
  return { numerator: "", denominator: "", focus: NUMERATOR };
}

/**
 * Box sizing is tuned for the short integers real content uses: 1–4 digits
 * keep the normal answer size (""). Anything longer — only reachable by
 * unusual input — takes ONE moderate step down ("long"; both shells wrap it
 * inside the box instead of clipping). There is no further shrinking.
 */
export function fieldSize(value) {
  return String(value ?? "").length > 4 ? "long" : "";
}

/** Tap a box. Returns the new fields, or null when nothing changes. */
export function focusField(fields, which) {
  if (which !== NUMERATOR && which !== DENOMINATOR) return null;
  if (fields.focus === which) return null;
  return { ...fields, focus: which };
}

/**
 * One key into the focused box. Every digit tap is accepted (input layer);
 * the box keeps the normalized integer (display layer): 0 then 2 → 「2」.
 * Returns the new fields, or null when the key is ignored.
 */
export function typeDigit(fields, key) {
  if (!/^\d$/.test(String(key))) return null;
  const current = fields[fields.focus];
  const next = normalizeField(current + key);
  if (next.length > FIELD_DIGITS) return null;
  return { ...fields, [fields.focus]: next };
}

/** Backspace in the focused box only. null when that box is already empty (focus stays). */
export function eraseDigit(fields) {
  const current = fields[fields.focus];
  if (!current) return null;
  return { ...fields, [fields.focus]: current.slice(0, -1) };
}

/** The judging string for Core, or "" when this is not an attempt. */
export function fieldsAnswer(fields) {
  return composeFractionFields(fields.numerator, fields.denominator);
}

/** Whether a stored prompt carries the empty fraction mark. */
export function hasBlankFraction(prompt) {
  return String(prompt ?? "").includes(BLANK_FRACTION);
}

/** Training screen stem: 「0.125 = ?/?」 → 「0.125 =」 (the boxes follow it). */
export function promptStem(prompt) {
  return String(prompt ?? "").replace(BLANK_FRACTION, "").trimEnd();
}

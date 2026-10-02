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
 * Technical guard, not a curriculum cap: at most 15 significant digits a box.
 * Every 15-digit integer is exactly representable as a JS Number (below
 * Number.MAX_SAFE_INTEGER, 16 digits), so judging "by integer value" stays
 * exact; and 15 digits still fit the box on a 375px-wide phone.
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
 * Type size step for a box with many digits, so a long entry still fits the
 * box on a phone (both shells use the same steps): "" | "long" | "xlong".
 */
export function fieldSize(value) {
  const n = String(value ?? "").length;
  if (n > 9) return "xlong";
  if (n > 5) return "long";
  return "";
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

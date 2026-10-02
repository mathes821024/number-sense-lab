/**
 * fraction_fields input — ONE shared model for the numerator box and the
 * denominator box (docs/curriculum/09_fraction_fields_contract.md §4–§5).
 * Every shell (h5/, the app/ pages on H5 and in the Mini Program) only hands
 * keys to it; none keeps its own fraction-box rules.
 *
 * - Focus starts on the numerator; tapping a box focuses it.
 * - Digits go only into the focused box. No 「.」, 「-」 or 「/」.
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
/** Digits per box. Two boxes keep the old 8-digit answer cap. */
export const FIELD_DIGITS = 4;

/** @typedef {{ numerator: string, denominator: string, focus: 'numerator'|'denominator' }} FractionFields */

/** @returns {FractionFields} */
export function emptyFields() {
  return { numerator: "", denominator: "", focus: NUMERATOR };
}

/** Tap a box. Returns the new fields, or null when nothing changes. */
export function focusField(fields, which) {
  if (which !== NUMERATOR && which !== DENOMINATOR) return null;
  if (fields.focus === which) return null;
  return { ...fields, focus: which };
}

/** One key into the focused box. Returns the new fields, or null when the key is ignored. */
export function typeDigit(fields, key) {
  if (!/^\d$/.test(String(key))) return null;
  const current = fields[fields.focus];
  if (current.length >= FIELD_DIGITS) return null;
  return { ...fields, [fields.focus]: current + key };
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

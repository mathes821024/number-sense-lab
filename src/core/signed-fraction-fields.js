import {
  DENOMINATOR,
  NUMERATOR,
  eraseDigit,
  focusField,
  normalizeField,
  typeDigit,
} from "./fraction-fields.js";
import { composeSignedFractionFields } from "./answer.js";

export function emptySignedFields() {
  return { sign: "", numerator: "", denominator: "", focus: NUMERATOR };
}

export function focusSignedField(fields, which) {
  return focusField(fields, which);
}

export function typeSignedDigit(fields, key) {
  return typeDigit(fields, key);
}

export function eraseSignedDigit(fields) {
  return eraseDigit(fields);
}

export function toggleSignedSign(fields) {
  const nextSign = fields.sign === "" ? "-" : fields.sign === "-" ? "+" : "";
  return { ...fields, sign: nextSign };
}

export function signedFieldsAnswer(fields) {
  return composeSignedFractionFields(
    fields.sign === "-",
    normalizeField(fields.numerator),
    normalizeField(fields.denominator),
  );
}

export { DENOMINATOR, NUMERATOR };

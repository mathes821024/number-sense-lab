function assertSafeInteger(value, label) {
  if (!Number.isSafeInteger(value)) throw new Error(`${label} must be a safe integer`);
}

function gcd(left, right) {
  let a = Math.abs(left);
  let b = Math.abs(right);
  while (b !== 0) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }
  return a || 1;
}

function safeMultiply(left, right) {
  const value = left * right;
  assertSafeInteger(value, "rational intermediate");
  return value;
}

function safeAdd(left, right) {
  const value = left + right;
  assertSafeInteger(value, "rational intermediate");
  return value;
}

export function rational(numerator, denominator = 1) {
  assertSafeInteger(numerator, "numerator");
  assertSafeInteger(denominator, "denominator");
  if (denominator === 0) throw new Error("zero denominator");
  if (numerator === 0) return Object.freeze({ numerator: 0, denominator: 1 });

  const sign = denominator < 0 ? -1 : 1;
  const divisor = gcd(numerator, denominator);
  const normalizedNumerator = (numerator / divisor) * sign;
  const normalizedDenominator = Math.abs(denominator / divisor);
  return Object.freeze({
    numerator: normalizedNumerator,
    denominator: normalizedDenominator
  });
}

function normalize(value) {
  if (!value || typeof value !== "object") throw new Error("invalid rational value");
  return rational(value.numerator, value.denominator);
}

export function parseRational(text) {
  const normalized = typeof text === "string" ? text.trim() : "";
  if (!/^[+-]?\d+(?:\/[+-]?\d+)?$/.test(normalized)) {
    throw new Error("invalid rational text");
  }
  const [numeratorText, denominatorText = "1"] = normalized.split("/");
  const numerator = Number(numeratorText);
  const denominator = Number(denominatorText);
  assertSafeInteger(numerator, "numerator");
  assertSafeInteger(denominator, "denominator");
  return rational(numerator, denominator);
}

export function formatRational(value) {
  const normalized = normalize(value);
  return normalized.denominator === 1
    ? String(normalized.numerator)
    : `${normalized.numerator}/${normalized.denominator}`;
}

export function add(left, right) {
  const a = normalize(left);
  const b = normalize(right);
  const denominatorGcd = gcd(a.denominator, b.denominator);
  const leftScale = b.denominator / denominatorGcd;
  const rightScale = a.denominator / denominatorGcd;
  const numerator = safeAdd(
    safeMultiply(a.numerator, leftScale),
    safeMultiply(b.numerator, rightScale)
  );
  const denominator = safeMultiply(a.denominator, leftScale);
  return rational(numerator, denominator);
}

export function negate(value) {
  const normalized = normalize(value);
  return rational(-normalized.numerator, normalized.denominator);
}

export function subtract(left, right) {
  return add(left, negate(right));
}

export function multiply(left, right) {
  const a = normalize(left);
  const b = normalize(right);
  const leftCancel = gcd(a.numerator, b.denominator);
  const rightCancel = gcd(b.numerator, a.denominator);
  const numerator = safeMultiply(a.numerator / leftCancel, b.numerator / rightCancel);
  const denominator = safeMultiply(a.denominator / rightCancel, b.denominator / leftCancel);
  return rational(numerator, denominator);
}

export function divide(left, right) {
  const divisor = normalize(right);
  if (divisor.numerator === 0) throw new Error("division by zero");
  return multiply(left, rational(divisor.denominator, divisor.numerator));
}

export function power(value, exponent) {
  if (!Number.isInteger(exponent) || exponent < 0 || exponent > 6) {
    throw new Error("exponent must be an integer from 0 to 6");
  }
  const base = normalize(value);
  let result = rational(1);
  for (let index = 0; index < exponent; index += 1) result = multiply(result, base);
  return result;
}

export function compare(left, right) {
  const a = normalize(left);
  const b = normalize(right);
  const denominatorGcd = gcd(a.denominator, b.denominator);
  const leftValue = safeMultiply(a.numerator, b.denominator / denominatorGcd);
  const rightValue = safeMultiply(b.numerator, a.denominator / denominatorGcd);
  return leftValue === rightValue ? 0 : leftValue < rightValue ? -1 : 1;
}

export function abs(value) {
  const normalized = normalize(value);
  return rational(Math.abs(normalized.numerator), normalized.denominator);
}

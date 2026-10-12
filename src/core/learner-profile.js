/**
 * Optional local display name. This is presentation data, never learner
 * identity, and must behave the same in browsers and Mini Program engines.
 */
export function normalizeNickname(value) {
  const printable = String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, "").trim();
  return Array.from(printable).slice(0, 12).join("");
}

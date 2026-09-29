/**
 * Student-facing math text. Fractions render with a horizontal bar.
 * Stored prompts stay as 1/2 so judging and content files do not change.
 */

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function formatMath(value) {
  const safe = escapeHtml(value);
  return safe.replace(
    /(\d{1,3})\/(\d{1,3})/g,
    (_, numerator, denominator) =>
      `<span class="frac" aria-label="${numerator}/${denominator}"><span class="num">${numerator}</span><span class="den">${denominator}</span></span>`,
  );
}

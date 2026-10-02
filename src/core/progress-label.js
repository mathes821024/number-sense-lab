/**
 * The calm position in a short set, as the student reads it:
 * 「第 2 题 · 共 10 题」. No slash (never 「2 / 10」, which reads like a
 * fraction), no percentage, no timer. Owner-authorized wording (2026-10-02);
 * the UI spec still says 「2 / 10」 until docs are aligned. Session and
 * scheduler semantics are not touched: this only formats two numbers.
 */
export function setPositionLabel(position, total) {
  return `第 ${position} 题 · 共 ${total} 题`;
}

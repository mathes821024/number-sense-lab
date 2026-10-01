/** Active theme. Theme-ready, no theme switcher (AGENTS.md Theme rule). */
import mathLab from "./math-lab/index.js";

export const theme = mathLab;

/** Asset for a semantic slot, or "" when the theme does not ship it. */
export function assetFor(slot) {
  return theme.assets[slot] || "";
}

/**
 * Theme layer for the H5 shell (docs/ui/05_visual_system_v03.md, Theme System).
 *
 * v0.3 ships exactly one theme, math-lab, and always loads it. There is no
 * theme picker, no settings page and no runtime switching; the registry only
 * keeps the structure a future theme pack would plug into.
 *
 * Components ask for assets by semantic name (asset("mascot.thinking")),
 * never by a theme's file path. A missing optional asset returns "" so the
 * component falls back to its text and shape.
 */
import { mathLabTheme } from "./themes/math-lab/theme.js";

export const DEFAULT_THEME_ID = "math-lab";

const REGISTRY = Object.freeze({ [mathLabTheme.id]: mathLabTheme });

/** The runtime theme. Always math-lab in v0.3. */
export function activeTheme() {
  return REGISTRY[DEFAULT_THEME_ID];
}

/** Registered theme ids (structure only; not exposed in the UI). */
export function themeIds() {
  return Object.keys(REGISTRY);
}

/** Markup for a semantic asset slot, or "" when the theme does not provide it. */
export function asset(name) {
  const value = activeTheme().assets[name];
  return typeof value === "string" ? value : "";
}

/** Marks the document with the active theme id. */
export function applyTheme(doc) {
  if (doc && doc.documentElement) {
    doc.documentElement.setAttribute("data-theme", activeTheme().id);
  }
  return activeTheme().id;
}

/**
 * Theme pack: math-lab — 澄蓝数学实验室 / Bright Number Lab.
 *
 * Visual expression only (docs/ui/05_visual_system_v03.md, Theme System;
 * docs/ui/07_visual_asset_decomposition.md). Nothing here knows about
 * questions, judging, mastery, scheduling, the mistake book, progress or
 * printing.
 *
 * Artwork (mascots, brand, domain icons, edge decoration) is the locked VA0
 * pack under assets/themes/math-lab/, reached only through its manifest by
 * semantic slot (h5/theme.js). This file names the manifest and the slots; it
 * holds no image paths of its own. Colour values live in theme.css.
 *
 * The only inline art here is what 07 says the interface draws itself: the
 * correct tick and the wrong ring (never baked into pictures).
 */

const MARK_CORRECT = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`;
const MARK_WRONG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="2.6" fill="none"/></svg>`;

export const mathLabTheme = Object.freeze({
  id: "math-lab",
  name: "澄蓝数学实验室",
  englishName: "Bright Number Lab",
  stylesheet: "themes/math-lab/theme.css",
  /** Relative to the assets/ root. Every image slot resolves through it. */
  manifest: "themes/math-lab/manifest.json",
  // Token names only; values are in theme.css (single source).
  colors: Object.freeze({
    "brand.primary": "--color-brand-primary",
    "brand.secondary": "--color-brand-secondary",
    "surface.page": "--surface-page",
    "surface.card": "--surface-card",
    "text.primary": "--text-primary",
    "text.secondary": "--text-secondary",
    "feedback.correct": "--feedback-correct",
    "feedback.wrong": "--feedback-wrong",
    "feedback.hint": "--feedback-hint",
  }),
  typography: Object.freeze({ ui: "--font-ui", math: "--font-math" }),
  radius: Object.freeze({ card: "--radius-card", button: "--radius-button" }),
  shadows: Object.freeze({ card: "--shadow-card", floating: "--shadow-floating" }),
  // Semantic slots (07 §已锁定的槽位). Values are manifest keys, not files.
  background: Object.freeze({
    cloud1: "decor.cloud1",
    cloud2: "decor.cloud2",
    hill: "decor.hill",
    leaf1: "decor.leaf1",
    leaf2: "decor.leaf2",
    sprout: "decor.sprout",
    sparkle: "decor.sparkle",
    question: "decor.question",
  }),
  mascot: Object.freeze({
    welcome: "mascot.welcome",
    correct: "mascot.correct",
    thinking: "mascot.thinking",
  }),
  brand: Object.freeze({ appIcon: "brand.appIcon", avatar: "brand.avatar", logo: "logo.mark" }),
  icons: Object.freeze({
    squares: "domain.squares",
    products: "domain.products",
    fraction_decimal: "domain.fractions",
  }),
  motion: Object.freeze({
    correct: "--motion-correct",
    wrong: "--motion-wrong",
    transition: "--motion-transition",
  }),
  // Sound cues stay in h5/sound.js; the theme does not change them.
  sounds: Object.freeze({}),
  /** Interface-drawn marks (not pictures). */
  marks: Object.freeze({
    "mark.correct": MARK_CORRECT,
    "mark.wrong": MARK_WRONG,
  }),
});

export default mathLabTheme;

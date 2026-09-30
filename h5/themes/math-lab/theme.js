/**
 * Theme pack: math-lab — 澄蓝数学实验室 / Bright Number Lab.
 *
 * Visual expression only (docs/ui/05_visual_system_v03.md, Theme System).
 * Nothing here knows about questions, judging, mastery, scheduling, the
 * mistake book, progress or printing. Colour values live in theme.css; this
 * object names them and provides the asset slots.
 *
 * All artwork is original, hand-written SVG (a simplified child-with-pencil
 * mascot, an N mark and shape icons). No bitmap from the visual board is
 * embedded or sliced.
 */

const INK = "#1C2430";
const SKIN = "#FFDCC4";
const HAIR = "#5B3B27";
const SHIRT = "#14956A";
const SUN = "#F5C451";
const CHEEK = "#F4A261";

/** Shared body, head and hair; `face` and `extra` vary by pose. */
function mascotSvg(pose, face, pencil, extra = "") {
  return `<svg class="mascot-art" data-pose="${pose}" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <ellipse cx="60" cy="114" rx="34" ry="4" fill="${INK}" opacity="0.08"/>
  <path d="M28 114c0-21 14-33 32-33s32 12 32 33z" fill="${SHIRT}"/>
  <path d="M51 92v14M51 92l18 14M69 92v14" stroke="#FFFDF8" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <circle cx="60" cy="52" r="29" fill="${SKIN}"/>
  <path d="M31 52c-2-20 11-31 29-31 17 0 30 10 29 29-5-6-12-10-21-11 1 3 0 6-2 8-7-6-17-7-26-4-4 2-7 5-9 9z" fill="${HAIR}"/>
  <circle cx="41" cy="63" r="4.5" fill="${CHEEK}" opacity="0.35"/>
  <circle cx="79" cy="63" r="4.5" fill="${CHEEK}" opacity="0.35"/>
  ${face}
  ${pencil}
  ${extra}
</svg>`;
}

const PENCIL = (angle) => `<g transform="rotate(${angle} 96 86)">
    <rect x="91" y="56" width="10" height="30" rx="1.5" fill="${SUN}"/>
    <rect x="91" y="84" width="10" height="7" rx="2" fill="#F28B82"/>
    <path d="M91 56h10l-5-10z" fill="#FFE6C2"/>
    <path d="M94.4 49.2h3.2L96 46z" fill="${INK}"/>
  </g>
  <circle cx="92" cy="90" r="6.5" fill="${SKIN}"/>`;

const MASCOT_DEFAULT = mascotSvg(
  "default",
  `<circle cx="49" cy="55" r="3.4" fill="${INK}"/>
  <circle cx="71" cy="55" r="3.4" fill="${INK}"/>
  <path d="M52 65q8 7 16 0" stroke="${INK}" stroke-width="2.8" stroke-linecap="round" fill="none"/>`,
  PENCIL(18),
);

const MASCOT_CORRECT = mascotSvg(
  "correct",
  `<path d="M44 56q5-6 10 0M66 56q5-6 10 0" stroke="${INK}" stroke-width="2.8" stroke-linecap="round" fill="none"/>
  <path d="M51 63q9 11 18 0z" fill="${INK}"/>`,
  PENCIL(-8),
  `<path d="M100 18l2.6 5.4 5.9.9-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z" fill="${SUN}"/>`,
);

const MASCOT_THINKING = mascotSvg(
  "thinking",
  `<circle cx="47" cy="52" r="3.4" fill="${INK}"/>
  <circle cx="69" cy="52" r="3.4" fill="${INK}"/>
  <path d="M55 67h10" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/>`,
  PENCIL(32),
  `<circle cx="104" cy="26" r="12" fill="#E4ECFD"/>
  <path d="M100 22.5q0-4.5 4.5-4.5t4.5 4.2q0 3-3.3 4.3-1.2.6-1.2 2.2" stroke="#5B8DEF" stroke-width="2.6" stroke-linecap="round" fill="none"/>
  <circle cx="104.5" cy="33.2" r="1.6" fill="#5B8DEF"/>`,
);

/** N mark: the app icon and the logo share it (05 §2). */
const LOGO = `<svg class="logo-art" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <rect x="2" y="2" width="60" height="60" rx="18" fill="${SHIRT}"/>
  <path d="M21 44V20l22 24V20" stroke="#FFFDF8" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <circle cx="48" cy="15" r="4" fill="${SUN}"/>
</svg>`;

/** Domain icons use currentColor; the tile colour comes from CSS tokens. */
const DOMAIN_SQUARES = `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <rect x="5" y="5" width="10" height="10" rx="2.5" fill="currentColor"/>
  <rect x="17" y="5" width="10" height="10" rx="2.5" fill="currentColor" opacity="0.55"/>
  <rect x="5" y="17" width="10" height="10" rx="2.5" fill="currentColor" opacity="0.55"/>
  <rect x="17" y="17" width="10" height="10" rx="2.5" fill="currentColor"/>
</svg>`;

const DOMAIN_PRODUCTS = `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <circle cx="16" cy="16" r="12" fill="currentColor" opacity="0.18"/>
  <path d="M11 11l10 10M21 11L11 21" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/>
</svg>`;

const DOMAIN_FRACTIONS = `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <rect x="11" y="4" width="10" height="9" rx="2.5" fill="currentColor"/>
  <rect x="6" y="15" width="20" height="2.8" rx="1.4" fill="currentColor"/>
  <rect x="11" y="20" width="10" height="9" rx="2.5" fill="currentColor" opacity="0.55"/>
</svg>`;

/** Soft edge decoration for Home only (05 §2: low opacity, behind content). */
const BACKGROUND_HOME = `<svg class="deco deco-cloud" viewBox="0 0 160 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <path d="M38 78h86a26 26 0 0 0 0-52 34 34 0 0 0-64-4 28 28 0 0 0-22 56z" fill="#FFFDF8"/>
  <circle cx="138" cy="14" r="6" fill="${SUN}" opacity="0.7"/>
</svg>
<svg class="deco deco-leaf" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <path d="M20 112C18 70 42 40 88 30c2 44-22 76-68 82z" fill="#7DCFB6" opacity="0.55"/>
  <path d="M24 108C44 84 60 64 80 40" stroke="#14956A" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.5"/>
  <path d="M6 116c2-26 18-44 44-50-2 26-16 44-44 50z" fill="#14956A" opacity="0.25"/>
</svg>
<svg class="deco deco-dots" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <rect x="6" y="6" width="14" height="14" rx="4" fill="#5B8DEF" opacity="0.18"/>
  <circle cx="44" cy="40" r="8" fill="#F4A261" opacity="0.25"/>
</svg>`;

/** Correct / wrong shape marks (never colour alone: each sits beside a word). */
const MARK_CORRECT = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`;
const MARK_WRONG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="2.6" fill="none"/></svg>`;
const STAR = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path d="M12 2.8l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 16.8l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" fill="currentColor"/></svg>`;

export const mathLabTheme = Object.freeze({
  id: "math-lab",
  name: "澄蓝数学实验室",
  englishName: "Bright Number Lab",
  stylesheet: "themes/math-lab/theme.css",
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
  background: Object.freeze({ home: "background.home" }),
  mascot: Object.freeze({
    default: "mascot.default",
    correct: "mascot.correct",
    thinking: "mascot.thinking",
  }),
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
  assets: Object.freeze({
    logo: LOGO,
    "mascot.default": MASCOT_DEFAULT,
    "mascot.correct": MASCOT_CORRECT,
    "mascot.thinking": MASCOT_THINKING,
    "background.home": BACKGROUND_HOME,
    "domain.squares": DOMAIN_SQUARES,
    "domain.products": DOMAIN_PRODUCTS,
    "domain.fractions": DOMAIN_FRACTIONS,
    "mark.correct": MARK_CORRECT,
    "mark.wrong": MARK_WRONG,
    "mark.star": STAR,
  }),
});

export default mathLabTheme;

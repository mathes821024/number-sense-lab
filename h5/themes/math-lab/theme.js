/**
 * Theme pack: math-lab — 澄蓝数学实验室 / Bright Number Lab.
 *
 * Visual expression only (docs/ui/05_visual_system_v03.md, Theme System).
 * Nothing here knows about questions, judging, mastery, scheduling, the
 * mistake book, progress or printing. Colour values live in theme.css; this
 * object names them and provides the asset slots.
 *
 * The original 3D mascot cutouts are project-local PNG assets. The N mark,
 * domain marks and decoration remain hand-written SVG. Components still
 * request every asset through semantic slots rather than file paths.
 */

const INK = "#1C2430";
const SHIRT = "#14956A";
const SUN = "#F5C451";
const SKY = "#5B8DEF";

const mascotImage = (name) =>
  `<img class="mascot-art" data-character="student-guide" src="./themes/math-lab/assets/${name}" alt="" decoding="async">`;

const MASCOT_DEFAULT = mascotImage("mascot-default.png");
const MASCOT_CORRECT = mascotImage("mascot-correct.png");
const MASCOT_THINKING = mascotImage("mascot-thinking.png");

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

/** Future-domain placeholder marks: shown only as 「敬请期待」 tiles on Home. */
const DOMAIN_CUBES = `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <rect x="12" y="4" width="9" height="9" rx="2" fill="currentColor"/>
  <rect x="6" y="16" width="9" height="9" rx="2" fill="currentColor" opacity="0.6"/>
  <rect x="18" y="16" width="9" height="9" rx="2" fill="currentColor" opacity="0.35"/>
</svg>`;

const DOMAIN_FACTORS = `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <circle cx="9" cy="9" r="3.2" fill="currentColor"/>
  <circle cx="23" cy="9" r="3.2" fill="currentColor" opacity="0.6"/>
  <circle cx="9" cy="23" r="3.2" fill="currentColor" opacity="0.6"/>
  <circle cx="23" cy="23" r="3.2" fill="currentColor" opacity="0.35"/>
</svg>`;

const DOMAIN_KNOWLEDGE_MAP = `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <path d="M10 10l7 5M21 9l-4 6M12 23l5-8" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.5" fill="none"/>
  <circle cx="9" cy="9" r="3.4" fill="currentColor"/>
  <circle cx="23" cy="8" r="3" fill="currentColor" opacity="0.6"/>
  <circle cx="18" cy="17" r="3" fill="currentColor" opacity="0.75"/>
  <circle cx="10" cy="24" r="3" fill="currentColor" opacity="0.45"/>
</svg>`;

/** Soft notebook / orbit decoration for Home only, always behind content. */
const BACKGROUND_HOME = `<svg class="deco deco-cloud" viewBox="0 0 160 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <path d="M38 78h86a26 26 0 0 0 0-52 34 34 0 0 0-64-4 28 28 0 0 0-22 56z" fill="#FFFDF8"/>
  <circle cx="138" cy="14" r="6" fill="${SUN}" opacity="0.7"/>
</svg>
<svg class="deco deco-leaf" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <path d="M20 112C18 70 42 40 88 30c2 44-22 76-68 82z" fill="#7DCFB6" opacity="0.55"/>
  <path d="M24 108C44 84 60 64 80 40" stroke="#14956A" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.5"/>
  <path d="M6 116c2-26 18-44 44-50-2 26-16 44-44 50z" fill="#14956A" opacity="0.25"/>
</svg>
<svg class="deco deco-orbit" viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <circle cx="110" cy="110" r="72" fill="none" stroke="${SHIRT}" stroke-width="1.5" stroke-dasharray="5 8" opacity="0.22"/>
  <circle cx="110" cy="110" r="98" fill="none" stroke="${SKY}" stroke-width="1.2" opacity="0.12"/>
  <circle cx="45" cy="57" r="6" fill="${SUN}" opacity="0.55"/>
  <circle cx="183" cy="132" r="4" fill="${SHIRT}" opacity="0.35"/>
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
    "domain.cubes": DOMAIN_CUBES,
    "domain.factors": DOMAIN_FACTORS,
    "domain.knowledge_map": DOMAIN_KNOWLEDGE_MAP,
    "mark.correct": MARK_CORRECT,
    "mark.wrong": MARK_WRONG,
    "mark.star": STAR,
  }),
});

export default mathLabTheme;

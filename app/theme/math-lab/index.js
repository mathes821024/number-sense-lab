/**
 * math-lab — 澄蓝数学实验室 / Bright Number Lab, the default and only runtime
 * theme (no picker, no switching). Same slot names as main's
 * h5/themes/math-lab/theme.js; every picture resolves through
 * assets/themes/math-lab/manifest.json by semantic slot. This file holds no
 * file names; colour values live in tokens.css.
 */
export const MANIFEST_PATH = "assets/themes/math-lab/manifest.json";

export default Object.freeze({
  id: "math-lab",
  name: "澄蓝数学实验室",
  englishName: "Bright Number Lab",
  mascot: Object.freeze({ welcome: "mascot.welcome", correct: "mascot.correct", thinking: "mascot.thinking" }),
  brand: Object.freeze({ logo: "logo.mark" }),
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
});

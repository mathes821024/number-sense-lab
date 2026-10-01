/**
 * Files that fill the math-lab slots in the H5 build. Every entry names the
 * manifest key it comes from (assets/themes/math-lab/manifest.json); a test
 * checks the import path equals the manifest value. No copies: webpack
 * bundles straight from assets/.
 *
 * H5: display-size WebP (512px) for mascots, as main's h5/theme.js prefers;
 * SVG for the logo and edge decoration (SVG is tier "有" on H5).
 */
import welcome from "../../../assets/themes/math-lab/mascot/mascot-welcome-512.webp";
import correct from "../../../assets/themes/math-lab/mascot/mascot-correct-512.webp";
import thinking from "../../../assets/themes/math-lab/mascot/mascot-thinking-512.webp";
import logo from "../../../assets/brand/logo-mark.svg";
import cloud1 from "../../../assets/themes/math-lab/decor/cloud-01.svg";
import cloud2 from "../../../assets/themes/math-lab/decor/cloud-02.svg";
import hill from "../../../assets/themes/math-lab/decor/hill-01.svg";
import leaf1 from "../../../assets/themes/math-lab/decor/leaf-01.svg";
import leaf2 from "../../../assets/themes/math-lab/decor/leaf-02.svg";
import sprout from "../../../assets/themes/math-lab/decor/sprout.svg";
import sparkle from "../../../assets/themes/math-lab/decor/sparkle.svg";
import question from "../../../assets/themes/math-lab/decor/question.svg";

export const themeAssets = Object.freeze({
  "mascot.welcome": { src: welcome, manifestKey: "mascot.welcomeDisplayWebp" },
  "mascot.correct": { src: correct, manifestKey: "mascot.correctDisplayWebp" },
  "mascot.thinking": { src: thinking, manifestKey: "mascot.thinkingDisplayWebp" },
  "logo.mark": { src: logo, manifestKey: "logo.mark" },
  "decor.cloud1": { src: cloud1, manifestKey: "decor.cloud1" },
  "decor.cloud2": { src: cloud2, manifestKey: "decor.cloud2" },
  "decor.hill": { src: hill, manifestKey: "decor.hill" },
  "decor.leaf1": { src: leaf1, manifestKey: "decor.leaf1" },
  "decor.leaf2": { src: leaf2, manifestKey: "decor.leaf2" },
  "decor.sprout": { src: sprout, manifestKey: "decor.sprout" },
  "decor.sparkle": { src: sparkle, manifestKey: "decor.sparkle" },
  "decor.question": { src: question, manifestKey: "decor.question" },
});

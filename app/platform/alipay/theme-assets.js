/**
 * Files that fill the math-lab slots in the Alipay build. Same PNG mascot
 * imports as WeChat — Alipay, like WeChat, uses PNG for local images.
 */
import welcome from "../../../assets/themes/math-lab/mascot/mascot-welcome-512.png";
import correct from "../../../assets/themes/math-lab/mascot/mascot-correct-512.png";
import thinking from "../../../assets/themes/math-lab/mascot/mascot-thinking-512.png";

export const themeAssets = Object.freeze({
  "mascot.welcome": { src: welcome, manifestKey: "mascot.welcomeDisplay" },
  "mascot.correct": { src: correct, manifestKey: "mascot.correctDisplay" },
  "mascot.thinking": { src: thinking, manifestKey: "mascot.thinkingDisplay" },
});

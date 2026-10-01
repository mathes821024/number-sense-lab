/**
 * math-lab / 澄蓝数学实验室 — the default theme. Pages ask for a semantic
 * slot (docs/ui/07_visual_asset_decomposition.md), never for a file.
 * Mascot files come from the VA0 asset pack (commit 62c7388). WebP is used
 * because the three PNG masters together exceed the Mini Program package
 * budget; PNG stays the documented fallback in that pack.
 */
import mascotWelcome from "./assets/mascot-welcome.webp";
import mascotCorrect from "./assets/mascot-correct.webp";
import mascotThinking from "./assets/mascot-thinking.webp";

export default {
  id: "math-lab",
  name: "澄蓝数学实验室",
  assets: {
    "mascot.welcome": mascotWelcome,
    "mascot.correct": mascotCorrect,
    "mascot.thinking": mascotThinking,
  },
};

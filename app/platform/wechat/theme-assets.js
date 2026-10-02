/**
 * Files that fill the math-lab slots in the WeChat build. Every entry names
 * the manifest key it comes from (assets/themes/math-lab/manifest.json); a
 * test checks the import path equals the manifest value. No copies.
 *
 * WeChat: display-size PNG (512px) for mascots. WeChat documents image webp
 * decoding for network resources only, so local WebP is not relied on; PNG is
 * the pack's fallback (capability matrix: PNG / WebP 「若 WebP 失败，用 PNG」).
 * SVG is 「待核」 for the Mini Program, so the domain tiles use the pack's
 * 192px PNG renditions of the same domain SVG masters (same slots as H5).
 * The pack has no PNG copy of the logo or decoration, so those slots stay
 * empty here: the pages fall back to words and shapes (05 §348), and nothing
 * is invented.
 */
import welcome from "../../../assets/themes/math-lab/mascot/mascot-welcome-512.png";
import correct from "../../../assets/themes/math-lab/mascot/mascot-correct-512.png";
import thinking from "../../../assets/themes/math-lab/mascot/mascot-thinking-512.png";
import domainSquares from "../../../assets/themes/math-lab/domains/domain-squares-192.png";
import domainProducts from "../../../assets/themes/math-lab/domains/domain-products-192.png";
import domainFractions from "../../../assets/themes/math-lab/domains/domain-fractions-192.png";

export const themeAssets = Object.freeze({
  "mascot.welcome": { src: welcome, manifestKey: "mascot.welcomeDisplay" },
  "mascot.correct": { src: correct, manifestKey: "mascot.correctDisplay" },
  "mascot.thinking": { src: thinking, manifestKey: "mascot.thinkingDisplay" },
  "domain.squares": { src: domainSquares, manifestKey: "domain.squaresPng" },
  "domain.products": { src: domainProducts, manifestKey: "domain.productsPng" },
  "domain.fractions": { src: domainFractions, manifestKey: "domain.fractionsPng" },
});

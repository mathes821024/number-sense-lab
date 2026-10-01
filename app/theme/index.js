/**
 * Theme layer for the shared pages. Components ask for a semantic slot
 * ("mascot.correct"), never a file. Which file of the approved pack fills a
 * slot on a client (display-size WebP on H5, display-size PNG in the Mini
 * Program, SVG only where the client is verified for it) is a platform
 * capability, so the bundled file table comes from app/platform/current.
 * A missing slot returns "" and the component falls back to words and shapes.
 */
import mathLab from "./math-lab/index.js";
import { themeAssets } from "../platform/current";

export const theme = mathLab;

export function assetFor(slot) {
  const entry = themeAssets[slot];
  return entry ? entry.src : "";
}

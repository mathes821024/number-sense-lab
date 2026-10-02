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
import { fbSpecialistAssets } from "./fb-specialist-assets.js";

export const theme = mathLab;

/**
 * The practice page's `domain.<domain_id>` icons and its header mascot come only
 * from the F-B manifest (docs/ui/08_fb_specialist_visual.md §1), the same PNG
 * files on H5 and in the Mini Program; every other slot from the math-lab table.
 */
export function assetFor(slot) {
  const entry = fbSpecialistAssets[slot] || themeAssets[slot];
  return entry ? entry.src : "";
}

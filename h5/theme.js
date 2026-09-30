/**
 * Theme layer for the H5 shell (docs/ui/05_visual_system_v03.md Theme System,
 * docs/ui/07_visual_asset_decomposition.md).
 *
 * v0.3 ships exactly one theme, math-lab, and always loads it. There is no
 * theme picker, no settings page and no runtime switching; the registry only
 * keeps the structure a future theme pack would plug into.
 *
 * Images come from the theme's manifest (assets/themes/math-lab/manifest.json)
 * by semantic slot, e.g. asset("mascot.thinking"). Business components never
 * name a file. If the manifest cannot load, or a slot is missing, asset()
 * returns "" and the component falls back to its words and shapes.
 */
import { mathLabTheme } from "./themes/math-lab/theme.js";

export const DEFAULT_THEME_ID = "math-lab";

const REGISTRY = Object.freeze({ [mathLabTheme.id]: mathLabTheme });

/** assets/ root, next to h5/ (same layout locally and on the server). */
export const ASSET_ROOT = new URL("../assets/", import.meta.url).href;

let manifest = null;
let assetBase = ASSET_ROOT;

/** The runtime theme. Always math-lab in v0.3. */
export function activeTheme() {
  return REGISTRY[DEFAULT_THEME_ID];
}

/** Registered theme ids (structure only; not exposed in the UI). */
export function themeIds() {
  return Object.keys(REGISTRY);
}

export function manifestUrl(base = ASSET_ROOT) {
  return new URL(activeTheme().manifest, base).href;
}

/** Accepts a parsed manifest for the active theme. Returns true when used. */
export function useManifest(json, base = ASSET_ROOT) {
  if (!json || json.id !== activeTheme().id || typeof json.assets !== "object") {
    manifest = null;
    return false;
  }
  manifest = json;
  assetBase = base;
  return true;
}

/** Fetches the manifest once. Never throws: a failure only means no pictures. */
export async function loadTheme({ fetchImpl = globalThis.fetch, base = ASSET_ROOT } = {}) {
  try {
    const res = await fetchImpl(manifestUrl(base));
    if (!res || !res.ok) throw new Error(`manifest ${res && res.status}`);
    useManifest(await res.json(), base);
  } catch {
    manifest = null;
  }
  return manifest;
}

function manifestPath(slot) {
  const dot = slot.indexOf(".");
  if (dot < 1 || !manifest) return "";
  const group = manifest.assets[slot.slice(0, dot)];
  const value = group && group[slot.slice(dot + 1)];
  return typeof value === "string" ? value : "";
}

/** Absolute URL for a semantic slot, or "" when the theme does not provide it. */
export function assetUrl(slot) {
  const path = manifestPath(slot);
  return path ? new URL(path, assetBase).href : "";
}

function escapeAttr(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
}

/**
 * Markup for a semantic slot. Pictures are decorative (alt=""); the words
 * around them carry the meaning. Mascots prefer the WebP twin when present.
 */
export function asset(slot, { className = "" } = {}) {
  const mark = activeTheme().marks[slot];
  if (mark) return mark;
  const src = assetUrl(slot);
  if (!src) return "";
  const cls = className ? ` class="${escapeAttr(className)}"` : "";
  const img = `<img${cls} src="${escapeAttr(src)}" alt="" decoding="async" draggable="false">`;
  if (slot.startsWith("mascot.")) {
    const webp = assetUrl(`${slot}Webp`);
    if (webp) return `<picture><source type="image/webp" srcset="${escapeAttr(webp)}">${img}</picture>`;
  }
  return img;
}

/** Warm the cache for the feedback mascots so the 700ms correct pause shows them. */
export function preloadAssets(slots, ImageCtor = globalThis.Image) {
  if (typeof ImageCtor !== "function") return [];
  return slots
    .map((slot) => assetUrl(`${slot}Webp`) || assetUrl(slot))
    .filter(Boolean)
    .map((src) => {
      const img = new ImageCtor();
      img.decoding = "async";
      img.src = src;
      return img;
    });
}

/** Marks the document with the active theme id. */
export function applyTheme(doc) {
  if (doc && doc.documentElement) {
    doc.documentElement.setAttribute("data-theme", activeTheme().id);
  }
  return activeTheme().id;
}

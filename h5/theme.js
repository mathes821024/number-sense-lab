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
/** Slots already preloaded for the current manifest. */
const preloaded = new Set();
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
  preloaded.clear();
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
 * Display-size copies (manifest `*Display` / `*DisplayWebp`) are what pages
 * load; the 1024px masters stay in the pack and are only a srcset candidate
 * for very dense screens. The largest mascot on any page is the home hero
 * (styles.css .mascot-hero: clamp(150px, 44vw, 196px)).
 */
export const MASCOT_SIZES = "(min-width: 640px) 196px, 44vw";
const MASCOT_DISPLAY_W = 512;
const MASCOT_MASTER_W = 1024;

/** Candidate sources for a slot: { webp, png } as srcset strings plus sizes. */
export function assetSources(slot) {
  const master = assetUrl(slot);
  if (!master) return null;
  const masterWebp = assetUrl(`${slot}Webp`);
  const display = assetUrl(`${slot}Display`);
  const displayWebp = assetUrl(`${slot}DisplayWebp`);
  if (slot.startsWith("mascot.")) {
    const pair = (small, big) =>
      [small && `${small} ${MASCOT_DISPLAY_W}w`, big && `${big} ${MASCOT_MASTER_W}w`].filter(Boolean).join(", ");
    return {
      src: display || master,
      srcset: pair(display, master),
      webp: pair(displayWebp, masterWebp),
      sizes: MASCOT_SIZES,
    };
  }
  return { src: display || master, srcset: "", webp: displayWebp || masterWebp || "", sizes: "" };
}

/**
 * Markup for a semantic slot. Pictures are decorative (alt=""); the words
 * around them carry the meaning. WebP is preferred when the theme ships it.
 */
export function asset(slot, { className = "" } = {}) {
  const mark = activeTheme().marks[slot];
  if (mark) return mark;
  const srcs = assetSources(slot);
  if (!srcs) return "";
  const cls = className ? ` class="${escapeAttr(className)}"` : "";
  const sizes = srcs.sizes ? ` sizes="${escapeAttr(srcs.sizes)}"` : "";
  const srcset = srcs.srcset ? ` srcset="${escapeAttr(srcs.srcset)}"` : "";
  const img = `<img${cls} src="${escapeAttr(srcs.src)}"${srcset}${sizes} alt="" decoding="async" draggable="false">`;
  if (srcs.webp) {
    return `<picture><source type="image/webp" srcset="${escapeAttr(srcs.webp)}"${sizes}>${img}</picture>`;
  }
  return img;
}

/**
 * Starts fetching slots before the screen that needs them (home: welcome;
 * training: correct / thinking so the 700ms feedback shows its picture).
 * Uses the same srcset and sizes as asset(), so the browser picks the same
 * file and the later <picture> is a cache hit. Each slot is preloaded once.
 */
export function preloadAssets(slots, { doc = globalThis.document, priority = "auto" } = {}) {
  if (!doc || !doc.head || typeof doc.createElement !== "function") return [];
  const links = [];
  for (const slot of slots) {
    if (!slot || preloaded.has(slot)) continue;
    const srcs = assetSources(slot);
    if (!srcs) continue;
    const link = doc.createElement("link");
    link.rel = "preload";
    link.as = "image";
    if (srcs.webp) {
      link.type = "image/webp";
      link.setAttribute("imagesrcset", srcs.webp);
    } else if (srcs.srcset) {
      link.setAttribute("imagesrcset", srcs.srcset);
    } else {
      link.href = srcs.src;
    }
    if (srcs.sizes) link.setAttribute("imagesizes", srcs.sizes);
    if (priority !== "auto") link.setAttribute("fetchpriority", priority);
    doc.head.appendChild(link);
    preloaded.add(slot);
    links.push(link);
  }
  return links;
}

/** Marks the document with the active theme id. */
export function applyTheme(doc) {
  if (doc && doc.documentElement) {
    doc.documentElement.setAttribute("data-theme", activeTheme().id);
  }
  return activeTheme().id;
}

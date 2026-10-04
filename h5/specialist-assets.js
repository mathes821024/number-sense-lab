/**
 * The F-B specialist page's pictures for the h5/ shell
 * (docs/ui/08_fb_specialist_visual.md §1). The mapping is the theme's runtime
 * manifest, assets/themes/math-lab/specialist/asset-manifest.json (a byte-for-byte
 * copy of the design hand-off, made by scripts/sync-fb-assets.mjs; the design
 * folder itself is never loaded): a domain's icon is the file the manifest names
 * for its `domain_id`, the header mascot is the manifest's mascot (the existing
 * welcome pose, reused). Nothing here names a file.
 *
 * Same files as the Taro build (app/theme/fb-specialist-assets.js, generated
 * from the same runtime manifest): domains `asset` (256px), mascot `asset_2x` (512px).
 * If the manifest cannot load, or a domain has no entry, the tile keeps its
 * interface glyph (src/core/practice-groups.js DOMAIN_GLYPHS): never an empty icon.
 */

/** The theme's specialist folder, next to h5/ (same layout locally and on the server). */
export const FB_ROOT = new URL("../assets/themes/math-lab/specialist/", import.meta.url).href;
export const DOMAIN_KEY = "asset";
export const MASCOT_KEY = "asset_2x";

let fb = null;
let fbBase = FB_ROOT;

/** Accepts a parsed F-B manifest. Returns true when it is the specialist-training baseline. */
export function useSpecialistManifest(json, base = FB_ROOT) {
  if (!json || json.page !== "specialist-training" || typeof json.domains !== "object") {
    fb = null;
    return false;
  }
  fb = json;
  fbBase = base;
  return true;
}

/** Fetches the manifest once. Never throws: a failure only means glyphs instead of pictures. */
export async function loadSpecialistAssets({ fetchImpl = globalThis.fetch, base = FB_ROOT } = {}) {
  try {
    const res = await fetchImpl(new URL("asset-manifest.json", base).href);
    if (!res || !res.ok) throw new Error(`F-B manifest ${res && res.status}`);
    useSpecialistManifest(await res.json(), base);
  } catch {
    fb = null;
  }
  return fb;
}

/** URL of a domain's icon, or "" when the manifest does not provide one. */
export function domainIconUrl(domain) {
  const entry = fb && Object.hasOwn(fb.domains, domain) ? fb.domains[domain] : null;
  const path = entry && typeof entry[DOMAIN_KEY] === "string" ? entry[DOMAIN_KEY] : "";
  return path ? new URL(path, fbBase).href : "";
}

/** The manifest's navigation group key of a domain ("" when unknown). Navigation only. */
export function domainAssetGroup(domain) {
  return (fb && Object.hasOwn(fb.domains, domain) && fb.domains[domain].group) || "";
}

/** URL of the header mascot, or "". */
export function specialistMascotUrl() {
  const path = fb && fb.mascot && typeof fb.mascot[MASCOT_KEY] === "string" ? fb.mascot[MASCOT_KEY] : "";
  return path ? new URL(path, fbBase).href : "";
}

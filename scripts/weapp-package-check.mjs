// Checks the built Mini Program package (dist/weapp) for the F-B specialist page:
// under WeChat's 2 MB main-package limit, no path or file that points at the design
// folder concept-design/ (docs/ui/08 §1: production pages never load from it), and
// the page's PNGs shipped from the theme's runtime folder, byte-identical to it.
//
//   npm run build:weapp && node scripts/weapp-package-check.mjs
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = fileURLToPath(new URL("..", import.meta.url));
export const LIMIT = 2 * 1024 * 1024;
const TEXT = /\.(js|json|wxml|wxss|wxs)$/;

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

/** Returns { bytes, files, problems[], pngs[] } for a built weapp folder. Source maps are not shipped and not counted. */
export function checkWeappPackage(dist = join(REPO, "dist/weapp")) {
  const files = walk(dist).filter((f) => !f.endsWith(".map"));
  const problems = [];
  let bytes = 0;
  for (const f of files) {
    bytes += statSync(f).size;
    const rel = relative(dist, f);
    if (rel.includes("concept-design")) problems.push(`design-folder file in package: ${rel}`);
    if (rel.startsWith("assets/themes/math-lab/specialist/") && /@2x|specialist-mascot\.png$/.test(rel)) problems.push(`non-runtime design file in package: ${rel}`);
    if (TEXT.test(f) && readFileSync(f, "utf8").includes("concept-design")) problems.push(`${rel} references concept-design`);
  }
  if (bytes >= LIMIT) problems.push(`package ${bytes} bytes ≥ ${LIMIT}`);
  const runtime = JSON.parse(readFileSync(join(REPO, "assets/themes/math-lab/specialist/asset-manifest.json"), "utf8"));
  const want = [...Object.values(runtime.domains).map((d) => d.asset), runtime.mascot.asset];
  const pngs = [];
  for (const p of want) {
    const shipped = join(dist, "assets/themes/math-lab/specialist", p);
    try {
      if (!readFileSync(shipped).equals(readFileSync(join(REPO, "assets/themes/math-lab/specialist", p)))) problems.push(`${p} differs from the runtime file`);
      pngs.push(`assets/themes/math-lab/specialist/${p}`);
    } catch {
      problems.push(`${p} not shipped under assets/themes/math-lab/specialist/`);
    }
  }
  return { bytes, files: files.length, problems, pngs };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const r = checkWeappPackage(process.env.DIST || undefined);
  console.log(`dist/weapp: ${r.files} files, ${r.bytes} bytes (${(r.bytes / 1024 / 1024).toFixed(2)} MB, limit 2 MB); F-B PNGs ${r.pngs.length}/9 from assets/themes/math-lab/specialist/`);
  for (const p of r.problems) console.log(`FAIL ${p}`);
  console.log(r.problems.length ? "FAIL" : "PASS");
  process.exit(r.problems.length ? 1 : 0);
}

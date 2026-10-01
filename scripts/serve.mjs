import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

// Port/host resolution: CLI flags (--port/--host) > env (PORT/HOST) > default.
// This lets preview tooling run `npm run dev -- --port <assigned>` unchanged.
function cliArg(flag) {
  const i = process.argv.indexOf(flag);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : null;
}
const port = Number(cliArg("--port") || process.env.PORT || 4173);
const host = cliArg("--host") || process.env.HOST || "0.0.0.0";
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

createServer((req, res) => {
  const url = new URL(req.url || "/", `http://localhost:${port}`);
  let path = decodeURIComponent(url.pathname);
  if (path === "/") {
    res.writeHead(302, { Location: "/h5/index.html" });
    res.end();
    return;
  }
  const file = normalize(join(root, path.replace(/^\//, "")));
  if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory()) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  res.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream" });
  res.end(readFileSync(file));
}).listen(port, host, () => {
  console.log(`Number Sense Lab v0.1 → http://localhost:${port}/`);
});

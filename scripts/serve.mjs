import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  process.argv.includes("--dist") ? "dist" : ".",
);
const port = Number(process.env.PORT || 4173);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".webp": "image/webp",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};
const allowed = new Set([
  "index.html",
  "styles.css",
  "main.js",
  "site-config.js",
]);
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    const rel =
      decodeURIComponent(url.pathname).replace(/^\/+/, "") || "index.html";
    if (!allowed.has(rel) && !rel.startsWith("assets/")) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    const file = path.resolve(root, rel);
    if (!file.startsWith(root + path.sep)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
    if (
      !allowed.has(rel) &&
      !file.startsWith(path.join(root, "assets") + path.sep)
    ) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    if (!(await stat(file)).isFile()) throw Error("not a file");
    const body = await readFile(file);
    res.writeHead(200, {
      "Content-Type": types[path.extname(file)] || "application/octet-stream",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(req.method === "HEAD" ? undefined : body);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});
server.listen(port, "127.0.0.1", () =>
  console.log("VAIZO preview: http://127.0.0.1:" + port),
);

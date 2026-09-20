import { cp, mkdir, writeFile, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { siteConfig } from "../site-config.js";
import { resolveConfig, assertReleaseReady } from "./config.mjs";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dest = path.join(root, "dist");
const config = resolveConfig(siteConfig, process.env);
if (process.argv.includes("--release") || config.releaseReady)
  assertReleaseReady(config);
await mkdir(dest, { recursive: true });
for (const name of ["index.html", "styles.css", "main.js"])
  await cp(path.join(root, name), path.join(dest, name));
await cp(path.join(root, "assets"), path.join(dest, "assets"), {
  recursive: true,
});
await writeFile(
  path.join(dest, "site-config.js"),
  "export const siteConfig = " + JSON.stringify(config, null, 2) + ";\n",
);
let html = await readFile(path.join(dest, "index.html"), "utf8");
if (config.releaseReady && config.ctaUrl)
  html = html.replace(
    '<meta name="robots" content="noindex, nofollow">',
    '<meta name="robots" content="index, follow">',
  );
await writeFile(path.join(dest, "index.html"), html);
console.log("Built static website: dist/");
if (!config.ctaUrl)
  console.log(
    "Preview mode: CTA shows a preparation notice. Set VAIZO_CTA_URL before publishing.",
  );

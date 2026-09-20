import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = process.argv[2];
if (!source)
  throw new Error("Usage: node scripts/optimize-images.mjs <source-directory>");
await mkdir(path.join(root, "assets"), { recursive: true });
for (const name of [
  "blue-filaments",
  "pearl-background",
  "documents",
  "quotation",
  "schedule",
]) {
  const input = path.join(source, name + ".png");
  const result = await sharp(input)
    .webp({ quality: 88, effort: 6 })
    .toFile(path.join(root, "assets", name + ".webp"));
  console.log(
    name +
      ": " +
      result.width +
      "x" +
      result.height +
      ", " +
      result.size +
      " bytes",
  );
}

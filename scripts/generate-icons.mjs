import sharp from "sharp";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const svg = readFileSync(join(process.cwd(), "public", "icon.svg"));

for (const size of [192, 512]) {
  await sharp(svg, { density: size / 24 })
    .resize(size, size)
    .png()
    .toFile(join(process.cwd(), "public", `icon-${size}x${size}.png`));
  console.log(`Generated public/icon-${size}x${size}.png`);
}

await sharp(svg, { density: 72 })
  .resize(180, 180)
  .png()
  .toFile(join(process.cwd(), "public", "apple-icon.png"));
console.log("Generated public/apple-icon.png");

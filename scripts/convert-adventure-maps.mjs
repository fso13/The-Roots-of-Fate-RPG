// Конвертация SVG карт приключения в PNG для GitLab Pages / браузеров без SVG
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAPS = path.join(__dirname, "..", "rpg", "adventure", "maps");

const files = fs.readdirSync(MAPS).filter((f) => f.endsWith(".svg"));
for (const f of files) {
  const input = path.join(MAPS, f);
  const out = path.join(MAPS, f.replace(/\.svg$/i, ".png"));
  const buf = fs.readFileSync(input);
  await sharp(buf).png({ compressionLevel: 9 }).toFile(out);
  console.log("Wrote", path.relative(process.cwd(), out));
}

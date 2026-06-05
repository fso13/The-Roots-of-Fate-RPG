// Копирует сгенерированные PNG из assets/ в rpg/adventure/maps/chernyy-schet/
// Использование: node scripts/install-chernyy-schet-maps.mjs <srcDir>
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "rpg", "adventure", "maps", "chernyy-schet");

const FILES = [
  "01-seraya-lestnitsa",
  "02-morg",
  "03-ratusha",
  "04-apteka",
  "05-zolotoy-list",
  "06-prachechnaya",
  "07-kanatnaya",
  "08-rybnyy-rynok",
  "09-ebonit",
  "10-mayak",
  "11-obitel",
  "12-osobnyak-noll",
  "13-dokerskiy-sklad",
  "14-priut",
  "15-palata-arhiv",
  "16-komendatura",
  "17-kazarmy",
  "18-pirs-7",
  "19-verf",
  "20-severnaya-vdova-paluba",
  "21-severnaya-vdova-trum",
  "22-arsenal",
  "23-slomannyy-fonar",
  "24-katakomby",
  "25-dom-u-mysa",
];

const srcDir = process.argv[2];
if (!srcDir || !fs.existsSync(srcDir)) {
  console.error("Usage: node scripts/install-chernyy-schet-maps.mjs <directory-with-png>");
  process.exit(1);
}

for (const name of FILES) {
  const src = path.join(srcDir, `${name}.png`);
  const dest = path.join(OUT, `${name}.png`);
  if (!fs.existsSync(src)) {
    console.warn("Skip (missing):", name);
    continue;
  }
  fs.copyFileSync(src, dest);
  console.log("Installed", name);
}

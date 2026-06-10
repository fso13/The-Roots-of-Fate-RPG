// Карта Солстхейма (DLC Dragonborn).
// Карта провинции 00-skyrim-provintsiya.png — отдельный файл в my_modules/skyrim/maps/ (GameBanshee).
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "my_modules", "skyrim", "maps");
fs.mkdirSync(OUT, { recursive: true });

const W = 1200;
const H = 900;

const PAL = {
  bg: "#12161c",
  tundra: "#7d8f6e",
  mountain: "#5c6369",
  peak: "#9aa3ad",
  border: "#0e1114",
  text: "#e8ecf0",
  sub: "#9ab0c4",
  gold: "#c9a227",
  dlc: "#6b4a8a",
};

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
}

function wrap(title, subtitle, body) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${PAL.bg}"/>
  ${body}
  <rect x="24" y="24" width="560" height="${subtitle ? 76 : 52}" fill="${PAL.border}" opacity="0.9" rx="6"/>
  <text x="42" y="56" fill="${PAL.text}" font-family="Georgia, serif" font-size="26">${esc(title)}</text>
  ${subtitle ? `<text x="42" y="84" fill="${PAL.sub}" font-family="Georgia, serif" font-size="15">${esc(subtitle)}</text>` : ""}
</svg>`;
}

function city(cx, cy, name, hold = "", size = 9) {
  return `
  <circle cx="${cx}" cy="${cy}" r="${size + 4}" fill="${PAL.gold}" opacity="0.25"/>
  <circle cx="${cx}" cy="${cy}" r="${size}" fill="${PAL.gold}" stroke="${PAL.border}" stroke-width="2"/>
  <text x="${cx}" y="${cy - size - 8}" text-anchor="middle" fill="${PAL.text}" font-family="Georgia, serif" font-size="13" font-weight="bold">${esc(name)}</text>
  ${hold ? `<text x="${cx}" y="${cy + size + 18}" text-anchor="middle" fill="${PAL.sub}" font-family="sans-serif" font-size="10">${esc(hold)}</text>` : ""}`;
}

const solstheimBody = () => `
  <path d="M 200 150 L 500 80 L 900 120 L 1100 300 L 1050 550 L 850 750 L 500 820 L 250 700 L 150 450 Z"
        fill="${PAL.tundra}" stroke="${PAL.border}" stroke-width="3"/>
  <path d="M 400 200 L 700 180 L 850 350 L 800 550 L 550 620 L 350 500 L 320 320 Z"
        fill="${PAL.mountain}" opacity="0.5"/>
  <path d="M 600 400 L 750 380 L 820 480 L 760 580 L 620 560 Z" fill="${PAL.peak}" opacity="0.7"/>
  <path d="M 250 600 L 400 650 L 450 780 L 300 800 L 200 700 Z" fill="#4a4540" opacity="0.45"/>
  ${city(750, 620, "Равен Рок", "Дом Редоран")}
  ${city(320, 420, "Скаальская деревня", "Скаалы")}
  ${city(680, 480, "Храм Мираака", "культ", 8)}
  <rect x="40" y="40" width="440" height="88" fill="${PAL.border}" opacity="0.88" rx="6"/>
  <text x="56" y="68" fill="${PAL.dlc}" font-family="Georgia, serif" font-size="14">DLC Dragonborn</text>
  <text x="56" y="88" fill="${PAL.sub}" font-size="11">Переправа: корабль из Виндхельма или Рифтена (2–4 дня пути).</text>
  <text x="56" y="108" fill="${PAL.sub}" font-size="11">Провинция — карта 00 (сетка A–L).</text>
`;

const provincePath = path.join(OUT, "00-skyrim-provintsiya.png");
if (!fs.existsSync(provincePath)) {
  console.warn("Skip: 00-skyrim-provintsiya.png not found — положите карту провинции в my_modules/skyrim/maps/");
}

const file = "01-solstheim";
const svg = wrap("Солстхейм", "DLC Dragonborn · Скаалы · Равен Рок · Мираак", solstheimBody());
const svgPath = path.join(OUT, `${file}.svg`);
const pngPath = path.join(OUT, `${file}.png`);
fs.writeFileSync(svgPath, svg);
await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(pngPath);
console.log("Wrote", path.relative(process.cwd(), pngPath));

// Удаляем устаревшую сгенерированную SVG провинции, если осталась
const oldSvg = path.join(OUT, "00-skyrim-provintsiya.svg");
if (fs.existsSync(oldSvg)) {
  fs.unlinkSync(oldSvg);
  console.log("Removed obsolete", path.relative(process.cwd(), oldSvg));
}

console.log("Done: Solstheim map generated; province map is a static asset.");

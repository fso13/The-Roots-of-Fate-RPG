// Обложки приключений для препрессa (A4 пропорции, 2480×3508 @300dpi эквивалент)
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const W = 1240;
const H = 1754;

const covers = [
  {
    dir: path.join(__dirname, "..", "rpg", "adventure", "maps", "pepel-slov"),
    file: "cover",
    svg: ({ w, h }) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2a2d34"/>
      <stop offset="55%" stop-color="#4a4e57"/>
      <stop offset="100%" stop-color="#1a1c22"/>
    </linearGradient>
    <radialGradient id="fire" cx="50%" cy="75%" r="45%">
      <stop offset="0%" stop-color="#ff9f1c" stop-opacity="0.9"/>
      <stop offset="50%" stop-color="#e85d04" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#e85d04" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#sky)"/>
  <rect width="${w}" height="${h}" fill="url(#fire)"/>
  ${Array.from({ length: 7 }, (_, i) => {
    const x = 80 + i * 155;
    const bh = 420 + (i % 3) * 90;
    return `<rect x="${x}" y="${h - bh - 120}" width="110" height="${bh}" fill="#3d4149" opacity="0.95"/>
    <rect x="${x + 8}" y="${h - bh - 108}" width="94" height="52" fill="#6ec5ff" opacity="0.25"/>`;
  }).join("")}
  <ellipse cx="${w * 0.52}" cy="${h * 0.62}" rx="90" ry="120" fill="#1a1c22" opacity="0.85"/>
  <rect x="${w * 0.48}" y="${h * 0.52}" width="70" height="90" rx="4" fill="#e85d04" opacity="0.35"/>
  <text x="${w / 2}" y="180" text-anchor="middle" font-family="Georgia, serif" font-size="72" fill="#f8f9fa" letter-spacing="2">Пепел слов</text>
  <text x="${w / 2}" y="240" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="#adb5bd">Корни судьбы · приключение</text>
  <text x="${w / 2}" y="${h - 80}" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="#6c757d">Солнечный Квартал · память против огня</text>
</svg>`,
  },
  {
    dir: path.join(__dirname, "..", "rpg", "adventure", "maps", "chernyy-shpil"),
    file: "cover",
    svg: ({ w, h }) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0%" stop-color="#0c0a10"/>
      <stop offset="100%" stop-color="#141218"/>
    </linearGradient>
    <radialGradient id="glow" cx="62%" cy="38%" r="35%">
      <stop offset="0%" stop-color="#9d4edd" stop-opacity="0.75"/>
      <stop offset="100%" stop-color="#9d4edd" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <rect width="${w}" height="${h}" fill="url(#glow)"/>
  <polygon points="${w * 0.5},${h * 0.18} ${w * 0.62},${h * 0.72} ${w * 0.38},${h * 0.72}" fill="#1f1b24" stroke="#4a4658" stroke-width="3"/>
  <rect x="${w * 0.47}" y="${h * 0.42}" width="60" height="70" fill="#9d4edd" opacity="0.55"/>
  <ellipse cx="${w * 0.5}" cy="${h * 0.78}" rx="280" ry="40" fill="#2d4a3e" opacity="0.5"/>
  <path d="M ${w * 0.35} ${h * 0.82} Q ${w * 0.5} ${h * 0.76} ${w * 0.65} ${h * 0.82}" fill="none" stroke="#b8c0d4" stroke-width="4" opacity="0.85"/>
  <text x="${w / 2}" y="170" text-anchor="middle" font-family="Georgia, serif" font-size="58" fill="#e8e0f0" letter-spacing="1">Зов из Чёрного шпиля</text>
  <text x="${w / 2}" y="230" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" fill="#9d8ec2">Корни судьбы · приключение</text>
  <text x="${w / 2}" y="${h - 80}" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="#6c6578">Вестмар · сказка без хэппи-энда</text>
</svg>`,
  },
];

for (const c of covers) {
  fs.mkdirSync(c.dir, { recursive: true });
  const svg = c.svg({ w: W, h: H });
  const svgPath = path.join(c.dir, `${c.file}.svg`);
  const pngPath = path.join(c.dir, `${c.file}.png`);
  fs.writeFileSync(svgPath, svg, "utf8");
  await sharp(Buffer.from(svg)).png().toFile(pngPath);
  console.log(`Wrote ${svgPath} + ${pngPath}`);
}

console.log("Done: adventure covers");

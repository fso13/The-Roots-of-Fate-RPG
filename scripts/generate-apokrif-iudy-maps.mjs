// Карты для «Дело № XII: Поцелуй Иуды» — Rome noir top-down, сетка, маркеры A/B/C
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "rpg", "adventure", "maps", "apokrif-iudy");
fs.mkdirSync(OUT, { recursive: true });

const W = 1200;
const H = 900;
const GRID = 60;

const PAL = {
  bg: "#141418",
  cobble: "#3a3642",
  floor: "#4a4654",
  marble: "#d8d2c8",
  wall: "#1e1c24",
  gold: "#c9a227",
  tiber: "#2d4a5a",
  accent: "#8b2942",
  text: "#f0ebe3",
  wet: "#2a2834",
  rust: "#6b5a48",
  danger: "#a4133c",
};

function grid() {
  let lines = "";
  for (let x = 0; x <= W; x += GRID) {
    lines += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="#ffffff08" stroke-width="1"/>`;
  }
  for (let y = 0; y <= H; y += GRID) {
    lines += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#ffffff08" stroke-width="1"/>`;
  }
  return lines;
}

function rect(x, y, w, h, fill, stroke = PAL.wall, sw = 2) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
}

function label(title, subtitle = "") {
  return `
  <rect x="20" y="20" width="520" height="${subtitle ? 72 : 48}" fill="${PAL.wall}" opacity="0.92" rx="4"/>
  <text x="36" y="52" fill="${PAL.text}" font-family="Georgia, serif" font-size="22">${title}</text>
  ${subtitle ? `<text x="36" y="78" fill="${PAL.gold}" font-family="Georgia, serif" font-size="14">${subtitle}</text>` : ""}`;
}

function marker(cx, cy, letter, color = PAL.gold) {
  return `
  <circle cx="${cx}" cy="${cy}" r="22" fill="${color}" opacity="0.95"/>
  <text x="${cx}" y="${cy + 6}" text-anchor="middle" fill="#111" font-size="18" font-weight="bold">${letter}</text>`;
}

function wrap(title, subtitle, body) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${PAL.bg}"/>
  ${body}
  ${grid()}
  <defs>
    <radialGradient id="glow" cx="50%" cy="40%" r="70%">
      <stop offset="0%" stop-color="transparent"/>
      <stop offset="100%" stop-color="#0a0a0e"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#glow)" opacity="0.35"/>
  ${label(title, subtitle)}
</svg>`;
}

const maps = [
  {
    file: "00-roma-obzor",
    title: "Рим — маршрут дела XII",
    subtitle: "Angelica → Катакомбы → Trastevere → Tiber → Castel → Fiumicino",
    body: () => {
      let s = rect(0, 0, W, H, PAL.cobble);
      s += rect(80, 120, 1040, 660, PAL.wet, PAL.tiber, 1);
      s += `<text x="600" y="500" text-anchor="middle" fill="${PAL.tiber}" font-size="28" opacity="0.5">TIBER</text>`;
      s += marker(180, 200, "A", PAL.gold);
      s += `<text x="180" y="165" text-anchor="middle" fill="${PAL.text}" font-size="11">Angelica</text>`;
      s += marker(350, 280, "B", PAL.accent);
      s += `<text x="350" y="245" text-anchor="middle" fill="${PAL.text}" font-size="11">Прискилла</text>`;
      s += marker(480, 380, "C", PAL.gold);
      s += `<text x="480" y="345" text-anchor="middle" fill="${PAL.text}" font-size="11">Trastevere</text>`;
      s += marker(620, 520, "1", "#7eb8da");
      s += `<text x="620" y="560" text-anchor="middle" fill="${PAL.text}" font-size="10">Fabricius</text>`;
      s += rect(820, 180, 180, 220, PAL.rust);
      s += marker(910, 290, "2", PAL.danger);
      s += `<text x="910" y="420" text-anchor="middle" fill="${PAL.text}" font-size="11">Castel</text>`;
      s += rect(950, 620, 200, 120, PAL.floor);
      s += marker(1050, 680, "3", PAL.accent);
      s += `<text x="1050" y="760" text-anchor="middle" fill="${PAL.text}" font-size="10">Fiumicino</text>`;
      return s;
    },
  },
  {
    file: "01-angelica-laboratoriya",
    title: "Biblioteca Angelica",
    subtitle: "Лаборатория Бруни · сц. 0",
    body: () => {
      let s = rect(0, 0, W, H, PAL.marble);
      s += rect(60, 60, 1080, 780, PAL.floor);
      s += rect(80, 80, 400, 720, PAL.wall);
      s += rect(520, 80, 600, 720, PAL.floor, PAL.gold, 1);
      s += rect(200, 150, 180, 100, "#2a2520");
      s += marker(290, 200, "A", PAL.gold);
      s += `<text x="290" y="270" text-anchor="middle" fill="${PAL.text}" font-size="10">верстак / монитор</text>`;
      s += rect(600, 200, 220, 140, "#1a2838");
      s += marker(710, 270, "B", PAL.accent);
      s += `<text x="710" y="360" text-anchor="middle" fill="${PAL.text}" font-size="10">сравнение NG 2006</text>`;
      s += rect(900, 600, 80, 120, PAL.rust);
      s += marker(940, 660, "C", "#7eb8da");
      s += `<text x="940" y="740" text-anchor="middle" fill="${PAL.text}" font-size="10">лифт</text>`;
      return s;
    },
  },
  {
    file: "02-lift-arkhiv",
    title: "Лифт и Archivio Restauro",
    subtitle: "Сц. 1 · шахта и архивная комната",
    body: () => {
      let s = rect(0, 0, W, H, PAL.marble);
      s += rect(100, 80, 200, 740, PAL.rust);
      s += marker(200, 450, "A", PAL.danger);
      s += `<text x="200" y="400" text-anchor="middle" fill="${PAL.text}" font-size="10">рез на тросе</text>`;
      s += rect(400, 120, 700, 640, PAL.floor);
      s += rect(450, 180, 600, 520, PAL.wet);
      for (let i = 0; i < 4; i++) {
        s += rect(480 + (i % 2) * 280, 220 + Math.floor(i / 2) * 200, 200, 120, PAL.cobble);
      }
      s += marker(580, 320, "B", PAL.gold);
      s += `<text x="580" y="380" text-anchor="middle" fill="${PAL.text}" font-size="10">дневник / контракт 1994</text>`;
      s += marker(900, 600, "C", "#7eb8da");
      s += `<text x="900" y="660" text-anchor="middle" fill="${PAL.text}" font-size="10">выход к Franco</text>`;
      return s;
    },
  },
  {
    file: "03-katakomby-priscilla",
    title: "Катакомбы Прискиллы",
    subtitle: "Капелла IV евангелистов · сц. 2",
    body: () => {
      let s = rect(0, 0, W, H, "#2a2420");
      s += rect(80, 80, 1040, 740, PAL.wet);
      s += rect(300, 200, 600, 400, PAL.cobble);
      for (let i = 0; i < 4; i++) {
        const x = 340 + (i % 2) * 260;
        const y = 240 + Math.floor(i / 2) * 180;
        s += rect(x, y, 180, 120, PAL.floor, PAL.gold, 2);
        s += marker(x + 90, y + 60, String(i + 1), PAL.gold);
      }
      s += rect(420, 620, 360, 80, "#1a1510");
      s += marker(600, 660, "A", PAL.accent);
      s += `<text x="600" y="720" text-anchor="middle" fill="${PAL.text}" font-size="11">фреска без монет</text>`;
      s += marker(150, 450, "B", PAL.danger);
      s += `<text x="150" y="510" text-anchor="middle" fill="${PAL.text}" font-size="10">засада Custodes</text>`;
      s += marker(1050, 200, "C", "#7eb8da");
      s += `<text x="1050" y="260" text-anchor="middle" fill="${PAL.text}" font-size="10">выход</text>`;
      return s;
    },
  },
  {
    file: "04-basilica-trastevere",
    title: "Basilica Santa Maria in Trastevere",
    subtitle: "Киот Lorenzo · сц. 3",
    body: () => {
      let s = rect(0, 0, W, H, PAL.marble);
      s += rect(0, 0, W, H, PAL.gold, "none", 0);
      s += `<rect width="${W}" height="${H}" fill="${PAL.gold}" opacity="0.08"/>`;
      s += rect(200, 100, 800, 700, PAL.floor);
      s += rect(480, 120, 240, 400, PAL.wet);
      s += marker(600, 500, "A", PAL.gold);
      s += `<text x="600" y="560" text-anchor="middle" fill="${PAL.text}" font-size="11">алтарь / месса</text>`;
      s += rect(220, 350, 120, 180, PAL.cobble);
      s += marker(280, 440, "B", PAL.accent);
      s += `<text x="280" y="550" text-anchor="middle" fill="${PAL.text}" font-size="10">киот Lorenzo</text>`;
      s += rect(900, 300, 80, 200, PAL.wall);
      s += marker(940, 400, "C", PAL.danger);
      s += `<text x="940" y="520" text-anchor="middle" fill="${PAL.text}" font-size="10">capellano</text>`;
      return s;
    },
  },
  {
    file: "05-most-fabricius",
    title: "Мост Fabricius · остров Тибр",
    subtitle: "Погоня · сц. 4",
    body: () => {
      let s = rect(0, 300, W, 300, PAL.tiber);
      s += rect(0, 0, W, 300, PAL.cobble);
      s += rect(0, 600, W, 300, PAL.cobble);
      s += rect(350, 250, 500, 400, PAL.rust);
      for (let i = 0; i < 6; i++) s += rect(370 + i * 75, 270, 50, 360, PAL.marble, PAL.wall, 1);
      s += marker(600, 450, "A", PAL.gold);
      s += `<text x="600" y="520" text-anchor="middle" fill="${PAL.text}" font-size="11">центр моста</text>`;
      s += marker(400, 200, "B", PAL.danger);
      s += `<text x="400" y="170" text-anchor="middle" fill="${PAL.text}" font-size="10">мото Custodes</text>`;
      s += marker(850, 650, "C", "#7eb8da");
      s += `<text x="850" y="710" text-anchor="middle" fill="${PAL.text}" font-size="10">San Bartolomeo</text>`;
      return s;
    },
  },
  {
    file: "06-castel-santangelo",
    title: "Castel Sant'Angelo",
    subtitle: "Комната VII · ангел с ключом · сц. 5",
    body: () => {
      let s = rect(0, 0, W, H, PAL.cobble);
      s += rect(150, 100, 900, 700, PAL.rust);
      s += rect(200, 150, 800, 600, PAL.floor);
      s += `<circle cx="600" cy="350" r="120" fill="none" stroke="${PAL.gold}" stroke-width="4"/>`;
      s += marker(600, 350, "A", PAL.gold);
      s += `<text x="600" y="490" text-anchor="middle" fill="${PAL.text}" font-size="11">статуя Михаила / QR</text>`;
      s += rect(750, 500, 200, 180, PAL.wet);
      s += marker(850, 590, "B", PAL.accent);
      s += `<text x="850" y="660" text-anchor="middle" fill="${PAL.text}" font-size="10">комн. VII / лист XIII</text>`;
      s += rect(250, 550, 120, 80, PAL.wall);
      s += marker(310, 590, "C", PAL.danger);
      s += `<text x="310" y="650" text-anchor="middle" fill="${PAL.text}" font-size="10">гвардеец</text>`;
      return s;
    },
  },
  {
    file: "07-passetto",
    title: "Passetto di Borgo",
    subtitle: "800 м к Ватикану · сц. 7",
    body: () => {
      let s = rect(0, 0, W, H, PAL.wet);
      s += rect(100, 350, 1000, 200, PAL.cobble);
      s += rect(100, 320, 1000, 30, PAL.wall);
      s += rect(100, 550, 1000, 30, PAL.wall);
      for (let i = 0; i < 8; i++) s += rect(150 + i * 120, 380, 40, 140, PAL.rust);
      s += marker(250, 450, "A", PAL.danger);
      s += `<text x="250" y="540" text-anchor="middle" fill="${PAL.text}" font-size="10">решётка</text>`;
      s += marker(600, 450, "B", PAL.gold);
      s += `<text x="600" y="540" text-anchor="middle" fill="${PAL.text}" font-size="10">узкий коридор</text>`;
      s += marker(950, 450, "C", PAL.accent);
      s += `<text x="950" y="540" text-anchor="middle" fill="${PAL.text}" font-size="10">Iscariot / выход</text>`;
      return s;
    },
  },
  {
    file: "08-fiumicino-sklad",
    title: "Fiumicino · склад D",
    subtitle: "Marcus Webb · сц. 6",
    body: () => {
      let s = rect(0, 0, W, H, "#3a3830");
      s += rect(80, 120, 1040, 660, PAL.floor);
      s += rect(200, 200, 400, 280, PAL.rust);
      s += `<text x="400" y="350" text-anchor="middle" fill="${PAL.text}" font-size="14" opacity="0.6">Fragile — Athens 1994</text>`;
      s += marker(400, 340, "A", PAL.gold);
      s += `<text x="400" y="500" text-anchor="middle" fill="${PAL.text}" font-size="10">контейнер Webb</text>`;
      s += rect(700, 250, 300, 200, PAL.wet);
      s += marker(850, 350, "B", PAL.accent);
      s += `<text x="850" y="470" text-anchor="middle" fill="${PAL.text}" font-size="10">стол / рентген 2003</text>`;
      s += marker(150, 650, "C", PAL.danger);
      s += `<text x="150" y="710" text-anchor="middle" fill="${PAL.text}" font-size="10">засада / Mercedes</text>`;
      return s;
    },
  },
  {
    file: "09-finale-uv",
    title: "Финал · UV-лаборатория",
    subtitle: "Два слоя чернил · сц. 8",
    body: () => {
      let s = rect(0, 0, W, H, PAL.marble);
      s += rect(100, 100, 1000, 700, PAL.floor);
      s += rect(400, 200, 400, 300, "#0a1020");
      s += `<rect x="420" y="220" width="360" height="80" fill="#4a0080" opacity="0.5"/>`;
      s += `<rect x="420" y="320" width="360" height="80" fill="#804000" opacity="0.4"/>`;
      s += marker(600, 350, "A", PAL.gold);
      s += `<text x="600" y="530" text-anchor="middle" fill="${PAL.text}" font-size="11">экран UV: два слоя</text>`;
      s += rect(150, 400, 180, 120, PAL.wet);
      s += marker(240, 460, "B", PAL.accent);
      s += `<text x="240" y="540" text-anchor="middle" fill="${PAL.text}" font-size="10">лист XIII в кейсе</text>`;
      s += rect(900, 500, 120, 80, PAL.rust);
      s += marker(960, 540, "C", "#7eb8da");
      s += `<text x="960" y="610" text-anchor="middle" fill="${PAL.text}" font-size="10">окно / Tiber</text>`;
      return s;
    },
  },
];

for (const m of maps) {
  const svg = wrap(m.title, m.subtitle, m.body());
  const svgPath = path.join(OUT, `${m.file}.svg`);
  const pngPath = path.join(OUT, `${m.file}.png`);
  fs.writeFileSync(svgPath, svg);
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(pngPath);
  console.log("Wrote", path.relative(process.cwd(), pngPath));
}

console.log(`Done: ${maps.length} maps in apokrif-iudy/`);

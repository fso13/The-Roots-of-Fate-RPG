// Карты для «Пепел слов» — dystopia top-down, сетка, маркеры A/B/C
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "rpg", "adventure", "maps", "pepel-slov");
fs.mkdirSync(OUT, { recursive: true });

const W = 1200;
const H = 900;
const GRID = 60;

const PAL = {
  bg: "#1c1c1f",
  floor: "#3a3a40",
  floor2: "#4a4a52",
  wall: "#141418",
  accent: "#e85d04",
  screen: "#48cae4",
  ash: "#6b6b70",
  rust: "#8b4513",
  text: "#f0ebe3",
  danger: "#c1121f",
  road: "#2f2f35",
};

function grid() {
  let lines = "";
  for (let x = 0; x <= W; x += GRID) {
    lines += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="#ffffff06" stroke-width="1"/>`;
  }
  for (let y = 0; y <= H; y += GRID) {
    lines += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#ffffff06" stroke-width="1"/>`;
  }
  return lines;
}

function rect(x, y, w, h, fill, stroke = PAL.wall, sw = 2) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
}

function label(title, subtitle = "") {
  return `
  <rect x="20" y="20" width="480" height="${subtitle ? 72 : 48}" fill="${PAL.wall}" opacity="0.9" rx="4"/>
  <text x="36" y="52" fill="${PAL.text}" font-family="Georgia, serif" font-size="22">${title}</text>
  ${subtitle ? `<text x="36" y="78" fill="${PAL.accent}" font-family="Georgia, serif" font-size="14">${subtitle}</text>` : ""}`;
}

function marker(cx, cy, letter, color = PAL.accent) {
  return `
  <circle cx="${cx}" cy="${cy}" r="22" fill="${color}" opacity="0.95"/>
  <text x="${cx}" y="${cy + 6}" text-anchor="middle" fill="#111" font-size="18" font-weight="bold">${letter}</text>`;
}

function screen(x, y, w, h) {
  return `${rect(x, y, w, h, "#0a1628", PAL.screen, 3)}
  <rect x="${x + 8}" y="${y + 8}" width="${w - 16}" height="${h - 16}" fill="${PAL.screen}" opacity="0.35"/>`;
}

function wrap(title, subtitle, body) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${PAL.bg}"/>
  ${body}
  ${grid()}
  <defs>
    <radialGradient id="glow" cx="50%" cy="35%" r="65%">
      <stop offset="0%" stop-color="transparent"/>
      <stop offset="100%" stop-color="#0a0a0c"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#glow)" opacity="0.4"/>
  ${label(title, subtitle)}
</svg>`;
}

const maps = [
  {
    file: "00-gorod-solnechnyy-kvartal",
    title: "Солнечный Квартал",
    subtitle: "Обзор города · маршрут дела",
    body: () => {
      let s = rect(0, 0, W, H, PAL.road);
      s += rect(80, 80, 1040, 740, PAL.floor, PAL.ash, 1);
      // blocks
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 5; col++) {
          s += rect(120 + col * 200, 120 + row * 170, 160, 130, PAL.floor2);
          if ((row + col) % 2 === 0) s += screen(140 + col * 200, 140 + row * 170, 40, 30);
        }
      }
      // rails east
      s += rect(980, 100, 80, 700, PAL.rust);
      for (let i = 0; i < 10; i++) s += rect(990, 120 + i * 65, 60, 8, "#555");
      // Pepelniki strip
      s += rect(200, 400, 600, 50, PAL.ash);
      s += marker(500, 425, "1", PAL.danger);
      s += `<text x="500" y="395" text-anchor="middle" fill="${PAL.accent}" font-size="12">Ул. Пепельников</text>`;
      s += marker(180, 750, "A", PAL.accent);
      s += `<text x="180" y="800" text-anchor="middle" fill="${PAL.text}" font-size="11">«Частоты»</text>`;
      s += marker(1050, 450, "B", "#7eb8da");
      s += `<text x="1050" y="500" text-anchor="middle" fill="${PAL.text}" font-size="11">«Остаток»</text>`;
      s += marker(500, 150, "C", PAL.danger);
      s += `<text x="500" y="115" text-anchor="middle" fill="${PAL.text}" font-size="11">Казарма №7</text>`;
      return s;
    },
  },
  {
    file: "01-radiomasterskaya",
    title: "Лавка «Частоты»",
    subtitle: "Задняя комната · брифинг у Альвара",
    body: () => {
      let s = rect(0, 0, W, H, PAL.floor);
      s += rect(60, 60, 500, 780, PAL.floor2);
      s += rect(620, 60, 520, 780, PAL.wall);
      s += rect(80, 100, 200, 120, PAL.rust);
      s += marker(180, 160, "A");
      s += `<text x="180" y="240" text-anchor="middle" fill="${PAL.text}" font-size="10">витрина</text>`;
      s += rect(300, 400, 220, 180, "#2a2520");
      s += marker(410, 490, "B", PAL.accent);
      s += `<text x="410" y="600" text-anchor="middle" fill="${PAL.text}" font-size="10">стол Альвара</text>`;
      s += rect(120, 650, 80, 60, PAL.wall);
      s += marker(160, 680, "C", "#7eb8da");
      s += `<text x="160" y="730" text-anchor="middle" fill="${PAL.text}" font-size="10">люк в подсобку</text>`;
      s += screen(700, 200, 120, 90);
      s += `<text x="760" y="320" text-anchor="middle" fill="${PAL.ash}" font-size="11">экран выкл.</text>`;
      return s;
    },
  },
  {
    file: "02-ulitsa-pepelnikov",
    title: "Улица Пепельников",
    subtitle: "Дома 12 и 14 · следы зачистки",
    body: () => {
      let s = rect(0, 550, W, 350, PAL.road);
      s += rect(0, 0, W, 550, PAL.bg);
      // building row
      for (let i = 0; i < 5; i++) {
        s += rect(80 + i * 220, 80, 180, 450, PAL.floor2);
        s += screen(100 + i * 220, 120, 50, 40);
        s += screen(150 + i * 220, 200, 50, 40);
      }
      s += rect(300, 480, 80, 70, PAL.danger);
      s += marker(340, 515, "A", PAL.danger);
      s += `<text x="340" y="470" text-anchor="middle" fill="${PAL.danger}" font-size="10">№12 сожжён</text>`;
      s += rect(520, 500, 60, 50, PAL.floor);
      s += marker(550, 525, "B");
      s += `<text x="550" y="470" text-anchor="middle" fill="${PAL.accent}" font-size="10">№14 «ремонт»</text>`;
      s += marker(200, 600, "C", "#7eb8da");
      s += `<text x="200" y="650" text-anchor="middle" fill="${PAL.text}" font-size="10">мел: полумесяц</text>`;
      return s;
    },
  },
  {
    file: "03-prachechnaya-lampa",
    title: "Прачечная «Белый пар»",
    subtitle: "Люк в подвал · вход в «Лампу»",
    body: () => {
      let s = rect(0, 0, W, H, PAL.floor);
      s += rect(100, 100, 1000, 700, PAL.floor2);
      for (let i = 0; i < 6; i++) {
        s += rect(150 + i * 150, 200, 100, 100, "#5a6a7a");
        s += `<circle cx="${200 + i * 150}" cy="250" r="35" fill="none" stroke="${PAL.ash}" stroke-width="4"/>`;
      }
      s += rect(750, 450, 200, 200, PAL.rust);
      s += marker(850, 550, "A", PAL.accent);
      s += `<text x="850" y="620" text-anchor="middle" fill="${PAL.text}" font-size="11">люк за барабаном</text>`;
      s += marker(300, 350, "B");
      s += `<text x="300" y="400" text-anchor="middle" fill="${PAL.text}" font-size="10">стойка дежурного</text>`;
      s += rect(900, 120, 120, 80, PAL.wall);
      s += marker(960, 160, "C", PAL.danger);
      return s;
    },
  },
  {
    file: "04-podval-lampa",
    title: "Подвал «Лампа в подвале»",
    subtitle: "Убежище · Соня",
    body: () => {
      let s = rect(0, 0, W, H, PAL.wall);
      s += rect(150, 150, 900, 600, PAL.floor);
      s += rect(200, 200, 300, 250, "#2a2520");
      s += marker(350, 320, "A", PAL.accent);
      s += `<text x="350" y="380" text-anchor="middle" fill="${PAL.text}" font-size="11">Соня / матрас</text>`;
      s += rect(600, 250, 350, 200, PAL.floor2);
      s += marker(775, 350, "B");
      s += `<text x="775" y="410" text-anchor="middle" fill="${PAL.text}" font-size="10">стол сети</text>`;
      s += rect(400, 550, 120, 80, PAL.rust);
      s += marker(460, 590, "C", "#7eb8da");
      s += `<text x="460" y="650" text-anchor="middle" fill="${PAL.text}" font-size="10">ход в канализацию</text>`;
      s += `<circle cx="250" cy="600" r="30" fill="${PAL.accent}" opacity="0.5"/>`;
      s += `<text x="250" y="605" text-anchor="middle" fill="#111" font-size="10">лампа</text>`;
      return s;
    },
  },
  {
    file: "05-kanalizatsiya",
    title: "Канализация",
    subtitle: "Погоня · развилка к «Тишине»",
    body: () => {
      let s = rect(0, 0, W, H, PAL.wall);
      s += rect(100, 300, 1000, 200, "#1a3a4a");
      s += rect(100, 350, 1000, 100, PAL.floor2);
      s += rect(550, 150, 100, 200, PAL.floor);
      s += rect(550, 550, 100, 200, PAL.floor);
      s += rect(200, 100, 150, 150, PAL.floor);
      s += marker(275, 175, "A");
      s += `<text x="275" y="90" text-anchor="middle" fill="${PAL.text}" font-size="10">люк с прачечной</text>`;
      s += marker(600, 400, "B", PAL.danger);
      s += marker(950, 400, "C", "#7eb8da");
      s += `<text x="750" y="280" text-anchor="middle" fill="${PAL.accent}" font-size="12">налево — Остаток · направо — казарма</text>`;
      return s;
    },
  },
  {
    file: "06-kazarma-7",
    title: "Казарма огнеборцев №7",
    subtitle: "Архив · казарменный двор",
    body: () => {
      let s = rect(0, 0, W, H, PAL.floor);
      s += rect(80, 80, 500, 740, PAL.floor2);
      s += rect(650, 120, 470, 300, PAL.danger);
      s += marker(785, 270, "A", PAL.danger);
      s += `<text x="785" y="330" text-anchor="middle" fill="${PAL.text}" font-size="11">гараж гончей</text>`;
      s += rect(650, 480, 470, 340, PAL.wall);
      s += marker(880, 620, "B");
      s += `<text x="880" y="680" text-anchor="middle" fill="${PAL.text}" font-size="10">архив эфира</text>`;
      s += rect(200, 300, 260, 200, PAL.rust);
      s += marker(330, 400, "C", PAL.accent);
      s += `<text x="330" y="520" text-anchor="middle" fill="${PAL.text}" font-size="10">кабинет Брэгга</text>`;
      return s;
    },
  },
  {
    file: "07-telestudiya",
    title: "Телестудия «Солнечный эфир»",
    subtitle: "Монтажная · Лайл",
    body: () => {
      let s = rect(0, 0, W, H, PAL.wall);
      s += rect(120, 120, 960, 660, PAL.floor);
      s += screen(200, 180, 400, 280);
      s += marker(400, 320, "A", PAL.screen);
      s += rect(700, 200, 300, 400, PAL.floor2);
      s += marker(850, 400, "B", PAL.accent);
      s += `<text x="850" y="460" text-anchor="middle" fill="${PAL.text}" font-size="10">монтажный стол</text>`;
      s += rect(150, 600, 100, 80, PAL.rust);
      s += marker(200, 640, "C", "#7eb8da");
      s += `<text x="200" y="700" text-anchor="middle" fill="${PAL.text}" font-size="10">запасной выход</text>`;
      return s;
    },
  },
  {
    file: "08-dvor-pepelishche",
    title: "Двор квартала 12",
    subtitle: "Пепелище Грейс · Брэгг",
    body: () => {
      let s = rect(0, 0, W, H, PAL.ash);
      s += rect(200, 200, 800, 500, "#2a2020");
      for (let i = 0; i < 20; i++) {
        const x = 250 + (i % 5) * 150;
        const y = 250 + Math.floor(i / 5) * 100;
        s += `<rect x="${x}" y="${y}" width="40" height="20" fill="${PAL.danger}" opacity="0.4" transform="rotate(${i * 17} ${x + 20} ${y + 10})"/>`;
      }
      s += marker(600, 450, "A", PAL.accent);
      s += `<text x="600" y="520" text-anchor="middle" fill="${PAL.text}" font-size="11">Брэгг</text>`;
      s += rect(350, 350, 120, 80, PAL.floor2);
      s += marker(410, 390, "B", "#7eb8da");
      s += `<text x="410" y="450" text-anchor="middle" fill="${PAL.text}" font-size="10">уцелевшая страница</text>`;
      s += marker(900, 300, "C", PAL.danger);
      s += `<text x="900" y="360" text-anchor="middle" fill="${PAL.text}" font-size="10">патруль</text>`;
      return s;
    },
  },
  {
    file: "09-stantsiya-ostatok",
    title: "Станция «Остаток»",
    subtitle: "Платформа 7 · финал",
    body: () => {
      let s = rect(0, 0, W, H, PAL.bg);
      s += rect(0, 400, W, 200, PAL.rust);
      for (let i = 0; i < 8; i++) s += rect(80 + i * 140, 410, 100, 12, "#666");
      s += rect(100, 150, 900, 200, PAL.floor2);
      s += marker(550, 250, "A", PAL.accent);
      s += `<text x="550" y="310" text-anchor="middle" fill="${PAL.text}" font-size="12">платформа 7</text>`;
      s += rect(800, 500, 300, 120, "#3d3028");
      s += marker(950, 560, "B");
      s += `<text x="950" y="640" text-anchor="middle" fill="${PAL.text}" font-size="10">состав</text>`;
      s += marker(200, 500, "C", PAL.danger);
      s += `<text x="200" y="560" text-anchor="middle" fill="${PAL.text}" font-size="10">контроль Брэгга</text>`;
      s += `<circle cx="1100" cy="80" r="40" fill="${PAL.danger}" opacity="0.7"/>`;
      s += `<text x="1100" y="85" text-anchor="middle" fill="${PAL.text}" font-size="10">вспышки</text>`;
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

console.log(`Done: ${maps.length} maps in pepel-slov/`);

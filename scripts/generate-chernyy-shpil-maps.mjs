// Карты для «Зов из Чёрного шпиля» — тёмное фэнтези, сетка, маркеры A/B/C
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "rpg", "adventure", "maps", "chernyy-shpil");
fs.mkdirSync(OUT, { recursive: true });

const W = 1200;
const H = 900;
const GRID = 60;

const PAL = {
  bg: "#141218",
  floor: "#2a2830",
  floor2: "#3d3848",
  wall: "#0c0a10",
  stone: "#4a4658",
  accent: "#9d4edd",
  silver: "#b8c0d4",
  swamp: "#2d4a3e",
  lava: "#c1121f",
  text: "#e8e0f0",
  ash: "#6b6578",
  wood: "#5c4033",
};

function grid() {
  let lines = "";
  for (let x = 0; x <= W; x += GRID) {
    lines += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="#ffffff05" stroke-width="1"/>`;
  }
  for (let y = 0; y <= H; y += GRID) {
    lines += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#ffffff05" stroke-width="1"/>`;
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
  ${subtitle ? `<text x="36" y="78" fill="${PAL.accent}" font-family="Georgia, serif" font-size="14">${subtitle}</text>` : ""}`;
}

function marker(cx, cy, letter, color = PAL.accent) {
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
    <radialGradient id="glow" cx="50%" cy="30%" r="70%">
      <stop offset="0%" stop-color="transparent"/>
      <stop offset="100%" stop-color="#0a0810"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#glow)" opacity="0.45"/>
  ${label(title, subtitle)}
</svg>`;
}

const maps = [
  {
    file: "00-obzor-vestmar",
    title: "Вестмар и Чёрный шпиль",
    subtitle: "Обзор маршрута · болота и крепость",
    body: () => {
      let s = rect(0, 0, W, H, PAL.swamp);
      s += rect(80, 500, 1040, 320, "#1a3028");
      for (let i = 0; i < 12; i++) {
        s += `<ellipse cx="${150 + i * 85}" cy="${620 + (i % 3) * 40}" rx="50" ry="25" fill="${PAL.swamp}" opacity="0.8"/>`;
      }
      s += rect(900, 80, 200, 380, PAL.stone);
      s += `<polygon points="1000,80 920,60 1080,60" fill="${PAL.wall}"/>`;
      s += marker(1000, 200, "1", PAL.accent);
      s += `<text x="1000" y="250" text-anchor="middle" fill="${PAL.silver}" font-size="11">Чёрный шпиль</text>`;
      s += marker(200, 350, "A", PAL.wood);
      s += `<text x="200" y="400" text-anchor="middle" fill="${PAL.text}" font-size="11">столица / шатры</text>`;
      s += marker(350, 650, "B");
      s += `<text x="350" y="700" text-anchor="middle" fill="${PAL.text}" font-size="11">Край Оврага</text>`;
      s += marker(650, 550, "C", PAL.silver);
      s += `<text x="650" y="600" text-anchor="middle" fill="${PAL.text}" font-size="11">холм щитов</text>`;
      return s;
    },
  },
  {
    file: "01-shatry-brifing",
    title: "Шатры у Каменного моста",
    subtitle: "Брифинг · Терон и (опц.) королева Милдред",
    body: () => {
      let s = rect(0, 0, W, H, PAL.floor);
      s += rect(150, 200, 400, 280, "#4a3a5a");
      s += marker(350, 340, "A", PAL.accent);
      s += `<text x="350" y="400" text-anchor="middle" fill="${PAL.text}" font-size="11">стол регента</text>`;
      s += rect(620, 180, 350, 320, PAL.wood);
      s += marker(795, 340, "B", PAL.silver);
      s += `<text x="795" y="400" text-anchor="middle" fill="${PAL.text}" font-size="10">ленты и герб</text>`;
      s += rect(200, 600, 800, 120, PAL.stone);
      s += marker(600, 660, "C");
      s += `<text x="600" y="720" text-anchor="middle" fill="${PAL.text}" font-size="10">дорога к болотам</text>`;
      return s;
    },
  },
  {
    file: "02-taverna-bezymyannogo",
    title: "«У Безымянного»",
    subtitle: "Край Оврага · доска тринадцати",
    body: () => {
      let s = rect(0, 0, W, H, PAL.wood);
      s += rect(80, 80, 1040, 740, PAL.floor2);
      s += rect(120, 120, 500, 400, "#2a2528");
      s += marker(370, 320, "A", PAL.accent);
      s += `<text x="370" y="380" text-anchor="middle" fill="${PAL.text}" font-size="11">доска I–XIII</text>`;
      s += rect(700, 200, 350, 250, PAL.wood);
      s += marker(875, 325, "B");
      s += `<text x="875" y="385" text-anchor="middle" fill="${PAL.text}" font-size="10">бар / Гав</text>`;
      s += rect(150, 580, 200, 120, PAL.wall);
      s += marker(250, 640, "C", PAL.lava);
      s += `<text x="250" y="700" text-anchor="middle" fill="${PAL.text}" font-size="10">драка / выход</text>`;
      return s;
    },
  },
  {
    file: "03-holm-shchitov",
    title: "Холм щитов",
    subtitle: "Следы двенадцати отрядов",
    body: () => {
      let s = rect(0, 0, W, H, PAL.swamp);
      s += `<ellipse cx="600" cy="500" rx="380" ry="220" fill="${PAL.stone}" opacity="0.7"/>`;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const x = 600 + Math.cos(a) * 200;
        const y = 500 + Math.sin(a) * 120;
        s += `<rect x="${x - 25}" y="${y - 30}" width="50" height="60" fill="${PAL.ash}" transform="rotate(${i * 40} ${x} ${y})"/>`;
      }
      s += marker(600, 450, "A", PAL.accent);
      s += `<text x="600" y="380" text-anchor="middle" fill="${PAL.silver}" font-size="11">щит VII «Не верь голосу»</text>`;
      s += marker(200, 700, "B");
      s += `<text x="200" y="750" text-anchor="middle" fill="${PAL.text}" font-size="10">тропа к шпилю</text>`;
      s += marker(1000, 250, "C", PAL.accent);
      s += `<text x="1000" y="300" text-anchor="middle" fill="${PAL.text}" font-size="10">вид на шпиль</text>`;
      return s;
    },
  },
  {
    file: "04-vrata-i-most",
    title: "Врата шпиля",
    subtitle: "Болотный мост · брат Эмиль",
    body: () => {
      let s = rect(0, 300, W, 600, PAL.swamp);
      s += rect(400, 100, 400, 500, PAL.stone);
      s += rect(520, 120, 160, 200, PAL.wall);
      s += marker(600, 220, "A", PAL.accent);
      s += `<text x="600" y="350" text-anchor="middle" fill="${PAL.text}" font-size="11">арка и руны</text>`;
      s += rect(200, 450, 800, 80, PAL.wood);
      s += marker(600, 490, "B");
      s += `<text x="600" y="560" text-anchor="middle" fill="${PAL.text}" font-size="10">мост (Выживание)</text>`;
      s += marker(450, 200, "C", PAL.silver);
      s += `<text x="450" y="160" text-anchor="middle" fill="${PAL.text}" font-size="10">Эмиль</text>`;
      return s;
    },
  },
  {
    file: "05-chasovnya",
    title: "Часовня 1-го яруса",
    subtitle: "Иконы · люк в склеп · лестница вверх",
    body: () => {
      let s = rect(0, 0, W, H, PAL.floor);
      s += rect(100, 100, 1000, 700, PAL.floor2);
      s += rect(450, 150, 300, 200, PAL.stone);
      s += marker(600, 250, "A", PAL.accent);
      s += `<text x="600" y="380" text-anchor="middle" fill="${PAL.text}" font-size="11">алтарь / икона</text>`;
      s += rect(150, 500, 200, 150, PAL.wall);
      s += marker(250, 575, "B", "#7eb8da");
      s += `<text x="250" y="670" text-anchor="middle" fill="${PAL.text}" font-size="10">люк в склеп</text>`;
      s += rect(950, 400, 100, 300, PAL.stone);
      s += marker(1000, 550, "C");
      s += `<text x="1000" y="620" text-anchor="middle" fill="${PAL.text}" font-size="10">лестница ↑</text>`;
      return s;
    },
  },
  {
    file: "06-galereya-portretov",
    title: "Галерея портретов",
    subtitle: "2-й ярус · портрет Элары · засада",
    body: () => {
      let s = rect(0, 0, W, H, PAL.wall);
      s += rect(80, 120, 1040, 200, PAL.wood);
      for (let i = 0; i < 6; i++) {
        s += rect(120 + i * 170, 140, 120, 160, PAL.floor2);
        s += `<rect x="${140 + i * 170}" y="160" width="80" height="100" fill="${PAL.accent}" opacity="0.25"/>`;
      }
      s += marker(1050, 220, "A", PAL.accent);
      s += `<text x="1050" y="360" text-anchor="middle" fill="${PAL.silver}" font-size="10">портрет Элары</text>`;
      s += marker(400, 550, "B", PAL.lava);
      s += `<text x="400" y="610" text-anchor="middle" fill="${PAL.text}" font-size="10">полый страж</text>`;
      s += rect(700, 500, 80, 120, PAL.stone);
      s += marker(740, 560, "C", "#7eb8da");
      s += `<text x="740" y="640" text-anchor="middle" fill="${PAL.text}" font-size="10">записка Годвина</text>`;
      s += rect(80, 750, 120, 40, PAL.stone);
      s += `<text x="140" y="775" text-anchor="middle" fill="${PAL.lava}" font-size="10">дверь запирается</text>`;
      return s;
    },
  },
  {
    file: "07-oruzheynaya",
    title: "Оружейная",
    subtitle: "Круг из двенадцати шлемов",
    body: () => {
      let s = rect(0, 0, W, H, PAL.floor);
      s += rect(150, 150, 900, 600, PAL.floor2);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
        const x = 600 + Math.cos(a) * 220;
        const y = 450 + Math.sin(a) * 180;
        s += `<circle cx="${x}" cy="${y}" r="28" fill="${PAL.ash}"/>`;
      }
      s += marker(600, 450, "A", PAL.accent);
      s += `<text x="600" y="520" text-anchor="middle" fill="${PAL.text}" font-size="11">шлем с зубом дракона</text>`;
      s += marker(950, 200, "B");
      s += `<text x="950" y="260" text-anchor="middle" fill="${PAL.text}" font-size="10">лестница к мосту</text>`;
      return s;
    },
  },
  {
    file: "08-most-pepelnitsy",
    title: "Мост Пепельницы",
    subtitle: "Лава · дракон · цепь рун",
    body: () => {
      let s = rect(0, 400, W, 500, PAL.lava);
      s += rect(0, 420, W, 200, "#4a1018");
      s += rect(250, 350, 700, 100, PAL.stone);
      s += marker(600, 400, "A", PAL.accent);
      s += marker(150, 500, "B");
      s += `<text x="150" y="560" text-anchor="middle" fill="${PAL.text}" font-size="10">вход партии</text>`;
      s += rect(950, 200, 180, 200, PAL.wall);
      s += marker(1040, 300, "C", PAL.lava);
      s += `<text x="1040" y="360" text-anchor="middle" fill="${PAL.text}" font-size="11">Пепельница</text>`;
      s += `<circle cx="1040" cy="250" r="35" fill="none" stroke="${PAL.accent}" stroke-width="4"/>`;
      s += `<text x="1040" y="430" text-anchor="middle" fill="${PAL.silver}" font-size="10">цепь рун</text>`;
      return s;
    },
  },
  {
    file: "09-koridor-zerkal",
    title: "Коридор зеркал",
    subtitle: "Семь зеркал · пепел в седьмом",
    body: () => {
      let s = rect(0, 0, W, H, PAL.wall);
      s += rect(100, 200, 1000, 500, PAL.floor);
      for (let i = 0; i < 7; i++) {
        s += rect(140 + i * 155, 250, 100, 280, PAL.silver);
        s += `<rect x="${150 + i * 155}" y="260" width="80" height="200" fill="#1a1828" opacity="0.8"/>`;
      }
      s += marker(895, 390, "A", PAL.accent);
      s += `<text x="895" y="560" text-anchor="middle" fill="${PAL.text}" font-size="10">7-е: пепел</text>`;
      s += marker(400, 750, "B");
      s += `<text x="400" y="800" text-anchor="middle" fill="${PAL.text}" font-size="10">вход</text>`;
      s += marker(800, 750, "C");
      s += `<text x="800" y="800" text-anchor="middle" fill="${PAL.text}" font-size="10">к комнате</text>`;
      return s;
    },
  },
  {
    file: "10-komnata-zerkalo",
    title: "Комната «принцессы»",
    subtitle: "Пустая кровать · Зеркало душ · финал",
    body: () => {
      let s = rect(0, 0, W, H, PAL.floor2);
      s += `<circle cx="600" cy="450" r="380" fill="${PAL.floor}" stroke="${PAL.accent}" stroke-width="3"/>`;
      s += rect(480, 380, 240, 180, PAL.silver);
      s += marker(600, 470, "A", PAL.accent);
      s += `<text x="600" y="580" text-anchor="middle" fill="${PAL.text}" font-size="11">пустая кровать</text>`;
      s += rect(520, 120, 160, 220, "#1a1828");
      s += `<rect x="530" y="130" width="140" height="180" fill="${PAL.accent}" opacity="0.2"/>`;
      s += marker(600, 220, "B", PAL.lava);
      s += `<text x="600" y="360" text-anchor="middle" fill="${PAL.silver}" font-size="12">Зеркало душ</text>`;
      s += marker(200, 450, "C");
      s += `<text x="200" y="510" text-anchor="middle" fill="${PAL.text}" font-size="10">Терон входит</text>`;
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

console.log(`Done: ${maps.length} maps in chernyy-shpil/`);

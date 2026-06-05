// УСТАРЕЛО: примитивные SVG-схемы. Актуальные карты — PNG в maps/chernyy-schet/
// (живописные battlemap, сгенерированы в стиле 01-gorod / 02-taverna).
// Установка: node scripts/install-chernyy-schet-maps.mjs <папка-с-png>

// Генерация SVG-карт для «Чёрного счёта» (нуар, top-down, сетка) — legacy
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "rpg", "adventure", "maps", "chernyy-schet");
fs.mkdirSync(OUT, { recursive: true });

const W = 1200;
const H = 900;
const GRID = 60;

const PAL = {
  bg: "#1a2332",
  floor: "#2c3544",
  floor2: "#3a4556",
  wall: "#0f1419",
  accent: "#c9a227",
  water: "#1e3a5f",
  fog: "rgba(180,200,220,0.12)",
  text: "#e8dcc8",
  danger: "#8b3a3a",
  wood: "#4a3728",
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
  <rect x="20" y="20" width="420" height="${subtitle ? 72 : 48}" fill="${PAL.wall}" opacity="0.85" rx="4"/>
  <text x="36" y="52" fill="${PAL.text}" font-family="Georgia, serif" font-size="22">${title}</text>
  ${subtitle ? `<text x="36" y="78" fill="${PAL.accent}" font-family="Georgia, serif" font-size="14">${subtitle}</text>` : ""}`;
}

function marker(cx, cy, letter, color = PAL.accent) {
  return `
  <circle cx="${cx}" cy="${cy}" r="22" fill="${color}" opacity="0.9"/>
  <text x="${cx}" y="${cy + 6}" text-anchor="middle" fill="#111" font-size="18" font-weight="bold">${letter}</text>`;
}

function wrap(title, subtitle, body) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${PAL.bg}"/>
  ${body}
  ${grid()}
  <rect width="${W}" height="${H}" fill="url(#fog)" opacity="0.35"/>
  <defs>
    <radialGradient id="fog" cx="50%" cy="40%" r="70%">
      <stop offset="0%" stop-color="transparent"/>
      <stop offset="100%" stop-color="#0a0e14"/>
    </radialGradient>
  </defs>
  ${label(title, subtitle)}
</svg>`;
}

const maps = [
  {
    file: "01-seraya-lestnitsa",
    title: "Серая лестница",
    subtitle: "Набережная · место находки тела",
    body: () => {
      let s = rect(0, 500, W, 400, PAL.water);
      s += `<path d="M0 500 Q300 480 600 500 T1200 490 L1200 900 L0 900 Z" fill="${PAL.water}" opacity="0.9"/>`;
      s += rect(200, 350, 800, 160, PAL.floor);
      for (let i = 0; i < 12; i++) s += rect(220 + i * 65, 360, 50, 140, PAL.floor2);
      s += rect(750, 200, 120, 280, PAL.wall);
      s += marker(810, 320, "A", "#7eb8da");
      s += marker(480, 420, "B", PAL.danger);
      s += `<text x="480" y="470" text-anchor="middle" fill="${PAL.text}" font-size="11" opacity="0.7">след волочения</text>`;
      s += rect(900, 380, 80, 40, PAL.wood);
      s += marker(940, 400, "C");
      return s;
    },
  },
  {
    file: "02-morg",
    title: "Морг при больнице",
    subtitle: "Холодный зал · стол и коридор",
    body: () => {
      let s = rect(0, 0, W, H, PAL.floor);
      s += rect(80, 120, 500, 600, PAL.floor2);
      s += rect(200, 300, 260, 120, "#5a6a7a");
      s += marker(330, 360, "A");
      s += rect(650, 80, 400, 720, PAL.wall);
      s += rect(700, 200, 300, 40, PAL.floor2);
      s += marker(850, 400, "B");
      return s;
    },
  },
  {
    file: "03-ratusha",
    title: "Площадь Ратуши",
    subtitle: "Доска приказов · стража",
    body: () => {
      let s = rect(0, 0, W, H, PAL.floor);
      s += rect(400, 100, 400, 500, PAL.floor2);
      s += rect(520, 200, 160, 200, PAL.wood);
      s += marker(600, 300, "A");
      s += rect(100, 600, 200, 120, PAL.wall);
      s += rect(900, 600, 200, 120, PAL.wall);
      s += marker(200, 200, "B");
      return s;
    },
  },
  {
    file: "04-apteka",
    title: "Аптека «Сухая соль»",
    subtitle: "Витрина · журнал рецептов",
    body: () => {
      let s = rect(0, 0, W, H, PAL.floor);
      s += rect(60, 80, 1080, 740, PAL.floor2);
      for (let i = 0; i < 8; i++) s += rect(100 + i * 130, 150, 80, 200, "#4a5a6a");
      s += rect(800, 500, 280, 200, PAL.wood);
      s += marker(940, 600, "A");
      s += marker(300, 400, "B");
      return s;
    },
  },
  {
    file: "05-zolotoy-list",
    title: "Отель «Золотой Лист»",
    subtitle: "Коридор · служебный проход",
    body: () => {
      let s = rect(0, 0, W, H, "#3d2e28");
      s += rect(100, 100, 1000, 200, PAL.floor2);
      s += rect(100, 350, 1000, 200, PAL.floor2);
      s += rect(100, 600, 1000, 200, PAL.floor2);
      for (let i = 0; i < 6; i++) s += rect(180 + i * 160, 120, 100, 160, PAL.wood);
      s += rect(950, 350, 80, 400, PAL.danger);
      s += marker(990, 500, "A", PAL.danger);
      s += marker(400, 450, "B");
      s += marker(700, 650, "C");
      return s;
    },
  },
  {
    file: "06-prachechnaya",
    title: "Прачечная «Белый пар»",
    subtitle: "Мешки · клеймо верфи",
    body: () => {
      let s = rect(0, 0, W, H, PAL.floor);
      s += rect(150, 200, 900, 500, PAL.floor2);
      for (let i = 0; i < 10; i++) s += rect(200 + i * 85, 250, 60, 80, "#d8dce8");
      s += marker(600, 500, "A");
      s += `<ellipse cx="900" cy="700" rx="120" ry="40" fill="${PAL.water}" opacity="0.5"/>`;
      return s;
    },
  },
  {
    file: "07-kanatnaya",
    title: "Канатная мастерская",
    subtitle: "Верёвки · двойной узел",
    body: () => {
      let s = rect(0, 0, W, H, PAL.wood);
      s += rect(80, 100, 1040, 700, PAL.floor2);
      for (let i = 0; i < 15; i++) {
        s += `<line x1="120" y1="${150 + i * 40}" x2="1080" y2="${150 + i * 40}" stroke="#6a5038" stroke-width="8"/>`;
      }
      s += marker(600, 450, "A");
      s += rect(900, 600, 180, 120, PAL.wall);
      return s;
    },
  },
  {
    file: "08-rybnyy-rynok",
    title: "Рыбный рынок",
    subtitle: "Причал · ящики Ласточек",
    body: () => {
      let s = rect(0, 550, W, 350, PAL.water);
      s += rect(0, 0, W, 550, PAL.floor);
      for (let i = 0; i < 12; i++) s += rect(80 + i * 90, 200, 70, 50, "#8ab4c8");
      s += marker(400, 400, "A");
      s += rect(800, 300, 300, 200, PAL.wood);
      s += marker(950, 400, "B");
      return s;
    },
  },
  {
    file: "09-ebonit",
    title: "Клуб «Эбонит»",
    subtitle: "Зал · бар · карточки гостей",
    body: () => {
      let s = rect(0, 0, W, H, "#1f1520");
      s += rect(100, 500, 1000, 300, "#4a2040");
      s += rect(200, 150, 800, 300, PAL.floor2);
      s += rect(500, 200, 200, 80, PAL.accent);
      s += marker(600, 350, "A");
      s += marker(900, 600, "B");
      for (let i = 0; i < 8; i++) s += rect(220 + i * 100, 520, 60, 60, "#2a1828");
      return s;
    },
  },
  {
    file: "10-mayak",
    title: "Ресторан «Маяк»",
    subtitle: "Зал с видом на воду",
    body: () => {
      let s = rect(0, 400, W, 500, PAL.water);
      s += rect(0, 0, W, 400, PAL.floor2);
      for (let i = 0; i < 10; i++) s += rect(100 + i * 100, 150, 50, 50, PAL.wood);
      s += rect(0, 350, W, 30, "#6a8ab0");
      s += marker(600, 250, "A");
      return s;
    },
  },
  {
    file: "11-obitel",
    title: "Обитель Св. Эвальда",
    subtitle: "Двор · исповедальня",
    body: () => {
      let s = rect(0, 0, W, H, PAL.floor);
      s += rect(300, 80, 600, 500, PAL.floor2);
      s += rect(450, 150, 300, 350, PAL.wall);
      s += marker(600, 350, "A");
      s += rect(100, 600, 200, 150, "#3a4a3a");
      s += rect(900, 600, 200, 150, "#3a4a3a");
      return s;
    },
  },
  {
    file: "12-osobnyak-noll",
    title: "Особняк Нолла",
    subtitle: "Кабинет · сейф",
    body: () => {
      let s = rect(0, 0, W, H, "#2a2420");
      s += rect(200, 100, 800, 700, PAL.floor2);
      s += rect(700, 500, 200, 180, PAL.wall);
      s += marker(800, 590, "A", PAL.accent);
      s += rect(250, 200, 400, 250, PAL.wood);
      s += marker(450, 320, "B");
      return s;
    },
  },
  {
    file: "13-dokerskiy-sklad",
    title: "Докерский склад №3",
    subtitle: "Ящики · военная маркировка",
    body: () => {
      let s = rect(0, 0, W, H, PAL.wood);
      s += rect(50, 50, 1100, 800, PAL.floor2);
      for (let r = 0; r < 4; r++)
        for (let c = 0; c < 6; c++)
          s += rect(120 + c * 170, 120 + r * 150, 140, 120, "#5a4a38");
      s += marker(600, 450, "A");
      s += rect(0, 750, W, 150, PAL.water);
      return s;
    },
  },
  {
    file: "14-priut",
    title: "Приют «Белая Крапива»",
    subtitle: "Двор · комната детей",
    body: () => {
      let s = rect(0, 0, W, H, PAL.floor);
      s += rect(150, 150, 900, 600, "#4a5a4a");
      s += rect(400, 300, 400, 300, PAL.floor2);
      s += marker(600, 450, "A");
      s += rect(200, 500, 120, 100, PAL.wood);
      return s;
    },
  },
  {
    file: "15-palata-arhiv",
    title: "Портовая палата — архив",
    subtitle: "Печати · код якоря",
    body: () => {
      let s = rect(0, 0, W, H, PAL.floor);
      s += rect(100, 100, 1000, 700, PAL.floor2);
      for (let i = 0; i < 20; i++) s += rect(150 + (i % 5) * 200, 180 + Math.floor(i / 5) * 140, 160, 100, PAL.wood);
      s += marker(600, 450, "A");
      return s;
    },
  },
  {
    file: "16-komendatura",
    title: "Комендатура",
    subtitle: "Коридор · журнал проходов",
    body: () => {
      let s = rect(0, 0, W, H, PAL.wall);
      s += rect(200, 80, 800, 740, PAL.floor2);
      s += rect(500, 200, 200, 500, PAL.floor);
      s += marker(600, 450, "A");
      s += rect(250, 300, 150, 300, PAL.danger);
      return s;
    },
  },
  {
    file: "17-kazarmy",
    title: "Казармы",
    subtitle: "Койки · капрал Бейтс",
    body: () => {
      let s = rect(0, 0, W, H, PAL.floor);
      for (let i = 0; i < 8; i++) s += rect(150 + i * 120, 200, 100, 220, PAL.wood);
      s += marker(600, 500, "A");
      s += rect(800, 600, 300, 200, PAL.floor2);
      return s;
    },
  },
  {
    file: "18-pirs-7",
    title: "Пирс №7",
    subtitle: "Туман · засада",
    body: () => {
      let s = rect(0, 400, W, 500, PAL.water);
      s += rect(300, 350, 600, 80, PAL.wood);
      s += rect(200, 200, 800, 160, PAL.floor2);
      s += marker(600, 280, "A");
      s += marker(350, 380, "B", PAL.danger);
      s += marker(850, 380, "C", PAL.danger);
      return s;
    },
  },
  {
    file: "19-verf",
    title: "Верфь",
    subtitle: "Настил «Северной Вдовы»",
    body: () => {
      let s = rect(0, 500, W, 400, PAL.water);
      s += rect(100, 100, 1000, 450, PAL.floor2);
      s += rect(400, 200, 400, 300, PAL.wood);
      s += marker(600, 350, "A");
      s += `<polygon points="350,150 850,150 900,100 300,100" fill="#3a4556"/>`;
      return s;
    },
  },
  {
    file: "20-severnaya-vdova-paluba",
    title: "«Северная Вдова» — палуба",
    subtitle: "Бой · тайник под настилом",
    body: () => {
      let s = rect(0, 200, W, 700, PAL.water);
      s += rect(150, 80, 900, 620, PAL.wood);
      s += rect(200, 120, 800, 540, PAL.floor2);
      s += marker(400, 400, "A");
      s += marker(700, 300, "B");
      s += marker(600, 550, "C", PAL.accent);
      s += rect(500, 100, 200, 80, PAL.wall);
      return s;
    },
  },
  {
    file: "21-severnaya-vdova-trum",
    title: "«Северная Вдова» — трюм",
    subtitle: "Ящики · штурманская внизу",
    body: () => {
      let s = rect(0, 0, W, H, "#1a1510");
      for (let i = 0; i < 12; i++) s += rect(100 + (i % 4) * 260, 150 + Math.floor(i / 4) * 200, 220, 160, PAL.wood);
      s += marker(600, 450, "A");
      s += rect(800, 100, 300, 200, PAL.floor2);
      return s;
    },
  },
  {
    file: "22-arsenal",
    title: "Плавучий арсенал",
    subtitle: "Баржа-склад",
    body: () => {
      let s = rect(0, 300, W, 600, PAL.water);
      s += rect(200, 150, 800, 500, PAL.wood);
      for (let i = 0; i < 15; i++) s += rect(250 + (i % 5) * 140, 220 + Math.floor(i / 5) * 120, 120, 90, "#3a3028");
      s += marker(600, 400, "A");
      return s;
    },
  },
  {
    file: "23-slomannyy-fonar",
    title: "Дом «Сломанный Фонарь»",
    subtitle: "Конспиративная комната",
    body: () => {
      let s = rect(0, 0, W, H, PAL.floor);
      s += rect(300, 200, 600, 500, PAL.floor2);
      s += rect(450, 350, 300, 200, PAL.wood);
      s += marker(600, 450, "A", PAL.danger);
      s += rect(750, 100, 80, 120, "#4a4030");
      return s;
    },
  },
  {
    file: "24-katakomby",
    title: "Катакомбы водостока",
    subtitle: "Погоня · тайник Ласточек",
    body: () => {
      let s = rect(0, 0, W, H, PAL.wall);
      s += rect(100, 100, 400, 700, PAL.floor2);
      s += rect(550, 250, 500, 400, PAL.floor);
      s += rect(100, 650, W, 200, PAL.water);
      s += marker(350, 400, "A");
      s += marker(750, 450, "B");
      return s;
    },
  },
  {
    file: "25-dom-u-mysa",
    title: "Дом у мыса",
    subtitle: "Финал · стол на веранде",
    body: () => {
      let s = rect(0, 500, W, 400, PAL.water);
      s += rect(350, 200, 500, 350, PAL.wood);
      s += rect(300, 450, 600, 60, PAL.floor2);
      s += marker(600, 480, "A", PAL.accent);
      s += marker(450, 350, "B");
      s += marker(750, 350, "C");
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

console.log(`Done: ${maps.length} maps in chernyy-schet/`);

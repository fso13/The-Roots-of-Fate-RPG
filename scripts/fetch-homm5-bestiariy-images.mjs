#!/usr/bin/env node
// Скачивает портреты существ HoMM5 с Might and Magic Wiki (Fandom)
// и вставляет их в my_modules/fantasy_bestiary/module.md

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "rpg", "fantasy", "images", "bestiariy");
const BESTIARY_MD = path.join(ROOT, "my_modules", "fantasy_bestiary", "module.md");
const API = "https://mightandmagic.fandom.com/api.php";

/** slug файла → страница вики HoMM5 */
const CREATURES = [
  { slug: "opolchenets", wiki: "Peasant_(H5)", heading: "Ополченец" },
  { slug: "luchnik", wiki: "Archer_(H5)", heading: "Лучник" },
  { slug: "rytsar-na-kone", wiki: "Cavalier_(H5)", heading: "Рыцарь на коне" },
  { slug: "grifon", wiki: "Griffin_(H5)", heading: "Грифон" },
  { slug: "nebesnyy-strazh", wiki: "Angel_(H5)", heading: "Небесный страж" },
  { slug: "bes", wiki: "Imp_(H5)", heading: "Бес" },
  { slug: "adskaya-gonchaya", wiki: "Hell_hound_(H5)", heading: "Адская гончая" },
  { slug: "porozhdenie-bezdny", wiki: "Pit_fiend_(H5)", heading: "Порождение бездны" },
  { slug: "sukkub", wiki: "Succubus_(H5)", heading: "Суккуб" },
  { slug: "skelet-voin", wiki: "Skeleton_(H5)", heading: "Скелет-воин" },
  { slug: "vampir", wiki: "Vampire_(H5)", heading: "Вампир" },
  { slug: "lich", wiki: "Lich_(H5)", heading: "Лич" },
  { slug: "kostyanoy-drakon", wiki: "Bone_dragon_(H5)", heading: "Костяной дракон" },
  { slug: "tyomnyy-sledopyt", wiki: "Dark_raider", heading: "Тёмный следопыт" },
  { slug: "minotavr", wiki: "Minotaur_(H5)", heading: "Минотавр" },
  { slug: "gidra", wiki: "Hydra_(H5)", heading: "Гидра" },
  { slug: "chernyy-drakon", wiki: "Black_dragon_(H5)", heading: "Чёрный дракон" },
  { slug: "lesnoy-elf", wiki: "Hunter_(H5)", heading: "Лесной эльф" },
  { slug: "edinorog", wiki: "Unicorn_(H5)", heading: "Единорог" },
  { slug: "dreven", wiki: "Treant_(H5)", heading: "Древень" },
  { slug: "gremlin", wiki: "Gremlin_(H5)", heading: "Гремлин" },
  { slug: "stalnoy-golem", wiki: "Steel_golem_(H5)", heading: "Стальной голем" },
  { slug: "arhimag", wiki: "Archmage_(H5)", heading: "Архимаг" },
  { slug: "gnom-strazh", wiki: "Defender_(H5)", heading: "Гном-страж" },
  { slug: "vsadnik-na-medvede", wiki: "Bear_rider", heading: "Всадник на медведе" },
  { slug: "goblin", wiki: "Goblin_(H5)", heading: "Гоблин" },
  { slug: "ork-voin", wiki: "Mauler_(H5)", heading: "Орк-воин" },
  { slug: "tsiklop", wiki: "Cyclops", heading: "Циклоп" },
  { slug: "chudishte", wiki: "Behemoth", heading: "Чудище" },
  { slug: "troll", wiki: "Troll", heading: "Тролль" },
  { slug: "gigantskiy-pauk", wiki: "Ancient_spider", heading: "Гигантский паук" },
  { slug: "krasnyy-drakon", wiki: "Red_dragon_(H5)", heading: "Красный дракон" },
  { slug: "prizrak", wiki: "Ghost_(H5)", heading: "Призрак" },
  { slug: "doppelganger", wiki: "Rakshasa_raja_(H5)", heading: "Доппельгангер" },
];

async function fetchThumbUrls(wikiTitles) {
  const titles = wikiTitles.join("|");
  const url = `${API}?action=query&format=json&prop=pageimages&pithumbsize=500&titles=${encodeURIComponent(titles)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API ${res.status}`);
  const data = await res.json();
  const byTitle = new Map();
  for (const page of Object.values(data.query.pages)) {
    if (page.missing) continue;
    const src = page.thumbnail?.source;
    if (src) byTitle.set(page.title, src);
  }
  return byTitle;
}

function fullImageUrl(thumbUrl) {
  return thumbUrl.replace(/\/revision\/latest\/scale-to-width-down\/\d+/, "/revision/latest");
}

function extFromUrl(url) {
  const m = url.match(/\.(png|jpg|jpeg|webp)/i);
  return m ? `.${m[1].toLowerCase().replace("jpeg", "jpg")}` : ".jpg";
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download ${res.status}: ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
}

function portraitHtml(slug, alt, ext) {
  return `<figure class="bestiary-portrait"><img src="images/bestiariy/${slug}${ext}" alt="${alt}" loading="lazy" width="200" height="280"></figure>`;
}

function insertPortraitsIntoMd(md, portraits) {
  let out = md;
  for (const { heading, html } of portraits) {
    const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(
      `(### ${escaped}(?:[^\\n]*)\\n\\n)(?:<figure class="bestiary-portrait">[\\s\\S]*?</figure>\\n\\n)?`,
      "u"
    );
    if (!re.test(out)) {
      console.warn("Heading not found:", heading);
      continue;
    }
    out = out.replace(re, `$1${html}\n\n`);
  }
  return out;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const batchSize = 8;
  const thumbByTitle = new Map();

  for (let i = 0; i < CREATURES.length; i += batchSize) {
    const batch = CREATURES.slice(i, i + batchSize);
    const thumbs = await fetchThumbUrls(batch.map((c) => c.wiki));
    for (const [title, src] of thumbs) thumbByTitle.set(title, src);
    await new Promise((r) => setTimeout(r, 300));
  }

  const portraits = [];
  let ok = 0;
  let fail = 0;

  for (const creature of CREATURES) {
    const wikiTitle = creature.wiki.replace(/_/g, " ").replace(/\(H5\)/, "(H5)");
    let thumb = null;
    for (const [title, src] of thumbByTitle) {
      if (title.replace(/ /g, "_") === creature.wiki || title === creature.wiki.replace(/_/g, " ")) {
        thumb = src;
        break;
      }
    }
    if (!thumb) {
      const normalized = creature.wiki.replace(/_/g, " ").replace(/\(H5\)/, " (H5)");
      thumb = thumbByTitle.get(normalized) || thumbByTitle.get(creature.wiki.replace(/_/g, " "));
    }
    if (!thumb) {
      console.error("No image:", creature.heading, creature.wiki);
      fail++;
      continue;
    }

    const fullUrl = fullImageUrl(thumb);
    const ext = extFromUrl(fullUrl);
    const dest = path.join(OUT_DIR, `${creature.slug}${ext}`);
    try {
      await download(fullUrl, dest);
      console.log("OK", creature.slug + ext);
      portraits.push({
        heading: creature.heading,
        html: portraitHtml(creature.slug, creature.heading, ext),
      });
      ok++;
      await new Promise((r) => setTimeout(r, 150));
    } catch (e) {
      console.error("FAIL", creature.slug, e.message);
      fail++;
    }
  }

  let md = fs.readFileSync(BESTIARY_MD, "utf8");
  if (!md.includes("иллюстрации — арты")) {
    md = md.replace(
      /(Ниже существа \*\*в духе\*\*[^\n]+\n\n)/,
      `$1*Иллюстрации — арты существ из **Heroes of Might and Magic V** (Ubisoft / Nival); статы ниже — перевод в «Корни судьбы», не официальные данные игры.*\n\n`
    );
  }
  md = insertPortraitsIntoMd(md, portraits);
  fs.writeFileSync(BESTIARY_MD, md, "utf8");

  console.log(`\nDone: ${ok} images, ${fail} failed → ${OUT_DIR}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

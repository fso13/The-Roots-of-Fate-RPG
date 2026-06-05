#!/usr/bin/env node
/**
 * Скачивает портреты существ HoMM V с mightandmagic.fandom.com
 * и кладёт в rpg/fantasy/images/bestiariy/
 *
 * Использование: node scripts/install-homm5-bestiariy-portraits.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "rpg", "fantasy", "images", "bestiariy");
const WIKI_API = "https://mightandmagic.fandom.com/api.php";

/** slug файла → страница вики «Имя (H5)» */
const CREATURES = [
  ["opolchenets", "Peasant"],
  ["luchnik", "Archer"],
  ["rytsar-kon", "Cavalier"],
  ["grifon", "Griffin"],
  ["nebesnyy-strazh", "Angel"],
  ["bes", "Imp"],
  ["adskaya-gonchaya", "Hell Hound"],
  ["porozhdenie-bezdny", "Horned Demon"],
  ["sukkub", "Succubus"],
  ["skelet-voin", "Skeleton"],
  ["vampir", "Vampire"],
  ["lich", "Lich"],
  ["kostyanoy-drakon", "Bone Dragon"],
  ["temniy-sledoput", "Blade Dancer"],
  ["minotavr", "Minotaur"],
  ["gidra", "Hydra"],
  ["chernyy-drakon", "Black Dragon"],
  ["lesnoy-elf", "Hunter"],
  ["edinorog", "Unicorn"],
  ["dreven", "Treant"],
  ["gremilin", "Gremlin"],
  ["stalnoy-golem", "Steel Golem"],
  ["arhimag", "Archmage"],
  ["gnom-strazh", "Dwarf"],
  ["vsadnik-medved", "Bear Rider"],
  ["goblin", "Goblin"],
  ["ork-voin", "Orc"],
  ["tsiklop", "Cyclop"],
  ["chudische", "Behemoth"],
  ["troll", "Troll"],
  ["gigantskiy-pauk", "Widowmaker"],
  ["krasnyy-drakon", "Red Dragon"],
  ["prizrak", "Ghost"],
  ["doppelganger", "Doppelganger"],
];

async function wikiPageImageUrl(wikiName) {
  const title = `${wikiName} (H5)`;
  const q = new URLSearchParams({
    action: "query",
    titles: title,
    prop: "pageimages",
    format: "json",
    redirects: "1",
  });
  const res = await fetch(`${WIKI_API}?${q}`);
  const data = await res.json();
  const page = Object.values(data.query?.pages || {})[0];
  if (!page || page.missing !== undefined) return null;
  const name = page.pageimage;
  if (!name) return null;

  const iq = new URLSearchParams({
    action: "query",
    titles: `File:${name}`,
    prop: "imageinfo",
    iiprop: "url",
    format: "json",
  });
  const ir = await fetch(`${WIKI_API}?${iq}`);
  const idata = await ir.json();
  const ipage = Object.values(idata.query?.pages || {})[0];
  return ipage?.imageinfo?.[0]?.url || null;
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  let ok = 0;
  let fail = 0;

  for (const [slug, wikiName] of CREATURES) {
    const dest = path.join(OUT, `${slug}.png`);
    try {
      const url = await wikiPageImageUrl(wikiName);
      if (!url) {
        console.warn(`SKIP (no wiki page): ${slug} ← ${wikiName} (H5)`);
        fail++;
        continue;
      }
      await download(url, dest);
      console.log(`OK: ${slug}.png ← ${wikiName}`);
      ok++;
      await new Promise((r) => setTimeout(r, 200));
    } catch (e) {
      console.warn(`FAIL: ${slug} — ${e.message}`);
      fail++;
    }
  }

  console.log(`\nDone: ${ok} ok, ${fail} skipped/failed → ${OUT}`);
}

main();

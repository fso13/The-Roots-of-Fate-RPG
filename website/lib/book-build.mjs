import fs from "fs";
import path from "path";
import { RPG, walkMarkdown, extractTitle } from "./pdf-core.mjs";
import { expandInventarSchema } from "./inventar-schema.mjs";

/** Разрешает относительный href (без .md) в путь rel от корня rpg/ */
export function resolveMdRel(hrefBase, fromRel) {
  const fromDir = path.posix.dirname(fromRel);
  const full = path.posix.normalize(path.posix.join(fromDir === "." ? "" : fromDir, `${hrefBase}.md`));
  const stack = [];
  for (const part of full.split("/")) {
    if (part === "..") stack.pop();
    else if (part && part !== ".") stack.push(part);
  }
  return stack.join("/");
}

function stripLinkDecorations(text) {
  return text.replace(/^\*\*|\*\*$/g, "").replace(/^`|`$/g, "").trim();
}

/** Текст ссылки — имя файла (.md), а не человекочитаемый заголовок */
export function isFilenameLinkText(text, targetRel) {
  const stripped = stripLinkDecorations(text);
  if (!/\.md$/i.test(stripped)) return false;
  const normalized = stripped.replace(/^(\.\.\/)+/, "");
  if (normalized === targetRel) return true;
  if (path.posix.basename(normalized) === path.posix.basename(targetRel)) return true;
  return false;
}

export function buildTitleByRel(relFiles) {
  const titleByRel = new Map();
  for (const rel of relFiles) {
    const raw = fs.readFileSync(path.join(RPG, rel), "utf8");
    titleByRel.set(rel, extractTitle(raw) || rel);
  }
  return titleByRel;
}

export const README_FILES = new Set(["README.md", "README-igrok.md", "README-hranitel.md"]);

export const BOOK_SOURCES_SKIP = new Set([
  "kniga-polnaya.md",
  "kniga-homebrewery.md",
  "kniga-igroka.md",
  "kniga-hranitelya.md",
  ...README_FILES,
]);

/** player | keeper — кому предназначена глава */
export const CHAPTER_AUDIENCE = {
  "00-yadro.md": "player",
  "01-moduli.md": "keeper",
  "02-boy.md": "player",
  "03-derevya-talantov.md": "player",
  "04-magiya.md": "player",
  "05-snaryazhenie.md": "player",
  "06-bestiariy.md": "keeper",
  "07-rany.md": "keeper",
  "08-krity-i-promahi.md": "keeper",
  "09-sozdanie-i-uroven.md": "player",
  "10-sostoyaniya.md": "player",
  "11-otryady.md": "keeper",
  "fantasy/01-zaklinaniya.md": "player",
  "fantasy/02-talanty-i-navyki.md": "player",
  "fantasy/03-snaryazhenie.md": "player",
  "fantasy/05-inventar.md": "player",
  "adventure/01-steklyannyy-zvon.md": "keeper",
  "adventure/02-chernyy-schet.md": "keeper",
  "adventure/03-pepel-slov.md": "keeper",
  "adventure/04-zov-chernogo-shpilya.md": "keeper",
  "adventure/05-apokrif-iudy.md": "keeper",
  "adventure/maps/chernyy-schet/MAPS.md": "keeper",
  "adventure/maps/pepel-slov/MAPS.md": "keeper",
  "adventure/maps/chernyy-shpil/MAPS.md": "keeper",
  "adventure/maps/apokrif-iudy/MAPS.md": "keeper",
  "adventure/maps/steklyannyy-zvon/MAPS.md": "keeper",
  "slovar-terminov.md": "player",
  "modules/noir-investigation.md": "keeper",
  "modules/fahrenheit-books.md": "keeper",
  "modules/hero-trap.md": "keeper",
  "modules/gothic-oruzhie.md": "player",
  "modules/gothic-bronya.md": "player",
  "modules/gothic-magiya.md": "player",
  "modules/gothic-talanty.md": "player",
  "modules/skyrim-oruzhie.md": "player",
  "modules/skyrim-bronya.md": "player",
  "modules/skyrim-magiya.md": "player",
  "modules/skyrim-talanty.md": "player",
  "modules/skyrim-bogi.md": "player",
  "modules/skyrim-kulty.md": "player",
  "modules/skyrim-izgotovlenie.md": "player",
  "modules/skyrim-alkhimiya.md": "player",
  "modules/skyrim-frakcii.md": "player",
  "modules/skyrim-karta.md": "player",
  "modules/ognestrel.md": "player",
  "modules/transport.md": "keeper",
};

export const PLAYER_CHAPTER_ORDER = [
  "00-yadro.md",
  "02-boy.md",
  "03-derevya-talantov.md",
  "04-magiya.md",
  "05-snaryazhenie.md",
  "09-sozdanie-i-uroven.md",
  "10-sostoyaniya.md",
  "fantasy/01-zaklinaniya.md",
  "fantasy/02-talanty-i-navyki.md",
  "fantasy/03-snaryazhenie.md",
  "fantasy/05-inventar.md",
  "slovar-terminov.md",
];

/** Порядок глав книги хранителя (только базовые главы, без доп. модулей). */
export const KEEPER_CHAPTER_ORDER = [
  "01-moduli.md",
  "06-bestiariy.md",
  "07-rany.md",
  "08-krity-i-promahi.md",
  "11-otryady.md",
  "slovar-terminov.md",
];

/** Идентификатор набора модулей Gothic. */
export const GOTHIC_PACK = "gothic";

/** Идентификатор набора модулей Skyrim. */
export const SKYRIM_PACK = "skyrim";

export function isGothicModule(mod) {
  return mod?.pack === GOTHIC_PACK;
}

export function isSkyrimModule(mod) {
  return mod?.pack === SKYRIM_PACK;
}

export function isPackModule(mod) {
  return isGothicModule(mod) || isSkyrimModule(mod);
}

/** Кастомные модули: исходник в my_modules/, страница на сайте — modules/*.html */
export const CUSTOM_MODULES = [
  {
    id: "fantasy_bestiary",
    title: "Фэнтези-бестиарий",
    srcRel: "fantasy_bestiary/module.md",
    outRel: "modules/fantasy-bestiariy.html",
    mdRel: "modules/fantasy-bestiariy.md",
    audience: "keeper",
  },
  {
    id: "noir_investigation",
    srcRel: "noir_investigation/module.md",
    outRel: "modules/noir-investigation.html",
    mdRel: "modules/noir-investigation.md",
    audience: "keeper",
  },
  {
    id: "fahrenheit_books",
    srcRel: "fahrenheit_books/module.md",
    outRel: "modules/fahrenheit-books.html",
    mdRel: "modules/fahrenheit-books.md",
    audience: "keeper",
  },
  {
    id: "hero_trap",
    srcRel: "hero_trap/module.md",
    outRel: "modules/hero-trap.html",
    mdRel: "modules/hero-trap.md",
    audience: "keeper",
  },
  {
    id: "gothic_weapons",
    title: "Готика — оружие",
    pack: GOTHIC_PACK,
    srcRel: "gothic/oruzhie/module.md",
    outRel: "modules/gothic-oruzhie.html",
    mdRel: "modules/gothic-oruzhie.md",
    audience: "player",
  },
  {
    id: "gothic_armor",
    title: "Готика — броня",
    pack: GOTHIC_PACK,
    srcRel: "gothic/bronya/module.md",
    outRel: "modules/gothic-bronya.html",
    mdRel: "modules/gothic-bronya.md",
    audience: "player",
  },
  {
    id: "gothic_magic",
    title: "Готика — магия",
    pack: GOTHIC_PACK,
    srcRel: "gothic/magiya/module.md",
    outRel: "modules/gothic-magiya.html",
    mdRel: "modules/gothic-magiya.md",
    audience: "player",
  },
  {
    id: "gothic_talents",
    title: "Готика — таланты",
    pack: GOTHIC_PACK,
    srcRel: "gothic/talanty/module.md",
    outRel: "modules/gothic-talanty.html",
    mdRel: "modules/gothic-talanty.md",
    audience: "player",
  },
  {
    id: "skyrim_weapons",
    title: "Скайрим — оружие",
    pack: SKYRIM_PACK,
    srcRel: "skyrim/oruzhie/module.md",
    outRel: "modules/skyrim-oruzhie.html",
    mdRel: "modules/skyrim-oruzhie.md",
    audience: "player",
  },
  {
    id: "skyrim_armor",
    title: "Скайрим — броня",
    pack: SKYRIM_PACK,
    srcRel: "skyrim/bronya/module.md",
    outRel: "modules/skyrim-bronya.html",
    mdRel: "modules/skyrim-bronya.md",
    audience: "player",
  },
  {
    id: "skyrim_magic",
    title: "Скайрим — магия",
    pack: SKYRIM_PACK,
    srcRel: "skyrim/magiya/module.md",
    outRel: "modules/skyrim-magiya.html",
    mdRel: "modules/skyrim-magiya.md",
    audience: "player",
  },
  {
    id: "skyrim_talents",
    title: "Скайрим — таланты",
    pack: SKYRIM_PACK,
    srcRel: "skyrim/talanty/module.md",
    outRel: "modules/skyrim-talanty.html",
    mdRel: "modules/skyrim-talanty.md",
    audience: "player",
  },
  {
    id: "skyrim_gods",
    title: "Скайрим — боги",
    pack: SKYRIM_PACK,
    srcRel: "skyrim/bogi/module.md",
    outRel: "modules/skyrim-bogi.html",
    mdRel: "modules/skyrim-bogi.md",
    audience: "player",
  },
  {
    id: "skyrim_cults",
    title: "Скайрим — культы",
    pack: SKYRIM_PACK,
    srcRel: "skyrim/kulty/module.md",
    outRel: "modules/skyrim-kulty.html",
    mdRel: "modules/skyrim-kulty.md",
    audience: "player",
  },
  {
    id: "skyrim_crafting",
    title: "Скайрим — изготовление",
    pack: SKYRIM_PACK,
    srcRel: "skyrim/izgotovlenie/module.md",
    outRel: "modules/skyrim-izgotovlenie.html",
    mdRel: "modules/skyrim-izgotovlenie.md",
    audience: "player",
  },
  {
    id: "skyrim_alchemy",
    title: "Скайрим — алхимия",
    pack: SKYRIM_PACK,
    srcRel: "skyrim/alkhimiya/module.md",
    outRel: "modules/skyrim-alkhimiya.html",
    mdRel: "modules/skyrim-alkhimiya.md",
    audience: "player",
  },
  {
    id: "skyrim_factions",
    title: "Скайрим — фракции и гильдии",
    pack: SKYRIM_PACK,
    srcRel: "skyrim/frakcii/module.md",
    outRel: "modules/skyrim-frakcii.html",
    mdRel: "modules/skyrim-frakcii.md",
    audience: "player",
  },
  {
    id: "skyrim_map",
    title: "Скайрим — карта",
    pack: SKYRIM_PACK,
    srcRel: "skyrim/karta/module.md",
    outRel: "modules/skyrim-karta.html",
    mdRel: "modules/skyrim-karta.md",
    audience: "player",
  },
  {
    id: "firearms",
    srcRel: "firearms/module.md",
    outRel: "modules/ognestrel.html",
    mdRel: "modules/ognestrel.md",
    audience: "player",
  },
  {
    id: "vehicles",
    srcRel: "vehicles/module.md",
    outRel: "modules/transport.html",
    mdRel: "modules/transport.md",
    audience: "keeper",
  },
];

/** Приключения на сайте: приключение + модуль + карты. */
export const ADVENTURES = [
  {
    id: "steklyannyy-zvon",
    title: "Стеклянный звон",
    adventureRel: "adventure/01-steklyannyy-zvon.md",
    moduleRel: null,
    mapsRel: "adventure/maps/steklyannyy-zvon/MAPS.md",
  },
  {
    id: "chernyy-schet",
    title: "Чёрный счёт",
    adventureRel: "adventure/02-chernyy-schet.md",
    moduleRel: "modules/noir-investigation.md",
    mapsRel: "adventure/maps/chernyy-schet/MAPS.md",
  },
  {
    id: "pepel-slov",
    title: "Пепел слов",
    adventureRel: "adventure/03-pepel-slov.md",
    moduleRel: "modules/fahrenheit-books.md",
    mapsRel: "adventure/maps/pepel-slov/MAPS.md",
  },
  {
    id: "chernyy-shpil",
    title: "Зов из Чёрного шпиля",
    adventureRel: "adventure/04-zov-chernogo-shpilya.md",
    moduleRel: "modules/hero-trap.md",
    mapsRel: "adventure/maps/chernyy-shpil/MAPS.md",
  },
  {
    id: "apokrif-iudy",
    title: "Поцелуй Иуды",
    adventureRel: "adventure/05-apokrif-iudy.md",
    moduleRel: "modules/noir-investigation.md",
    mapsRel: "adventure/maps/apokrif-iudy/MAPS.md",
  },
];

const README_BY_AUDIENCE = {
  all: "README.md",
  player: "README-igrok.md",
  keeper: "README-hranitel.md",
};

export const GITLAB_RAW =
  "https://gitlab.com/fso13/me-rpg/-/raw/main/rpg";

export function chapterAnchor(rel) {
  return `chapter-${rel.replace(/\.md$/, "").replace(/\//g, "-")}`;
}

export function slugifyHb(title) {
  return title
    .toLowerCase()
    .replace(/[«»"'""]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function chapterAudience(rel) {
  return CHAPTER_AUDIENCE[rel] || null;
}

export function isReadmeFile(rel) {
  return README_FILES.has(rel);
}

export function stripReadmeForBook(md) {
  return md
    .replace(/## Оглавление[\s\S]*?(?=\n## )/, "")
    .replace(/## Книга игрока[\s\S]*?(?=\n## )/, "")
    .replace(/## Книга хранителя[\s\S]*?(?=\n## )/, "")
    .replace(/### Дополнительные модули[\s\S]*?(?=\n## )/, "")
    .replace(/## Приключения[\s\S]*?(?=\n## )/, "")
    .replace(/## Одним файлом[\s\S]*?(?=\n## )/, "")
    .replace(/## Сборка книг[\s\S]*?(?=\n## )/, "")
    .replace(/## PDF[\s\S]*?(?=\n## )/, "")
    .replace(/## Скачать[\s\S]*?(?=\n## )/, "");
}

export function fixMdLinks(md, linkForRel, opts = {}) {
  const { titleByRel, fromRel = "" } = opts;
  return md.replace(/\[([^\]]+)\]\(([^")]*?)\.md(#[^)]*)?\)/g, (_, text, base, hash) => {
    const rel = resolveMdRel(base, fromRel);
    let label = text;
    if (titleByRel && isFilenameLinkText(text, rel)) {
      const title = titleByRel.get(rel);
      if (title) label = title;
    }
    let target = linkForRel(rel);
    if (!target.startsWith("#") && !/\.md$/i.test(target)) {
      target = `${target}.md`;
    }
    return `[${label}](${target}${hash || ""})`;
  });
}

export function buildToc(entries, linkForRel) {
  const lines = ["## Оглавление", ""];
  let group = null;
  for (const e of entries) {
    if (isReadmeFile(e.rel)) continue;
    const g =
      e.rel.startsWith("fantasy/") ? "fantasy" : e.rel.startsWith("adventure/") ? "adventure" : "core";
    if (g !== group) {
      group = g;
      if (g === "fantasy") lines.push("", "### Фэнтези", "");
      if (g === "adventure") lines.push("", "### Приключения", "");
    }
    lines.push(`- [${e.title}](${linkForRel(e.rel)})`);
  }
  lines.push("");
  return lines.join("\n");
}

export function orderBookFiles(relFiles, { audience = "all" } = {}) {
  const readme = relFiles.filter((r) => isReadmeFile(r));
  const content = relFiles.filter((r) => !isReadmeFile(r));

  let ordered = content;
  if (audience === "player") {
    ordered = sortByOrder(content, PLAYER_CHAPTER_ORDER);
  } else if (audience === "keeper") {
    ordered = sortByOrder(content, KEEPER_CHAPTER_ORDER);
  } else if (audience === "all") {
    const player = sortByOrder(
      content.filter((r) => CHAPTER_AUDIENCE[r] === "player"),
      PLAYER_CHAPTER_ORDER
    );
    const keeper = sortByOrder(
      content.filter((r) => CHAPTER_AUDIENCE[r] === "keeper"),
      KEEPER_CHAPTER_ORDER
    );
    ordered = [...player, ...keeper];
  } else {
    const core = content.filter(
      (r) => !r.startsWith("fantasy/") && !r.startsWith("adventure/")
    );
    const fantasy = content.filter((r) => r.startsWith("fantasy/"));
    const adventure = content.filter((r) => r.startsWith("adventure/"));
    ordered = [...core, ...fantasy, ...adventure];
  }

  return [...readme, ...ordered];
}

function sortByOrder(files, order) {
  const set = new Set(files);
  const sorted = order.filter((r) => set.has(r));
  const rest = files.filter((r) => !order.includes(r));
  return [...sorted, ...rest];
}

export function listBookSources({
  includeAdventure = null,
  audience = "all",
  includeCustomModules = false,
} = {}) {
  const readmeRel = README_BY_AUDIENCE[audience] || README_BY_AUDIENCE.all;
  const withAdventure =
    includeAdventure ?? (audience === "all" ? false : audience === "player" ? false : false);

  let relFiles = orderBookFiles(walkMarkdown(RPG)).filter((r) => {
    if (BOOK_SOURCES_SKIP.has(r)) return false;
    if (isReadmeFile(r)) return false;
    if (r.startsWith("modules/")) return false;
    if (audience === "all") {
      if (r.startsWith("adventure/")) return false;
      return CHAPTER_AUDIENCE[r] === "player" || CHAPTER_AUDIENCE[r] === "keeper";
    }
    if (r === "slovar-terminov.md") return true;
    return CHAPTER_AUDIENCE[r] === audience;
  });

  if (!withAdventure) relFiles = relFiles.filter((r) => !r.startsWith("adventure/"));

  if (includeCustomModules) {
    for (const mod of CUSTOM_MODULES) {
      if (audience !== "all" && mod.audience !== audience) continue;
      relFiles.push(mod.mdRel);
    }
  }

  if (fs.existsSync(path.join(RPG, readmeRel))) {
    relFiles = orderBookFiles([readmeRel, ...relFiles], { audience });
  } else {
    relFiles = orderBookFiles(relFiles, { audience });
  }

  return relFiles;
}

export function loadBookEntries(relFiles) {
  const titleByRel = buildTitleByRel(relFiles);

  const linkHash = (rel) => `#${slugifyHb(titleByRel.get(rel) || rel)}`;

  return relFiles.map((rel) => {
    const raw = fs.readFileSync(path.join(RPG, rel), "utf8");
    const md = isReadmeFile(rel) ? stripReadmeForBook(raw) : raw;
    return {
      rel,
      title: titleByRel.get(rel),
      anchor: chapterAnchor(rel),
      hbAnchor: slugifyHb(titleByRel.get(rel)),
      body: expandInventarSchema(
        fixMdLinks(md.trim(), (targetRel) => linkHash(targetRel), { titleByRel, fromRel: rel })
      ),
    };
  });
}

export const BOOK_OUTPUT = {
  all: "kniga-polnaya.md",
  player: "kniga-igroka.md",
  keeper: "kniga-hranitelya.md",
};

export const PDF_OUTPUT = {
  all: "koreni-sudby-polnoe-izdanie.pdf",
  player: "koreni-sudby-kniga-igroka.pdf",
  keeper: "koreni-sudby-kniga-hranitelya.pdf",
};

export const PDF_OUTPUT_CAIRN = {
  all: "koreni-sudby-polnoe-izdanie-cairn.pdf",
  player: "koreni-sudby-kniga-igroka-cairn.pdf",
  keeper: "koreni-sudby-kniga-hranitelya-cairn.pdf",
};

export const PDF_HTML_OUTPUT = {
  all: "print-book-polnoe.html",
  player: "print-book-igrok.html",
  keeper: "print-book-hranitel.html",
};

export const PDF_HTML_OUTPUT_CAIRN = {
  all: "print-book-cairn-polnoe.html",
  player: "print-book-cairn-igrok.html",
  keeper: "print-book-cairn-hranitel.html",
};

export function pdfOutputName(style, audience = "all") {
  const map = style === "cairn" ? PDF_OUTPUT_CAIRN : PDF_OUTPUT;
  return map[audience] || map.all;
}

export function pdfHtmlOutputName(style, audience = "all") {
  const map = style === "cairn" ? PDF_HTML_OUTPUT_CAIRN : PDF_HTML_OUTPUT;
  return map[audience] || map.all;
}

export const PDF_TITLE = {
  all: "Корни судьбы — полное издание",
  player: "Корни судьбы — Книга игрока",
  keeper: "Корни судьбы — Книга хранителя",
};

export function modulePdfFile(mod) {
  return `koreni-sudby-modul-${mod.id.replace(/_/g, "-")}.pdf`;
}

export function adventurePdfFile(adv) {
  return `koreni-sudby-priklyuchenie-${adv.id}.pdf`;
}

export function modulePdfHtmlFile(mod) {
  return `print-modul-${mod.id.replace(/_/g, "-")}.html`;
}

export function adventurePdfHtmlFile(adv) {
  return `print-priklyuchenie-${adv.id}.html`;
}

export function findCustomModule(idOrMdRel) {
  return CUSTOM_MODULES.find((m) => m.id === idOrMdRel || m.mdRel === idOrMdRel);
}

export function findAdventureByRel(adventureRel) {
  return ADVENTURES.find((a) => a.adventureRel === adventureRel);
}

/** Источники глав для PDF одного приключения. */
export function listAdventurePdfSources(adventureId) {
  const adv = ADVENTURES.find((a) => a.id === adventureId);
  if (!adv) throw new Error(`Unknown adventure: ${adventureId}`);
  const module = adv.moduleRel ? findCustomModule(adv.moduleRel) : null;
  const rels = [adv.adventureRel];
  if (adv.mapsRel) rels.push(adv.mapsRel);
  return { adv, rels, module };
}

/** Файлы для скачивания с сайта (public/). */
export const BOOK_DOWNLOAD_GROUPS = [
  {
    id: "player",
    title: "Книга игрока",
    items: [{ file: PDF_OUTPUT.player, label: "PDF, A4" }],
  },
  {
    id: "keeper",
    title: "Книга хранителя",
    items: [{ file: PDF_OUTPUT.keeper, label: "PDF, A4" }],
  },
  {
    id: "all",
    title: "Полное издание",
    items: [{ file: PDF_OUTPUT.all, label: "PDF, A4" }],
  },
];

const PRESERVE_IN_PUBLIC = /^(koreni-sudby-.*\.pdf|print-(book|modul|priklyuchenie).*\.html)$/;

/** Сохранить PDF и print-HTML перед очисткой public/. */
export function preserveBookAssets(publicDir) {
  const preserved = new Map();
  if (!fs.existsSync(publicDir)) return preserved;
  for (const name of fs.readdirSync(publicDir)) {
    if (!PRESERVE_IN_PUBLIC.test(name)) continue;
    preserved.set(name, fs.readFileSync(path.join(publicDir, name)));
  }
  return preserved;
}

export function restoreBookAssets(publicDir, preserved) {
  if (!preserved?.size) return;
  fs.mkdirSync(publicDir, { recursive: true });
  for (const [name, data] of preserved) {
    fs.writeFileSync(path.join(publicDir, name), data);
  }
}

export function copyBooksForDownload(publicDir, rpgDir = RPG) {
  fs.mkdirSync(publicDir, { recursive: true });
  for (const name of Object.values(BOOK_OUTPUT)) {
    const src = path.join(rpgDir, name);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(publicDir, name));
    }
  }
}

/** Копии MD + восстановленные PDF перед финальной вёрсткой index. */
export function syncBookDownloads(publicDir, rpgDir = RPG, preserved = null) {
  copyBooksForDownload(publicDir, rpgDir);
  if (preserved) restoreBookAssets(publicDir, preserved);
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function escapeDownloadHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Компактный блок скачивания PDF на странице модуля или приключения.
 * items: [{ file, label }]
 */
export function renderPagePdfDownloadHtml(
  publicDir,
  { prefix = "", id = "pdf-download", title = "Скачать PDF", items = [], missingHint = "npm run pdf:pack" } = {}
) {
  if (!items.length) return "";

  const links = items
    .map((item) => {
      const diskPath = path.join(publicDir, item.file);
      const href = `${prefix}${item.file}`;
      const size = fs.existsSync(diskPath)
        ? formatFileSize(fs.statSync(diskPath).size)
        : `соберите: ${missingHint}`;
      return `<li><a class="download-link" href="${escapeDownloadHtml(href)}" download>${escapeDownloadHtml(item.label)}</a> <span class="download-meta">${escapeDownloadHtml(size)}</span></li>`;
    })
    .join("\n      ");

  return `
<section class="downloads downloads-page" id="${escapeDownloadHtml(id)}">
  <h2 class="section-title">${escapeDownloadHtml(title)}</h2>
  <p class="downloads-note">PDF для печати и офлайн-игры.</p>
  <ul class="download-list download-list-page">
    ${links}
  </ul>
</section>`;
}

/** HTML-блок «Скачать книги»; prefix — относительный путь к корню public (напр. «../»). */
export function renderBookDownloadsHtml(
  publicDir,
  { prefix = "", id = "downloads", onlyGroupIds = null } = {}
) {
  const groupsSource = onlyGroupIds
    ? BOOK_DOWNLOAD_GROUPS.filter((g) => onlyGroupIds.includes(g.id))
    : BOOK_DOWNLOAD_GROUPS;
  const esc = (s) =>
    String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const groups = groupsSource.map((group) => {
    const links = group.items
      .map((item) => {
        const diskPath = path.join(publicDir, item.file);
        const href = `${prefix}${item.file}`;
        const size = fs.existsSync(diskPath)
          ? formatFileSize(fs.statSync(diskPath).size)
          : "соберите: npm run pdf:all";
        return `<li><a class="download-link" href="${esc(href)}" download>${esc(item.label)}</a> <span class="download-meta">${esc(size)}</span></li>`;
      })
      .join("\n        ");
    if (!links) return "";
    return `
    <div class="download-group">
      <h3>${esc(group.title)}</h3>
      <ul class="download-list">
        ${links}
      </ul>
    </div>`;
  }).filter(Boolean);

  if (!groups.length) return "";

  return `
  <section class="downloads" id="${esc(id)}">
    <h2 class="section-title">Скачать книги</h2>
    <p class="downloads-note">PDF для печати и офлайн-игры.</p>
    <div class="download-grid">
      ${groups.join("")}
    </div>
  </section>`;
}

#!/usr/bin/env node
/**
 * Сборка PDF в папку new_pdf/:
 * - kniga-igroka.pdf
 * - kniga-hranitelya.pdf
 * - polnoe-izdanie.pdf — игрок + хранитель + узкий набор модулей
 * - modules/<pack>.pdf — остальные модули по группам
 * - adventures/*.pdf
 *
 * Usage: node scripts/build-new-pdf.mjs
 */
import fs from "fs";
import path from "path";
import {
  ROOT,
  PUBLIC,
  MY_MODULES,
  buildChapterList,
  buildCustomModuleChapter,
  buildPrintHtml,
  buildBleedSheetHtml,
  buildAdventurePrintHtml,
  renderPdf,
  applyBleedCovers,
  applyAdventureBleedCovers,
  padPdfToBooklet,
  imposeBookletPdf,
  bookletOutputPath,
  ensurePublicBuilt,
  copyPrintCss,
  adventurePrintHtmlFilename,
  ADVENTURE_PDF_OPTS_BASE,
  adventurePdfHeaderFooter,
  adventurePdfRenderOptions,
  PRINT_A5_PDF_OPTS_BASE,
  printChromeTemplates,
} from "../website/lib/pdf-core.mjs";
import {
  listBookSources,
  isReadmeFile,
  stripReadmeForBook,
  CUSTOM_MODULES,
  ADVENTURES,
  listAdventurePdfSources,
  CHAPTER_AUDIENCE,
  GOTHIC_PACK,
  SKYRIM_PACK,
  HOMM3_PACK,
  ELDEN_RING_PACK,
} from "../website/lib/book-build.mjs";
import { buildCairnPdf } from "./build-pdf-cairn.mjs";
import { buildCharacterSheetChapterHtml } from "../website/lib/character-sheet-print.mjs";

const OUT_DIR = path.join(ROOT, "new_pdf");
const ADV_DIR = path.join(OUT_DIR, "adventures");
const MOD_DIR = path.join(OUT_DIR, "modules");

/** Модули, которые входят в полное издание (раздел «Модули»). */
const FULL_EDITION_MODULE_IDS = new Set(["firearms", "vehicles", "noir_investigation"]);

/** Глава магии ядра — в полном издании в разделе «Модули», не в «Для игрока». */
const MAGIC_CHAPTER_REL = "04-magiya.md";

const FONT_LINKS = `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=MedievalSharp&family=Source+Sans+3:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">`;

function isAdventureModule(mod) {
  return /adventure/i.test(mod.id) || /\/adventure\//.test(mod.srcRel);
}

function moduleExists(mod) {
  return fs.existsSync(path.join(MY_MODULES, mod.srcRel));
}

function fullEditionModules() {
  return CUSTOM_MODULES.filter(
    (mod) => FULL_EDITION_MODULE_IDS.has(mod.id) && moduleExists(mod)
  );
}

/** Группы паков → отдельные PDF. */
const MODULE_PACK_GROUPS = [
  {
    id: "gothic",
    title: "Gothic",
    file: "gothic.pdf",
    match: (m) => m.pack === GOTHIC_PACK && !isAdventureModule(m),
  },
  {
    id: "skyrim",
    title: "Skyrim",
    file: "skyrim.pdf",
    match: (m) => m.pack === SKYRIM_PACK && !isAdventureModule(m),
  },
  {
    id: "elden-ring",
    title: "Elden Ring",
    file: "elden-ring.pdf",
    match: (m) => m.pack === ELDEN_RING_PACK && !isAdventureModule(m),
  },
  {
    id: "homm3",
    title: "Heroes III",
    file: "homm3.pdf",
    match: (m) => m.pack === HOMM3_PACK && !isAdventureModule(m),
  },
  {
    id: "fantasy-bestiariy",
    title: "Фэнтези-бестиарий",
    file: "fantasy-bestiariy.pdf",
    match: (m) => m.id === "fantasy_bestiary",
  },
  {
    id: "prochee",
    title: "Прочие модули",
    file: "prochee.pdf",
    match: (m) =>
      !isAdventureModule(m) &&
      !FULL_EDITION_MODULE_IDS.has(m.id) &&
      !m.pack &&
      m.id !== "fantasy_bestiary",
  },
];

function coverHtml(subtitle, tagline = "Только d6 · игрок · хранитель · модули") {
  return `
  <div class="print-cairn-cover">
    <img class="cover-art" src="images/the-edge-cover.png" alt="">
    <div class="cover-art-shade" aria-hidden="true"></div>
    <div class="print-cairn-cover-inner">
      <div class="cover-top">
        <h1>The Edge!</h1>
        <p class="cover-book">${subtitle}</p>
      </div>
      <div class="cover-bottom">
        <p class="edition">Модульная настольная ролевая игра</p>
        <p class="tagline">${tagline}</p>
        <p class="cover-credits"><span class="credit-label">Авторы</span> Тайная гильдия · fso13</p>
        <p class="cover-playtesters"><span class="credit-label">Плейтестеры</span> fso13 · sidiusktan · nuttyCheese · deadelfdance</p>
      </div>
    </div>
  </div>`;
}

function backCoverHtml(subtitle) {
  return `
  <div class="print-cairn-back">
    <img class="cover-art" src="images/the-edge-back-cover.png" alt="">
    <div class="cover-art-shade" aria-hidden="true"></div>
    <div class="print-cairn-back-inner">
      <div class="cover-top">
        <h1>The Edge!</h1>
        <p class="back-blurb">Два кубика. Светлый и тёмный. Один ход — и сцена уже не та, что была.</p>
      </div>
      <div class="cover-bottom">
        <p class="tagline">${subtitle} · только d6</p>
        <p class="back-meta">Тайная гильдия · fso13</p>
      </div>
    </div>
  </div>`;
}

const CAIRN_PDF_OPTS = { ...PRINT_A5_PDF_OPTS_BASE };

function transformCoreMd(rel, md) {
  return isReadmeFile(rel) ? stripReadmeForBook(md) : md;
}

async function buildFullEdition() {
  copyPrintCss("print-cairn.css");

  const coreRels = listBookSources({
    includeAdventure: false,
    audience: "all",
    includeCustomModules: false,
  }).filter((r) => !isReadmeFile(r));

  const playerRels = coreRels.filter(
    (r) => CHAPTER_AUDIENCE[r] === "player" && r !== MAGIC_CHAPTER_REL
  );
  const keeperRels = coreRels.filter((r) => CHAPTER_AUDIENCE[r] === "keeper");
  const magicRels = coreRels.includes(MAGIC_CHAPTER_REL) ? [MAGIC_CHAPTER_REL] : [];

  const playerChapters = buildChapterList(playerRels, {
    wrapHead: true,
    transformMd: transformCoreMd,
  });
  const keeperChapters = buildChapterList(keeperRels, {
    wrapHead: true,
    transformMd: transformCoreMd,
  });
  keeperChapters.push({
    rel: "character-sheet.html",
    title: "Лист персонажа",
    id: "chapter-list-personazha",
    body: buildCharacterSheetChapterHtml(),
  });

  const moduleChapters = [
    ...buildChapterList(magicRels, { wrapHead: true, transformMd: transformCoreMd }),
    ...fullEditionModules().map((mod) => buildCustomModuleChapter(mod, { wrapHead: true })),
  ];

  const chapters = [...playerChapters, ...keeperChapters, ...moduleChapters];
  const tocGroups = [
    { label: "Для игрока", chapters: playerChapters },
    { label: "Для хранителя", chapters: keeperChapters },
    { label: "Модули", chapters: moduleChapters },
  ];

  const outPdf = path.join(OUT_DIR, "polnoe-izdanie.pdf");
  const outHtml = path.join(PUBLIC, "print-book-cairn-new-polnoe.html");
  const front = coverHtml("Полное издание");
  const back = backCoverHtml("Полное издание");

  const html = buildPrintHtml({
    chapters,
    title: "The Edge! — полное издание",
    bodyClass: "print-cairn",
    cssHref: "css/print-cairn.css",
    fontLinks: FONT_LINKS,
    coverHtml: front,
    mainClass: "print-cairn-main",
    tocClass: "print-cairn-toc",
    tocGroups,
  });

  fs.writeFileSync(outHtml, html, "utf8");
  const frontBleedHtml = path.join(PUBLIC, "print-bleed-front-polnoe-new.html");
  const backBleedHtml = path.join(PUBLIC, "print-bleed-back-polnoe-new.html");
  fs.writeFileSync(
    frontBleedHtml,
    buildBleedSheetHtml({
      title: "The Edge! — полное издание — обложка",
      cssHref: "css/print-cairn.css",
      fontLinks: FONT_LINKS,
      sheetHtml: front,
    }),
    "utf8"
  );
  fs.writeFileSync(
    backBleedHtml,
    buildBleedSheetHtml({
      title: "The Edge! — полное издание — задник",
      cssHref: "css/print-cairn.css",
      fontLinks: FONT_LINKS,
      sheetHtml: back,
    }),
    "utf8"
  );

  await renderPdf(outHtml, outPdf, {
    ...CAIRN_PDF_OPTS,
    ...printChromeTemplates("The Edge! · Полное издание"),
  });
  await applyBleedCovers(outPdf, {
    frontHtmlPath: frontBleedHtml,
    backHtmlPath: backBleedHtml,
  });
  const padded = await padPdfToBooklet(outPdf, { multiple: 4, reserveTrailing: 1 });
  if (padded) console.log(`Booklet pad: +${padded} notes page(s) → multiple of 4`);
  const broshyura = bookletOutputPath(outPdf);
  const imposed = await imposeBookletPdf(outPdf, broshyura);
  console.log(
    `Broshyura: ${broshyura} (${imposed.pagesIn}→${imposed.pagesOut} стр. A4, ${imposed.sheets} листов)`
  );

  console.log("PDF:", outPdf, `(${chapters.length} chapters)`);
}

async function buildModulePackPdfs() {
  fs.mkdirSync(MOD_DIR, { recursive: true });
  copyPrintCss("print-cairn.css");

  for (const group of MODULE_PACK_GROUPS) {
    const mods = CUSTOM_MODULES.filter((m) => group.match(m) && moduleExists(m));
    if (!mods.length) {
      console.log("Skip pack (empty):", group.id);
      continue;
    }

    const chapters = mods.map((mod) => buildCustomModuleChapter(mod, { wrapHead: true }));
    const outPdf = path.join(MOD_DIR, group.file);
    const outHtml = path.join(PUBLIC, `print-book-cairn-pack-${group.id}.html`);

    const html = buildPrintHtml({
      chapters,
      title: `The Edge! — ${group.title}`,
      bodyClass: "print-cairn",
      cssHref: "css/print-cairn.css",
      fontLinks: FONT_LINKS,
      coverHtml: coverHtml(group.title, "Пак модулей"),
      mainClass: "print-cairn-main",
      tocClass: "print-cairn-toc",
      simpleToc: true,
    });

    fs.writeFileSync(outHtml, html, "utf8");
    await renderPdf(outHtml, outPdf, {
      ...CAIRN_PDF_OPTS,
      ...printChromeTemplates(`The Edge! · ${group.title}`),
    });
    console.log("Pack PDF:", outPdf, `(${chapters.length} chapters)`);
  }
}

async function buildAdventurePdfs() {
  fs.mkdirSync(ADV_DIR, { recursive: true });
  copyPrintCss("print-adventure.css");

  for (const adv of ADVENTURES) {
    const { rels, module } = listAdventurePdfSources(adv.id);
    const chapters = [];
    if (adv.adventureRel) chapters.push(...buildChapterList([adv.adventureRel]));
    if (module) chapters.push(buildCustomModuleChapter(module));
    const mapRels = rels.filter((r) => r !== adv.adventureRel);
    if (mapRels.length) chapters.push(...buildChapterList(mapRels));
    if (!chapters.length) {
      console.warn("Skip adventure (no chapters):", adv.id);
      continue;
    }

    const outPdf = path.join(ADV_DIR, `${adv.id}.pdf`);
    const outHtml = path.join(PUBLIC, adventurePrintHtmlFilename(adv));
    const html = buildAdventurePrintHtml(adv, { chapters });
    fs.writeFileSync(outHtml, html, "utf8");
    await renderPdf(outHtml, outPdf, {
      ...ADVENTURE_PDF_OPTS_BASE,
      ...adventurePdfHeaderFooter(adv),
      ...adventurePdfRenderOptions(adv),
    });
    await applyAdventureBleedCovers(adv, outPdf);
    console.log("Adventure PDF:", outPdf, `(${adv.style || "default"})`);
  }
}

function listOutputs() {
  console.log("\nГотово →", OUT_DIR);
  for (const name of fs.readdirSync(OUT_DIR).sort()) {
    const p = path.join(OUT_DIR, name);
    if (fs.statSync(p).isFile()) {
      const mb = (fs.statSync(p).size / (1024 * 1024)).toFixed(1);
      console.log(`  ${name} (${mb} MB)`);
    }
  }
  for (const sub of ["modules", "adventures"]) {
    const dir = path.join(OUT_DIR, sub);
    if (!fs.existsSync(dir)) continue;
    console.log(`  ${sub}/`);
    for (const name of fs.readdirSync(dir).sort()) {
      const mb = (fs.statSync(path.join(dir, name)).size / (1024 * 1024)).toFixed(1);
      console.log(`    ${name} (${mb} MB)`);
    }
  }
}


async function buildCharacterSheetPdf() {
  copyPrintCss("print-cairn.css");
  const sheetCssSrc = path.join(ROOT, "website", "css", "character-sheet.css");
  const sheetCssDest = path.join(PUBLIC, "css", "character-sheet.css");
  if (fs.existsSync(sheetCssSrc)) fs.copyFileSync(sheetCssSrc, sheetCssDest);

  const body = buildCharacterSheetChapterHtml();
  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <title>The Edge! — Лист персонажа</title>
  ${FONT_LINKS}
  <link rel="stylesheet" href="css/print-cairn.css">
  <style>
    @page { size: 148mm 210mm; margin: 0; }
    body.print-cairn { margin: 0; }
    .print-cairn-main { padding: 6mm 7mm; }
    .chapter { page-break-before: avoid; }
  </style>
</head>
<body class="print-cairn">
  <main class="print-cairn-main">
    <section class="chapter" id="chapter-list-personazha">${body}</section>
  </main>
</body>
</html>`;

  const outHtml = path.join(PUBLIC, "print-list-personazha.html");
  const outPdf = path.join(OUT_DIR, "list-personazha.pdf");
  fs.writeFileSync(outHtml, html, "utf8");
  await renderPdf(outHtml, outPdf, {
    ...PRINT_A5_PDF_OPTS_BASE,
    displayHeaderFooter: false,
    stampLeafPages: false,
    fillTocPages: false,
    skipCoverPageNumber: false,
    skipPages: 0,
    margin: { top: "6mm", right: "7mm", bottom: "6mm", left: "7mm" },
  });
  console.log("Sheet PDF:", outPdf);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(ADV_DIR, { recursive: true });
  fs.mkdirSync(MOD_DIR, { recursive: true });
  ensurePublicBuilt();

  const adventuresOnly = process.argv.includes("--adventures");
  if (adventuresOnly) {
    console.log("→ Приключения…");
    await buildAdventurePdfs();
    listOutputs();
    return;
  }
  if (process.argv.includes("--sheet")) {
    console.log("→ Лист персонажа…");
    await buildCharacterSheetPdf();
    listOutputs();
    return;
  }
  if (process.argv.includes("--hranitel")) {
    console.log("→ Книга хранителя…");
    await buildCairnPdf({
      audience: "keeper",
      includeAdventure: false,
      alsoMain: false,
      output: path.join(OUT_DIR, "kniga-hranitelya.pdf"),
    });
    listOutputs();
    return;
  }
  if (process.argv.includes("--polnoe")) {
    console.log("→ Полное издание…");
    await buildFullEdition();
    listOutputs();
    return;
  }

  console.log("→ Книга игрока…");
  await buildCairnPdf({
    audience: "player",
    includeAdventure: false,
    alsoMain: false,
    output: path.join(OUT_DIR, "kniga-igroka.pdf"),
  });

  console.log("→ Книга хранителя…");
  await buildCairnPdf({
    audience: "keeper",
    includeAdventure: false,
    alsoMain: false,
    output: path.join(OUT_DIR, "kniga-hranitelya.pdf"),
  });

  console.log("→ Полное издание…");
  await buildFullEdition();

  console.log("→ Пакы модулей…");
  await buildModulePackPdfs();

  console.log("→ Приключения…");
  await buildAdventurePdfs();

  listOutputs();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

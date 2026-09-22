#!/usr/bin/env node
// PDF в стиле Cairn 2E Warden's Guide: A5, Lora + Source Sans, линии с кружками
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  PUBLIC,
  buildChapterList,
  buildPrintHtml,
  renderPdf,
  ensurePublicBuilt,
  copyPrintCss,
  parsePdfArgs,
  escapeHtml,
  PRINT_A5_PDF_OPTS_BASE,
  printChromeTemplates,
} from "../website/lib/pdf-core.mjs";
import {
  listBookSources,
  isReadmeFile,
  stripReadmeForBook,
  PDF_OUTPUT_CAIRN,
  PDF_OUTPUT,
  PDF_TITLE,
  pdfHtmlOutputName,
} from "../website/lib/book-build.mjs";
import { buildCharacterSheetChapterHtml } from "../website/lib/character-sheet-print.mjs";

const FONT_LINKS = `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=MedievalSharp&family=Source+Sans+3:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">`;

const RUNNING = {
  player: "The Edge! · Книга игрока",
  keeper: "The Edge! · Книга хранителя",
  all: "The Edge! · Полное издание",
};

const BOOK_LABEL = {
  player: "Книга игрока",
  keeper: "Книга хранителя",
  all: "Полное издание",
};

function coverHtml(audience) {
  const book = BOOK_LABEL[audience] || BOOK_LABEL.all;
  return `
  <div class="print-cairn-cover">
    <img class="cover-art" src="images/the-edge-cover.png" alt="">
    <div class="cover-art-shade" aria-hidden="true"></div>
    <div class="print-cairn-cover-inner">
      <div class="cover-top">
        <h1>The Edge!</h1>
        <p class="cover-book">${escapeHtml(book)}</p>
      </div>
      <div class="cover-bottom">
        <p class="edition">Модульная настольная ролевая игра</p>
        <p class="tagline">Только d6 · тактика · магия как атака</p>
        <p class="cover-credits"><span class="credit-label">Авторы</span> Тайная гильдия · fso13</p>
        <p class="cover-playtesters"><span class="credit-label">Плейтестеры</span> fso13 · sidiusktan · nuttyCheese · deadelfdance</p>
      </div>
    </div>
  </div>`;
}

const HELP = `Usage: node scripts/build-pdf-cairn.mjs [options]

  --audience <all|player|keeper>  Какую книгу собрать (default: all)
  --output <path>                 PDF file
  --also-main                     Также записать в koreni-sudby-kniga-*.pdf (основные файлы)
  --no-adventure                  Exclude adventure/*.md
`;

export async function buildCairnPdf(optsIn = {}) {
  const opts = {
    includeAdventure: false,
    audience: "all",
    alsoMain: false,
    ...optsIn,
  };

  if (!opts.audience) opts.audience = "all";
  if (!opts.output) {
    opts.output = path.join(PUBLIC, PDF_OUTPUT_CAIRN[opts.audience] || PDF_OUTPUT_CAIRN.all);
  }
  const outHtml = path.join(PUBLIC, pdfHtmlOutputName("cairn", opts.audience));
  const running = RUNNING[opts.audience] || RUNNING.all;

  ensurePublicBuilt();
  copyPrintCss("print-cairn.css");

  const relFiles = listBookSources({
    includeAdventure: opts.includeAdventure,
    audience: opts.audience,
  });

  const chapters = buildChapterList(relFiles, {
    wrapHead: true,
    transformMd: (rel, md) => (isReadmeFile(rel) ? stripReadmeForBook(md) : md),
  });

  if (opts.audience === "player" || opts.audience === "all") {
    chapters.push({
      rel: "character-sheet.html",
      title: "Лист персонажа",
      id: "chapter-list-personazha",
      body: buildCharacterSheetChapterHtml(),
    });
  }

  const html = buildPrintHtml({
    chapters,
    title: PDF_TITLE[opts.audience] || PDF_TITLE.all,
    bodyClass: "print-cairn",
    cssHref: "css/print-cairn.css",
    fontLinks: FONT_LINKS,
    coverHtml: coverHtml(opts.audience),
    mainClass: "print-cairn-main",
    tocClass: "print-cairn-toc",
  });

  fs.writeFileSync(outHtml, html, "utf8");
  fs.mkdirSync(path.dirname(opts.output), { recursive: true });

  const pdfOpts = {
    ...PRINT_A5_PDF_OPTS_BASE,
    ...printChromeTemplates(running),
  };

  await renderPdf(outHtml, opts.output, pdfOpts);

  const mainOut = path.join(PUBLIC, PDF_OUTPUT[opts.audience] || PDF_OUTPUT.all);
  if (opts.alsoMain && mainOut !== opts.output) {
    fs.copyFileSync(opts.output, mainOut);
  }

  return {
    output: opts.output,
    mainOutput: opts.alsoMain ? mainOut : null,
    outHtml,
    chapters: chapters.length,
    audience: opts.audience,
  };
}

async function main() {
  const argv = process.argv;
  const opts = parsePdfArgs(argv, {
    output: path.join(PUBLIC, PDF_OUTPUT_CAIRN.all),
    includeAdventure: false,
    audience: "all",
    helpText: HELP,
  });

  if (!opts.audience) opts.audience = "all";
  if (argv.indexOf("--output") === -1) {
    opts.output = path.join(PUBLIC, PDF_OUTPUT_CAIRN[opts.audience] || PDF_OUTPUT_CAIRN.all);
  }
  opts.alsoMain = argv.includes("--also-main");

  const result = await buildCairnPdf(opts);
  console.log("PDF (Cairn / Warden's Guide style):", result.output);
  if (result.mainOutput) console.log("Also:", result.mainOutput);
  console.log("Audience:", result.audience);
  console.log("HTML:", result.outHtml);
  console.log("Chapters:", result.chapters);
}

const thisFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === thisFile) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

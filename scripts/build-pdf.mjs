#!/usr/bin/env node
// Сборка PDF правил (светлая книжная вёрстка, A4)
import fs from "fs";
import path from "path";
import {
  PUBLIC,
  buildChapterList,
  buildPrintHtml,
  renderPdf,
  ensurePublicBuilt,
  copyPrintCss,
  parsePdfArgs,
} from "../website/lib/pdf-core.mjs";
import {
  listBookSources,
  isReadmeFile,
  stripReadmeForBook,
  PDF_OUTPUT,
  PDF_TITLE,
  pdfHtmlOutputName,
} from "../website/lib/book-build.mjs";

const FONT_LINKS = `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Source+Sans+3:wght@400;600&display=swap" rel="stylesheet">`;

function coverHtml(audience) {
  const title = PDF_TITLE[audience] || PDF_TITLE.all;
  return `
  <div class="print-cover">
    <h1>${title}</h1>
    <p class="tagline">Модульная настольная ролевая игра · только d6</p>
  </div>`;
}

const HELP = `Usage: node scripts/build-pdf.mjs [options]

  --audience <all|player|keeper>  Какую книгу собрать (default: all)
  --output <path>                 PDF file
  --no-adventure                  Exclude adventure/*.md
`;

async function main() {
  const opts = parsePdfArgs(process.argv, {
    output: path.join(PUBLIC, PDF_OUTPUT.all),
    includeAdventure: true,
    audience: "all",
    helpText: HELP,
  });

  if (!opts.audience) opts.audience = "all";
  if (process.argv.indexOf("--output") === -1) {
    opts.output = path.join(PUBLIC, PDF_OUTPUT[opts.audience] || PDF_OUTPUT.all);
  }
  const outHtml = path.join(PUBLIC, pdfHtmlOutputName("book", opts.audience));

  ensurePublicBuilt();
  copyPrintCss("print-book.css");

  const relFiles = listBookSources({
    includeAdventure: opts.includeAdventure,
    audience: opts.audience,
  });

  const chapters = buildChapterList(relFiles, {
    transformMd: (rel, md) => (isReadmeFile(rel) ? stripReadmeForBook(md) : md),
  });

  const html = buildPrintHtml({
    chapters,
    title: PDF_TITLE[opts.audience] || PDF_TITLE.all,
    bodyClass: "print-book",
    cssHref: "css/print-book.css",
    fontLinks: FONT_LINKS,
    coverHtml: coverHtml(opts.audience),
    mainClass: "print-book-main",
  });

  fs.writeFileSync(outHtml, html, "utf8");
  fs.mkdirSync(path.dirname(opts.output), { recursive: true });

  await renderPdf(outHtml, opts.output, {
    format: "A4",
    margin: { top: "18mm", right: "16mm", bottom: "20mm", left: "16mm" },
    displayHeaderFooter: true,
    headerTemplate: "<span></span>",
    footerTemplate: `
      <div style="width:100%;font-size:8px;color:#666;text-align:center;padding:0 16mm;">
        <span>Корни судьбы</span>
        <span style="float:right"><span class="pageNumber"></span> / <span class="totalPages"></span></span>
      </div>`,
  });

  console.log("PDF:", opts.output);
  console.log("Audience:", opts.audience);
  console.log("HTML:", outHtml);
  console.log("Chapters:", chapters.length);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

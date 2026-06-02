#!/usr/bin/env node
// Сборка PDF правил (светлая книжная вёрстка, A4)
import fs from "fs";
import path from "path";
import {
  PUBLIC,
  RPG,
  walkMarkdown,
  buildChapterList,
  buildPrintHtml,
  renderPdf,
  ensurePublicBuilt,
  copyPrintCss,
  parsePdfArgs,
} from "../website/lib/pdf-core.mjs";

const OUT_HTML = path.join(PUBLIC, "print-book.html");
const OUT_PDF = path.join(PUBLIC, "koreni-sudby-pravila.pdf");

const FONT_LINKS = `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Source+Sans+3:wght@400;600&display=swap" rel="stylesheet">`;

const COVER = `
  <div class="print-cover">
    <h1>Корни судьбы</h1>
    <p class="tagline">Модульная настольная ролевая игра</p>
  </div>`;

const HELP = `Usage: node scripts/build-pdf.mjs [options]

  --output <path>   PDF (default: public/koreni-sudby-pravila.pdf)
  --no-adventure    Exclude adventure/*.md
`;

async function main() {
  const opts = parsePdfArgs(process.argv, {
    output: OUT_PDF,
    includeAdventure: true,
    helpText: HELP,
  });

  ensurePublicBuilt();
  copyPrintCss("print-book.css");

  let relFiles = walkMarkdown(RPG);
  if (!opts.includeAdventure) relFiles = relFiles.filter((r) => !r.startsWith("adventure/"));

  const chapters = buildChapterList(relFiles);
  const html = buildPrintHtml({
    chapters,
    title: "Корни судьбы — правила",
    bodyClass: "print-book",
    cssHref: "css/print-book.css",
    fontLinks: FONT_LINKS,
    coverHtml: COVER,
    mainClass: "print-book-main",
  });

  fs.writeFileSync(OUT_HTML, html, "utf8");
  fs.mkdirSync(path.dirname(opts.output), { recursive: true });

  await renderPdf(OUT_HTML, opts.output, {
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
  console.log("HTML:", OUT_HTML);
  console.log("Chapters:", chapters.length);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

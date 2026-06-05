#!/usr/bin/env node
// PDF в стиле Cairn: A5, Lora, тёплая бумага (по мотивам «Cairn Книга Игрока»)
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
  PDF_OUTPUT_CAIRN,
  PDF_TITLE,
  pdfHtmlOutputName,
} from "../website/lib/book-build.mjs";

const FONT_LINKS = `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,500;0,600;0,700;1,400&family=Lora:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">`;

function coverHtml(audience) {
  const title = PDF_TITLE[audience] || PDF_TITLE.all;
  return `
  <div class="print-cairn-cover">
    <div class="print-cairn-cover-inner">
      <h1>${title}</h1>
      <p class="edition">Модульная настольная ролевая игра</p>
      <p class="tagline">Только d6 · тактика · магия как атака</p>
    </div>
  </div>`;
}

const HELP = `Usage: node scripts/build-pdf-cairn.mjs [options]

  --audience <all|player|keeper>  Какую книгу собрать (default: all)
  --output <path>                 PDF file
  --no-adventure                  Exclude adventure/*.md
`;

async function main() {
  const opts = parsePdfArgs(process.argv, {
    output: path.join(PUBLIC, PDF_OUTPUT_CAIRN.all),
    includeAdventure: true,
    audience: "all",
    helpText: HELP,
  });

  if (!opts.audience) opts.audience = "all";
  if (process.argv.indexOf("--output") === -1) {
    opts.output = path.join(PUBLIC, PDF_OUTPUT_CAIRN[opts.audience] || PDF_OUTPUT_CAIRN.all);
  }
  const outHtml = path.join(PUBLIC, pdfHtmlOutputName("cairn", opts.audience));

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

  await renderPdf(outHtml, opts.output, {
    width: "148mm",
    height: "210mm",
    margin: { top: "20mm", right: "16mm", bottom: "24mm", left: "16mm" },
    displayHeaderFooter: true,
    headerTemplate: "<span></span>",
    footerTemplate: `
      <div style="width:100%;font-family:Lora,Georgia,serif;font-size:9pt;color:#3d3a36;text-align:center;">
        <span class="pageNumber"></span>
      </div>`,
  });

  console.log("PDF (Cairn style):", opts.output);
  console.log("Audience:", opts.audience);
  console.log("HTML:", outHtml);
  console.log("Chapters:", chapters.length);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

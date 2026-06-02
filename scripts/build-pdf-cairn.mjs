#!/usr/bin/env node
// PDF в стиле Cairn: A5, Lora, тёплая бумага (по мотивам «Cairn Книга Игрока»)
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

const OUT_HTML = path.join(PUBLIC, "print-book-cairn.html");
const OUT_PDF = path.join(PUBLIC, "koreni-sudby-pravila-cairn.pdf");

const FONT_LINKS = `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,500;0,600;0,700;1,400&family=Lora:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">`;

const COVER = `
  <div class="print-cairn-cover">
    <div class="print-cairn-cover-inner">
      <h1>Корни судьбы</h1>
      <p class="edition">Модульная настольная ролевая игра</p>
      <p class="tagline">Единый кубик за столом · тактика · магия как атака</p>
    </div>
  </div>`;

const HELP = `Usage: node scripts/build-pdf-cairn.mjs [options]

  --output <path>   PDF (default: public/koreni-sudby-pravila-cairn.pdf)
  --no-adventure    Exclude adventure/*.md
`;

async function main() {
  const opts = parsePdfArgs(process.argv, {
    output: OUT_PDF,
    includeAdventure: true,
    helpText: HELP,
  });

  ensurePublicBuilt();
  copyPrintCss("print-cairn.css");

  let relFiles = walkMarkdown(RPG);
  if (!opts.includeAdventure) relFiles = relFiles.filter((r) => !r.startsWith("adventure/"));

  const chapters = buildChapterList(relFiles, { wrapHead: true });
  const html = buildPrintHtml({
    chapters,
    title: "Корни судьбы — правила",
    bodyClass: "print-cairn",
    cssHref: "css/print-cairn.css",
    fontLinks: FONT_LINKS,
    coverHtml: COVER,
    mainClass: "print-cairn-main",
    tocClass: "print-cairn-toc",
  });

  fs.writeFileSync(OUT_HTML, html, "utf8");
  fs.mkdirSync(path.dirname(opts.output), { recursive: true });

  await renderPdf(OUT_HTML, opts.output, {
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
  console.log("HTML:", OUT_HTML);
  console.log("Chapters:", chapters.length);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

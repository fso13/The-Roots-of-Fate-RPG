#!/usr/bin/env node
// PDF отдельного приключения или доп. модуля
import fs from "fs";
import path from "path";
import {
  PUBLIC,
  MY_MODULES,
  buildChapterList,
  buildCustomModuleChapter,
  buildModulePrintHtml,
  buildAdventurePrintHtml,
  renderPdf,
  ensurePublicBuilt,
  copyPrintCss,
  adventurePrintHtmlFilename,
  modulePrintHtmlFilename,
} from "../website/lib/pdf-core.mjs";
import {
  CUSTOM_MODULES,
  ADVENTURES,
  findCustomModule,
  listAdventurePdfSources,
  adventurePdfFile,
  modulePdfFile,
} from "../website/lib/book-build.mjs";

const PDF_OPTS = {
  format: "A4",
  margin: { top: "18mm", right: "16mm", bottom: "20mm", left: "16mm" },
  displayHeaderFooter: true,
  headerTemplate: "<span></span>",
  footerTemplate: `
      <div style="width:100%;font-size:8px;color:#666;text-align:center;padding:0 16mm;">
        <span>Корни судьбы</span>
        <span style="float:right"><span class="pageNumber"></span> / <span class="totalPages"></span></span>
      </div>`,
};

function parseArgs(argv) {
  const opts = { adventure: null, module: null, allAdventures: false, allModules: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--adventure" && argv[i + 1]) opts.adventure = argv[++i];
    else if (a === "--module" && argv[i + 1]) opts.module = argv[++i];
    else if (a === "--all-adventures") opts.allAdventures = true;
    else if (a === "--all-modules") opts.allModules = true;
    else if (a === "--help" || a === "-h") {
      console.log(`Usage: node scripts/build-pdf-pack.mjs [options]

  --adventure <id>     PDF одного приключения (${ADVENTURES.map((a) => a.id).join(", ")})
  --module <id>        PDF одного модуля (${CUSTOM_MODULES.map((m) => m.id).join(", ")})
  --all-adventures     PDF всех приключений
  --all-modules        PDF всех доп. модулей
`);
      process.exit(0);
    }
  }
  return opts;
}

async function buildAdventurePdf(adventureId) {
  const { adv, rels, module } = listAdventurePdfSources(adventureId);
  const chapters = [];
  chapters.push(...buildChapterList([adv.adventureRel]));
  if (module) chapters.push(buildCustomModuleChapter(module));
  const mapRels = rels.filter((r) => r !== adv.adventureRel);
  if (mapRels.length) chapters.push(...buildChapterList(mapRels));

  const outPdf = path.join(PUBLIC, adventurePdfFile(adv));
  const outHtml = path.join(PUBLIC, adventurePrintHtmlFilename(adv));

  const html = buildAdventurePrintHtml(adv, { chapters });

  fs.writeFileSync(outHtml, html, "utf8");
  fs.mkdirSync(path.dirname(outPdf), { recursive: true });
  await renderPdf(outHtml, outPdf, PDF_OPTS);
  console.log("PDF:", outPdf);
  console.log("HTML:", outHtml);
  console.log("Chapters:", chapters.length);
}

async function buildModulePdf(moduleId) {
  const mod = findCustomModule(moduleId);
  if (!mod) throw new Error(`Unknown module: ${moduleId}`);

  const outPdf = path.join(PUBLIC, modulePdfFile(mod));
  const outHtml = path.join(PUBLIC, modulePrintHtmlFilename(mod));

  const html = buildModulePrintHtml(mod);

  fs.writeFileSync(outHtml, html, "utf8");
  fs.mkdirSync(path.dirname(outPdf), { recursive: true });
  await renderPdf(outHtml, outPdf, PDF_OPTS);
  console.log("PDF:", outPdf);
  console.log("HTML:", outHtml);
}

async function main() {
  const opts = parseArgs(process.argv);
  ensurePublicBuilt();
  copyPrintCss("print-book.css");

  if (opts.allAdventures) {
    for (const adv of ADVENTURES) await buildAdventurePdf(adv.id);
    return;
  }
  if (opts.allModules) {
    for (const mod of CUSTOM_MODULES) {
      const srcPath = path.join(MY_MODULES, mod.srcRel);
      if (!fs.existsSync(srcPath)) {
        console.warn("Skip module (no source):", mod.id);
        continue;
      }
      await buildModulePdf(mod.id);
    }
    return;
  }
  if (opts.adventure) {
    await buildAdventurePdf(opts.adventure);
    return;
  }
  if (opts.module) {
    await buildModulePdf(opts.module);
    return;
  }

  console.error("Укажите --adventure, --module, --all-adventures или --all-modules");
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

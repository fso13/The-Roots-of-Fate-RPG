#!/usr/bin/env node
/**
 * Импозиция A5-книги → A4 landscape брошюра (2-up, седловая сшивка).
 *
 * Usage:
 *   node scripts/impose-booklet.mjs new_pdf/kniga-igroka.pdf
 *   node scripts/impose-booklet.mjs new_pdf/kniga-igroka.pdf --out new_pdf/out.pdf
 *   node scripts/impose-booklet.mjs --all   # igrok / hranitel / polnoe в new_pdf/
 */
import fs from "fs";
import path from "path";
import {
  ROOT,
  imposeBookletPdf,
  bookletOutputPath,
  padPdfToBooklet,
} from "../website/lib/pdf-core.mjs";

const DEFAULT_BOOKS = [
  "new_pdf/kniga-igroka.pdf",
  "new_pdf/kniga-hranitelya.pdf",
  "new_pdf/polnoe-izdanie.pdf",
];

async function imposeOne(srcRel, outRel = null) {
  const src = path.isAbsolute(srcRel) ? srcRel : path.join(ROOT, srcRel);
  if (!fs.existsSync(src)) {
    console.error("Нет файла:", src);
    process.exit(1);
  }
  const padded = await padPdfToBooklet(src, { multiple: 4, reserveTrailing: 1 });
  if (padded) console.log(`  pad +${padded}`);
  const out = outRel
    ? path.isAbsolute(outRel)
      ? outRel
      : path.join(ROOT, outRel)
    : bookletOutputPath(src);
  const info = await imposeBookletPdf(src, out);
  const mb = (fs.statSync(out).size / (1024 * 1024)).toFixed(1);
  console.log(
    `OK ${path.relative(ROOT, out)} — ${info.pagesIn}→${info.pagesOut} стр. A4 (${info.sheets} листов, ${mb} MB)`
  );
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--all")) {
    for (const rel of DEFAULT_BOOKS) {
      console.log("→", rel);
      await imposeOne(rel);
    }
    return;
  }
  const src = argv.find((a) => !a.startsWith("-"));
  if (!src) {
    console.log(`Usage: node scripts/impose-booklet.mjs <book.pdf> [--out out.pdf]
       node scripts/impose-booklet.mjs --all`);
    process.exit(1);
  }
  const outIdx = argv.indexOf("--out");
  const out = outIdx >= 0 ? argv[outIdx + 1] : null;
  await imposeOne(src, out);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

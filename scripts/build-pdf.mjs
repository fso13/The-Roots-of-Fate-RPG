#!/usr/bin/env node
/**
 * Основные PDF книг игрока и хранителя — в стиле Cairn 2E Warden's Guide (A5).
 * Полное издание по умолчанию тоже в этом стиле.
 * Старая A4-вёрстка: node scripts/build-pdf-a4.mjs (если нужен fallback).
 */
import path from "path";
import { PUBLIC, parsePdfArgs } from "../website/lib/pdf-core.mjs";
import { PDF_OUTPUT_CAIRN, PDF_OUTPUT } from "../website/lib/book-build.mjs";
import { buildCairnPdf } from "./build-pdf-cairn.mjs";

const HELP = `Usage: node scripts/build-pdf.mjs [options]

  --audience <all|player|keeper>  Какую книгу собрать (default: all)
  --output <path>                 PDF file
  --no-adventure                  Exclude adventure/*.md

Книги собираются в стиле Cairn 2E Warden's Guide (A5).
Пишутся и в koreni-sudby-kniga-*-cairn.pdf, и в основные koreni-sudby-kniga-*.pdf.
`;

async function main() {
  const opts = parsePdfArgs(process.argv, {
    output: path.join(PUBLIC, PDF_OUTPUT.all),
    includeAdventure: false,
    audience: "all",
    helpText: HELP,
  });

  if (!opts.audience) opts.audience = "all";

  // Сначала cairn-имя, затем копия в основной файл
  const cairnOut = path.join(PUBLIC, PDF_OUTPUT_CAIRN[opts.audience] || PDF_OUTPUT_CAIRN.all);
  const mainOut = path.join(PUBLIC, PDF_OUTPUT[opts.audience] || PDF_OUTPUT.all);

  if (process.argv.indexOf("--output") === -1) {
    opts.output = cairnOut;
  }

  const result = await buildCairnPdf({
    ...opts,
    alsoMain: process.argv.indexOf("--output") === -1,
  });

  console.log("PDF:", result.mainOutput || result.output);
  if (result.mainOutput) console.log("Cairn copy:", result.output);
  console.log("Audience:", result.audience);
  console.log("HTML:", result.outHtml);
  console.log("Chapters:", result.chapters);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

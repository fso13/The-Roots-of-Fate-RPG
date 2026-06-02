#!/usr/bin/env node
// Сборка одного Markdown-файла из rpg/**/*.md
import fs from "fs";
import path from "path";
import { RPG } from "../website/lib/pdf-core.mjs";
import {
  chapterAnchor,
  loadBookEntries,
  listBookSources,
  buildToc,
} from "../website/lib/book-build.mjs";

const OUT = path.join(RPG, "kniga-polnaya.md");

function parseArgs(argv) {
  const opts = { includeAdventure: true, output: OUT };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--no-adventure") opts.includeAdventure = false;
    else if (argv[i] === "--output" && argv[i + 1]) opts.output = path.resolve(argv[++i]);
  }
  return opts;
}

function main() {
  const opts = parseArgs(process.argv);
  const relFiles = listBookSources(opts.includeAdventure);
  const entries = loadBookEntries(relFiles);
  const linkHash = (rel) => `#${chapterAnchor(rel)}`;

  const readme = entries.find((e) => e.rel === "README.md");
  const toc = buildToc(entries, linkHash);
  const parts = [
    "<!-- Сгенерировано: npm run book:md — не правьте вручную -->",
    "",
    readme ? readme.body : "# Корни судьбы",
    "",
    toc,
    "---",
    "",
  ];

  for (const e of entries) {
    if (e.rel === "README.md") continue;
    parts.push(`<a id="${e.anchor}"></a>`, "", `<!-- ${e.rel} -->`, "", e.body, "", "---", "");
  }

  const out = parts.join("\n").replace(/\n---\n\n$/, "\n");
  fs.writeFileSync(opts.output, out, "utf8");
  console.log("Written:", opts.output);
  console.log("Chapters:", entries.filter((e) => e.rel !== "README.md").length);
}

main();

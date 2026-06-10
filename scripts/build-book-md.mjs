#!/usr/bin/env node
// Сборка одного Markdown-файла из rpg/**/*.md
import fs from "fs";
import path from "path";
import { RPG } from "../website/lib/pdf-core.mjs";
import {
  BOOK_OUTPUT,
  chapterAnchor,
  loadBookEntries,
  listBookSources,
  buildToc,
} from "../website/lib/book-build.mjs";

function parseArgs(argv) {
  const opts = { includeAdventure: false, audience: "all", output: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--no-adventure") opts.includeAdventure = false;
    else if (argv[i] === "--audience" && argv[i + 1]) opts.audience = argv[++i];
    else if (argv[i] === "--output" && argv[i + 1]) opts.output = path.resolve(argv[++i]);
    else if (argv[i] === "--help" || argv[i] === "-h") {
      console.log(`Usage: node scripts/build-book-md.mjs [options]

  --audience <all|player|keeper>  Какую книгу собрать (default: all)
  --output <path>                 Output file
  --no-adventure                  Exclude adventure/*.md
`);
      process.exit(0);
    }
  }
  if (!opts.output) {
    opts.output = path.join(RPG, BOOK_OUTPUT[opts.audience] || BOOK_OUTPUT.all);
  }
  return opts;
}

function main() {
  const opts = parseArgs(process.argv);
  const relFiles = listBookSources(opts);
  const entries = loadBookEntries(relFiles);
  const linkHash = (rel) => `#${chapterAnchor(rel)}`;

  const readme = entries.find((e) => e.rel.startsWith("README"));
  const toc = buildToc(entries, linkHash);
  const parts = [
    `<!-- Сгенерировано: npm run book:md --audience ${opts.audience} — не правьте вручную -->`,
    "",
    readme ? readme.body : "# Корни судьбы",
    "",
    toc,
    "---",
    "",
  ];

  for (const e of entries) {
    if (isReadmeEntry(e.rel)) continue;
    parts.push(`<a id="${e.anchor}"></a>`, "", `<!-- ${e.rel} -->`, "", e.body, "", "---", "");
  }

  const out = parts.join("\n").replace(/\n---\n\n$/, "\n");
  fs.writeFileSync(opts.output, out, "utf8");
  console.log("Written:", opts.output);
  console.log("Audience:", opts.audience);
  console.log("Chapters:", entries.filter((e) => !isReadmeEntry(e.rel)).length);
}

function isReadmeEntry(rel) {
  return rel === "README.md" || rel === "README-igrok.md" || rel === "README-hranitel.md";
}

main();

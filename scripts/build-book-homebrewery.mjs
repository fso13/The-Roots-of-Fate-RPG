#!/usr/bin/env node
// Сборка Markdown для https://homebrewery.naturalcrit.com/
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { RPG } from "../website/lib/pdf-core.mjs";
import {
  BOOK_OUTPUT,
  GITLAB_RAW,
  loadBookEntries,
  listBookSources,
  buildToc,
  PDF_TITLE,
} from "../website/lib/book-build.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const STYLE = path.join(ROOT, "website", "homebrewery", "style.css");

function parseArgs(argv) {
  const opts = { includeAdventure: true, audience: "all", output: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--no-adventure") opts.includeAdventure = false;
    else if (argv[i] === "--audience" && argv[i + 1]) opts.audience = argv[++i];
    else if (argv[i] === "--output" && argv[i + 1]) opts.output = path.resolve(argv[++i]);
    else if (argv[i] === "--help" || argv[i] === "-h") {
      console.log(`Usage: node scripts/build-book-homebrewery.mjs [options]

  --audience <all|player|keeper>  Какую книгу собрать (default: all)
  --output <path>                 Output file
  --no-adventure                  Exclude adventure/*.md

Откройте https://homebrewery.naturalcrit.com/ → New → вставьте весь файл.
`);
      process.exit(0);
    }
  }
  if (!opts.output) {
    opts.output = path.join(RPG, BOOK_OUTPUT[opts.audience] || BOOK_OUTPUT.all.replace("polnaya", "homebrewery"));
    if (opts.audience === "all" && !argv.includes("--output")) {
      opts.output = path.join(RPG, "kniga-homebrewery.md");
    }
  }
  return opts;
}

function rawImageUrl(relPath, src) {
  const dir = path.dirname(relPath);
  const normalized = src.replace(/^\.\//, "");
  return `${GITLAB_RAW}/${dir === "." ? "" : `${dir}/`}${normalized}`;
}

function transformSegment(segment, relPath) {
  let s = segment;

  s = s.replace(/<figure[^>]*>[\s\S]*?<img\s+src="([^"]+)"\s+alt="([^"]*)"[\s\S]*?<\/figure>/gi, (_, src, alt) => {
    const url = rawImageUrl(relPath, src);
    return `\n[Image: ${alt || "иллюстрация"} | ${url}]\n`;
  });

  s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
    if (/^https?:\/\//i.test(src) || src.startsWith("data:")) return match;
    const url = rawImageUrl(relPath, src);
    return `[Image: ${alt || "иллюстрация"} | ${url}]`;
  });

  s = s.replace(/^(?:\*|_)([^*_\n]+)(?:\*|_)\s*$/gm, (line, inner) => {
    if (inner.length > 120) return line;
    return `{{descriptive\n${line.trim()}\n}}`;
  });

  return s;
}

function transformForHomebrewery(md, relPath) {
  const parts = md.split(/(```[\s\S]*?```)/g);
  return parts
    .map((part, i) => (i % 2 === 1 ? part : transformSegment(part, relPath)))
    .join("");
}

function metadataBlock(audience) {
  const title = PDF_TITLE[audience] || PDF_TITLE.all;
  return `\`\`\`metadata
title: ${title}
description: Модульная настольная РПГ — только d6
author:
systems: []
language: ru
renderer: V3
theme: Blank
\`\`\``;
}

function styleBlock() {
  const css = fs.readFileSync(STYLE, "utf8");
  const inventarCss = fs.readFileSync(path.join(ROOT, "website", "css", "inventar-schema.css"), "utf8");
  return `\`\`\`css\n${css}\n${inventarCss}\n\`\`\``;
}

function isReadmeEntry(rel) {
  return rel === "README.md" || rel === "README-igrok.md" || rel === "README-hranitel.md";
}

function main() {
  const opts = parseArgs(process.argv);
  const relFiles = listBookSources(opts);
  const entries = loadBookEntries(relFiles);
  const linkHash = (rel) => `#${entries.find((e) => e.rel === rel)?.hbAnchor || rel}`;

  const readme = entries.find((e) => e.rel.startsWith("README"));
  const toc = buildToc(entries, linkHash);
  const bookTitle = PDF_TITLE[opts.audience] || PDF_TITLE.all;

  const parts = [
    "<!-- Сгенерировано: npm run book:homebrewery -->",
    "<!-- https://homebrewery.naturalcrit.com/ -->",
    "",
    metadataBlock(opts.audience),
    "",
    styleBlock(),
    "",
    "{{frontCover}}",
    "",
    `# ${bookTitle}`,
    "",
    "##### Модульная настольная ролевая игра · только d6",
    "",
    "{{/frontCover}}",
    "",
    "\\page",
    "",
  ];

  if (readme) {
    parts.push("{{wide", "", transformForHomebrewery(readme.body, readme.rel), "", "}}", "", "\\page", "");
  }

  parts.push("{{wide", "", toc, "", "}}", "", "\\page", "");

  for (const e of entries) {
    if (isReadmeEntry(e.rel)) continue;
    parts.push("\\page", "", transformForHomebrewery(e.body, e.rel), "");
  }

  fs.writeFileSync(opts.output, parts.join("\n").trim() + "\n", "utf8");
  console.log("Written:", opts.output);
  console.log("Audience:", opts.audience);
  console.log("Chapters:", entries.filter((e) => !isReadmeEntry(e.rel)).length);
  console.log("Откройте https://homebrewery.naturalcrit.com/ и вставьте содержимое файла.");
}

main();

#!/usr/bin/env node
// Сборка Markdown для https://homebrewery.naturalcrit.com/
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { RPG } from "../website/lib/pdf-core.mjs";
import {
  GITLAB_RAW,
  loadBookEntries,
  listBookSources,
  buildToc,
} from "../website/lib/book-build.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT = path.join(RPG, "kniga-homebrewery.md");
const STYLE = path.join(ROOT, "website", "homebrewery", "style.css");

function parseArgs(argv) {
  const opts = { includeAdventure: true, output: OUT };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--no-adventure") opts.includeAdventure = false;
    else if (argv[i] === "--output" && argv[i + 1]) opts.output = path.resolve(argv[++i]);
    else if (argv[i] === "--help" || argv[i] === "-h") {
      console.log(`Usage: node scripts/build-book-homebrewery.mjs [options]

  --output <path>   Output file (default: rpg/kniga-homebrewery.md)
  --no-adventure    Exclude adventure/*.md

Откройте https://homebrewery.naturalcrit.com/ → New → вставьте весь файл.
В Properties выберите тему Blank (уже в metadata).
`);
      process.exit(0);
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

function metadataBlock() {
  return `\`\`\`metadata
title: Корни судьбы
description: Модульная настольная РПГ — полные правила
author:
systems: []
language: ru
renderer: V3
theme: Blank
\`\`\``;
}

function styleBlock() {
  const css = fs.readFileSync(STYLE, "utf8");
  return `\`\`\`css\n${css}\n\`\`\``;
}

function main() {
  const opts = parseArgs(process.argv);
  const relFiles = listBookSources(opts.includeAdventure);
  const entries = loadBookEntries(relFiles);
  const linkHash = (rel) => `#${entries.find((e) => e.rel === rel)?.hbAnchor || rel}`;

  const readme = entries.find((e) => e.rel === "README.md");
  const toc = buildToc(entries, linkHash);

  const parts = [
    "<!-- Сгенерировано: npm run book:homebrewery -->",
    "<!-- https://homebrewery.naturalcrit.com/ -->",
    "",
    metadataBlock(),
    "",
    styleBlock(),
    "",
    "{{frontCover}}",
    "",
    "# Корни судьбы",
    "",
    "##### Модульная настольная ролевая игра",
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
    if (e.rel === "README.md") continue;
    parts.push("\\page", "", transformForHomebrewery(e.body, e.rel), "");
  }

  fs.writeFileSync(opts.output, parts.join("\n").trim() + "\n", "utf8");
  console.log("Written:", opts.output);
  console.log("Chapters:", entries.filter((e) => e.rel !== "README.md").length);
  console.log("Откройте https://homebrewery.naturalcrit.com/ и вставьте содержимое файла.");
}

main();

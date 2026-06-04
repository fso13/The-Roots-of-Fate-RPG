#!/usr/bin/env node
// Восстанавливает .md в href внутренних ссылок на главы
import fs from "fs";
import path from "path";
import { RPG, walkMarkdown } from "../website/lib/pdf-core.mjs";

const SKIP = new Set([
  "kniga-polnaya.md",
  "kniga-homebrewery.md",
  "kniga-igroka.md",
  "kniga-hranitelya.md",
  "README.md",
  "README-igrok.md",
  "README-hranitel.md",
]);

function isChapterHref(href) {
  if (!href || href.startsWith("#") || /^https?:/i.test(href)) return false;
  if (/\.(md|html|yaml|yml)$/i.test(href)) return false;
  return /^(\.\.\/|\.\/)?(\d{2}-[a-z-]+|fantasy\/\d{2}-[a-z-]+|adventure\/\d{2}-[a-z-]+|kniga-[a-z-]+)$/.test(href);
}

function repair(md) {
  return md.replace(/\[([^\]]+)\]\(([^")#]+)(#[^)]*)?\)/g, (match, text, href, hash) => {
    if (!isChapterHref(href)) return match;
    return `[${text}](${href}.md${hash || ""})`;
  });
}

function main() {
  const relFiles = walkMarkdown(RPG).filter((r) => !SKIP.has(r));
  let changed = 0;
  for (const rel of relFiles) {
    const filePath = path.join(RPG, rel);
    const raw = fs.readFileSync(filePath, "utf8");
    const next = repair(raw);
    if (next !== raw) {
      fs.writeFileSync(filePath, next, "utf8");
      changed++;
      console.log("Repaired:", rel);
    }
  }
  console.log("Done.", changed, "file(s).");
}

main();

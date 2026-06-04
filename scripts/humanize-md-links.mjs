#!/usr/bin/env node
// Заменяет текст ссылок вида 00-yadro.md на заголовки глав во всех rpg/**/*.md
import fs from "fs";
import path from "path";
import { RPG, walkMarkdown } from "../website/lib/pdf-core.mjs";
import { buildTitleByRel, fixMdLinks } from "../website/lib/book-build.mjs";

const SKIP = new Set([
  "kniga-polnaya.md",
  "kniga-homebrewery.md",
  "kniga-igroka.md",
  "kniga-hranitelya.md",
]);

function main() {
  const relFiles = walkMarkdown(RPG).filter((r) => !SKIP.has(r));
  const titleByRel = buildTitleByRel(relFiles);
  let changed = 0;

  for (const rel of relFiles) {
    const filePath = path.join(RPG, rel);
    const raw = fs.readFileSync(filePath, "utf8");
    const next = fixMdLinks(raw, (targetRel) => {
      const to = targetRel.replace(/\.md$/, "");
      const fromDir = path.posix.dirname(rel);
      let href = path.posix.relative(fromDir === "." ? "" : fromDir, to);
      if (href && !href.startsWith(".") && fromDir !== ".") href = `./${href}`;
      return href;
    }, { titleByRel, fromRel: rel });
    if (next !== raw) {
      fs.writeFileSync(filePath, next, "utf8");
      changed++;
      console.log("Updated:", rel);
    }
  }

  console.log("Done.", changed, "file(s) changed.");
}

main();

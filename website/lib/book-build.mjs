import fs from "fs";
import path from "path";
import { RPG, walkMarkdown, extractTitle } from "./pdf-core.mjs";

/** Разрешает относительный href (без .md) в путь rel от корня rpg/ */
export function resolveMdRel(hrefBase, fromRel) {
  const fromDir = path.posix.dirname(fromRel);
  const full = path.posix.normalize(path.posix.join(fromDir === "." ? "" : fromDir, `${hrefBase}.md`));
  const stack = [];
  for (const part of full.split("/")) {
    if (part === "..") stack.pop();
    else if (part && part !== ".") stack.push(part);
  }
  return stack.join("/");
}

function stripLinkDecorations(text) {
  return text.replace(/^\*\*|\*\*$/g, "").replace(/^`|`$/g, "").trim();
}

/** Текст ссылки — имя файла (.md), а не человекочитаемый заголовок */
export function isFilenameLinkText(text, targetRel) {
  const stripped = stripLinkDecorations(text);
  if (!/\.md$/i.test(stripped)) return false;
  const normalized = stripped.replace(/^(\.\.\/)+/, "");
  if (normalized === targetRel) return true;
  if (path.posix.basename(normalized) === path.posix.basename(targetRel)) return true;
  return false;
}

export function buildTitleByRel(relFiles) {
  const titleByRel = new Map();
  for (const rel of relFiles) {
    const raw = fs.readFileSync(path.join(RPG, rel), "utf8");
    titleByRel.set(rel, extractTitle(raw) || rel);
  }
  return titleByRel;
}

export const BOOK_SOURCES_SKIP = new Set(["kniga-polnaya.md", "kniga-homebrewery.md"]);

export const GITLAB_RAW =
  "https://gitlab.com/fso13/me-rpg/-/raw/main/rpg";

export function chapterAnchor(rel) {
  return `chapter-${rel.replace(/\.md$/, "").replace(/\//g, "-")}`;
}

export function slugifyHb(title) {
  return title
    .toLowerCase()
    .replace(/[«»"'""]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function stripReadmeForBook(md) {
  return md
    .replace(/## Оглавление[\s\S]*?(?=\n## )/, "")
    .replace(/## Одним файлом[\s\S]*?(?=\n## )/, "")
    .replace(/## PDF[\s\S]*?(?=\n## )/, "");
}

export function fixMdLinks(md, linkForRel, opts = {}) {
  const { titleByRel, fromRel = "" } = opts;
  return md.replace(/\[([^\]]+)\]\(([^")]*?)\.md(#[^)]*)?\)/g, (_, text, base, hash) => {
    const rel = resolveMdRel(base, fromRel);
    let label = text;
    if (titleByRel && isFilenameLinkText(text, rel)) {
      const title = titleByRel.get(rel);
      if (title) label = title;
    }
    let target = linkForRel(rel);
    if (!target.startsWith("#") && !/\.md$/i.test(target)) {
      target = `${target}.md`;
    }
    return `[${label}](${target}${hash || ""})`;
  });
}

export function buildToc(entries, linkForRel) {
  const lines = ["## Оглавление", ""];
  let group = null;
  for (const e of entries) {
    if (e.rel === "README.md") continue;
    const g =
      e.rel.startsWith("fantasy/") ? "fantasy" : e.rel.startsWith("adventure/") ? "adventure" : "core";
    if (g !== group) {
      group = g;
      if (g === "fantasy") lines.push("", "### Фэнтези", "");
      if (g === "adventure") lines.push("", "### Приключения", "");
    }
    lines.push(`- [${e.title}](${linkForRel(e.rel)})`);
  }
  lines.push("");
  return lines.join("\n");
}

export function orderBookFiles(relFiles) {
  const readme = relFiles.filter((r) => r === "README.md");
  const core = relFiles.filter(
    (r) => r !== "README.md" && !r.startsWith("fantasy/") && !r.startsWith("adventure/")
  );
  const fantasy = relFiles.filter((r) => r.startsWith("fantasy/"));
  const adventure = relFiles.filter((r) => r.startsWith("adventure/"));
  return [...readme, ...core, ...fantasy, ...adventure];
}

export function listBookSources(includeAdventure = true) {
  let relFiles = orderBookFiles(walkMarkdown(RPG)).filter((r) => !BOOK_SOURCES_SKIP.has(r));
  if (!includeAdventure) relFiles = relFiles.filter((r) => !r.startsWith("adventure/"));
  return relFiles;
}

export function loadBookEntries(relFiles) {
  const titleByRel = buildTitleByRel(relFiles);

  const linkHash = (rel) => `#${slugifyHb(titleByRel.get(rel) || rel)}`;

  return relFiles.map((rel) => {
    const raw = fs.readFileSync(path.join(RPG, rel), "utf8");
    const md = rel === "README.md" ? stripReadmeForBook(raw) : raw;
    return {
      rel,
      title: titleByRel.get(rel),
      anchor: chapterAnchor(rel),
      hbAnchor: slugifyHb(titleByRel.get(rel)),
      body: fixMdLinks(md.trim(), (targetRel) => linkHash(targetRel), { titleByRel, fromRel: rel }),
    };
  });
}

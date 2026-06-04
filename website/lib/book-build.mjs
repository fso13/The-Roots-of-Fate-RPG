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

export const README_FILES = new Set(["README.md", "README-igrok.md", "README-hranitel.md"]);

export const BOOK_SOURCES_SKIP = new Set([
  "kniga-polnaya.md",
  "kniga-homebrewery.md",
  "kniga-igroka.md",
  "kniga-hranitelya.md",
  ...README_FILES,
]);

/** player | keeper — кому предназначена глава */
export const CHAPTER_AUDIENCE = {
  "00-yadro.md": "player",
  "01-moduli.md": "keeper",
  "02-boy.md": "player",
  "03-derevya-talantov.md": "player",
  "04-magiya.md": "player",
  "05-snaryazhenie.md": "player",
  "06-bestiariy.md": "keeper",
  "07-rany.md": "keeper",
  "08-krity-i-promahi.md": "keeper",
  "09-sozdanie-i-uroven.md": "player",
  "10-sostoyaniya.md": "player",
  "11-otryady.md": "keeper",
  "fantasy/01-zaklinaniya.md": "player",
  "fantasy/02-talanty-i-navyki.md": "player",
  "fantasy/03-snaryazhenie.md": "player",
  "fantasy/04-bestiariy.md": "keeper",
  "fantasy/05-inventar.md": "player",
  "adventure/01-steklyannyy-zvon.md": "keeper",
  "slovar-terminov.md": "player",
};

export const PLAYER_CHAPTER_ORDER = [
  "00-yadro.md",
  "02-boy.md",
  "03-derevya-talantov.md",
  "04-magiya.md",
  "05-snaryazhenie.md",
  "09-sozdanie-i-uroven.md",
  "10-sostoyaniya.md",
  "fantasy/01-zaklinaniya.md",
  "fantasy/02-talanty-i-navyki.md",
  "fantasy/03-snaryazhenie.md",
  "fantasy/05-inventar.md",
  "slovar-terminov.md",
];

/** Порядок глав книги хранителя (фэнтези-бестиарий сразу после базового). */
export const KEEPER_CHAPTER_ORDER = [
  "01-moduli.md",
  "06-bestiariy.md",
  "fantasy/04-bestiariy.md",
  "07-rany.md",
  "08-krity-i-promahi.md",
  "11-otryady.md",
  "slovar-terminov.md",
];

const README_BY_AUDIENCE = {
  all: "README.md",
  player: "README-igrok.md",
  keeper: "README-hranitel.md",
};

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

export function chapterAudience(rel) {
  return CHAPTER_AUDIENCE[rel] || null;
}

export function isReadmeFile(rel) {
  return README_FILES.has(rel);
}

export function stripReadmeForBook(md) {
  return md
    .replace(/## Оглавление[\s\S]*?(?=\n## )/, "")
    .replace(/## Книга игрока[\s\S]*?(?=\n## )/, "")
    .replace(/## Книга хранителя[\s\S]*?(?=\n## )/, "")
    .replace(/## Одним файлом[\s\S]*?(?=\n## )/, "")
    .replace(/## Сборка книг[\s\S]*?(?=\n## )/, "")
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
    if (isReadmeFile(e.rel)) continue;
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

export function orderBookFiles(relFiles, { audience = "all" } = {}) {
  const readme = relFiles.filter((r) => isReadmeFile(r));
  const content = relFiles.filter((r) => !isReadmeFile(r));

  let ordered = content;
  if (audience === "player") {
    ordered = sortByOrder(content, PLAYER_CHAPTER_ORDER);
  } else if (audience === "keeper") {
    ordered = sortByOrder(content, KEEPER_CHAPTER_ORDER);
  } else if (audience === "all") {
    const player = sortByOrder(
      content.filter((r) => CHAPTER_AUDIENCE[r] === "player"),
      PLAYER_CHAPTER_ORDER
    );
    const keeper = sortByOrder(
      content.filter((r) => CHAPTER_AUDIENCE[r] === "keeper"),
      KEEPER_CHAPTER_ORDER
    );
    const adventure = content.filter((r) => r.startsWith("adventure/"));
    ordered = [...player, ...keeper, ...adventure];
  } else {
    const core = content.filter(
      (r) => !r.startsWith("fantasy/") && !r.startsWith("adventure/")
    );
    const fantasy = content.filter((r) => r.startsWith("fantasy/"));
    const adventure = content.filter((r) => r.startsWith("adventure/"));
    ordered = [...core, ...fantasy, ...adventure];
  }

  return [...readme, ...ordered];
}

function sortByOrder(files, order) {
  const set = new Set(files);
  const sorted = order.filter((r) => set.has(r));
  const rest = files.filter((r) => !order.includes(r));
  return [...sorted, ...rest];
}

export function listBookSources({ includeAdventure = true, audience = "all" } = {}) {
  const readmeRel = README_BY_AUDIENCE[audience] || README_BY_AUDIENCE.all;

  let relFiles = orderBookFiles(walkMarkdown(RPG)).filter((r) => {
    if (BOOK_SOURCES_SKIP.has(r)) return false;
    if (isReadmeFile(r)) return false;
    if (audience === "all") return true;
    if (r === "slovar-terminov.md") return true;
    return CHAPTER_AUDIENCE[r] === audience;
  });

  if (!includeAdventure) relFiles = relFiles.filter((r) => !r.startsWith("adventure/"));

  if (fs.existsSync(path.join(RPG, readmeRel))) {
    relFiles = orderBookFiles([readmeRel, ...relFiles], { audience });
  } else {
    relFiles = orderBookFiles(relFiles, { audience });
  }

  return relFiles;
}

export function loadBookEntries(relFiles) {
  const titleByRel = buildTitleByRel(relFiles);

  const linkHash = (rel) => `#${slugifyHb(titleByRel.get(rel) || rel)}`;

  return relFiles.map((rel) => {
    const raw = fs.readFileSync(path.join(RPG, rel), "utf8");
    const md = isReadmeFile(rel) ? stripReadmeForBook(raw) : raw;
    return {
      rel,
      title: titleByRel.get(rel),
      anchor: chapterAnchor(rel),
      hbAnchor: slugifyHb(titleByRel.get(rel)),
      body: fixMdLinks(md.trim(), (targetRel) => linkHash(targetRel), { titleByRel, fromRel: rel }),
    };
  });
}

export const BOOK_OUTPUT = {
  all: "kniga-polnaya.md",
  player: "kniga-igroka.md",
  keeper: "kniga-hranitelya.md",
};

export const PDF_OUTPUT = {
  all: "koreni-sudby-pravila.pdf",
  player: "koreni-sudby-kniga-igroka.pdf",
  keeper: "koreni-sudby-kniga-hranitelya.pdf",
};

export const PDF_TITLE = {
  all: "Корни судьбы — полное издание",
  player: "Корни судьбы — Книга игрока",
  keeper: "Корни судьбы — Книга хранителя",
};

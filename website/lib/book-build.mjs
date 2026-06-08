import fs from "fs";
import path from "path";
import { RPG, walkMarkdown, extractTitle } from "./pdf-core.mjs";
import { expandInventarSchema } from "./inventar-schema.mjs";

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
  "adventure/02-chernyy-schet.md": "keeper",
  "adventure/03-pepel-slov.md": "keeper",
  "adventure/04-zov-chernogo-shpilya.md": "keeper",
  "adventure/maps/chernyy-schet/MAPS.md": "keeper",
  "adventure/maps/pepel-slov/MAPS.md": "keeper",
  "adventure/maps/chernyy-shpil/MAPS.md": "keeper",
  "slovar-terminov.md": "player",
  "modules/noir-investigation.md": "keeper",
  "modules/fahrenheit-books.md": "keeper",
  "modules/hero-trap.md": "keeper",
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
  "modules/noir-investigation.md",
  "modules/fahrenheit-books.md",
  "modules/hero-trap.md",
  "slovar-terminov.md",
];

/** Кастомные модули: исходник в my_modules/, страница на сайте — modules/*.html */
export const CUSTOM_MODULES = [
  {
    id: "noir_investigation",
    srcRel: "noir_investigation/module.md",
    outRel: "modules/noir-investigation.html",
    mdRel: "modules/noir-investigation.md",
    audience: "keeper",
  },
  {
    id: "fahrenheit_books",
    srcRel: "fahrenheit_books/module.md",
    outRel: "modules/fahrenheit-books.html",
    mdRel: "modules/fahrenheit-books.md",
    audience: "keeper",
  },
  {
    id: "hero_trap",
    srcRel: "hero_trap/module.md",
    outRel: "modules/hero-trap.html",
    mdRel: "modules/hero-trap.md",
    audience: "keeper",
  },
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
      body: expandInventarSchema(
        fixMdLinks(md.trim(), (targetRel) => linkHash(targetRel), { titleByRel, fromRel: rel })
      ),
    };
  });
}

export const BOOK_OUTPUT = {
  all: "kniga-polnaya.md",
  player: "kniga-igroka.md",
  keeper: "kniga-hranitelya.md",
};

export const PDF_OUTPUT = {
  all: "koreni-sudby-polnoe-izdanie.pdf",
  player: "koreni-sudby-kniga-igroka.pdf",
  keeper: "koreni-sudby-kniga-hranitelya.pdf",
};

export const PDF_OUTPUT_CAIRN = {
  all: "koreni-sudby-polnoe-izdanie-cairn.pdf",
  player: "koreni-sudby-kniga-igroka-cairn.pdf",
  keeper: "koreni-sudby-kniga-hranitelya-cairn.pdf",
};

export const PDF_HTML_OUTPUT = {
  all: "print-book-polnoe.html",
  player: "print-book-igrok.html",
  keeper: "print-book-hranitel.html",
};

export const PDF_HTML_OUTPUT_CAIRN = {
  all: "print-book-cairn-polnoe.html",
  player: "print-book-cairn-igrok.html",
  keeper: "print-book-cairn-hranitel.html",
};

export function pdfOutputName(style, audience = "all") {
  const map = style === "cairn" ? PDF_OUTPUT_CAIRN : PDF_OUTPUT;
  return map[audience] || map.all;
}

export function pdfHtmlOutputName(style, audience = "all") {
  const map = style === "cairn" ? PDF_HTML_OUTPUT_CAIRN : PDF_HTML_OUTPUT;
  return map[audience] || map.all;
}

export const PDF_TITLE = {
  all: "Корни судьбы — полное издание",
  player: "Корни судьбы — Книга игрока",
  keeper: "Корни судьбы — Книга хранителя",
};

/** Файлы для скачивания с сайта (public/). */
export const BOOK_DOWNLOAD_GROUPS = [
  {
    id: "player",
    title: "Книга игрока",
    items: [
      { file: PDF_OUTPUT.player, label: "PDF, A4" },
      { file: PDF_OUTPUT_CAIRN.player, label: "PDF, Cairn (A5)" },
      { file: BOOK_OUTPUT.player, label: "Markdown", fromRpg: true },
    ],
  },
  {
    id: "keeper",
    title: "Книга хранителя",
    items: [
      { file: PDF_OUTPUT.keeper, label: "PDF, A4" },
      { file: PDF_OUTPUT_CAIRN.keeper, label: "PDF, Cairn (A5)" },
      { file: BOOK_OUTPUT.keeper, label: "Markdown", fromRpg: true },
    ],
  },
  {
    id: "all",
    title: "Полное издание",
    items: [
      { file: PDF_OUTPUT.all, label: "PDF, A4" },
      { file: PDF_OUTPUT_CAIRN.all, label: "PDF, Cairn (A5)" },
      { file: BOOK_OUTPUT.all, label: "Markdown", fromRpg: true },
    ],
  },
];

const PRESERVE_IN_PUBLIC = /^(koreni-sudby-.*\.pdf|print-book.*\.html)$/;

/** Сохранить PDF и print-HTML перед очисткой public/. */
export function preserveBookAssets(publicDir) {
  const preserved = new Map();
  if (!fs.existsSync(publicDir)) return preserved;
  for (const name of fs.readdirSync(publicDir)) {
    if (!PRESERVE_IN_PUBLIC.test(name)) continue;
    preserved.set(name, fs.readFileSync(path.join(publicDir, name)));
  }
  return preserved;
}

export function restoreBookAssets(publicDir, preserved) {
  if (!preserved?.size) return;
  fs.mkdirSync(publicDir, { recursive: true });
  for (const [name, data] of preserved) {
    fs.writeFileSync(path.join(publicDir, name), data);
  }
}

export function copyBooksForDownload(publicDir, rpgDir = RPG) {
  fs.mkdirSync(publicDir, { recursive: true });
  for (const name of Object.values(BOOK_OUTPUT)) {
    const src = path.join(rpgDir, name);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(publicDir, name));
    }
  }
}

/** Копии MD + восстановленные PDF перед финальной вёрсткой index. */
export function syncBookDownloads(publicDir, rpgDir = RPG, preserved = null) {
  copyBooksForDownload(publicDir, rpgDir);
  if (preserved) restoreBookAssets(publicDir, preserved);
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** HTML-блок «Скачать книги»; prefix — относительный путь к корню public (напр. «../»). */
export function renderBookDownloadsHtml(
  publicDir,
  { prefix = "", id = "downloads", onlyGroupIds = null } = {}
) {
  const groupsSource = onlyGroupIds
    ? BOOK_DOWNLOAD_GROUPS.filter((g) => onlyGroupIds.includes(g.id))
    : BOOK_DOWNLOAD_GROUPS;
  const esc = (s) =>
    String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const groups = groupsSource.map((group) => {
    const links = group.items
      .map((item) => {
        const diskPath = path.join(publicDir, item.file);
        const href = `${prefix}${item.file}`;
        const size = fs.existsSync(diskPath)
          ? formatFileSize(fs.statSync(diskPath).size)
          : "соберите: npm run pdf:all";
        return `<li><a class="download-link" href="${esc(href)}" download>${esc(item.label)}</a> <span class="download-meta">${esc(size)}</span></li>`;
      })
      .join("\n        ");
    if (!links) return "";
    return `
    <div class="download-group">
      <h3>${esc(group.title)}</h3>
      <ul class="download-list">
        ${links}
      </ul>
    </div>`;
  }).filter(Boolean);

  if (!groups.length) return "";

  return `
  <section class="downloads" id="${esc(id)}">
    <h2 class="section-title">Скачать книги</h2>
    <p class="downloads-note">PDF для печати и офлайн-игры. Markdown — полная сборка из исходников (<code>npm run book:*</code>).</p>
    <div class="download-grid">
      ${groups.join("")}
    </div>
  </section>`;
}

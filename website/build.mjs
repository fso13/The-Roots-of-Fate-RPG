#!/usr/bin/env node
// Сборка статического сайта: rpg/**/*.md → public/
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { marked } from "marked";
import {
  buildTitleByRel,
  fixMdLinks as humanizeMdLinks,
  chapterAudience,
  PLAYER_CHAPTER_ORDER,
  KEEPER_CHAPTER_ORDER,
  CUSTOM_MODULES,
  ADVENTURES,
  GOTHIC_PACK,
  SKYRIM_PACK,
  preserveBookAssets,
  renderBookDownloadsHtml,
  renderPagePdfDownloadHtml,
  modulePdfFile,
  adventurePdfFile,
  syncBookDownloads,
} from "./lib/book-build.mjs";
import { linkGlossaryInHtml, glossaryHrefForPage } from "./lib/glossary.mjs";
import { expandInventarSchema } from "./lib/inventar-schema.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const RPG = path.join(ROOT, "rpg");
const MY_MODULES = path.join(ROOT, "my_modules");
const OUT = path.join(ROOT, "public");
const CSS_SRC = path.join(__dirname, "css", "main.css");
const JS_MANIFEST = path.join(__dirname, "js", "manifest.js");

// Соответствие страниц манифесту (modules в manifest.example.yaml)
const PAGE_TO_MODULE = {
  "02-boy.html": "tactical_combat",
  "03-derevya-talantov.html": "talent_trees",
  "04-magiya.html": "magic",
  "05-snaryazhenie.html": "equipment",
  "06-bestiariy.html": "bestiary",
  "07-rany.html": "wounds",
  "08-krity-i-promahi.html": "crits_and_fumbles",
  "09-sozdanie-i-uroven.html": "character_progression",
  "10-sostoyaniya.html": "states",
  "11-otryady.html": "squads",
  "fantasy/01-zaklinaniya.html": "fantasy_spells",
  "fantasy/02-talanty-i-navyki.html": "fantasy_skills",
  "fantasy/03-snaryazhenie.html": "fantasy_gear",
  "modules/fantasy-bestiariy.html": "fantasy_bestiary",
  "fantasy/05-inventar.html": "fantasy_inventory",
  "modules/noir-investigation.html": "noir_investigation",
  "modules/fahrenheit-books.html": "fahrenheit_books",
  "modules/hero-trap.html": "hero_trap",
  "modules/gothic-oruzhie.html": "gothic_weapons",
  "modules/gothic-bronya.html": "gothic_armor",
  "modules/gothic-magiya.html": "gothic_magic",
  "modules/gothic-talanty.html": "gothic_talents",
  "modules/skyrim-oruzhie.html": "skyrim_weapons",
  "modules/skyrim-bronya.html": "skyrim_armor",
  "modules/skyrim-magiya.html": "skyrim_magic",
  "modules/skyrim-talanty.html": "skyrim_talents",
  "modules/skyrim-bogi.html": "skyrim_gods",
  "modules/skyrim-kulty.html": "skyrim_cults",
  "modules/skyrim-izgotovlenie.html": "skyrim_crafting",
  "modules/skyrim-alkhimiya.html": "skyrim_alchemy",
  "modules/skyrim-frakcii.html": "skyrim_factions",
  "modules/skyrim-karta.html": "skyrim_map",
  "modules/ognestrel.html": "firearms",
  "modules/transport.html": "vehicles",
};

marked.use({ gfm: true });

function walkMarkdown(dir, base = dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) out.push(...walkMarkdown(full, base));
    else if (name.endsWith(".md")) out.push(path.relative(base, full).replace(/\\/g, "/"));
  }
  return out.sort((a, b) => a.localeCompare(b, "ru"));
}

function extractTitle(md) {
  const m = md.match(/^#\s+(.+)$/m);
  return m ? m[1].trim().replace(/\*\*/g, "") : null;
}

function stripFrontmatter(md) {
  if (md.startsWith("---\n")) {
    const end = md.indexOf("\n---\n", 4);
    if (end !== -1) return md.slice(end + 5);
  }
  return md;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fixMdLinks(html) {
  return html.replace(/href="([^"]*?)\.md(#[^"]*)?"/g, (_, base, hash) => {
    const h = hash || "";
    return `href="${base}.html${h}"`;
  });
}

/** Создаёт slug для якоря из текста заголовка (без HTML) */
function slugify(text) {
  const stripped = text.replace(/<[^>]+>/g, "").trim();
  return stripped
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "section";
}

/** Извлекает h2/h3, добавляет id, возвращает { html, toc } */
function extractHeadingsAndAddIds(html) {
  const toc = [];
  const seen = new Map();

  function ensureUniqueId(baseId) {
    const count = (seen.get(baseId) || 0) + 1;
    seen.set(baseId, count);
    return count === 1 ? baseId : `${baseId}-${count}`;
  }

  const modified = html.replace(
    /<(h[23])>([\s\S]*?)<\/\1>/gi,
    (match, tag, inner) => {
      const level = parseInt(tag.charAt(1), 10);
      const id = ensureUniqueId(slugify(inner));
      toc.push({ level, text: inner.replace(/<[^>]+>/g, "").trim(), id });
      return `<${tag} id="${id}">${inner}</${tag}>`;
    }
  );

  return { html: modified, toc };
}

function sortNavByChapterOrder(items, mdOrder) {
  const hrefOrder = mdOrder.map((r) => r.replace(/\.md$/, ".html"));
  const byKey = new Map(
    items.map((item) => {
      const key = typeof item === "string" ? item.replace(/\.md$/, ".html") : item.href || item.outRel;
      return [key, item];
    })
  );
  const sorted = hrefOrder.map((h) => byKey.get(h)).filter(Boolean);
  const rest = items.filter((item) => {
    const key = typeof item === "string" ? item.replace(/\.md$/, ".html") : item.href || item.outRel;
    return !hrefOrder.includes(key);
  });
  return [...sorted, ...rest];
}

function depthOf(relPath) {
  return relPath.split("/").length - 1;
}

function cssPrefix(relHtmlPath) {
  const d = depthOf(relHtmlPath);
  return d === 0 ? "" : "../".repeat(d);
}

function wrapPage({ title, bodyHtml, relPath, navGroups, activeSlug, toc = [], extraScripts = "" }) {
  const prefix = cssPrefix(relPath);
  const navHtml = navGroups
    .map((group) => {
      const itemsHtml = group.items
        .map((item) => {
          const cls = item.href === activeSlug ? ' class="active"' : "";
          const dataMod = item.module ? ` data-module="${escapeHtml(item.module)}"` : "";
          return `<a href="${prefix}${item.href}"${cls}${dataMod}>${escapeHtml(item.short)}</a>`;
        })
        .join("\n");
      if (group.title) {
        return `<div class="nav-group"><div class="nav-group-title">${escapeHtml(group.title)}</div>${itemsHtml}</div>`;
      }
      return itemsHtml;
    })
    .join("\n");

  const tocHtml =
    toc.length > 0
      ? toc
          .map((item) => {
            const cls = item.level === 3 ? "toc-item toc-item-h3" : "toc-item toc-item-h2";
            return `<a class="${cls}" href="#${escapeHtml(item.id)}">${escapeHtml(item.text)}</a>`;
          })
          .join("\n")
      : "";

  const tocSidebar =
    tocHtml
      ? `
    <aside class="toc-sidebar">
      <div class="toc-sidebar-inner">
        <div class="toc-sidebar-title">На странице</div>
        <nav class="toc-nav">${tocHtml}</nav>
      </div>
    </aside>`
      : "";

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Корни судьбы — модульная настольная РПГ. ${escapeHtml(title)}">
  <title>${escapeHtml(title)} — Корни судьбы</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Source+Sans+3:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${prefix}css/main.css">
</head>
<body>
  <header class="site-header">
    <a class="brand" href="${prefix}index.html">Корни судьбы</a>
    <nav class="nav-inline">
      <a href="${prefix}index.html">Главная</a>
      <a href="${prefix}oglavlenie.html">Оглавление</a>
      <a href="${prefix}oglavlenie-igroka.html">Игроку</a>
      <a href="${prefix}oglavlenie-hranitelya.html">Хранителю</a>
      <a href="${prefix}character-sheet.html">Лист персонажа</a>
      <a href="${prefix}nastroyki.html">Настройки</a>
    </nav>
  </header>
  <div class="layout-doc${tocSidebar ? " layout-doc-with-toc" : ""}">
    <aside class="sidebar">
      <div class="sidebar-inner">
        <div class="sidebar-title">Разделы</div>
        <nav>${navHtml}</nav>
      </div>
    </aside>
    <article class="doc-main">
      ${bodyHtml}
    </article>${tocSidebar}
  </div>
  <footer class="site-footer">
    <p>Модульная настольная РПГ «Корни судьбы» · <a href="https://gitlab.com/fso13/me-rpg">Исходники на GitLab</a></p>
  </footer>
  <script src="${prefix}js/manifest.js"></script>${extraScripts}
</body>
</html>`;
}

const README_HTML = {
  "README.md": "oglavlenie.html",
  "README-igrok.md": "oglavlenie-igroka.html",
  "README-hranitel.md": "oglavlenie-hranitelya.html",
};

function slugFromMd(rel) {
  if (README_HTML[rel]) return README_HTML[rel];
  return rel.replace(/\.md$/, ".html");
}

function isReadmeRel(rel) {
  return rel in README_HTML;
}

function shortLabel(rel, title) {
  if (rel === "README.md") return "Оглавление";
  if (rel === "README-igrok.md") return "Книга игрока";
  if (rel === "README-hranitel.md") return "Книга хранителя";
  if (rel.startsWith("fantasy/")) {
    const n = rel.replace("fantasy/", "").replace(".md", "");
    return title && title.length < 50 ? title : n;
  }
  return title && title.length < 52 ? title : rel.replace(".md", "");
}

function main() {
  const preservedBooks = preserveBookAssets(OUT);
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(path.join(OUT, "css"), { recursive: true });
  fs.mkdirSync(path.join(OUT, "js"), { recursive: true });
  fs.mkdirSync(path.join(OUT, "fantasy"), { recursive: true });
  fs.copyFileSync(CSS_SRC, path.join(OUT, "css", "main.css"));
  fs.copyFileSync(path.join(__dirname, "css", "character-sheet.css"), path.join(OUT, "css", "character-sheet.css"));
  fs.copyFileSync(path.join(__dirname, "css", "inventar-schema.css"), path.join(OUT, "css", "inventar-schema.css"));
  fs.copyFileSync(JS_MANIFEST, path.join(OUT, "js", "manifest.js"));
  fs.copyFileSync(path.join(__dirname, "js", "config-page.js"), path.join(OUT, "js", "config-page.js"));
  fs.copyFileSync(path.join(__dirname, "js", "character-sheet.js"), path.join(OUT, "js", "character-sheet.js"));
  const sheetSrc = expandInventarSchema(
    fs.readFileSync(path.join(__dirname, "character-sheet.html"), "utf8")
  );
  fs.writeFileSync(path.join(OUT, "character-sheet.html"), sheetSrc, "utf8");

  const siteImages = path.join(__dirname, "images");
  if (fs.existsSync(siteImages)) {
    fs.mkdirSync(path.join(OUT, "images"), { recursive: true });
    fs.cpSync(siteImages, path.join(OUT, "images"), { recursive: true });
  }

  const advMaps = path.join(RPG, "adventure", "maps");
  if (fs.existsSync(advMaps)) {
    fs.mkdirSync(path.join(OUT, "adventure", "maps"), { recursive: true });
    fs.cpSync(advMaps, path.join(OUT, "adventure", "maps"), { recursive: true });
  }

  const fantasyImages = path.join(RPG, "fantasy", "images");
  if (fs.existsSync(fantasyImages)) {
    fs.mkdirSync(path.join(OUT, "fantasy", "images"), { recursive: true });
    fs.cpSync(fantasyImages, path.join(OUT, "fantasy", "images"), { recursive: true });
  }

  const skyrimMaps = path.join(MY_MODULES, "skyrim", "maps");
  if (fs.existsSync(skyrimMaps)) {
    fs.mkdirSync(path.join(OUT, "modules", "skyrim", "maps"), { recursive: true });
    fs.cpSync(skyrimMaps, path.join(OUT, "modules", "skyrim", "maps"), { recursive: true });
  }

  const relFiles = walkMarkdown(RPG);
  const titleByRel = buildTitleByRel(relFiles);
  const pageMeta = [];

  for (const rel of relFiles) {
    const md = fs.readFileSync(path.join(RPG, rel), "utf8");
    const title = extractTitle(md) || rel;
    pageMeta.push({
      rel,
      outRel: slugFromMd(rel),
      title,
      short: shortLabel(rel, title),
      isReadme: isReadmeRel(rel),
      audience: chapterAudience(rel),
      isCustomModule: false,
    });
  }

  const customModulePages = [];
  for (const mod of CUSTOM_MODULES) {
    const srcPath = path.join(MY_MODULES, mod.srcRel);
    if (!fs.existsSync(srcPath)) {
      console.warn("Custom module not found:", srcPath);
      continue;
    }
    const raw = fs.readFileSync(srcPath, "utf8");
    const md = stripFrontmatter(raw);
    const title = extractTitle(md) || mod.id;
    const entry = {
      rel: mod.mdRel,
      outRel: mod.outRel,
      title,
      short: title.length < 52 ? title : "Нуарное расследование",
      isReadme: false,
      audience: mod.audience,
      isCustomModule: true,
      moduleId: mod.id,
      pack: mod.pack || null,
      mdBody: md,
    };
    customModulePages.push(entry);
    pageMeta.push(entry);
    titleByRel.set(mod.mdRel, title);
  }

  const toNavItem = (p) => {
    const mod = PAGE_TO_MODULE[p.outRel];
    return {
      href: p.outRel,
      short: p.short.length > 44 ? p.short.slice(0, 42) + "…" : p.short,
      module: mod || null,
    };
  };

  const core = pageMeta.filter(
    (p) =>
      !p.isReadme &&
      !p.isCustomModule &&
      !p.rel.startsWith("fantasy/") &&
      !p.rel.startsWith("adventure/")
  );
  const fant = pageMeta.filter((p) => p.rel.startsWith("fantasy/"));
  const customModOrder = CUSTOM_MODULES.map((m) => m.mdRel);
  const customMods = pageMeta
    .filter((p) => p.isCustomModule)
    .sort((a, b) => customModOrder.indexOf(a.rel) - customModOrder.indexOf(b.rel));
  const gothicMods = customMods.filter((p) => p.pack === GOTHIC_PACK);
  const skyrimMods = customMods.filter((p) => p.pack === SKYRIM_PACK);
  const extraMods = customMods.filter(
    (p) => p.pack !== GOTHIC_PACK && p.pack !== SKYRIM_PACK
  );
  const readmes = pageMeta.filter((p) => p.isReadme);
  const pageByRel = new Map(pageMeta.map((p) => [p.rel, p]));

  const playerCore = core.filter((p) => p.audience === "player");
  const keeperCore = core.filter((p) => p.audience === "keeper");
  const playerFant = fant.filter((p) => p.audience === "player");

  const HIDE_FROM_NAV = new Set([
    "kniga-polnaya.md",
    "kniga-homebrewery.md",
    "kniga-igroka.md",
    "kniga-hranitelya.md",
  ]);
  const isNavVisible = (p) => !HIDE_FROM_NAV.has(p.rel);

  const slovarPage = pageMeta.find((p) => p.rel === "slovar-terminov.md");

  const advMainRels = new Set(ADVENTURES.map((a) => a.adventureRel));
  const advMain = pageMeta.filter((p) => advMainRels.has(p.rel));

  const playerNavItems = sortNavByChapterOrder(
    [...playerCore, ...playerFant].filter(isNavVisible).map(toNavItem),
    PLAYER_CHAPTER_ORDER
  );
  const keeperNavItems = sortNavByChapterOrder(
    [...keeperCore, ...(slovarPage ? [slovarPage] : [])]
      .filter(isNavVisible)
      .map(toNavItem),
    KEEPER_CHAPTER_ORDER
  );
  const adventureNavItems = advMain.filter(isNavVisible).map(toNavItem);

  const navGroups = [
    {
      title: "Оглавления",
      items: readmes.map(toNavItem),
    },
    {
      title: "Книга игрока",
      items: playerNavItems,
    },
    {
      title: "Книга хранителя",
      items: keeperNavItems,
    },
    ...(adventureNavItems.length
      ? [
          {
            title: "Приключения",
            items: adventureNavItems,
          },
        ]
      : []),
    ...(gothicMods.length
      ? [
          {
            title: "Модули Gothic",
            items: gothicMods.filter(isNavVisible).map(toNavItem),
          },
        ]
      : []),
    ...(skyrimMods.length
      ? [
          {
            title: "Модули Skyrim",
            items: skyrimMods.filter(isNavVisible).map(toNavItem),
          },
        ]
      : []),
    ...(extraMods.length
      ? [
          {
            title: "Доп. модули",
            items: extraMods.filter(isNavVisible).map(toNavItem),
          },
        ]
      : []),
  ];

  syncBookDownloads(OUT, RPG, preservedBooks);

  for (const p of pageMeta) {
    const md = p.isCustomModule
      ? p.mdBody
      : fs.readFileSync(path.join(RPG, p.rel), "utf8");
    const mdForPage = expandInventarSchema(
      humanizeMdLinks(md, (rel) => rel, { titleByRel, fromRel: p.rel })
    );
    const rawBody = fixMdLinks(marked.parse(mdForPage));
    const { html: bodyWithIds, toc } = extractHeadingsAndAddIds(rawBody);
    let bodyHtml = linkGlossaryInHtml(bodyWithIds, glossaryHrefForPage(p.outRel));
    const dlPrefix = p.outRel.includes("/") ? "../" : "";

    if (p.isCustomModule) {
      const mod = CUSTOM_MODULES.find((m) => m.id === p.moduleId);
      if (mod) {
        bodyHtml =
          renderPagePdfDownloadHtml(OUT, {
            prefix: dlPrefix,
            items: [{ file: modulePdfFile(mod), label: mod.title || "PDF модуля" }],
            missingHint: "npm run pdf:modules",
          }) + bodyHtml;
      }
    } else {
      const adv = ADVENTURES.find((a) => a.adventureRel === p.rel);
      if (adv) {
        bodyHtml =
          renderPagePdfDownloadHtml(OUT, {
            prefix: dlPrefix,
            items: [{ file: adventurePdfFile(adv), label: `PDF: ${adv.title}` }],
            missingHint: "npm run pdf:adventures",
          }) + bodyHtml;
      }
    }

    if (p.rel === "README-igrok.md") {
      bodyHtml += renderBookDownloadsHtml(OUT, {
        prefix: dlPrefix,
        id: "downloads",
        onlyGroupIds: ["player"],
      });
    } else if (p.rel === "README-hranitel.md") {
      bodyHtml += renderBookDownloadsHtml(OUT, {
        prefix: dlPrefix,
        id: "downloads",
        onlyGroupIds: ["keeper"],
      });
    } else if (p.rel === "README.md") {
      bodyHtml += renderBookDownloadsHtml(OUT, { prefix: dlPrefix, id: "downloads" });
    }
    const outPath = path.join(OUT, p.outRel);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    const html = wrapPage({
      title: p.isReadme ? p.short : p.title,
      bodyHtml,
      relPath: p.outRel,
      navGroups,
      activeSlug: p.outRel,
      toc,
    });
    fs.writeFileSync(outPath, html);
  }

  const playerPages = sortNavByChapterOrder([...playerCore, ...playerFant], PLAYER_CHAPTER_ORDER);
  const keeperPages = sortNavByChapterOrder(
    [...keeperCore, ...(slovarPage ? [slovarPage] : [])],
    KEEPER_CHAPTER_ORDER
  );

  const card = (p, metaOverride) => {
    const desc = p.short.replace(/"/g, "&quot;");
    let meta = metaOverride || "Правила";
    if (!metaOverride) {
      if (p.isReadme) meta = "Оглавление";
      else if (p.isCustomModule)
        meta =
          p.pack === GOTHIC_PACK ? "Gothic" : p.pack === SKYRIM_PACK ? "Skyrim" : "Доп. модуль";
      else if (p.audience === "player") meta = "Игрок";
      else if (p.audience === "keeper") meta = "Хранитель";
      if (p.rel.startsWith("fantasy/")) meta = "Фэнтези · игрок";
      if (p.rel.startsWith("adventure/") && p.rel.endsWith(".md") && !p.rel.includes("/maps/")) meta = "Приключение";
      if (p.rel.includes("/maps/") && p.rel.endsWith("MAPS.md")) meta = "Карты";
    }
    const mod = PAGE_TO_MODULE[p.outRel];
    const dataMod = mod ? ` data-module="${mod}"` : "";
    return `
    <a class="card" href="${p.outRel}"${dataMod}>
      <div class="meta">${meta}</div>
      <h3>${escapeHtml(p.title)}</h3>
      <p>${escapeHtml(desc)}</p>
    </a>`;
  };

  const adventureSections = ADVENTURES.map((advConfig) => {
    const adventure = pageByRel.get(advConfig.adventureRel);
    if (!adventure) return "";
    const module = advConfig.moduleRel ? pageByRel.get(advConfig.moduleRel) : null;
    const maps = advConfig.mapsRel ? pageByRel.get(advConfig.mapsRel) : null;
    const cards = [
      card(adventure, "Приключение"),
      module ? card(module, "Модуль") : "",
      maps ? card(maps, "Карты") : "",
    ]
      .filter(Boolean)
      .join("");
    return `
  <section id="index-adventure-${advConfig.id}" class="index-adventure">
  <h2 class="section-title">${escapeHtml(adventure.title)}</h2>
  <div class="card-grid card-grid-adventure">
    ${cards}
  </div>
  </section>`;
  }).join("");

  const indexHtml = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Корни судьбы — модульная настольная ролевая игра. Только d6, книга игрока и книга хранителя, тактика, магия как атака.">
  <title>Корни судьбы — модульная настольная РПГ</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Source+Sans+3:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/main.css">
</head>
<body>
  <header class="site-header">
    <a class="brand" href="index.html">Корни судьбы</a>
    <nav class="nav-inline">
      <a href="index.html">Главная</a>
      <a href="oglavlenie.html">Оглавление</a>
      <a href="oglavlenie-igroka.html">Игроку</a>
      <a href="oglavlenie-hranitelya.html">Хранителю</a>
      <a href="character-sheet.html">Лист персонажа</a>
      <a href="nastroyki.html">Настройки</a>
    </nav>
  </header>
  <section class="hero">
    <img class="hero-emblem" src="images/emblem-tree-d6.png" width="240" height="264" alt="Дерево с корнями, растущее из шестигранного кубика — символ игры">
    <div class="hero-ornament"></div>
    <h1>Корни судьбы</h1>
    <p class="tagline">Модульная настольная ролевая игра. Только d6, две книги — для игроков и для хранителя. Тактика без лишнего счёта, магия как атака.</p>
    <div class="hero-actions">
      <a class="btn" href="oglavlenie-igroka.html">Книга игрока</a>
      <a class="btn btn-muted" href="oglavlenie-hranitelya.html">Книга хранителя</a>
      <a class="btn btn-muted" href="#downloads">Скачать PDF</a>
    </div>
  </section>
  ${renderBookDownloadsHtml(OUT)}
  <section id="index-section-readmes">
  <h2 class="section-title">Оглавления</h2>
  <div class="card-grid">
    ${readmes.map((p) => card(p)).join("")}
  </div>
  </section>
  <section id="index-section-player">
  <h2 class="section-title">Книга игрока</h2>
  <div class="card-grid">
    ${playerPages.map((p) => card(p)).join("")}
  </div>
  </section>
  <section id="index-section-keeper">
  <h2 class="section-title">Книга хранителя</h2>
  <div class="card-grid">
    ${keeperPages.map((p) => card(p)).join("")}
  </div>
  </section>
  ${adventureSections}
  ${
    gothicMods.length
      ? `<section id="index-section-gothic">
  <h2 class="section-title">Модули Gothic</h2>
  <div class="card-grid">
    ${gothicMods.map((p) => card(p)).join("")}
  </div>
  </section>`
      : ""
  }
  ${
    skyrimMods.length
      ? `<section id="index-section-skyrim">
  <h2 class="section-title">Модули Skyrim</h2>
  <div class="card-grid">
    ${skyrimMods.map((p) => card(p)).join("")}
  </div>
  </section>`
      : ""
  }
  ${
    extraMods.length
      ? `<section id="index-section-custom">
  <h2 class="section-title">Дополнительные модули</h2>
  <div class="card-grid">
    ${extraMods.map((p) => card(p)).join("")}
  </div>
  </section>`
      : ""
  }
  <footer class="site-footer">
    <p>Собрано из Markdown · <a href="https://gitlab.com/fso13/me-rpg">GitLab</a> · Pages</p>
  </footer>
  <script src="js/manifest.js"></script>
</body>
</html>`;

  fs.writeFileSync(path.join(OUT, "index.html"), indexHtml);

  // Страница настроек модулей
  const configBody = `<h1>Настройки модулей</h1>
<p>Включите или отключите разделы правил. Навигация обновится автоматически. Состояние сохраняется в браузере.</p>
<div id="config-form" class="config-form"></div>
<p class="config-actions">
  <button type="button" id="config-save" class="btn btn-sm">Применить</button>
  <button type="button" id="config-reset" class="btn btn-sm btn-muted">Сбросить по умолчанию</button>
</p>`;

  const configHtml = wrapPage({
    title: "Настройки модулей",
    bodyHtml: configBody,
    relPath: "nastroyki.html",
    navGroups,
    activeSlug: null,
    extraScripts: '\n  <script src="js/config-page.js"></script>',
  });
  fs.writeFileSync(path.join(OUT, "nastroyki.html"), configHtml);

  console.log("Built", pageMeta.length, "pages + index.html + nastroyki.html →", OUT);
}

main();

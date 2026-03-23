#!/usr/bin/env node
// Сборка статического сайта: rpg/**/*.md → public/
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { marked } from "marked";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const RPG = path.join(ROOT, "rpg");
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
  "fantasy/04-bestiariy.html": "fantasy_bestiary",
  "fantasy/05-inventar.html": "fantasy_inventory",
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

function slugFromMd(rel) {
  return rel.replace(/\.md$/, ".html");
}

function shortLabel(rel, title) {
  if (rel === "README.md") return "Оглавление";
  if (rel.startsWith("fantasy/")) {
    const n = rel.replace("fantasy/", "").replace(".md", "");
    return title && title.length < 50 ? title : n;
  }
  return title && title.length < 52 ? title : rel.replace(".md", "");
}

function main() {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(path.join(OUT, "css"), { recursive: true });
  fs.mkdirSync(path.join(OUT, "js"), { recursive: true });
  fs.mkdirSync(path.join(OUT, "fantasy"), { recursive: true });
  fs.copyFileSync(CSS_SRC, path.join(OUT, "css", "main.css"));
  fs.copyFileSync(path.join(__dirname, "css", "character-sheet.css"), path.join(OUT, "css", "character-sheet.css"));
  fs.copyFileSync(JS_MANIFEST, path.join(OUT, "js", "manifest.js"));
  fs.copyFileSync(path.join(__dirname, "js", "config-page.js"), path.join(OUT, "js", "config-page.js"));
  fs.copyFileSync(path.join(__dirname, "js", "character-sheet.js"), path.join(OUT, "js", "character-sheet.js"));
  fs.copyFileSync(path.join(__dirname, "character-sheet.html"), path.join(OUT, "character-sheet.html"));

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

  const relFiles = walkMarkdown(RPG);
  const pageMeta = [];

  for (const rel of relFiles) {
    const md = fs.readFileSync(path.join(RPG, rel), "utf8");
    const title = extractTitle(md) || rel;
    pageMeta.push({
      rel,
      outRel: rel === "README.md" ? "oglavlenie.html" : slugFromMd(rel),
      title,
      short: shortLabel(rel, title),
      isReadme: rel === "README.md",
    });
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
    (p) => !p.isReadme && !p.rel.startsWith("fantasy/") && !p.rel.startsWith("adventure/")
  );
  const fant = pageMeta.filter((p) => p.rel.startsWith("fantasy/"));
  const adv = pageMeta.filter((p) => p.rel.startsWith("adventure/"));

  const navGroups = [
    { items: core.map(toNavItem) },
    { title: "Фэнтези-модули", items: fant.map(toNavItem) },
    { items: adv.map(toNavItem) },
  ];

  for (const p of pageMeta) {
    const md = fs.readFileSync(path.join(RPG, p.rel), "utf8");
    const rawBody = fixMdLinks(marked.parse(md));
    const { html: bodyHtml, toc } = extractHeadingsAndAddIds(rawBody);
    const outPath = path.join(OUT, p.outRel);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    const html = wrapPage({
      title: p.isReadme ? "Оглавление" : p.title,
      bodyHtml,
      relPath: p.outRel,
      navGroups,
      activeSlug: p.outRel,
      toc,
    });
    fs.writeFileSync(outPath, html);
  }

  // Главная страница

  const card = (p) => {
    const desc = p.short.replace(/"/g, "&quot;");
    let meta = "Правила";
    if (p.rel.startsWith("fantasy/")) meta = "Фэнтези";
    if (p.rel.startsWith("adventure/")) meta = "Приключение";
    const mod = PAGE_TO_MODULE[p.outRel];
    const dataMod = mod ? ` data-module="${mod}"` : "";
    return `
    <a class="card" href="${p.outRel}"${dataMod}>
      <div class="meta">${meta}</div>
      <h3>${escapeHtml(p.title)}</h3>
      <p>${escapeHtml(desc)}</p>
    </a>`;
  };

  const indexHtml = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Корни судьбы — модульная настольная ролевая игра. Один тип кубиков, тактика, магия как атака, фэнтези-модули.">
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
      <a href="character-sheet.html">Лист персонажа</a>
      <a href="nastroyki.html">Настройки</a>
    </nav>
  </header>
  <section class="hero">
    <div class="hero-ornament"></div>
    <h1>Корни судьбы</h1>
    <p class="tagline">Модульная настольная ролевая игра. Единый кубик за столом, тактика без лишнего счёта, магия как атака — и тихая роскошь минимализма.</p>
    <a class="btn" href="oglavlenie.html">Читать правила</a>
  </section>
  <section id="index-section-core">
  <h2 class="section-title">Основные главы</h2>
  <div class="card-grid">
    ${core.map(card).join("")}
  </div>
  </section>
  <section id="index-section-fantasy">
  <h2 class="section-title">Фэнтези-модули</h2>
  <div class="card-grid">
    ${fant.map(card).join("")}
  </div>
  </section>
  ${adv.length ? `<section id="index-section-adv">
  <h2 class="section-title">Приключения</h2>
  <div class="card-grid">
    ${adv.map(card).join("")}
  </div>
  </section>` : ""}
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

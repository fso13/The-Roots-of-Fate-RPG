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

function depthOf(relPath) {
  return relPath.split("/").length - 1;
}

function cssPrefix(relHtmlPath) {
  const d = depthOf(relHtmlPath);
  return d === 0 ? "" : "../".repeat(d);
}

function wrapPage({ title, bodyHtml, relPath, navItems, activeSlug }) {
  const prefix = cssPrefix(relPath);
  const navHtml = navItems
    .map((item) => {
      const cls = item.href === activeSlug ? ' class="active"' : "";
      return `<a href="${prefix}${item.href}"${cls}>${escapeHtml(item.short)}</a>`;
    })
    .join("\n");

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
    </nav>
  </header>
  <div class="layout-doc">
    <aside class="sidebar">
      <div class="sidebar-inner">
        <div class="sidebar-title">Разделы</div>
        <nav>${navHtml}</nav>
      </div>
    </aside>
    <article class="doc-main">
      ${bodyHtml}
    </article>
  </div>
  <footer class="site-footer">
    <p>Модульная настольная РПГ «Корни судьбы» · <a href="https://gitlab.com/fso13/me-rpg">Исходники на GitLab</a></p>
  </footer>
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
  fs.mkdirSync(path.join(OUT, "fantasy"), { recursive: true });
  fs.copyFileSync(CSS_SRC, path.join(OUT, "css", "main.css"));

  const advMaps = path.join(RPG, "adventure", "maps");
  if (fs.existsSync(advMaps)) {
    fs.mkdirSync(path.join(OUT, "adventure", "maps"), { recursive: true });
    fs.cpSync(advMaps, path.join(OUT, "adventure", "maps"), { recursive: true });
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

  const navItems = pageMeta
    .filter((p) => !p.isReadme)
    .map((p) => ({
      href: p.outRel,
      short: p.short.length > 44 ? p.short.slice(0, 42) + "…" : p.short,
    }));

  for (const p of pageMeta) {
    const md = fs.readFileSync(path.join(RPG, p.rel), "utf8");
    const bodyHtml = fixMdLinks(marked.parse(md));
    const outPath = path.join(OUT, p.outRel);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    const html = wrapPage({
      title: p.isReadme ? "Оглавление" : p.title,
      bodyHtml,
      relPath: p.outRel,
      navItems,
      activeSlug: p.outRel,
    });
    fs.writeFileSync(outPath, html);
  }

  // Главная страница
  const core = pageMeta.filter(
    (p) => !p.isReadme && !p.rel.startsWith("fantasy/") && !p.rel.startsWith("adventure/")
  );
  const fant = pageMeta.filter((p) => p.rel.startsWith("fantasy/"));
  const adv = pageMeta.filter((p) => p.rel.startsWith("adventure/"));

  const card = (p) => {
    const desc = p.short.replace(/"/g, "&quot;");
    let meta = "Правила";
    if (p.rel.startsWith("fantasy/")) meta = "Фэнтези";
    if (p.rel.startsWith("adventure/")) meta = "Приключение";
    return `
    <a class="card" href="${p.outRel}">
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
    </nav>
  </header>
  <section class="hero">
    <div class="hero-ornament"></div>
    <h1>Корни судьбы</h1>
    <p class="tagline">Модульная настольная ролевая игра. Единый кубик за столом, тактика без лишнего счёта, магия как атака — и тихая роскошь минимализма.</p>
    <a class="btn" href="oglavlenie.html">Читать правила</a>
  </section>
  <h2 class="section-title">Основные главы</h2>
  <div class="card-grid">
    ${core.map(card).join("")}
  </div>
  <h2 class="section-title">Фэнтези-модули</h2>
  <div class="card-grid">
    ${fant.map(card).join("")}
  </div>
  ${adv.length ? `<h2 class="section-title">Приключения</h2>
  <div class="card-grid">
    ${adv.map(card).join("")}
  </div>` : ""}
  <footer class="site-footer">
    <p>Собрано из Markdown · <a href="https://gitlab.com/fso13/me-rpg">GitLab</a> · Pages</p>
  </footer>
</body>
</html>`;

  fs.writeFileSync(path.join(OUT, "index.html"), indexHtml);

  console.log("Built", pageMeta.length, "pages + index.html →", OUT);
}

main();

import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { marked } from "marked";
import { expandInventarSchema } from "./inventar-schema.mjs";

marked.use({ gfm: true });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, "..", "..");

const LOCAL_BROWSERS = path.join(ROOT, ".playwright-browsers");
if (fs.existsSync(LOCAL_BROWSERS)) {
  process.env.PLAYWRIGHT_BROWSERS_PATH = LOCAL_BROWSERS;
}

let chromiumModule;
async function getChromium() {
  if (!chromiumModule) {
    chromiumModule = (await import("playwright")).chromium;
  }
  return chromiumModule;
}
export const RPG = path.join(ROOT, "rpg");
export const PUBLIC = path.join(ROOT, "public");

export function walkMarkdown(dir, base = dir) {
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

export function extractTitle(md) {
  const m = md.match(/^#\s+(.+)$/m);
  return m ? m[1].trim().replace(/\*\*/g, "") : null;
}

export function chapterId(rel) {
  return `chapter-${rel.replace(/\.md$/, "").replace(/\//g, "-")}`;
}

export function fixMdLinksForPdf(html) {
  return html.replace(/href="([^"]*?)\.md(#[^"]*)?"/g, (_, base, hash) => {
    const id = chapterId(`${base}.md`);
    return `href="#${id}${hash || ""}"`;
  });
}

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function assetPublicPath(relPath, src) {
  if (/^https?:\/\//i.test(src) || src.startsWith("data:")) return null;
  const dir = path.dirname(relPath);
  const normalized = src.replace(/^\.\//, "");
  const abs = path.join(RPG, dir === "." ? "" : dir, normalized);
  if (!fs.existsSync(abs)) return null;
  return path.relative(PUBLIC, abs).replace(/\\/g, "/");
}

function relImageSrc(relPath, mdText) {
  return mdText.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
    const fromPublic = assetPublicPath(relPath, src);
    if (fromPublic) return `![${alt}](${fromPublic})`;
    return match;
  });
}

function fixHtmlAssetPaths(html, relPath) {
  return html.replace(/\bsrc="([^"]+)"/g, (match, src) => {
    const fromPublic = assetPublicPath(relPath, src);
    return fromPublic ? `src="${fromPublic}"` : match;
  });
}

export function wrapChapterHead(html) {
  let replaced = false;
  return html.replace(/<h1>([\s\S]*?)<\/h1>/, (match, inner) => {
    if (replaced) return match;
    replaced = true;
    return `<div class="chapter-head"><h1>${inner}</h1><div class="chapter-rule" aria-hidden="true"></div></div>`;
  });
}

export function buildChapterList(relFiles, { wrapHead = false, transformMd } = {}) {
  return relFiles.map((rel) => {
    const mdRaw = fs.readFileSync(path.join(RPG, rel), "utf8");
    const mdBase = transformMd ? transformMd(rel, mdRaw) : mdRaw;
    const md = expandInventarSchema(relImageSrc(rel, mdBase));
    const title = extractTitle(md) || rel;
    const id = chapterId(rel);
    let body = fixHtmlAssetPaths(fixMdLinksForPdf(marked.parse(md)), rel);
    if (wrapHead) body = wrapChapterHead(body);
    return { rel, title, id, body };
  });
}

export function buildToc(chapters, { tocClass = "print-toc" } = {}) {
  const isIntro = (c) =>
    c.rel === "README.md" || c.rel === "README-igrok.md" || c.rel === "README-hranitel.md";
  const core = chapters.filter(
    (c) => !isIntro(c) && !c.rel.startsWith("fantasy/") && !c.rel.startsWith("adventure/")
  );
  const fantasy = chapters.filter((c) => c.rel.startsWith("fantasy/"));
  const adventure = chapters.filter((c) => c.rel.startsWith("adventure/"));
  const readme = chapters.find((c) => isIntro(c));

  const section = (items) =>
    items
      .map(
        (c) => `<li class="toc-item">
          <a class="toc-link" href="#${c.id}">
            <span class="toc-title">${escapeHtml(c.title)}</span>
            <span class="toc-fill" aria-hidden="true"></span>
          </a>
        </li>`
      )
      .join("\n");

  let html = `<nav class="${tocClass}"><h2>Оглавление</h2><ol>`;
  if (readme) html += section([readme]);
  if (core.length) {
    html += '<li class="toc-group">Основные главы</li>';
    html += section(core);
  }
  if (fantasy.length) {
    html += '<li class="toc-group">Фэнтези-модули</li>';
    html += section(fantasy);
  }
  if (adventure.length) {
    html += '<li class="toc-group">Приключения</li>';
    html += section(adventure);
  }
  html += "</ol></nav>";
  return html;
}

export function buildPrintHtml({
  chapters,
  title,
  bodyClass,
  cssHref,
  fontLinks = "",
  coverHtml,
  mainClass = "print-book-main",
  tocClass,
}) {
  const toc = buildToc(chapters, { tocClass: tocClass || "print-toc" });
  const body = chapters.map((c) => `<section class="chapter" id="${c.id}">${c.body}</section>`).join("\n");

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  ${fontLinks}
  <link rel="stylesheet" href="${cssHref}">
</head>
<body class="${bodyClass}">
  ${coverHtml}
  <main class="${mainClass}">
    ${toc}
    ${body}
  </main>
</body>
</html>`;
}

async function launchPdfBrowser() {
  const chromium = await getChromium();
  const attempts = [
    { channel: "chrome", headless: true },
    { channel: "chromium", headless: true },
    { headless: true },
  ];
  let lastError;
  for (const options of attempts) {
    try {
      return await chromium.launch(options);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

export async function renderPdf(htmlPath, pdfPath, pdfOptions) {
  const browser = await launchPdfBrowser();
  try {
    const page = await browser.newPage();
    await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle" });
    await page.pdf({ path: pdfPath, printBackground: true, ...pdfOptions });
  } finally {
    await browser.close();
  }
}

export function ensurePublicBuilt() {
  if (!fs.existsSync(PUBLIC)) {
    console.error("Сначала выполните: npm run build");
    process.exit(1);
  }
}

export function copyPrintCss(cssName) {
  const cssDir = path.join(ROOT, "website", "css");
  const destDir = path.join(PUBLIC, "css");
  fs.mkdirSync(destDir, { recursive: true });
  for (const name of [cssName, "inventar-schema.css"]) {
    fs.copyFileSync(path.join(cssDir, name), path.join(destDir, name));
  }
}

export function parsePdfArgs(argv, defaults) {
  const opts = { ...defaults };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--no-adventure") opts.includeAdventure = false;
    else if (a === "--audience" && argv[i + 1]) opts.audience = argv[++i];
    else if (a === "--output" && argv[i + 1]) opts.output = path.resolve(argv[++i]);
    else if (a === "--help" || a === "-h") {
      console.log(defaults.helpText || "");
      process.exit(0);
    }
  }
  return opts;
}

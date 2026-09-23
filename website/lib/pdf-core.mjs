import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { marked } from "marked";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
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
export const MY_MODULES = path.join(ROOT, "my_modules");
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

/** Общие поля A5 под колонтитул с листком. */
export const PRINT_A5_PDF_OPTS_BASE = {
  width: "148mm",
  height: "210mm",
  margin: { top: "15mm", right: "12mm", bottom: "18mm", left: "12mm" },
  displayHeaderFooter: true,
};

const PRINT_GOLD_HEX = "#111111";
const PRINT_GOLD = rgb(17 / 255, 17 / 255, 17 / 255);
const PRINT_INK = rgb(0, 0, 0);
const MM = 72 / 25.4;

/** Верхний колонтитул пустой — главу штампуем поверх. */
export function printHeaderTemplate(_runningTitle) {
  return `<div style="width:100%;height:8mm;"></div>`;
}

/** Пустой низ — место под номер страницы. */
export function printFooterSpacerTemplate() {
  return `<div style="width:100%;height:12mm;"></div>`;
}

/** Header + spacer; номер и бегущая глава — stampPageChrome. */
export function printChromeTemplates(runningTitle) {
  return {
    headerTemplate: printHeaderTemplate(runningTitle),
    footerTemplate: printFooterSpacerTemplate(),
  };
}

export function parseChapterMeta(title, index = 1) {
  const clean = String(title || "")
    .replace(/[«»""]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  // Номер на развороте / в колонтитуле — порядок в книге (уникальный).
  const num = String(index).padStart(2, "0");
  let rest = clean;
  const m = clean.match(/^Глава\s+(\d+)\.\s*(.+)$/i);
  if (m) {
    rest = m[2].trim();
  }
  const words = rest.split(/\s+/).filter(Boolean);
  let line1 = rest.toUpperCase();
  let line2 = "";
  if (words.length >= 2) {
    if (words.length === 2) {
      line1 = words[0].toUpperCase();
      line2 = words[1].toUpperCase();
    } else {
      const mid = Math.max(1, Math.ceil(words.length / 2));
      line1 = words.slice(0, mid).join(" ").toUpperCase();
      line2 = words.slice(mid).join(" ").toUpperCase();
    }
  }
  return {
    num,
    line1,
    line2,
    full: rest,
    running: `${num}  ${rest.toUpperCase()}`,
    tocSub: line2 || "ГЛАВА",
  };
}

/**
 * Штамп: сверху номер+название главы, снизу номер страницы. Без кубика.
 */
function resolveStampFontPath() {
  const candidates = [
    path.join(ROOT, "website", "fonts", "stamp-cyrillic.ttf"),
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/Library/Fonts/Arial Unicode.ttf",
    "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

export async function stampPageChrome(pdfPath, { skipPages = 2, pageMap = {}, chapters = [] } = {}) {
  const bytes = fs.readFileSync(pdfPath);
  const doc = await PDFDocument.load(bytes);
  doc.registerFontkit(fontkit);
  const fontPath = resolveStampFontPath();
  let font;
  let fontReg;
  if (fontPath) {
    const fontBytes = fs.readFileSync(fontPath);
    font = await doc.embedFont(fontBytes, { subset: true });
    fontReg = font;
  } else {
    font = await doc.embedFont(StandardFonts.HelveticaBold);
    fontReg = await doc.embedFont(StandardFonts.Helvetica);
  }
  const pages = doc.getPages();

  const starts = chapters
    .map((ch, idx) => ({
      ...ch,
      meta: parseChapterMeta(ch.title, ch.chapterIndex ?? idx + 1),
      start: pageMap[ch.id] != null ? pageMap[ch.id] : null,
    }))
    .filter((c) => c.start != null)
    .sort((a, b) => a.start - b.start);

  function chapterForPageNum(pageNum) {
    if (!starts.length || pageNum < starts[0].start) return null;
    let cur = starts[0];
    for (const s of starts) {
      if (s.start <= pageNum) cur = s;
      else break;
    }
    return cur;
  }

  pages.forEach((page, i) => {
    if (i < skipPages) return;
    const pageNum = i - skipPages + 1;
    const { width, height } = page.getSize();
    const ch = chapterForPageNum(pageNum);
    const marginX = 12 * MM;

    if (ch) {
      let running = ch.meta.running;
      const maxW = width - marginX * 2;
      try {
        while (font.widthOfTextAtSize(running, 7.5) > maxW && running.length > 8) {
          running = running.slice(0, -2);
        }
        page.drawText(running, {
          x: marginX,
          y: height - 10 * MM,
          size: 7.5,
          font,
          color: PRINT_INK,
        });
      } catch (err) {
        page.drawText(String(ch.meta.num), {
          x: marginX,
          y: height - 10 * MM,
          size: 7.5,
          font,
          color: PRINT_INK,
        });
      }
      page.drawLine({
        start: { x: marginX, y: height - 11.2 * MM },
        end: { x: width - marginX, y: height - 11.2 * MM },
        thickness: 0.6,
        color: PRINT_INK,
      });
    }

    // Номер страницы: чётные — слева от края, нечётные — справа от края
    const label = String(pageNum);
    const boxW = Math.max(11 * MM, font.widthOfTextAtSize(label, 11) + 6 * MM);
    const boxH = 8 * MM;
    const boxY = 5 * MM; // чуть выше края листа (~5 мм), чтобы не срезало при печати
    const isOdd = pageNum % 2 === 1;
    const boxX = isOdd ? width - boxW : 0;
    page.drawRectangle({
      x: boxX,
      y: boxY,
      width: boxW,
      height: boxH,
      color: PRINT_INK,
    });
    const tw = font.widthOfTextAtSize(label, 11);
    page.drawText(label, {
      x: boxX + (boxW - tw) / 2,
      y: boxY + (boxH - 11 * 0.72) / 2,
      size: 11,
      font,
      color: rgb(1, 1, 1),
    });
  });

  fs.writeFileSync(pdfPath, await doc.save());
}

/** @deprecated */
export async function stampDicePageNumbers(pdfPath, opts = {}) {
  return stampPageChrome(pdfPath, opts);
}

/** @deprecated alias */
export async function stampLeafPageNumbers(pdfPath, opts = {}) {
  const skipPages = opts.skipFirst === false ? 0 : opts.skipPages ?? 2;
  return stampPageChrome(pdfPath, { skipPages });
}


function normalizeTocText(s) {
  return String(s || "")
    .replace(/[«»""„]/g, "")
    .replace(/[—–−]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Страницы глав по тексту PDF (для номеров в оглавлении). */
export async function resolveChapterPagesFromPdf(pdfPath, chapters, { skipPages = 2 } = {}) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;
  const pageTexts = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const text = content.items.map((it) => it.str).join(" ");
    pageTexts.push(normalizeTocText(text));
  }

  const tocFlags = pageTexts.map(() => false);
  let inToc = false;
  for (let i = skipPages; i < pageTexts.length; i++) {
    const t = pageTexts[i];
    if (t.includes("оглавление")) inToc = true;
    if (inToc) {
      tocFlags[i] = true;
      // конец оглавления — крупный номер главы + «о главе» / начало основного текста
      const looksOpen =
        /(?:^|\s)0?\d{1,2}\s+[а-яёa-z]{3,}/i.test(t.slice(0, 80)) &&
        (t.includes("о главе") || t.includes("глава "));
      if (looksOpen && !t.includes("оглавление")) {
        tocFlags[i] = false;
        inToc = false;
      }
    }
  }

  const map = {};
  const usedPages = new Set();
  chapters.forEach((ch, idx) => {
    const meta = parseChapterMeta(ch.title, ch.chapterIndex ?? idx + 1);
    const needles = [
      normalizeTocText(ch.title),
      normalizeTocText(`глава ${Number(meta.num)}. ${meta.full}`),
      normalizeTocText(meta.full),
      normalizeTocText([meta.line1, meta.line2].filter(Boolean).join(" ")),
    ].filter((n, i, arr) => n && n.length >= 3 && arr.indexOf(n) === i);

    let found = -1;
    let bestScore = -1;
    for (let i = skipPages; i < pageTexts.length; i++) {
      if (usedPages.has(i) || tocFlags[i]) continue;
      const t = pageTexts[i];
      const head = t.slice(0, 180);
      let score = 0;

      // Сильный сигнал открытия главы: номер + название в начале
      const openRe = new RegExp(
        `(?:^|\\s)${meta.num}\\s+${normalizeTocText(meta.full).slice(0, 16).replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}`
      );
      if (meta.full && openRe.test(head)) score = 120;
      else if (
        head.startsWith(meta.num) ||
        head.includes(` ${meta.num} `) ||
        new RegExp(`^${meta.num}\\s`).test(head)
      ) {
        const bit = normalizeTocText(meta.full).slice(0, 14);
        if (bit && head.includes(bit)) score = 110;
      }

      for (const needle of needles) {
        if (head.includes(needle)) score = Math.max(score, needle.length >= 12 ? 90 : 70);
        else if (t.includes(needle) && !tocFlags[i]) score = Math.max(score, 35);
      }

      if (score > bestScore) {
        bestScore = score;
        found = i;
        if (score >= 110) break;
      }
    }
    if (found >= 0 && bestScore >= 60) {
      map[ch.id] = found - skipPages + 1;
      usedPages.add(found);
    }
  });
  return map;
}

export function fillTocPageNumbersInHtml(html, pageMap) {
  return html.replace(
    /(<span class="toc-page" data-toc-for=")([^"]+)("[^>]*>)([^<]*)(<\/span>)/g,
    (full, a, id, b, _old, c) => {
      const n = pageMap[id];
      return `${a}${id}${b}${n != null ? String(n) : "·"}${c}`;
    }
  );
}

function tocItemHtml(c, index = 1) {
  const meta = parseChapterMeta(c.title, c.chapterIndex ?? index);
  const sub = escapeHtml((c.tocSub || meta.tocSub || "").toUpperCase());
  const displayTitle = [meta.line1, meta.line2].filter(Boolean).join(" ");
  return `<li class="toc-item">
          <span class="toc-page" data-toc-for="${c.id}" data-chapter-title="${escapeHtml(c.title)}">·</span>
          <div class="toc-text">
            <a class="toc-link" href="#${c.id}"><span class="toc-title">${escapeHtml(displayTitle)}</span></a>
            <span class="toc-sub">${sub}</span>
          </div>
        </li>`;
}

export function stripFrontmatter(md) {
  if (md.startsWith("---\n")) {
    const end = md.indexOf("\n---\n", 4);
    if (end !== -1) return md.slice(end + 5);
  }
  return md;
}

function resolveAssetAbs(relPath, src) {
  if (/^https?:\/\//i.test(src) || src.startsWith("data:")) return null;
  const normalized = src.replace(/^\.\//, "");
  const dir = path.dirname(relPath);
  const candidates = [path.normalize(path.join(RPG, dir === "." ? "" : dir, normalized))];
  if (normalized.includes("..")) {
    candidates.push(path.normalize(path.join(RPG, normalized.replace(/^(\.\.\/)+/, ""))));
  }
  if (relPath.startsWith("modules/")) {
    candidates.push(path.normalize(path.join(MY_MODULES, normalized)));
    candidates.push(path.normalize(path.join(PUBLIC, "modules", normalized)));
  }
  for (const abs of candidates) {
    if (fs.existsSync(abs)) return abs;
  }
  return null;
}

function assetPublicPath(relPath, src) {
  const abs = resolveAssetAbs(relPath, src);
  if (!abs) return null;
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

export function wrapChapterHead(html, { artSrc = null, index = 1, title: titleOpt = null } = {}) {
  let replaced = false;
  let leadHtml = "";
  // Первый абзац после h1 — лид на развороте главы
  html = html.replace(/<\/h1>\s*<p>([\s\S]*?)<\/p>/, (match, inner) => {
    const text = String(inner).replace(/<[^>]+>/g, "").trim();
    if (text.length > 20 && text.length < 420) {
      leadHtml = `<p class="chapter-open-lead-label">О главе</p><p class="chapter-open-lead">${inner}</p>`;
      return "</h1>";
    }
    return match;
  });

  return html.replace(/<h1>([\s\S]*?)<\/h1>/, (match, inner) => {
    if (replaced) return match;
    replaced = true;
    const plain = String(inner).replace(/<[^>]+>/g, "").trim();
    const meta = parseChapterMeta(titleOpt || plain, index);
    const art = artSrc
      ? `<figure class="chapter-art"><img src="${escapeHtml(artSrc)}" alt=""></figure>`
      : "";
    return `<div class="chapter-open">
  <div class="chapter-open-num">${escapeHtml(meta.num)}</div>
  <div class="chapter-open-rule" aria-hidden="true"></div>
  <h1 class="chapter-open-title">${escapeHtml(meta.line1)}</h1>
  ${meta.line2 ? `<p class="chapter-open-subtitle">${escapeHtml(meta.line2)}</p>` : ""}
  <div class="chapter-open-rule" aria-hidden="true"></div>
  ${leadHtml}
  ${art}
</div>`;
  });
}

/** Путь к иллюстрации главы относительно public/ (или null). */
export function chapterArtPublicPath(rel) {
  const key = rel.replace(/\.md$/, "").replace(/\//g, "-");
  const file = `images/chapters/${key}.png`;
  const abs = path.join(ROOT, "website", file);
  return fs.existsSync(abs) ? file : null;
}

export function buildChapterList(relFiles, { wrapHead = false, transformMd } = {}) {
  return relFiles.map((rel, i) => {
    const mdRaw = fs.readFileSync(path.join(RPG, rel), "utf8");
    const mdBase = transformMd ? transformMd(rel, mdRaw) : mdRaw;
    const md = expandInventarSchema(relImageSrc(rel, mdBase));
    const title = extractTitle(md) || rel;
    const id = chapterId(rel);
    let body = fixHtmlAssetPaths(fixMdLinksForPdf(marked.parse(md)), rel);
    if (wrapHead) {
      body = wrapChapterHead(body, {
        artSrc: chapterArtPublicPath(rel),
        index: i + 1,
        title,
      });
    }
    return { rel, title, id, body, chapterIndex: i + 1 };
  });
}

export function buildCustomModuleChapter(mod, { wrapHead = false, index = 1 } = {}) {
  const srcPath = path.join(MY_MODULES, mod.srcRel);
  const mdRaw = stripFrontmatter(fs.readFileSync(srcPath, "utf8"));
  const rel = mod.mdRel;
  const md = expandInventarSchema(relImageSrc(rel, mdRaw));
  const title = extractTitle(md) || mod.title || mod.id;
  const id = chapterId(rel);
  let body = fixHtmlAssetPaths(fixMdLinksForPdf(marked.parse(md)), rel);
  if (wrapHead) {
    body = wrapChapterHead(body, {
      artSrc: chapterArtPublicPath(rel),
      index,
      title,
    });
  }
  return { rel, title, id, body, chapterIndex: index };
}

export function buildThanksChapter(index = 99) {
  const rel = "blagodarnosti.md";
  const srcPath = path.join(RPG, rel);
  if (!fs.existsSync(srcPath)) {
    return {
      rel,
      title: "Благодарности",
      id: chapterId(rel),
      chapterIndex: index,
      body: wrapChapterHead("<h1>Благодарности</h1><p>Спасибо, что играете.</p>", {
        index,
        title: "Благодарности",
      }),
    };
  }
  const md = fs.readFileSync(srcPath, "utf8");
  const title = extractTitle(md) || "Благодарности";
  const id = chapterId(rel);
  let body = fixHtmlAssetPaths(fixMdLinksForPdf(marked.parse(md)), rel);
  body = wrapChapterHead(body, { index, title });
  return { rel, title, id, body, chapterIndex: index, tocSub: "КОНЕЦ КНИГИ" };
}

export function buildSimpleToc(chapters, { tocClass = "print-toc" } = {}) {
  const items = chapters.map((c, i) => tocItemHtml(c, i + 1)).join("\n");
  return `<nav class="${tocClass}"><h2><span class="toc-h2-text">ОГЛАВЛЕНИЕ</span></h2><ol>${items}</ol></nav>`;
}

function tocSectionItems(items, tocSub) {
  return items
    .map((c, i) => tocItemHtml({ ...c, tocSub: c.tocSub || tocSub }, i + 1))
    .join("\n");
}

/** Группы оглавления: [{ label, chapters }] */
export function buildGroupedToc(groups, { tocClass = "print-toc" } = {}) {
  let html = `<nav class="${tocClass}"><h2><span class="toc-h2-text">ОГЛАВЛЕНИЕ</span></h2><ol>`;
  for (const group of groups) {
    if (!group?.chapters?.length) continue;
    html += tocSectionItems(group.chapters, group.label || "");
  }
  html += `</ol></nav>`;
  return html;
}

export function buildPrintHtml({
  chapters,
  title,
  bodyClass,
  cssHref,
  fontLinks = "",
  coverHtml,
  backCoverHtml = "",
  mainClass = "print-book-main",
  tocClass,
  simpleToc = false,
  tocGroups = null,
  blankAfterCover = true,
  includeThanks = true,
  includeToc = true,
}) {
  const allChapters = includeThanks
    ? [...chapters, buildThanksChapter(chapters.length + 1)]
    : [...chapters];

  let toc;
  if (!includeToc) {
    toc = "";
  } else if (tocGroups) {
    const groups = tocGroups.map((g) => ({ ...g, chapters: [...g.chapters] }));
    if (includeThanks) {
      const thanks = allChapters[allChapters.length - 1];
      groups.push({ label: null, chapters: [thanks] });
    }
    toc = buildGroupedToc(groups, { tocClass: tocClass || "print-toc" });
  } else if (simpleToc) {
    toc = buildSimpleToc(allChapters, { tocClass: tocClass || "print-toc" });
  } else {
    toc = buildToc(allChapters, { tocClass: tocClass || "print-toc" });
  }
  const body = allChapters
    .map((c, i) => {
      const idx = c.chapterIndex ?? i + 1;
      return `<section class="chapter" id="${c.id}" data-chapter-title="${escapeHtml(c.title)}" data-chapter-index="${idx}">${c.body}</section>`;
    })
    .join("\n");
  const blank = blankAfterCover
    ? `<div class="print-blank-page" aria-hidden="true"></div>`
    : "";

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
  ${blank}
  <main class="${mainClass}">
    ${toc}
    ${body}
  </main>
  ${backCoverHtml || ""}
</body>
</html>`;
}

/** Одностраничный HTML обложки / задника для печати без полей. */
export function buildBleedSheetHtml({
  title,
  bodyClass = "print-cairn print-bleed-sheet",
  cssHref,
  fontLinks = "",
  sheetHtml,
}) {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  ${fontLinks}
  <link rel="stylesheet" href="${cssHref}">
  <style>
    @page { size: 148mm 210mm; margin: 0; }
    html, body { margin: 0; padding: 0; }
  </style>
</head>
<body class="${bodyClass}">
  ${sheetHtml}
</body>
</html>`;
}

const BLEED_PDF_OPTS = {
  width: "148mm",
  height: "210mm",
  margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
  displayHeaderFooter: false,
  printBackground: true,
  preferCSSPageSize: true,
};

/**
 * Рендерит лист без полей и подменяет/добавляет страницы в готовом PDF.
 * frontHtmlPath → страница 0; backHtmlPath → в конец (после удаления старого задника, если был).
 */
export async function applyBleedCovers(pdfPath, { frontHtmlPath, backHtmlPath, hadBackCover = false } = {}) {
  if (!frontHtmlPath && !backHtmlPath) return;

  const browser = await launchPdfBrowser();
  const tmpDir = path.join(path.dirname(pdfPath), ".bleed-tmp");
  fs.mkdirSync(tmpDir, { recursive: true });
  const frontPdf = path.join(tmpDir, "front-bleed.pdf");
  const backPdf = path.join(tmpDir, "back-bleed.pdf");

  try {
    const page = await browser.newPage();
    if (frontHtmlPath) {
      await page.goto(pathToFileURL(frontHtmlPath).href, { waitUntil: "networkidle" });
      await page.pdf({ path: frontPdf, ...BLEED_PDF_OPTS });
    }
    if (backHtmlPath) {
      await page.goto(pathToFileURL(backHtmlPath).href, { waitUntil: "networkidle" });
      await page.pdf({ path: backPdf, ...BLEED_PDF_OPTS });
    }
  } finally {
    await browser.close();
  }

  const book = await PDFDocument.load(fs.readFileSync(pdfPath));
  const out = await PDFDocument.create();

  if (frontHtmlPath && fs.existsSync(frontPdf)) {
    const front = await PDFDocument.load(fs.readFileSync(frontPdf));
    const [p] = await out.copyPages(front, [0]);
    out.addPage(p);
  } else if (book.getPageCount() > 0) {
    const [p] = await out.copyPages(book, [0]);
    out.addPage(p);
  }

  const bookCount = book.getPageCount();
  const endExclusive = hadBackCover && bookCount > 1 ? bookCount - 1 : bookCount;
  if (endExclusive > 1) {
    const middle = await out.copyPages(
      book,
      Array.from({ length: endExclusive - 1 }, (_, i) => i + 1)
    );
    for (const p of middle) out.addPage(p);
  }

  if (backHtmlPath && fs.existsSync(backPdf)) {
    const back = await PDFDocument.load(fs.readFileSync(backPdf));
    const [p] = await out.copyPages(back, [0]);
    out.addPage(p);
  }

  fs.writeFileSync(pdfPath, await out.save());
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

/**
 * Доливает страницы до кратности `multiple` (для печати брошюрой).
 * Вставляет листы «Заметки» перед задней обложкой (`reserveTrailing` последних страниц).
 * `minNotes` — минимум листов заметок, даже если кратность уже соблюдена.
 * @returns {number} сколько страниц добавлено
 */
export async function padPdfToBooklet(
  pdfPath,
  { multiple = 4, reserveTrailing = 1, label = "Заметки", minNotes = 0 } = {}
) {
  const doc = await PDFDocument.load(fs.readFileSync(pdfPath));
  doc.registerFontkit(fontkit);
  const count = doc.getPageCount();
  const rem = count % multiple;
  let need = rem === 0 ? 0 : multiple - rem;
  if (minNotes > need) {
    // Добираем до minNotes, сохраняя кратность multiple
    need = minNotes;
    while ((count + need) % multiple !== 0) need += 1;
  }
  if (need === 0) return 0;

  const fontPath = resolveStampFontPath();
  let font;
  if (fontPath) {
    font = await doc.embedFont(fs.readFileSync(fontPath), { subset: true });
  } else {
    font = await doc.embedFont(StandardFonts.Helvetica);
  }

  const ref = doc.getPage(0);
  const { width, height } = ref.getSize();
  const insertAt = Math.max(0, count - Math.max(0, reserveTrailing));
  const marginX = 12 * MM;
  const marginTop = 15 * MM;
  const marginBottom = 18 * MM;

  for (let i = 0; i < need; i++) {
    const page = doc.insertPage(insertAt + i, [width, height]);
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: rgb(1, 1, 1),
    });

    const title = label.toUpperCase();
    const titleSize = 11;
    const titleW = font.widthOfTextAtSize(title, titleSize);
    page.drawText(title, {
      x: (width - titleW) / 2,
      y: height - marginTop - titleSize,
      size: titleSize,
      font,
      color: PRINT_GOLD,
    });
    page.drawLine({
      start: { x: marginX, y: height - marginTop - titleSize - 2.5 * MM },
      end: { x: width - marginX, y: height - marginTop - titleSize - 2.5 * MM },
      thickness: 0.6,
      color: PRINT_INK,
    });

    const lineGap = 8 * MM;
    let y = height - marginTop - titleSize - 8 * MM;
    const bottom = marginBottom;
    while (y > bottom) {
      page.drawLine({
        start: { x: marginX, y },
        end: { x: width - marginX, y },
        thickness: 0.35,
        color: rgb(0.78, 0.78, 0.78),
      });
      y -= lineGap;
    }
  }

  fs.writeFileSync(pdfPath, await doc.save());
  return need;
}

/** A4 landscape (две A5 бок о бок). */
const A4_LANDSCAPE_W = 297 * MM;
const A4_LANDSCAPE_H = 210 * MM;

/**
 * Импозиция для печати брошюры на A4:
 * каждый лист PDF = A4 landscape, слева и справа по одной странице A5-книги
 * в порядке седловой сшивки (saddle stitch).
 *
 * Печать: A4, двусторонняя, переворот по короткому краю.
 * Режим «брошюра» в драйвере не включать — уже спущено.
 *
 * @returns {{ sheets: number, pagesOut: number, pagesIn: number }}
 */
export async function imposeBookletPdf(srcPath, outPath) {
  const src = await PDFDocument.load(fs.readFileSync(srcPath));
  const n = src.getPageCount();
  if (n < 4 || n % 4 !== 0) {
    throw new Error(
      `imposeBookletPdf: нужно кратно 4 страницам (сейчас ${n}). Сначала padPdfToBooklet.`
    );
  }

  const out = await PDFDocument.create();
  const embedded = await out.embedPages(src.getPages());
  const sheets = n / 4;
  const halfW = A4_LANDSCAPE_W / 2;

  function addSpread(leftIdx, rightIdx) {
    const page = out.addPage([A4_LANDSCAPE_W, A4_LANDSCAPE_H]);
    const drawHalf = (emb, x0) => {
      if (!emb) return;
      const scale = Math.min(halfW / emb.width, A4_LANDSCAPE_H / emb.height);
      const w = emb.width * scale;
      const h = emb.height * scale;
      page.drawPage(emb, {
        x: x0 + (halfW - w) / 2,
        y: (A4_LANDSCAPE_H - h) / 2,
        width: w,
        height: h,
      });
    };
    drawHalf(embedded[leftIdx], 0);
    drawHalf(embedded[rightIdx], halfW);
  }

  for (let s = 0; s < sheets; s++) {
    // 1-based page numbers in classic booklet order
    const leftFront = n - 2 * s;
    const rightFront = 2 * s + 1;
    const leftBack = 2 * s + 2;
    const rightBack = n - 2 * s - 1;
    addSpread(leftFront - 1, rightFront - 1);
    addSpread(leftBack - 1, rightBack - 1);
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, await out.save());
  return { sheets, pagesOut: sheets * 2, pagesIn: n };
}

/** Рядом с book.pdf → book-broshyura.pdf */
export function bookletOutputPath(srcPath) {
  const dir = path.dirname(srcPath);
  const base = path.basename(srcPath, path.extname(srcPath));
  return path.join(dir, `${base}-broshyura.pdf`);
}

export function buildToc(chapters, { tocClass = "print-toc" } = {}) {
  const isIntro = (c) =>
    c.rel === "README.md" || c.rel === "README-igrok.md" || c.rel === "README-hranitel.md";
  const isThanks = (c) => c.rel === "blagodarnosti.md";
  const core = chapters.filter(
    (c) =>
      !isIntro(c) &&
      !isThanks(c) &&
      !c.rel.startsWith("fantasy/") &&
      !c.rel.startsWith("adventure/") &&
      !c.rel.startsWith("modules/")
  );
  const fantasy = chapters.filter((c) => c.rel.startsWith("fantasy/"));
  const adventure = chapters.filter((c) => c.rel.startsWith("adventure/"));
  const modules = chapters.filter((c) => c.rel.startsWith("modules/"));
  const readme = chapters.find((c) => isIntro(c));
  const thanks = chapters.find((c) => isThanks(c));

  const section = (items, tocSub) =>
    items.map((c, i) => tocItemHtml({ ...c, tocSub: c.tocSub || tocSub }, i + 1)).join("\n");

  let html = `<nav class="${tocClass}"><h2><span class="toc-h2-text">ОГЛАВЛЕНИЕ</span></h2><ol>`;
  if (readme) html += section([readme], "ВВЕДЕНИЕ");
  if (core.length) html += section(core, "ОСНОВНЫЕ ГЛАВЫ");
  if (fantasy.length) html += section(fantasy, "ФЭНТЕЗИ-МОДУЛИ");
  if (modules.length) html += section(modules, "ДОПОЛНИТЕЛЬНЫЕ МОДУЛИ");
  if (adventure.length) html += section(adventure, "ПРИКЛЮЧЕНИЯ");
  if (thanks) html += section([thanks], "КОНЕЦ КНИГИ");
  html += `</ol></nav>`;
  return html;
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

export async function renderPdf(htmlPath, pdfPath, pdfOptions = {}) {
  const {
    stampLeafPages = true,
    skipCoverPageNumber = true,
    skipPages = skipCoverPageNumber ? 2 : 0,
    fillTocPages = true,
    ...playwrightPdfOptions
  } = pdfOptions;

  let pageMap = {};
  let tocChapters = [];

  const browser = await launchPdfBrowser();
  try {
    const page = await browser.newPage();
    await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle" });
    await page.pdf({ path: pdfPath, printBackground: true, ...playwrightPdfOptions });

    if (fillTocPages) {
      const html = fs.readFileSync(htmlPath, "utf8");
      tocChapters = [];
      const re =
        /data-toc-for="([^"]+)"[\s\S]*?toc-title">([^<]+)<\/span>[\s\S]*?toc-sub">([^<]*)<\/span>/g;
      let m;
      while ((m = re.exec(html)) !== null) {
        tocChapters.push({ id: m[1], title: m[2], tocSub: m[3] });
      }
      // fallback: page then title order in new TOC
      if (!tocChapters.length) {
        const re2 =
          /toc-page" data-toc-for="([^"]+)"[\s\S]*?<span class="toc-title">([^<]+)<\/span>/g;
        while ((m = re2.exec(html)) !== null) {
          tocChapters.push({ id: m[1], title: m[2] });
        }
      }
      // Prefer original titles from data attributes if we also store them
      if (!tocChapters.length) {
        const re3 = /data-toc-for="([^"]+)"/g;
        while ((m = re3.exec(html)) !== null) {
          tocChapters.push({ id: m[1], title: m[1] });
        }
      }
      if (tocChapters.length) {
        try {
          // Оригинальные названия из data-chapter-title
          const reTitle =
            /data-toc-for="([^"]+)"\s+data-chapter-title="([^"]*)"/g;
          const byId = {};
          let tm;
          while ((tm = reTitle.exec(html)) !== null) {
            byId[tm[1]] = tm[2]
              .replace(/&quot;/g, '"')
              .replace(/&amp;/g, "&")
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">");
          }
          tocChapters = tocChapters.map((c) => ({
            ...c,
            title: byId[c.id] || c.title,
          }));

          pageMap = await resolveChapterPagesFromPdf(pdfPath, tocChapters, { skipPages });
          if (Object.keys(pageMap).length) {
            const filled = fillTocPageNumbersInHtml(html, pageMap);
            fs.writeFileSync(htmlPath, filled, "utf8");
            await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle" });
            await page.pdf({ path: pdfPath, printBackground: true, ...playwrightPdfOptions });
          }
        } catch (err) {
          console.warn("TOC page numbers:", err.message || err);
        }
      }
    }
  } finally {
    await browser.close();
  }
  if (stampLeafPages) {
    const html = fs.readFileSync(htmlPath, "utf8");
    const chaptersForStamp = [];
    const re =
      /id="(chapter-[^"]+)"\s+data-chapter-title="([^"]*)"(?:\s+data-chapter-index="(\d+)")?/g;
    let m;
    while ((m = re.exec(html)) !== null) {
      chaptersForStamp.push({
        id: m[1],
        title: m[2]
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">"),
        chapterIndex: m[3] ? Number(m[3]) : undefined,
      });
    }
    if (!chaptersForStamp.length && tocChapters.length) {
      chaptersForStamp.push(...tocChapters);
    }
    await stampPageChrome(pdfPath, {
      skipPages,
      pageMap,
      chapters: chaptersForStamp,
    });
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
  const fontsSrc = path.join(ROOT, "website", "fonts");
  const fontsDest = path.join(PUBLIC, "fonts");
  if (fs.existsSync(fontsSrc)) {
    fs.mkdirSync(fontsDest, { recursive: true });
    fs.cpSync(fontsSrc, fontsDest, { recursive: true });
  }
  const imagesSrc = path.join(ROOT, "website", "images");
  const imagesDest = path.join(PUBLIC, "images");
  if (fs.existsSync(imagesSrc)) {
    fs.mkdirSync(imagesDest, { recursive: true });
    fs.cpSync(imagesSrc, imagesDest, { recursive: true });
  }
}

const PRINT_FONT_LINKS = `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Source+Sans+3:wght@400;600&display=swap" rel="stylesheet">`;

const ADVENTURE_FONT_LINKS = `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=MedievalSharp&family=Source+Sans+3:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">`;

function printCoverHtml(title, tagline) {
  return `
  <div class="print-cover">
    <h1>${escapeHtml(title)}</h1>
    <p class="tagline">${escapeHtml(tagline)}</p>
  </div>`;
}

export function adventureHasArtCover(adv) {
  return Boolean(adv?.coverArt);
}

export function adventureCoverHtml(adv) {
  const genre = adv.genre || "Приключение";
  const tagline = adv.tagline || "Модульная настольная РПГ · только d6";

  if (adv.coverArt) {
    const logo =
      adv.coverLogo && !adv.coverComposed
        ? `<img class="cover-logo" src="${escapeHtml(adv.coverLogo)}" alt="">`
        : "";
    const subtitle = adv.coverSubtitle
      ? `<p class="cover-subtitle">${escapeHtml(adv.coverSubtitle)}</p>`
      : "";
    const shade = adv.coverComposed
      ? ""
      : `<div class="cover-art-shade" aria-hidden="true"></div>`;
    const artClass = adv.coverComposed
      ? "print-adventure-cover has-art composed"
      : "print-adventure-cover has-art";
    return `
  <div class="${artClass}">
    <img class="cover-art" src="${escapeHtml(adv.coverArt)}" alt="">
    ${shade}
    <div class="print-adventure-cover-inner">
      <div class="cover-top">
        ${logo}
        ${subtitle}
        <p class="cover-genre">${escapeHtml(genre)}</p>
        <h1>${escapeHtml(adv.title)}</h1>
        <p class="cover-book">The Edge! · Приключение</p>
      </div>
      <div class="cover-bottom">
        <div class="print-adventure-ornament" aria-hidden="true">
          <span class="dot"></span><span class="line"></span>
          <span class="dot"></span><span class="line"></span>
          <span class="dot"></span>
        </div>
        <p class="tagline">${escapeHtml(tagline)}</p>
      </div>
    </div>
  </div>`;
  }

  return `
  <div class="print-adventure-cover">
    <div class="print-adventure-cover-inner">
      <p class="cover-genre">${escapeHtml(genre)}</p>
      <h1>${escapeHtml(adv.title)}</h1>
      <p class="cover-book">The Edge! · Приключение</p>
      <div class="print-adventure-ornament" aria-hidden="true">
        <span class="dot"></span><span class="line"></span>
        <span class="dot"></span><span class="line"></span>
        <span class="dot"></span>
      </div>
      <p class="tagline">${escapeHtml(tagline)}</p>
    </div>
  </div>`;
}

export function adventureBackCoverHtml(adv) {
  if (!adv.backArt) return "";
  const tagline = adv.tagline || "Модульная настольная РПГ · только d6";
  const logo =
    adv.coverLogo && !adv.coverComposed
      ? `<img class="cover-logo cover-logo-sm" src="${escapeHtml(adv.coverLogo)}" alt="">`
      : "";
  const shade = adv.coverComposed
    ? ""
    : `<div class="cover-art-shade" aria-hidden="true"></div>`;
  const artClass = adv.coverComposed
    ? "print-adventure-back has-art composed"
    : "print-adventure-back has-art";
  return `
  <div class="${artClass}">
    <img class="cover-art" src="${escapeHtml(adv.backArt)}" alt="">
    ${shade}
    <div class="print-adventure-back-inner">
      <div class="cover-top">
        ${logo}
        <p class="cover-book">The Edge!</p>
        <h2>${escapeHtml(adv.title)}</h2>
        <p class="blurb">${escapeHtml(tagline)}</p>
      </div>
      <div class="cover-bottom">
        <p class="edition">Фан-модуль по миру Skyrim · только d6</p>
      </div>
    </div>
  </div>`;
}

/** Full-bleed обложка/задник для приключений с coverArt. */
export async function applyAdventureBleedCovers(adv, pdfPath, publicDir = PUBLIC) {
  if (!adventureHasArtCover(adv)) return;

  const front = adventureCoverHtml(adv);
  const back = adventureBackCoverHtml(adv);
  const frontBleedHtml = path.join(publicDir, `print-bleed-front-adv-${adv.id}.html`);
  const backBleedHtml = back
    ? path.join(publicDir, `print-bleed-back-adv-${adv.id}.html`)
    : null;

  fs.writeFileSync(
    frontBleedHtml,
    buildBleedSheetHtml({
      title: `The Edge! — ${adv.title} — обложка`,
      bodyClass: "print-adventure print-bleed-sheet",
      cssHref: "css/print-adventure.css",
      fontLinks: ADVENTURE_FONT_LINKS,
      sheetHtml: front,
    }),
    "utf8"
  );

  if (back && backBleedHtml) {
    fs.writeFileSync(
      backBleedHtml,
      buildBleedSheetHtml({
        title: `The Edge! — ${adv.title} — задник`,
        bodyClass: "print-adventure print-bleed-sheet",
        cssHref: "css/print-adventure.css",
        fontLinks: ADVENTURE_FONT_LINKS,
        sheetHtml: back,
      }),
      "utf8"
    );
  }

  await applyBleedCovers(pdfPath, {
    frontHtmlPath: frontBleedHtml,
    backHtmlPath: backBleedHtml || undefined,
  });
}

/** PDF A5, как книги правил. */
export const ADVENTURE_PDF_OPTS_BASE = {
  ...PRINT_A5_PDF_OPTS_BASE,
};

export function adventurePdfHeaderFooter(adv) {
  return printChromeTemplates(`The Edge! · ${adv.title}`);
}

export function adventurePdfRenderOptions(adv) {
  return {
    fillTocPages: adv.includeToc !== false,
  };
}

export function modulePrintHtmlFilename(mod) {
  return `print-modul-${mod.id.replace(/_/g, "-")}.html`;
}

export function adventurePrintHtmlFilename(adv) {
  return `print-priklyuchenie-${adv.id}.html`;
}

export function buildModulePrintHtml(mod) {
  const chapters = [buildCustomModuleChapter(mod)];
  const title = `The Edge! — ${mod.title || mod.id}`;
  return buildPrintHtml({
    chapters,
    title,
    bodyClass: "print-book",
    cssHref: "css/print-book.css",
    fontLinks: PRINT_FONT_LINKS,
    coverHtml: printCoverHtml(title, "Дополнительный модуль · только d6"),
    mainClass: "print-book-main",
    simpleToc: true,
  });
}

export function writeModulePrintHtml(mod, publicDir = PUBLIC) {
  const srcPath = path.join(MY_MODULES, mod.srcRel);
  if (!fs.existsSync(srcPath)) return null;
  const outHtml = path.join(publicDir, modulePrintHtmlFilename(mod));
  fs.writeFileSync(outHtml, buildModulePrintHtml(mod), "utf8");
  return outHtml;
}

export function buildAdventurePrintHtml(adv, { chapters }) {
  const style = adv.style || "glass";
  const title = `The Edge! — ${adv.title}`;
  return buildPrintHtml({
    chapters,
    title,
    bodyClass: `print-adventure theme-${style}`,
    cssHref: "css/print-adventure.css",
    fontLinks: ADVENTURE_FONT_LINKS,
    coverHtml: adventureCoverHtml(adv),
    mainClass: "print-adventure-main",
    tocClass: "print-adventure-toc",
    simpleToc: true,
    includeThanks: adv.includeThanks !== false,
    includeToc: adv.includeToc !== false,
  });
}

export function writeAdventurePrintHtml(adv, chapters, publicDir = PUBLIC) {
  const outHtml = path.join(publicDir, adventurePrintHtmlFilename(adv));
  fs.writeFileSync(outHtml, buildAdventurePrintHtml(adv, { chapters }), "utf8");
  return outHtml;
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

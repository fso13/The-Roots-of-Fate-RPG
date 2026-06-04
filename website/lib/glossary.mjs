/** Сокращения и термины → якорь в slovar-terminov.md / slovar-terminov.html */
export const GLOSSARY_PAGE = "slovar-terminov";

export const GLOSSARY_TERMS = {
  "2d6": {
    id: "2d6",
    title: "Два d6",
    tip: "Бросок двух шестигранников; суммируйте результат.",
  },
  "1d6": {
    id: "1d6",
    title: "Один d6",
    tip: "Бросок одного шестигранника.",
  },
  d6: {
    id: "d6",
    title: "Шестигранный кубик",
    tip: "Единственный тип кубиков в «Корнях судьбы».",
  },
  ЧЦ: {
    id: "chc",
    title: "Число цели",
    tip: "Порог успеха броска или сложности задачи. Задаёт хранитель.",
  },
  ОД: {
    id: "od",
    title: "Очки действия",
    tip: "Ресурс хода в бою. Обычно 2 ОД за раунд.",
  },
  ОО: {
    id: "oo",
    title: "Очки опыта",
    tip: "Награда между сессиями; тратятся на таланты и навыки.",
  },
};

const TERM_KEYS = Object.keys(GLOSSARY_TERMS).sort((a, b) => b.length - a.length);

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const TERM_RE = new RegExp(`(?<![\\p{L}\\p{N}])(${TERM_KEYS.map(escapeRegex).join("|")})(?![\\p{L}\\p{N}])`, "gu");

const OPEN_SKIP = /^(<(a\b|code\b|pre\b|h[1-6]\b|script\b|textarea\b)[\s>])/i;
const CLOSE_SKIP = /^<\/(a|code|pre|h[1-6]|script|textarea)>/i;

function termLink(term, glossaryHref) {
  const meta = GLOSSARY_TERMS[term];
  const href = `${glossaryHref}#term-${meta.id}`;
  const tip = `${meta.title} — ${meta.tip}`;
  const esc = tip.replace(/"/g, "&quot;");
  return `<a class="term" href="${href}" title="${esc}" data-tip="${esc}">${term}</a>`;
}

/** Добавляет ссылки на словарь терминов в HTML (не трогает code/pre/заголовки/ссылки). */
export function linkGlossaryInHtml(html, glossaryHref) {
  if (!glossaryHref) return html;

  const parts = html.split(/(<[^>]+>)/g);
  let skipDepth = 0;

  return parts
    .map((part) => {
      if (part.startsWith("<")) {
        if (OPEN_SKIP.test(part)) skipDepth += 1;
        else if (CLOSE_SKIP.test(part) && skipDepth > 0) skipDepth -= 1;
        return part;
      }
      if (skipDepth > 0) return part;
      return part.replace(TERM_RE, (match) => termLink(match, glossaryHref));
    })
    .join("");
}

export function glossaryHrefForPage(relHtmlPath) {
  const depth = relHtmlPath.split("/").length - 1;
  const prefix = depth === 0 ? "" : "../".repeat(depth);
  return `${prefix}${GLOSSARY_PAGE}.html`;
}

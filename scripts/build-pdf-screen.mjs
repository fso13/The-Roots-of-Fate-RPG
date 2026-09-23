#!/usr/bin/env node
// Ширма хранителя: 4 листа A4 portrait → PDF
import fs from "fs";
import path from "path";
import { PUBLIC, ROOT, renderPdf } from "../website/lib/pdf-core.mjs";

const OUT_HTML = path.join(PUBLIC, "print-shirima-hranitelya.html");
const OUT_PDF = path.join(PUBLIC, "the-edge-shirima-hranitelya.pdf");

const FONT_LINKS = `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Source+Sans+3:wght@400;600&display=swap" rel="stylesheet">`;

function screenHtml() {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <title>The Edge! — Ширма хранителя</title>
  ${FONT_LINKS}
  <link rel="stylesheet" href="css/print-screen.css">
</head>
<body class="screen">

<!-- ========== ЛИСТ 1: ЯДРО ========== -->
<section class="panel" aria-label="Лист 1 — Ядро">
  <header class="panel-head">
    <h1>The Edge! · Ширма · 1/4 · Ядро</h1>
    <span class="meta">только d6 · светлый + тёмный</span>
  </header>
  <div class="cols">
    <div class="stack">
      <div class="block">
        <h2>Проверка</h2>
        <div class="formula">2d6 (светлый + тёмный) + атрибут + ранг ≥ ЧЦ</div>
        <p><strong>Успех</strong> → смотри <span class="tag tag-light">светлый</span>. <strong>Провал</strong> → смотри <span class="tag tag-dark">тёмный</span> (цена + шаг вперёд).</p>
        <p class="note">Боевые атаки: цветные таблицы не читать — криты 6+6 / 1+1 (лист 3).</p>
        <h3>Атрибуты (1–5)</h3>
        <dl class="kv">
          <dt>Тело</dt><dd>сила, выносливость, здоровье</dd>
          <dt>Ловкость</dt><dd>реакция, точность, скрытность</dd>
          <dt>Разум</dt><dd>анализ, знания, восприятие</dd>
          <dt>Воля</dt><dd>харизма, магия, стресс</dd>
        </dl>
        <p class="note">Ранг навыка 0–4. Стресс / раны: макс. = <strong>6 + Тело</strong>.</p>
      </div>
      <div class="block">
        <h2>Сложности (ЧЦ)</h2>
        <table>
          <thead><tr><th>Уровень</th><th>ЧЦ</th><th>Ориентир</th></tr></thead>
          <tbody>
            <tr><td>Тривиально</td><td>7</td><td>бросок, если цена провала важна</td></tr>
            <tr><td>Легко</td><td>8–9</td><td>рутина под лёгким давлением</td></tr>
            <tr><td>Обычно</td><td>10–11</td><td>стандарт сцены</td></tr>
            <tr><td>Трудно</td><td>12–13</td><td>сопротивление, спешка, помехи</td></tr>
            <tr><td>Опасно</td><td>14–15</td><td>сильный противник / жёсткие условия</td></tr>
            <tr><td>Экстремально</td><td>16–17</td><td>на грани возможного</td></tr>
            <tr><td>Легендарно</td><td>18+</td><td>чудо или сверхподготовка</td></tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="stack">
      <div class="block">
        <h2><span class="tag tag-light">Светлый</span> — степень успеха</h2>
        <table class="tight">
          <thead><tr><th class="num">d6</th><th>Степень</th><th>Эффект</th></tr></thead>
          <tbody>
            <tr><td class="num">1</td><td>Едва</td><td>цель есть, но грязно: время, шум, расход, след</td></tr>
            <tr><td class="num">2</td><td>Скромно</td><td>ровно заявленное — без бонуса</td></tr>
            <tr><td class="num">3</td><td>Чисто</td><td>уверенно; одна полезная деталь</td></tr>
            <tr><td class="num">4</td><td>Сильно</td><td>цель + преимущество (тише/быстрее / +1 к след. проверке)</td></tr>
            <tr><td class="num">5</td><td>Блестяще</td><td>цель + серьёзный бонус (улика, позиция, NPC)</td></tr>
            <tr><td class="num">6</td><td>Идеально</td><td>максимум + доп. выигрыш по ситуации</td></tr>
          </tbody>
        </table>
      </div>
      <div class="block">
        <h2><span class="tag tag-dark">Тёмный</span> — цена и шаг вперёд</h2>
        <p class="note"><strong>«Ничего» запрещено.</strong> Всегда цена + движение вперёд.</p>
        <table class="tight">
          <thead><tr><th class="num">d6</th><th>Цена</th><th>Шаг вперёд</th></tr></thead>
          <tbody>
            <tr><td class="num">1</td><td>жёсткая: стресс / шум / враг / −1 к след. проверке</td><td>тонкая нить: намёк, обломок</td></tr>
            <tr><td class="num">2</td><td>заметная (время, расход, стража)</td><td>~¼ цели</td></tr>
            <tr><td class="num">3</td><td>умеренная</td><td>~½ цели по смыслу</td></tr>
            <tr><td class="num">4</td><td>мягкая</td><td>почти успех с изъяном</td></tr>
            <tr><td class="num">5</td><td>лёгкая</td><td>большая доля; не хватает шага</td></tr>
            <tr><td class="num">6</td><td>минимальная (скорее сюжет)</td><td>почти полный «кривой» успех</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</section>

<!-- ========== ЛИСТ 2: БОЙ ========== -->
<section class="panel" aria-label="Лист 2 — Бой">
  <header class="panel-head">
    <h1>The Edge! · Ширма · 2/4 · Бой и снаряжение</h1>
    <span class="meta">2 ОД / раунд · урон из атаки</span>
  </header>
  <div class="cols">
    <div class="stack">
      <div class="block">
        <h2>Дистанция и ход</h2>
        <table>
          <thead><tr><th>Положение</th><th>Что можно</th></tr></thead>
          <tbody>
            <tr><td>Рукопашная</td><td>ближний удар, касание магией</td></tr>
            <tr><td>Рядом</td><td>1 ОД → Рукопашная или Даль</td></tr>
            <tr><td>Даль</td><td>лук, метательное, дальняя магия</td></tr>
          </tbody>
        </table>
        <table style="margin-top:2mm">
          <thead><tr><th>ОД</th><th>Действие</th></tr></thead>
          <tbody>
            <tr><td>1</td><td>Атака (оружие / урон. заклинание)</td></tr>
            <tr><td>1</td><td>Сдвиг на 1 шаг</td></tr>
            <tr><td>2</td><td>Сдвиг на 2 шага (по согласованию)</td></tr>
          </tbody>
        </table>
        <div class="formula">Инициатива: 2d6 + Ловкость</div>
      </div>
      <div class="block">
        <h2>Атака и урон</h2>
        <p><strong>Рукопашная:</strong> 2d6 + Тело/Ловкость + ранг ≥ ЧЦ</p>
        <p><strong>Дальняя:</strong> 2d6 + Ловкость + ранг ≥ ЧЦ</p>
        <div class="formula">ЧЦ защиты = 8 + Ловкость + доспех + щит</div>
        <div class="formula">Урон = (итог − ЧЦ) + бонус оружия</div>
        <p class="note">Второй кубик на урон не кидать. ≤1 ситуативный +1 к защите (укрытие).</p>
      </div>
      <div class="block">
        <h2>Лечение / стабилизация</h2>
        <div class="formula">2d6 + Разум + Медицина ≥ 10 → −1 рана союзнику</div>
        <p class="note">1 ОД в бою; цель Рукопашная/Рядом. Зелье: −1 стресс или −1 рана / сцену.</p>
      </div>
    </div>
    <div class="stack">
      <div class="block">
        <h2>Оружие (бонус к урону)</h2>
        <table>
          <thead><tr><th>Тип</th><th>+</th><th>Особенности</th></tr></thead>
          <tbody>
            <tr><td>Кинжал</td><td>+1</td><td>Ловкость, вплотную</td></tr>
            <tr><td>Меч</td><td>+2</td><td>Тело или Ловкость</td></tr>
            <tr><td>Копьё</td><td>+2</td><td>длинное / близко</td></tr>
            <tr><td>Лук</td><td>+2</td><td>Даль, стрелы</td></tr>
            <tr><td>Дубина</td><td>+1</td><td>Тело, дешёвое</td></tr>
          </tbody>
        </table>
        <p class="note">Мастерское: +1 к бонусу (или −1 к лому).</p>
      </div>
      <div class="block">
        <h2>Доспех и щит</h2>
        <table>
          <thead><tr><th>Тип</th><th>К ЧЦ</th><th>Минус</th></tr></thead>
          <tbody>
            <tr><td>Без</td><td>+0</td><td>—</td></tr>
            <tr><td>Кожа</td><td>+1</td><td>—</td></tr>
            <tr><td>Кольчуга</td><td>+2</td><td>−1 Скрытность (шум)</td></tr>
            <tr><td>Латы</td><td>+3</td><td>−1 Ловкость на 1-й Сдвиг</td></tr>
          </tbody>
        </table>
        <p><strong>Щит:</strong> +1 к ЧЦ против одной ближней атаки / раунд.</p>
      </div>
      <div class="block">
        <h2>Магия (кратко)</h2>
        <p>Урон. заклинание = атака (1 ОД + обычно 1 искра).</p>
        <div class="formula">Урон = (итог − ЧЦ) + бонус заклинания</div>
        <div class="formula">Макс. искр = 3 + Воля</div>
        <p><strong>Без урона:</strong> 2d6 + Воля + ранг ≥ ЧЦ; искра по тексту.</p>
        <h3>Школы</h3>
        <ul>
          <li><strong>Стихии</strong> — огонь, холод, молния, земля</li>
          <li><strong>Дух</strong> — болт, снятие чар</li>
          <li><strong>Энтропия</strong> — дебаффы, сбить</li>
          <li><strong>Сотворение</strong> — преграда, лечение</li>
        </ul>
        <p class="note">Старт: «Первое соглашение» I → школа I→II→III.</p>
      </div>
    </div>
  </div>
</section>

<!-- ========== ЛИСТ 3: КРИТЫ / СОСТОЯНИЯ / РАНЫ ========== -->
<section class="panel" aria-label="Лист 3 — Криты и состояния">
  <header class="panel-head">
    <h1>The Edge! · Ширма · 3/4 · Криты, раны, состояния</h1>
    <span class="meta">опциональные модули</span>
  </header>
  <div class="cols">
    <div class="stack">
      <div class="block">
        <h2>Пары на атаке</h2>
        <table>
          <thead><tr><th>Кубики</th><th>Эффект</th></tr></thead>
          <tbody>
            <tr><td>6+6</td><td>Крит → таблица ниже</td></tr>
            <tr><td>1+1</td><td>Провал → таблица ниже</td></tr>
            <tr><td>5+6 / 6+5</td><td>+1 урон или переброс 1d6</td></tr>
            <tr><td>1+2 / 2+1</td><td>−1 к итогу атаки</td></tr>
          </tbody>
        </table>
      </div>
      <div class="block">
        <h2>Криты (после урона, 1d6)</h2>
        <table class="tight">
          <thead><tr><th class="num">d6</th><th>Эффект</th></tr></thead>
          <tbody>
            <tr><td class="num">1</td><td>+2 к урону</td></tr>
            <tr><td class="num">2</td><td>+1 урон; цель → Рядом</td></tr>
            <tr><td class="num">3</td><td>разоружение (1 ОД поднять)</td></tr>
            <tr><td class="num">4</td><td>1 стресс цели</td></tr>
            <tr><td class="num">5</td><td>зона раны «повреждена» (или +2 урона)</td></tr>
            <tr><td class="num">6</td><td>+1 урон + любой эффект 1–4</td></tr>
          </tbody>
        </table>
      </div>
      <div class="block">
        <h2>Провалы атаки (1d6)</h2>
        <table class="tight">
          <thead><tr><th class="num">d6</th><th>Эффект</th></tr></thead>
          <tbody>
            <tr><td class="num">1</td><td>полный промах (даже при сумме ≥ ЧЦ)</td></tr>
            <tr><td class="num">2</td><td>промах и −1 ОД в след. раунде</td></tr>
            <tr><td class="num">3</td><td>½ бонуса оружия себе (мин. 1)</td></tr>
            <tr><td class="num">4</td><td>оружие выпало (1 ОД)</td></tr>
            <tr><td class="num">5</td><td>1 урон союзнику Рядом</td></tr>
            <tr><td class="num">6</td><td>падаете → Рядом; −1 к 1-й защите</td></tr>
          </tbody>
        </table>
        <p class="note">Даль: 3 = 1 урон себе; 4 = нет стрел / −1 к след. дальней.</p>
      </div>
    </div>
    <div class="stack">
      <div class="block">
        <h2>Зоны удара (1d6)</h2>
        <table>
          <thead><tr><th class="num">d6</th><th>Зона</th></tr></thead>
          <tbody>
            <tr><td class="num">1</td><td>Голова</td></tr>
            <tr><td class="num">2</td><td>Грудь / спина</td></tr>
            <tr><td class="num">3</td><td>Рука с оружием</td></tr>
            <tr><td class="num">4</td><td>Другая рука</td></tr>
            <tr><td class="num">5</td><td>Нога опорная</td></tr>
            <tr><td class="num">6</td><td>Другая нога</td></tr>
          </tbody>
        </table>
        <p class="note">Прицел: −2 к итогу (−3 голова). Зона на ступень суровее.</p>
        <h3>Состояние зоны</h3>
        <ul>
          <li><strong>Повреждена:</strong> −1 к связанным проверкам</li>
          <li><strong>Выведена:</strong> рука/нога/голова недоступны; торс = выбытие</li>
        </ul>
      </div>
      <div class="block">
        <h2>Лечение зон</h2>
        <table class="tight">
          <thead><tr><th>Действие</th><th>Эффект</th></tr></thead>
          <tbody>
            <tr><td>Перевязка ≥10</td><td>повреждена→целая или выведена→повреждена</td></tr>
            <tr><td>Длинный отдых</td><td>повреждённые → целые</td></tr>
            <tr><td>Хирургия ≥13</td><td>выведена → повреждена</td></tr>
          </tbody>
        </table>
      </div>
      <div class="block">
        <h2>Состояния</h2>
        <table class="tight">
          <thead><tr><th>Состояние</th><th>Эффект</th></tr></thead>
          <tbody>
            <tr><td>Сбитый с ног</td><td>−1 атака; Сдвиг = 2 ОД; vs него +1 атака</td></tr>
            <tr><td>Оглушённый</td><td>пропуск 1 хода (0 ОД)</td></tr>
            <tr><td>Разоружён</td><td>1 ОД поднять оружие/щит</td></tr>
            <tr><td>Смещён</td><td>дистанция ±1 шаг</td></tr>
            <tr><td>Замедлен</td><td>−1 ОД в начале раунда</td></tr>
            <tr><td>Напуган</td><td>−1 к 1-му броску атаки/защиты</td></tr>
            <tr><td>Скован</td><td>нет Сдвига; атаки −2; 2 ОД / проверка</td></tr>
            <tr><td>Ослеплён</td><td>атаки −2; ЧЦ −1; Даль = 0</td></tr>
          </tbody>
        </table>
        <p class="note">Одинаковые не стакаются. Лимит: ≤3 состояния. Разные — стакаются.</p>
      </div>
    </div>
  </div>
</section>

<!-- ========== ЛИСТ 4: ОТРЯДЫ + ШПАРГАЛКА ========== -->
<section class="panel" aria-label="Лист 4 — Отряды и шпаргалка">
  <header class="panel-head">
    <h1>The Edge! · Ширма · 4/4 · Отряды и шпаргалка</h1>
    <span class="meta">печать · A4 portrait × 4</span>
  </header>
  <div class="cols">
    <div class="stack">
      <div class="block">
        <h2>Отряды (N = 2–6)</h2>
        <div class="formula">Раны отряда = раны одного × N</div>
        <div class="formula">Урон = (итог − ЧЦ) + бонус оружия + бонус N</div>
        <table>
          <thead><tr><th>N</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th></tr></thead>
          <tbody>
            <tr><td>Бонус</td><td>+0</td><td>+1</td><td>+2</td><td>+3</td><td>+3</td></tr>
          </tbody>
        </table>
        <p class="note">Один бросок атаки за раунд. Урон в общий пул. При 0 — отряд пал.</p>
        <h3>Разделение (игрок)</h3>
        <table class="tight">
          <thead><tr><th>Действие</th><th>ОД</th><th>Правило</th></tr></thead>
          <tbody>
            <tr><td>Отвлечь</td><td>1</td><td>Воля/Хитрость ≥10 → 1–2 отделяются</td></tr>
            <tr><td>Узкость</td><td>1–2</td><td>эффект. N −1 к бонусу (мин. 0)</td></tr>
            <tr><td>Вклиниться</td><td>1</td><td>отряд −1 к след. атаке</td></tr>
            <tr><td>Разделить огнём</td><td>1</td><td>≥½ ран одного → 1 отделился</td></tr>
          </tbody>
        </table>
      </div>
      <div class="block">
        <h2>Термины</h2>
        <dl class="kv">
          <dt>ЧЦ</dt><dd>число цели (порог броска)</dd>
          <dt>ОД</dt><dd>очки действия (обычно 2 / раунд)</dd>
          <dt>ОО</dt><dd>очки опыта (между сессиями)</dd>
          <dt>Искра</dt><dd>ресурс магии (макс. 3 + Воля)</dd>
          <dt>Стресс</dt><dd>нематериальное давление</dd>
          <dt>Рана</dt><dd>физический урон; 0 = выбит</dd>
        </dl>
      </div>
    </div>
    <div class="stack">
      <div class="block">
        <h2>Быстрые формулы</h2>
        <table class="tight">
          <thead><tr><th>Ситуация</th><th>Формула</th></tr></thead>
          <tbody>
            <tr><td>Навык / сцена</td><td>светлый+тёмный + атр. + ранг ≥ ЧЦ</td></tr>
            <tr><td>Атака ближняя</td><td>2d6 + Тело/Ловк. + ранг ≥ ЧЦ защ.</td></tr>
            <tr><td>Атака дальняя</td><td>2d6 + Ловкость + ранг ≥ ЧЦ защ.</td></tr>
            <tr><td>ЧЦ защиты</td><td>8 + Ловкость + доспех + щит</td></tr>
            <tr><td>Урон</td><td>(итог − ЧЦ) + бонус оружия/закл.</td></tr>
            <tr><td>Магия без урона</td><td>2d6 + Воля + ранг ≥ ЧЦ</td></tr>
            <tr><td>Стабилизация</td><td>2d6 + Разум + Медицина ≥ 10</td></tr>
            <tr><td>Инициатива</td><td>2d6 + Ловкость</td></tr>
          </tbody>
        </table>
      </div>
      <div class="block">
        <h2>Памятка хранителя</h2>
        <ul>
          <li>Провал сцены ≠ тупик: тёмный кубик всегда даёт шаг.</li>
          <li>Не бросай, если исход очевиден (автоуспех / автопровал).</li>
          <li>≤1 ситуативный бонус к защите за атаку.</li>
          <li>Не копи бонусы: один главный штраф/бонус на сцену.</li>
          <li>Опция пула: (2+ранг)d6, сумма двух лучших = светлый+тёмный.</li>
          <li>Мягче криты: 1+1 → −2 урона; 6+6 → только +1 урона.</li>
        </ul>
      </div>
      <div class="block">
        <h2>Сборка PDF</h2>
        <p class="note"><code>npm run pdf:shirima</code> · файл <code>the-edge-shirima-hranitelya.pdf</code></p>
        <p class="note">Печать: A4 книжная (portrait), 4 листа. Можно согнуть в ширму или положить рядом.</p>
      </div>
    </div>
  </div>
</section>

</body>
</html>`;
}

async function main() {
  const cssSrc = path.join(ROOT, "website", "css", "print-screen.css");
  const cssDestDir = path.join(PUBLIC, "css");
  fs.mkdirSync(cssDestDir, { recursive: true });
  fs.copyFileSync(cssSrc, path.join(cssDestDir, "print-screen.css"));

  fs.mkdirSync(PUBLIC, { recursive: true });
  fs.writeFileSync(OUT_HTML, screenHtml(), "utf8");

  const output =
    process.argv.includes("--output") && process.argv[process.argv.indexOf("--output") + 1]
      ? path.resolve(process.argv[process.argv.indexOf("--output") + 1])
      : OUT_PDF;

  fs.mkdirSync(path.dirname(output), { recursive: true });

  await renderPdf(OUT_HTML, output, {
    format: "A4",
    landscape: false,
    margin: { top: "8mm", right: "9mm", bottom: "9mm", left: "9mm" },
    displayHeaderFooter: false,
    stampLeafPages: false,
    fillTocPages: false,
    preferCSSPageSize: true,
  });

  console.log("PDF:", output);
  console.log("HTML:", OUT_HTML);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

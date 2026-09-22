import { blankSkillRowHtml, resourceTrackHtml } from "./sheet-ticks.mjs";
import { inventarSchemaHtml } from "./inventar-schema.mjs";

/**
 * Компактный бланк листа персонажа на 1 страницу A5 (книга игрока).
 */
export function buildCharacterSheetChapterHtml() {
  const cols = 4;
  const rowsPerCol = 7;
  const skillsHtml = Array.from({ length: cols }, (_, col) => {
    const rows = Array.from({ length: rowsPerCol }, (_, row) =>
      blankSkillRowHtml(`skill_${col + 1}_${row + 1}`)
    ).join("");
    return `<div class="skill-col"><div class="skill-list">${rows}</div></div>`;
  }).join("");

  return `
<div class="sheet-in-book sheet-in-book--compact">
  <div class="sheet-title">Лист персонажа</div>

  <div class="sheet-top">
    <section class="sheet-block sheet-basics">
      <h2>Персонаж</h2>
      <div class="sheet-row"><label>Имя</label><div class="fill-line"></div></div>
      <div class="sheet-row"><label>Происхождение</label><div class="fill-line"></div></div>
      <div class="sheet-row"><label>Цель</label><div class="fill-line"></div></div>
      <div class="sheet-row sheet-row-inline">
        <label>Ур.</label><div class="fill-box"></div>
        <label>ОО</label><div class="fill-box"></div>
      </div>
    </section>

    <section class="sheet-block sheet-attributes">
      <h2>Атрибуты</h2>
      <p class="sheet-hint">10 очк.</p>
      <div class="attr-grid">
        <div class="attr-item"><label>Тело</label><div class="fill-box"></div></div>
        <div class="attr-item"><label>Ловк.</label><div class="fill-box"></div></div>
        <div class="attr-item"><label>Разум</label><div class="fill-box"></div></div>
        <div class="attr-item"><label>Воля</label><div class="fill-box"></div></div>
      </div>
    </section>

    <section class="sheet-block sheet-resources">
      <h2>Ресурсы</h2>
      <p class="sheet-hint">6+Тело / 3+Воля</p>
      <div class="resource-grid">
        ${resourceTrackHtml("Стресс", "stress", 11, "")}
        ${resourceTrackHtml("Раны", "wounds", 11, "")}
        ${resourceTrackHtml("Искры", "sparks", 8, "")}
      </div>
    </section>
  </div>

  <section class="sheet-block sheet-skills">
    <h2>Навыки <span class="sheet-hint-inline">ранг 0–4</span></h2>
    <div class="skills-grid">${skillsHtml}</div>
  </section>

  <div class="sheet-mid">
    <section class="sheet-block sheet-side">
      <h2>Таланты</h2>
      <div class="fill-area"></div>
      <h2>Заклинания</h2>
      <div class="fill-area"></div>
      <h2>Снаряжение</h2>
      <div class="sheet-row"><label>Оружие</label><div class="fill-line"></div></div>
      <div class="sheet-row"><label>Доспех</label><div class="fill-line"></div></div>
      <div class="sheet-row"><label>Щит</label><div class="fill-line"></div></div>
      <div class="sheet-row"><label>Прочее</label><div class="fill-line"></div></div>
      <h2>Заметки</h2>
      <div class="fill-area fill-area-notes"></div>
    </section>

    <section class="sheet-block sheet-inventory">
      <h2>Инвентарь</h2>
      <figure class="sheet-inventory-fig">
        ${inventarSchemaHtml()}
        <figcaption>Слоты + сумка 10×4</figcaption>
      </figure>
    </section>
  </div>
</div>`;
}

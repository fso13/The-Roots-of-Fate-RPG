/**
 * Квадратики рангов/ресурсов для листа персонажа (экран + печать).
 */
export function tickBoxesHtml(name, count, { checked = 0 } = {}) {
  const n = Math.max(0, Number(count) || 0);
  const boxes = [];
  for (let i = 1; i <= n; i++) {
    const isOn = i <= checked;
    boxes.push(
      `<label class="tick"><input type="checkbox" name="${name}_${i}" value="1"${
        isOn ? " checked" : ""
      }><span aria-hidden="true"></span></label>`
    );
  }
  return `<span class="tick-track" data-field="${name}" data-max="${n}">${boxes.join("")}</span>`;
}

export function skillRowHtml(label, name) {
  return `<div class="skill-row"><span>${label}</span>${tickBoxesHtml(name, 4)}</div>`;
}

/** Пустая строка навыка: линия для названия + 4 квадрата ранга. */
export function blankSkillRowHtml(name) {
  return `<div class="skill-row skill-row--blank"><div class="fill-line"></div>${tickBoxesHtml(name, 4)}</div>`;
}

/** Пустой трек ресурсов для печати/PDF (без JS). */
export function resourceTrackHtml(label, name, count, hint) {
  const n = Math.max(0, Number(count) || 0);
  const cells = Array.from({ length: n }, () => `<td></td>`).join("");
  return `<div class="resource-item">
    <label>${label}</label>
    <table class="rbox-track" data-field="${name}" data-max="${n}" role="presentation"><tr>${cells}</tr></table>
    ${hint ? `<span class="resource-hint">${hint}</span>` : ""}
  </div>`;
}

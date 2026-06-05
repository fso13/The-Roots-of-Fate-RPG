export const INVENTAR_SCHEMA_PLACEHOLDER = "<!-- inventar-schema -->";

function grid(cols, rows) {
  const cells = Array.from({ length: cols * rows }, () => '<span class="inventar-schema__cell"></span>').join("");
  return `<div class="inventar-schema__grid" style="--cols:${cols};--rows:${rows}">${cells}</div>`;
}

function zone(title, cols, rows, { variant = "gold", layout = "stack", extraClass = "" } = {}) {
  const titleClass =
    layout === "inline" ? "inventar-schema__zone-title inventar-schema__zone-title--inline" : "inventar-schema__zone-title";
  const variantClass = variant === "silver" ? "inventar-schema__zone--silver" : "inventar-schema__zone--gold";
  const layoutClass = layout === "inline" ? " inventar-schema__zone--inline" : "";
  return `<div class="inventar-schema__zone ${variantClass}${layoutClass}${extraClass ? ` ${extraClass}` : ""}">
    <span class="${titleClass}">${title}</span>
    ${grid(cols, rows)}
  </div>`;
}

export function inventarSchemaHtml() {
  return `<div class="inventar-schema" role="img" aria-label="Схема инвентаря: слоты экипировки и сумка 10×4">
    <div class="inventar-schema__gear">
      <div class="inventar-schema__col inventar-schema__col--side">
        <div class="inventar-schema__set-badge" aria-hidden="true">I</div>
        ${zone("Руки I", 2, 4)}
        ${zone("Перчатки", 2, 2)}
      </div>
      <div class="inventar-schema__col inventar-schema__col--center">
        ${zone("Голова", 2, 2)}
        ${zone("Шея", 1, 1)}
        ${zone("Туловище", 2, 3)}
        <div class="inventar-schema__belt-row">
          ${zone("Кольца", 1, 1, { extraClass: "inventar-schema__zone--compact" })}
          ${zone("Пояс", 2, 1, { extraClass: "inventar-schema__zone--belt" })}
          ${zone("Кольца", 1, 1, { extraClass: "inventar-schema__zone--compact" })}
        </div>
      </div>
      <div class="inventar-schema__col inventar-schema__col--side">
        <div class="inventar-schema__set-badge" aria-hidden="true">II</div>
        ${zone("Руки II", 2, 4)}
        ${zone("Сапоги", 2, 2)}
      </div>
    </div>
    <div class="inventar-schema__bag">
      <div class="inventar-schema__zone inventar-schema__zone--silver inventar-schema__zone--bag">
        ${grid(10, 4)}
      </div>
      <span class="inventar-schema__bag-label">Сумка 10×4</span>
    </div>
  </div>`;
}

export function expandInventarSchema(text) {
  if (!text.includes(INVENTAR_SCHEMA_PLACEHOLDER)) return text;
  return text.split(INVENTAR_SCHEMA_PLACEHOLDER).join(inventarSchemaHtml());
}

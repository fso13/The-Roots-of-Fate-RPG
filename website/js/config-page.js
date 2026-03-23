/**
 * Страница настроек модулей — рендер формы и обработка изменений.
 */
(function () {
  const MODULES_ORDER = [
    "tactical_combat",
    "talent_trees",
    "magic",
    "equipment",
    "bestiary",
    "wounds",
    "crits_and_fumbles",
    "states",
    "character_progression",
    "fantasy_spells",
    "fantasy_skills",
    "fantasy_gear",
    "fantasy_bestiary",
    "fantasy_inventory",
    "firearms",
    "vehicles",
  ];

  function init() {
    const api = window.KoreniSudby && window.KoreniSudby.manifest;
    if (!api) return;

    const form = document.getElementById("config-form");
    const saveBtn = document.getElementById("config-save");
    const resetBtn = document.getElementById("config-reset");
    if (!form || !saveBtn || !resetBtn) return;

    function render() {
      const config = api.getConfig();
      const labels = api.MODULE_LABELS || {};
      form.innerHTML = "";

      const coreGroup = document.createElement("div");
      coreGroup.className = "config-group";
      coreGroup.innerHTML = '<div class="config-group-title">Основные модули</div>';
      const fantasyGroup = document.createElement("div");
      fantasyGroup.className = "config-group";
      fantasyGroup.innerHTML = '<div class="config-group-title">Фэнтези-модули</div>';
      const otherGroup = document.createElement("div");
      otherGroup.className = "config-group";
      otherGroup.innerHTML = '<div class="config-group-title">Прочее</div>';

      const fantasyKeys = ["fantasy_spells", "fantasy_skills", "fantasy_gear", "fantasy_bestiary", "fantasy_inventory"];
      const otherKeys = ["firearms", "vehicles"];

      MODULES_ORDER.forEach((key) => {
        const label = labels[key] || key;
        const checked = config[key] !== false;
        const labelEl = document.createElement("label");
        labelEl.className = "config-checkbox";
        labelEl.innerHTML = `
          <input type="checkbox" data-module="${key}" ${checked ? "checked" : ""}>
          <span>${label}</span>
        `;
        if (fantasyKeys.includes(key)) {
          fantasyGroup.appendChild(labelEl);
        } else if (otherKeys.includes(key)) {
          otherGroup.appendChild(labelEl);
        } else {
          coreGroup.appendChild(labelEl);
        }
      });

      form.appendChild(coreGroup);
      form.appendChild(fantasyGroup);
      form.appendChild(otherGroup);
    }

    function collectConfig() {
      const config = { ...api.DEFAULT_MODULES };
      form.querySelectorAll('input[data-module]').forEach((input) => {
        config[input.getAttribute("data-module")] = input.checked;
      });
      return config;
    }

    function apply() {
      api.saveConfig(collectConfig());
      api.applyNavFilter && api.applyNavFilter();
      if (window.parent !== window) {
        window.parent.postMessage({ type: "koreni-sudby-config-changed" }, "*");
      }
      window.dispatchEvent(new CustomEvent("koreni-sudby-config-changed"));
    }

    saveBtn.addEventListener("click", () => {
      apply();
      saveBtn.textContent = "Сохранено";
      setTimeout(() => (saveBtn.textContent = "Применить"), 800);
    });

    resetBtn.addEventListener("click", () => {
      api.saveConfig({ ...api.DEFAULT_MODULES });
      render();
      apply();
    });

    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

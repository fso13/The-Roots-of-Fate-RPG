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
    "squads",
    "character_progression",
    "fantasy_spells",
    "fantasy_skills",
    "fantasy_gear",
    "fantasy_bestiary",
    "fantasy_inventory",
    "noir_investigation",
    "fahrenheit_books",
    "hero_trap",
    "gothic_weapons",
    "gothic_armor",
    "gothic_magic",
    "gothic_talents",
    "skyrim_weapons",
    "skyrim_armor",
    "skyrim_magic",
    "skyrim_talents",
    "skyrim_gods",
    "skyrim_cults",
    "skyrim_crafting",
    "skyrim_alchemy",
    "skyrim_factions",
    "skyrim_map",
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
      const gothicGroup = document.createElement("div");
      gothicGroup.className = "config-group";
      gothicGroup.innerHTML = '<div class="config-group-title">Модули Gothic</div>';
      const skyrimGroup = document.createElement("div");
      skyrimGroup.className = "config-group";
      skyrimGroup.innerHTML = '<div class="config-group-title">Модули Skyrim</div>';
      const customGroup = document.createElement("div");
      customGroup.className = "config-group";
      customGroup.innerHTML = '<div class="config-group-title">Дополнительные модули</div>';

      const fantasyKeys = ["fantasy_spells", "fantasy_skills", "fantasy_gear", "fantasy_bestiary", "fantasy_inventory"];
      const gothicKeys = ["gothic_weapons", "gothic_armor", "gothic_magic", "gothic_talents"];
      const skyrimKeys = [
        "skyrim_weapons",
        "skyrim_armor",
        "skyrim_magic",
        "skyrim_talents",
        "skyrim_gods",
        "skyrim_cults",
        "skyrim_crafting",
        "skyrim_alchemy",
        "skyrim_factions",
        "skyrim_map",
      ];
      const customKeys = [
        "noir_investigation",
        "fahrenheit_books",
        "hero_trap",
        "firearms",
        "vehicles",
      ];

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
        } else if (gothicKeys.includes(key)) {
          gothicGroup.appendChild(labelEl);
        } else if (skyrimKeys.includes(key)) {
          skyrimGroup.appendChild(labelEl);
        } else if (customKeys.includes(key)) {
          customGroup.appendChild(labelEl);
        } else {
          coreGroup.appendChild(labelEl);
        }
      });

      form.appendChild(coreGroup);
      form.appendChild(fantasyGroup);
      if (gothicGroup.querySelector("label")) form.appendChild(gothicGroup);
      if (skyrimGroup.querySelector("label")) form.appendChild(skyrimGroup);
      if (customGroup.querySelector("label")) form.appendChild(customGroup);
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

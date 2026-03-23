/**
 * Конфигурация модулей для сайта «Корни судьбы».
 * Соответствует modules/manifest.example.yaml.
 * Состояние сохраняется в localStorage и фильтрует навигацию.
 */

(function () {
  const STORAGE_KEY = "koreni-sudby-manifest";

  const MODULE_TO_PAGE = {
    tactical_combat: "02-boy.html",
    talent_trees: "03-derevya-talantov.html",
    magic: "04-magiya.html",
    equipment: "05-snaryazhenie.html",
    bestiary: "06-bestiariy.html",
    wounds: "07-rany.html",
    crits_and_fumbles: "08-krity-i-promahi.html",
    character_progression: "09-sozdanie-i-uroven.html",
    states: "10-sostoyaniya.html",
    fantasy_spells: "fantasy/01-zaklinaniya.html",
    fantasy_skills: "fantasy/02-talanty-i-navyki.html",
    fantasy_gear: "fantasy/03-snaryazhenie.html",
    fantasy_bestiary: "fantasy/04-bestiariy.html",
    fantasy_inventory: "fantasy/05-inventar.html",
  };

  const DEFAULT_MODULES = {
    core: true,
    tactical_combat: true,
    talent_trees: true,
    magic: true,
    equipment: true,
    bestiary: true,
    wounds: false,
    crits_and_fumbles: false,
    states: true,
    character_progression: true,
    fantasy_spells: true,
    fantasy_skills: true,
    fantasy_gear: true,
    fantasy_bestiary: true,
    fantasy_inventory: true,
    firearms: false,
    vehicles: false,
  };

  const MODULE_LABELS = {
    tactical_combat: "Бой (гл. 02)",
    talent_trees: "Деревья талантов (гл. 03)",
    magic: "Магия (гл. 04)",
    equipment: "Снаряжение (гл. 05)",
    bestiary: "Бестиарий (гл. 06)",
    wounds: "Модуль ран (гл. 07)",
    crits_and_fumbles: "Криты и промахи (гл. 08)",
    states: "Состояния (гл. 10)",
    character_progression: "Создание персонажа (гл. 09)",
    fantasy_spells: "Фэнтези: заклинания",
    fantasy_skills: "Фэнтези: таланты и навыки",
    fantasy_gear: "Фэнтези: снаряжение",
    fantasy_bestiary: "Фэнтези: бестиарий",
    fantasy_inventory: "Фэнтези: инвентарь",
    firearms: "Огнестрел",
    vehicles: "Транспорт",
  };

  function getConfig() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_MODULES, ...parsed };
      }
    } catch (_) {}
    return { ...DEFAULT_MODULES };
  }

  function saveConfig(config) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }

  function getPageFromHref(href) {
    const m = href.match(/([^/]+\.html)$/);
    return m ? m[1] : href;
  }

  function normalizeHref(href) {
    return href.replace(/^.*\//, "").replace(/^\.\.\//g, "");
  }

  function applyNavFilter() {
    const config = getConfig();

    const nav = document.querySelector(".sidebar nav");
    if (nav) {
      nav.querySelectorAll("a[data-module]").forEach((a) => {
        const mod = a.getAttribute("data-module");
        const enabled = config[mod] !== false;
        a.style.display = enabled ? "" : "none";
      });
      nav.querySelectorAll(".nav-group").forEach((group) => {
        const hasVisible = Array.from(group.querySelectorAll("a[data-module]")).some(
          (a) => config[a.getAttribute("data-module")] !== false
        );
        group.style.display = hasVisible ? "" : "none";
      });
    }

    document.querySelectorAll(".card[data-module]").forEach((card) => {
      const mod = card.getAttribute("data-module");
      const enabled = config[mod] !== false;
      card.style.display = enabled ? "" : "none";
    });

    document.querySelectorAll(".sheet-body [data-module]").forEach((el) => {
      const mod = el.getAttribute("data-module");
      const enabled = config[mod] !== false;
      el.style.display = enabled ? "" : "none";
    });

    const fantasySection = document.getElementById("index-section-fantasy");
    if (fantasySection) {
      const grid = fantasySection.querySelector(".card-grid");
      const visible = grid && Array.from(grid.querySelectorAll(".card[data-module]")).some(
        (c) => config[c.getAttribute("data-module")] !== false
      );
      fantasySection.style.display = visible ? "" : "none";
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyNavFilter);
  } else {
    applyNavFilter();
  }

  window.KoreniSudby = window.KoreniSudby || {};
  window.KoreniSudby.manifest = {
    getConfig,
    saveConfig,
    applyNavFilter,
    DEFAULT_MODULES,
    MODULE_TO_PAGE,
    MODULE_LABELS,
    STORAGE_KEY,
  };
})();

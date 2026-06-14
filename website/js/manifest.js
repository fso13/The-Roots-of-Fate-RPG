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
    squads: "11-otryady.html",
    fantasy_spells: "fantasy/01-zaklinaniya.html",
    fantasy_skills: "fantasy/02-talanty-i-navyki.html",
    fantasy_gear: "fantasy/03-snaryazhenie.html",
    fantasy_bestiary: "modules/fantasy-bestiariy.html",
    fantasy_inventory: "fantasy/05-inventar.html",
    noir_investigation: "modules/noir-investigation.html",
    fahrenheit_books: "modules/fahrenheit-books.html",
    hero_trap: "modules/hero-trap.html",
    gothic_weapons: "modules/gothic-oruzhie.html",
    gothic_armor: "modules/gothic-bronya.html",
    gothic_magic: "modules/gothic-magiya.html",
    gothic_talents: "modules/gothic-talanty.html",
    gothic_adventure: "modules/gothic-adventure.html",
    skyrim_weapons: "modules/skyrim-oruzhie.html",
    skyrim_armor: "modules/skyrim-bronya.html",
    skyrim_magic: "modules/skyrim-magiya.html",
    skyrim_talents: "modules/skyrim-talanty.html",
    skyrim_gods: "modules/skyrim-bogi.html",
    skyrim_cults: "modules/skyrim-kulty.html",
    skyrim_crafting: "modules/skyrim-izgotovlenie.html",
    skyrim_alchemy: "modules/skyrim-alkhimiya.html",
    skyrim_factions: "modules/skyrim-frakcii.html",
    skyrim_map: "modules/skyrim-karta.html",
    skyrim_adventure: "modules/skyrim-adventure.html",
    elden_ring_lore: "modules/elden-ring-lore.html",
    elden_ring_skills: "modules/elden-ring-navyki.html",
    elden_ring_talents: "modules/elden-ring-talanty.html",
    elden_ring_magic: "modules/elden-ring-magiya.html",
    elden_ring_items: "modules/elden-ring-predmety.html",
    elden_ring_bestiary: "modules/elden-ring-bestiariy.html",
    elden_ring_adventure: "modules/elden-ring-adventure.html",
    homm3_lore: "modules/homm3-lore.html",
    homm3_magic: "modules/homm3-magiya.html",
    homm3_bestiary: "modules/homm3-bestiariy.html",
    homm3_talents: "modules/homm3-talanty.html",
    homm3_items: "modules/homm3-predmety.html",
    homm3_adventure: "modules/homm3-adventure.html",
    firearms: "modules/ognestrel.html",
    vehicles: "modules/transport.html",
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
    squads: true,
    character_progression: true,
    fantasy_spells: true,
    fantasy_skills: true,
    fantasy_gear: true,
    fantasy_bestiary: true,
    fantasy_inventory: true,
    firearms: false,
    vehicles: false,
    noir_investigation: true,
    fahrenheit_books: false,
    hero_trap: false,
    gothic_weapons: false,
    gothic_armor: false,
    gothic_magic: false,
    gothic_talents: false,
    gothic_adventure: false,
    skyrim_weapons: false,
    skyrim_armor: false,
    skyrim_magic: false,
    skyrim_talents: false,
    skyrim_gods: false,
    skyrim_cults: false,
    skyrim_crafting: false,
    skyrim_alchemy: false,
    skyrim_factions: false,
    skyrim_map: false,
    skyrim_adventure: false,
    elden_ring_lore: false,
    elden_ring_skills: false,
    elden_ring_talents: false,
    elden_ring_magic: false,
    elden_ring_items: false,
    elden_ring_bestiary: false,
    elden_ring_adventure: false,
    homm3_lore: false,
    homm3_magic: false,
    homm3_bestiary: false,
    homm3_talents: false,
    homm3_items: false,
    homm3_adventure: false,
  };

  const MODULE_LABELS = {
    tactical_combat: "Бой (гл. 2, игрок)",
    talent_trees: "Деревья талантов (гл. 3, игрок)",
    magic: "Магия (гл. 4, игрок)",
    equipment: "Снаряжение (гл. 5, игрок)",
    bestiary: "Бестиарий (гл. 2, хранитель)",
    wounds: "Раны (гл. 4, хранитель)",
    crits_and_fumbles: "Криты и промахи (гл. 5, хранитель)",
    states: "Состояния (гл. 7, игрок)",
    squads: "Отряды (гл. 6, хранитель)",
    character_progression: "Создание персонажа (гл. 6, игрок)",
    fantasy_spells: "Заклинания (гл. 8, игрок)",
    fantasy_skills: "Таланты и навыки (гл. 9, игрок)",
    fantasy_gear: "Расш. снаряжение (гл. 10, игрок)",
    fantasy_bestiary: "Фэнтези-бестиарий",
    fantasy_inventory: "Инвентарь (гл. 11, игрок)",
    firearms: "Огнестрел",
    vehicles: "Транспорт",
    noir_investigation: "Нуарное расследование",
    fahrenheit_books: "Пепел и память (451°)",
    hero_trap: "Эхо сказки (ловушка героя)",
    gothic_weapons: "Готика — оружие",
    gothic_armor: "Готика — броня",
    gothic_magic: "Готика — магия",
    gothic_talents: "Готика — таланты",
    gothic_adventure: "Готика — Колокол на обрыве",
    skyrim_weapons: "Скайрим — оружие",
    skyrim_armor: "Скайрим — броня",
    skyrim_magic: "Скайрим — магия",
    skyrim_talents: "Скайрим — таланты",
    skyrim_gods: "Скайрим — боги",
    skyrim_cults: "Скайрим — культы",
    skyrim_crafting: "Скайрим — изготовление",
    skyrim_alchemy: "Скайрим — алхимия",
    skyrim_factions: "Скайрим — фракции и гильдии",
    skyrim_map: "Скайрим — карта",
    skyrim_adventure: "Скайрим — Пепельный курган",
    elden_ring_lore: "Elden Ring — лор Междуземья",
    elden_ring_skills: "Elden Ring — навыки",
    elden_ring_talents: "Elden Ring — таланты",
    elden_ring_magic: "Elden Ring — магия",
    elden_ring_items: "Elden Ring — товары и предметы",
    elden_ring_bestiary: "Elden Ring — бестиарий",
    elden_ring_adventure: "Elden Ring — Плачущий корень",
    homm3_lore: "Heroes III — лор Антагарича",
    homm3_magic: "Heroes III — магия",
    homm3_bestiary: "Heroes III — бестиарий",
    homm3_talents: "Heroes III — таланты и навыки",
    homm3_items: "Heroes III — товары и артефакты",
    homm3_adventure: "Heroes III — Обелиск у Тихой рощи",
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

    const gothicSection = document.getElementById("index-section-gothic");
    if (gothicSection) {
      const grid = gothicSection.querySelector(".card-grid");
      const visible = grid && Array.from(grid.querySelectorAll(".card[data-module]")).some(
        (c) => config[c.getAttribute("data-module")] !== false
      );
      gothicSection.style.display = visible ? "" : "none";
    }

    const skyrimSection = document.getElementById("index-section-skyrim");
    if (skyrimSection) {
      const grid = skyrimSection.querySelector(".card-grid");
      const visible = grid && Array.from(grid.querySelectorAll(".card[data-module]")).some(
        (c) => config[c.getAttribute("data-module")] !== false
      );
      skyrimSection.style.display = visible ? "" : "none";
    }

    const eldenRingSection = document.getElementById("index-section-elden-ring");
    if (eldenRingSection) {
      const grid = eldenRingSection.querySelector(".card-grid");
      const visible = grid && Array.from(grid.querySelectorAll(".card[data-module]")).some(
        (c) => config[c.getAttribute("data-module")] !== false
      );
      eldenRingSection.style.display = visible ? "" : "none";
    }

    const homm3Section = document.getElementById("index-section-homm3");
    if (homm3Section) {
      const grid = homm3Section.querySelector(".card-grid");
      const visible = grid && Array.from(grid.querySelectorAll(".card[data-module]")).some(
        (c) => config[c.getAttribute("data-module")] !== false
      );
      homm3Section.style.display = visible ? "" : "none";
    }

    const customSection = document.getElementById("index-section-custom");
    if (customSection) {
      const grid = customSection.querySelector(".card-grid");
      const visible = grid && Array.from(grid.querySelectorAll(".card[data-module]")).some(
        (c) => config[c.getAttribute("data-module")] !== false
      );
      customSection.style.display = visible ? "" : "none";
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

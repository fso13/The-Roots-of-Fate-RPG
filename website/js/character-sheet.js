/**
 * Лист персонажа «Корни судьбы» — интерактивность, сохранение, печать.
 */
(function () {
  const STORAGE_KEY = "koreni-sudby-character";

  function init() {
    updateAttrSum();
    updateResourceMaxes();
    loadFromStorage();

    document.querySelectorAll('[data-attr]').forEach((input) => {
      input.addEventListener("input", updateAttrSum);
    });

    document.querySelectorAll('[name="body"], [name="agility"], [name="mind"], [name="will"]').forEach((input) => {
      input.addEventListener("input", updateResourceMaxes);
    });

    document.getElementById("btn-print")?.addEventListener("click", () => window.print());
    document.getElementById("btn-save")?.addEventListener("click", saveToStorage);
    document.getElementById("btn-load")?.addEventListener("click", loadFromStorage);
    document.getElementById("attr-roll")?.addEventListener("click", rollAttributes);
  }

  function getAttr(name) {
    const el = document.querySelector(`[name="${name}"]`);
    return el ? parseInt(el.value, 10) || 0 : 0;
  }

  const ATTR_COST = { 1: 0, 2: 1, 3: 2, 4: 4, 5: 6 };

  function attrCost(val) {
    return ATTR_COST[Math.max(1, Math.min(5, val))] ?? 0;
  }

  function updateAttrSum() {
    const spent =
      attrCost(getAttr("body")) +
      attrCost(getAttr("agility")) +
      attrCost(getAttr("mind")) +
      attrCost(getAttr("will"));
    const el = document.getElementById("attr-spent");
    if (el) {
      el.textContent = spent;
      el.style.color = spent === 10 ? "var(--accent)" : spent > 10 ? "#c44" : "var(--ink-muted)";
    }
  }

  function roll2d6() {
    return (Math.floor(Math.random() * 6) + 1) + (Math.floor(Math.random() * 6) + 1);
  }

  function attrFrom2d6(sum) {
    if (sum <= 4) return 1;
    if (sum <= 6) return 2;
    if (sum <= 8) return 3;
    if (sum <= 10) return 4;
    return 5;
  }

  function rollAttributes() {
    ["body", "agility", "mind", "will"].forEach((name) => {
      const el = document.querySelector(`[name="${name}"]`);
      if (el) el.value = attrFrom2d6(roll2d6());
    });
    updateAttrSum();
    updateResourceMaxes();
  }

  function updateResourceMaxes() {
    const body = getAttr("body");
    const will = getAttr("will");
    const stressMax = document.querySelector('[name="stress_max"]');
    const woundsMax = document.querySelector('[name="wounds_max"]');
    const sparksMax = document.querySelector('[name="sparks_max"]');
    if (stressMax) stressMax.value = 6 + body;
    if (woundsMax) woundsMax.value = 6 + body;
    if (sparksMax) sparksMax.value = 3 + will;
  }

  function serialize() {
    const data = {};
    document.querySelectorAll("input, textarea").forEach((el) => {
      if (el.name && el.type !== "submit" && el.type !== "button") {
        data[el.name] = el.value;
      }
    });
    return JSON.stringify(data);
  }

  function deserialize(json) {
    try {
      const data = JSON.parse(json);
      Object.entries(data).forEach(([name, value]) => {
        const el = document.querySelector(`[name="${name}"]`);
        if (el && value != null) el.value = value;
      });
      updateAttrSum();
      updateResourceMaxes();
    } catch (_) {}
  }

  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, serialize());
      const btn = document.getElementById("btn-save");
      if (btn) {
        btn.textContent = "Сохранено";
        setTimeout(() => (btn.textContent = "Сохранить в браузере"), 1200);
      }
    } catch (_) {}
  }

  function loadFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) deserialize(saved);
    } catch (_) {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

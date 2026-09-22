/**
 * Лист персонажа «The Edge!» — интерактивность, сохранение, печать.
 */
(function () {
  const STORAGE_KEY = "the-edge-character";

  function init() {
    mountAllTracks();
    updateAttrSum();
    updateResourceMaxes();
    loadFromStorage();

    document.querySelectorAll("[data-attr]").forEach((input) => {
      input.addEventListener("input", updateAttrSum);
    });

    document.querySelectorAll('[name="body"], [name="agility"], [name="mind"], [name="will"]').forEach((input) => {
      input.addEventListener("input", () => {
        updateResourceMaxes();
      });
    });

    document.getElementById("btn-print")?.addEventListener("click", () => window.print());
    window.addEventListener("beforeprint", stripPlaceholdersForPrint);
    window.addEventListener("afterprint", restorePlaceholdersAfterPrint);
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
    return Math.floor(Math.random() * 6) + 1 + (Math.floor(Math.random() * 6) + 1);
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

  function countChecked(track) {
    return track.querySelectorAll('input[type="checkbox"]:checked').length;
  }

  function fillTrack(track, max, checked) {
    const field = track.dataset.field || track.dataset.resource || "tick";
    const n = Math.max(0, max | 0);
    const on = Math.max(0, Math.min(n, checked | 0));
    track.dataset.max = String(n);
    track.innerHTML = "";
    for (let i = 1; i <= n; i++) {
      const label = document.createElement("label");
      label.className = "tick";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.name = `${field}_${i}`;
      input.value = "1";
      if (i <= on) input.checked = true;
      const span = document.createElement("span");
      span.setAttribute("aria-hidden", "true");
      label.appendChild(input);
      label.appendChild(span);
      track.appendChild(label);
    }
  }

  function mountAllTracks() {
    document.querySelectorAll(".tick-track[data-field]").forEach((track) => {
      const max = parseInt(track.dataset.max || "4", 10) || 4;
      fillTrack(track, max, 0);
    });
    document.querySelectorAll(".tick-track[data-resource]").forEach((track) => {
      const max = parseInt(track.dataset.max || "9", 10) || 9;
      fillTrack(track, max, 0);
    });
  }

  function updateResourceMaxes() {
    const body = getAttr("body");
    const will = getAttr("will");
    const limits = {
      stress: 6 + body,
      wounds: 6 + body,
      sparks: 3 + will,
    };
    Object.entries(limits).forEach(([key, max]) => {
      const track = document.querySelector(`.tick-track[data-resource="${key}"]`);
      const label = document.querySelector(`[data-max-label="${key}"]`);
      if (label) label.textContent = String(max);
      if (track) {
        const kept = countChecked(track);
        fillTrack(track, max, kept);
      }
    });
  }

  function serialize() {
    const data = {};
    document.querySelectorAll("input, textarea").forEach((el) => {
      if (!el.name || el.type === "submit" || el.type === "button") return;
      if (el.type === "checkbox") {
        data[el.name] = el.checked ? "1" : "0";
      } else {
        data[el.name] = el.value;
      }
    });
    return JSON.stringify(data);
  }

  function deserialize(json) {
    try {
      const data = JSON.parse(json);
      Object.entries(data).forEach(([name, value]) => {
        if (name.endsWith("_max") && ["stress_max", "wounds_max", "sparks_max"].includes(name)) return;
        const el = document.querySelector(`[name="${name}"]`);
        if (!el || value == null) return;
        if (el.type === "checkbox") el.checked = value === "1" || value === true || value === 1;
        else el.value = value;
      });

      // Legacy number skills → ticks
      document.querySelectorAll(".tick-track[data-field]").forEach((track) => {
        const field = track.dataset.field;
        const legacy = data[field];
        if (legacy != null && !Number.isNaN(Number(legacy))) {
          fillTrack(track, parseInt(track.dataset.max || "4", 10) || 4, Number(legacy));
        } else {
          const max = parseInt(track.dataset.max || "4", 10) || 4;
          let checked = 0;
          for (let i = 1; i <= max; i++) {
            if (data[`${field}_${i}`] === "1") checked = i;
          }
          fillTrack(track, max, checked);
        }
      });

      updateAttrSum();
      updateResourceMaxes();

      // Restore resource fills after max rebuild
      ["stress", "wounds", "sparks"].forEach((key) => {
        const track = document.querySelector(`.tick-track[data-resource="${key}"]`);
        if (!track) return;
        const max = parseInt(track.dataset.max || "0", 10) || 0;
        let checked = 0;
        const legacyCur = data[`${key}_current`];
        if (legacyCur != null && !Number.isNaN(Number(legacyCur))) {
          checked = Number(legacyCur);
        } else {
          for (let i = 1; i <= max; i++) {
            if (data[`${key}_${i}`] === "1") checked = i;
          }
        }
        fillTrack(track, max, checked);
      });
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

  function stripPlaceholdersForPrint() {
    document
      .querySelectorAll(".sheet-body input[placeholder], .sheet-body textarea[placeholder]")
      .forEach((el) => {
        el.dataset.savedPlaceholder = el.placeholder;
        el.placeholder = "";
      });
  }

  function restorePlaceholdersAfterPrint() {
    document
      .querySelectorAll(".sheet-body input[data-saved-placeholder], .sheet-body textarea[data-saved-placeholder]")
      .forEach((el) => {
        el.placeholder = el.dataset.savedPlaceholder;
        delete el.dataset.savedPlaceholder;
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

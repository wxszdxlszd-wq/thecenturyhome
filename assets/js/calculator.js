/* ============================================================
   The Old House Playbook — budget calculator (pure functions)
   Exposed on window.Calculator for both the page and Node tests.
   Figures: typical US market ranges (2025-2026), vary by region.
   ============================================================ */
(function (global) {
  "use strict";

  var COST_BANDS = { low: 0.8, mid: 1.0, high: 1.35 };

  // Per sq ft of project scope, before old-house reserves.
  var SCOPE_RATES = {
    full:  { low: 55, high: 95 },    // whole-house renovation $/sqft
    kitchen_bath: { low: 12000, high: 26000 }, // fixed range for 1 kitchen + 1 bath refresh
    restore: { low: 30, high: 60 }   // focused repair/restoration $/sqft
  };

  // Old-house-only contingency line items (based on % of subtotal).
  var RESERVE_RATES = {
    plaster: 0.04,   // plaster & lath repair allowance
    wiring: 0.05,    // knob-and-tube / outdated panel replacement
    foundation: 0.05,// foundation & drainage reserve
    windows: 0.03,   // historic window repair reserve
    misc: 0.06       // surprise reserve (old houses always surprise)
  };

  var ERA_MULT = {
    pre1900: 1.12,
    "1900s": 1.08,
    "1920s": 1.05,
    "1930s": 1.02,
    "1940s": 1.0,
    "1950s": 1.0
  };

  function round2(n) { return Math.round(n * 100) / 100; }

  function money(n) {
    return "$" + Math.round(n).toLocaleString("en-US");
  }

  /**
   * Core calculation.
   * @param {object} input { era, sqft, scope, band, diy }
   * @returns {{ ok: true, totalLow, totalHigh, breakdown: [{label, low, high}], notes: [] }
   *          | { ok: false, errors: string[] }}
   */
  function calculate(input) {
    var errors = [];
    if (!input) return { ok: false, errors: ["Missing input."] };
    var era = String(input.era || "");
    var sqft = Number(input.sqft);
    var scope = String(input.scope || "");
    var band = String(input.band || "mid");
    var diy = input.diy === true || input.diy === "true" || input.diy === "1";

    if (!ERA_MULT[era]) errors.push("Pick a building era.");
    if (!scope || !SCOPE_RATES[scope]) errors.push("Pick a renovation scope.");
    if (!COST_BANDS[band]) errors.push("Pick a cost band.");
    if (!isFinite(sqft) || sqft <= 0) errors.push("Square footage must be a positive number.");
    if (isFinite(sqft) && sqft > 20000) errors.push("That looks too large for a single-family renovation — double-check the number.");
    if (errors.length) return { ok: false, errors: errors };

    var mult = ERA_MULT[era] * COST_BANDS[band];
    var diyFactor = diy ? 0.6 : 1.0;

    var baseLow, baseHigh;
    if (scope === "kitchen_bath") {
      baseLow = SCOPE_RATES.kitchen_bath.low;
      baseHigh = SCOPE_RATES.kitchen_bath.high;
    } else {
      baseLow = SCOPE_RATES[scope].low * sqft;
      baseHigh = SCOPE_RATES[scope].high * sqft;
    }
    var subtotalLow = baseLow * mult * diyFactor;
    var subtotalHigh = baseHigh * mult * diyFactor;

    var items = [];
    var reserves = [
      ["Plaster & lath repair", RESERVE_RATES.plaster],
      ["Electrical (old wiring/panel)", RESERVE_RATES.wiring],
      ["Foundation & drainage", RESERVE_RATES.foundation],
      ["Historic windows", RESERVE_RATES.windows],
      ["Surprise reserve", RESERVE_RATES.misc]
    ];
    var totalLow = subtotalLow, totalHigh = subtotalHigh;
    reserves.forEach(function (r) {
      var low = subtotalLow * r[1];
      var high = subtotalHigh * r[1];
      totalLow += low; totalHigh += high;
      items.push({ label: r[0], low: low, high: high });
    });

    var notes = [];
    notes.push("Typical US market ranges (2025-2026), varies by region — treat as planning input, not a quote.");
    if (diy) notes.push("DIY labor assumed at ~60% of professional labor; materials still full cost.");
    if (era && ERA_MULT[era] > 1) notes.push("Pre-1930 homes carry an age premium for specialty trades.");
    notes.push("Always get 3 contractor bids and one structural inspection before committing.");

    return {
      ok: true,
      totalLow: round2(totalLow),
      totalHigh: round2(totalHigh),
      breakdown: items,
      notes: notes,
      label: { totalLow: money(totalLow), totalHigh: money(totalHigh), item: null }
    };
  }

  global.Calculator = {
    calculate: calculate,
    money: money,
    ERA_MULT: ERA_MULT,
    SCOPE_RATES: SCOPE_RATES,
    COST_BANDS: COST_BANDS
  };

  /* ---------- DOM wiring (page only) ---------- */
  function wirePage() {
    var form = document.getElementById("calc-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var fields = {
        era: document.getElementById("era"),
        scope: document.getElementById("scope"),
        band: document.getElementById("band"),
        sqft: document.getElementById("sqft"),
        diy: document.getElementById("diy")
      };
      Object.values(fields).forEach(function (f) {
        if (f) f.closest(".field").classList.remove("is-invalid");
      });
      var input = {
        era: fields.era && fields.era.value,
        scope: fields.scope && fields.scope.value,
        band: fields.band && fields.band.value,
        sqft: fields.sqft && fields.sqft.value,
        diy: fields.diy && fields.diy.checked
      };
      var res = calculate(input);
      var out = document.getElementById("calc-results");
      var totalEl = document.getElementById("calc-total");
      var rangeEl = document.getElementById("calc-range");
      var listEl = document.getElementById("calc-breakdown");
      var notesEl = document.getElementById("calc-notes");
      if (!res.ok) {
        res.errors.forEach(function (msg) {
          var err = document.createElement("div");
          err.className = "field-error";
          err.style.display = "block";
          err.textContent = msg;
          var holder = document.querySelector(".calc-form");
          if (holder) holder.insertBefore(err, out);
        });
        return;
      }
      totalEl.textContent = global.Calculator.money(res.totalLow) + " – " + global.Calculator.money(res.totalHigh);
      rangeEl.textContent = "Estimated range for your renovation (incl. old-house reserves)";
      listEl.innerHTML = "";
      res.breakdown.forEach(function (b) {
        var li = document.createElement("li");
        var span = document.createElement("span");
        span.textContent = b.label;
        var amt = document.createElement("span");
        amt.className = "amt";
        amt.textContent = global.Calculator.money(b.low) + " – " + global.Calculator.money(b.high);
        li.appendChild(span); li.appendChild(amt);
        listEl.appendChild(li);
      });
      var extra = document.createElement("li");
      var s2 = document.createElement("span"); s2.textContent = "Subtotal (scope × age × region)";
      var a2 = document.createElement("span"); a2.className = "amt";
      a2.textContent = global.Calculator.money(res.totalLow - res.breakdown.reduce(function (s, b) { return s + b.low; }, 0)) + " – " + global.Calculator.money(res.totalHigh - res.breakdown.reduce(function (s, b) { return s + b.high; }, 0));
      extra.appendChild(s2); extra.appendChild(a2);
      listEl.insertBefore(extra, listEl.firstChild);
      notesEl.innerHTML = "";
      res.notes.forEach(function (n) {
        var p = document.createElement("p");
        p.style.cssText = "font-size:0.85rem;color:#4a4f4a;margin:0.3rem 0;";
        p.textContent = n;
        notesEl.appendChild(p);
      });
      out.hidden = false;
      out.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", wirePage);
    } else {
      wirePage();
    }
  }
})(typeof window !== "undefined" ? window : globalThis);

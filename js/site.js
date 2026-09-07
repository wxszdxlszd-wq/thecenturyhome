/* ════════════════════════════════════════════════════════════
   The Old House Playbook — site.js (v2)
   Nav, reveals, counters, FAQ, lightbox wiring, buy links,
   email capture, reader progress.
   ════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var cfg = window.SITE_CONFIG || {};
  var buyUrl = cfg.gumroadUrl || cfg.checkoutUrl || cfg.kofiUrl || "";
  var IS_PLACEHOLDER = !buyUrl || /ko-fi\.com\/s\//.test(buyUrl);


  /* ---------- No-JS guard ---------- */
  document.body.classList.remove("loading");

  /* ---------- Buy links: point data-buy at the configured checkout ---------- */
  document.querySelectorAll("a[data-buy]").forEach(function (a) {
    if (buyUrl) a.href = buyUrl;
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener");
    a.addEventListener("click", function (e) {
      if (!IS_PLACEHOLDER) return;
      e.preventDefault();
      var msg = document.getElementById("buy-placeholder-msg");
      if (msg) {
        msg.hidden = false;
        msg.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  });

  /* ---------- Mobile nav ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var closeBtn = document.querySelector(".nav-close");
  var nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    function setNav(open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      document.body.style.overflow = open ? "hidden" : "";
    }
    toggle.addEventListener("click", function () { setNav(!nav.classList.contains("is-open")); });
    if (closeBtn) closeBtn.addEventListener("click", function () { setNav(false); });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setNav(false); });
    });
  }

  /* ---------- Sticky header shadow ---------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", (window.scrollY || 0) > 8);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Email capture ---------- */
  var form = document.querySelector("[data-email-form]");
  if (form) {
    var input = form.querySelector("input[type='email']");
    var status = form.querySelector(".form-status");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = (input && input.value || "").trim();
      if (!status) return;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        status.className = "form-status is-error";
        status.textContent = "Please enter a valid email address.";
        return;
      }
      if (!cfg.formEndpoint) {
        status.className = "form-status is-muted";
        status.textContent = "The free audit checklist is already open — use the button below.";
        return;
      }
      var btn = form.querySelector("button");
      if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }
      fetch(cfg.formEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ email: email })
      }).then(function (r) {
        if (r.ok) {
          status.className = "form-status is-success";
          status.textContent = "Done! Check your inbox for the free audit checklist.";
          if (input) input.value = "";
        } else {
          throw new Error("bad response");
        }
      }).catch(function () {
        status.className = "form-status is-error";
        status.textContent = "Something went wrong — please try again.";
      }).finally(function () {
        if (btn) { btn.disabled = false; btn.textContent = "Send me the checklist"; }
      });
    });
  }

  /* ---------- Scroll reveal (robust: fires on instant jumps too) ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length) {
    var revealArr = Array.prototype.slice.call(revealEls);
    var viewTicking = false;
    function viewCheck() {
      var vh = window.innerHeight * 0.92;
      revealArr = revealArr.filter(function (el) {
        if (el.getBoundingClientRect().top < vh) {
          el.classList.add("is-in");
          return false;
        }
        return true;
      });
      if (!revealArr.length) window.removeEventListener("scroll", onViewTick);
    }
    function onViewTick() {
      if (viewTicking) return;
      viewTicking = true;
      requestAnimationFrame(function () { viewTicking = false; viewCheck(); });
    }
    window.addEventListener("scroll", onViewTick, { passive: true });
    viewCheck();
  }

  /* ---------- Animated counters ---------- */
  var countEls = document.querySelectorAll("[data-count]");
  if (countEls.length) {
    var countArr = Array.prototype.slice.call(countEls);
    var countDone = false;

    function runCounter(el) {
      var target = parseFloat(el.dataset.count);
      var decimals = parseInt(el.dataset.decimals || "0", 10);
      var prefix = el.dataset.prefix || "";
      var suffix = el.dataset.suffix || "";
      var dur = 1400;
      var t0 = null;
      function frame(t) {
        if (!t0) t0 = t;
        var p = Math.min((t - t0) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = prefix + (target * eased).toFixed(decimals) + suffix;
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    function checkCounters() {
      var vh = window.innerHeight * 0.92;
      countArr = countArr.filter(function (el) {
        if (el.getBoundingClientRect().top < vh) {
          runCounter(el);
          return false;
        }
        return true;
      });
      if (!countArr.length && !countDone) {
        countDone = true;
        window.removeEventListener("scroll", onCountTick);
      }
    }
    var countTicking = false;
    function onCountTick() {
      if (countTicking) return;
      countTicking = true;
      requestAnimationFrame(function () { countTicking = false; checkCounters(); });
    }
    window.addEventListener("scroll", onCountTick, { passive: true });
    checkCounters();
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var q = item.querySelector(".faq-q");
    if (!q) return;
    q.addEventListener("click", function () {
      var open = item.classList.toggle("is-open");
      q.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });

  /* ---------- Reader progress bar ---------- */
  var progress = document.getElementById("reader-progress");
  if (progress) {
    function onScroll() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - doc.clientHeight;
      progress.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + "%";
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
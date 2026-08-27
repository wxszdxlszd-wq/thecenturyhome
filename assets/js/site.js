/* ============================================================
   The Old House Playbook — site.js v2 (shared behaviour)
   ============================================================ */
(function () {
  "use strict";

  var cfg = window.SITE_CONFIG || {};
  var checkoutUrl = cfg.kofiUrl || cfg.checkoutUrl || cfg.gumroadUrl || "https://ko-fi.com/s/86751002e2";
  var IS_PLACEHOLDER = /old-house-playbook-kit|placeholder/.test(checkoutUrl || "");

  /* ---------- Header: hero-aware ---------- */
  var header = document.querySelector(".site-header");
  var hasHero = !!(document.querySelector(".hero") || document.querySelector(".member-hero"));
  if (hasHero) document.body.classList.add("has-hero");

  function onScroll() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 40);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile nav ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* Marketing pages: .frame nav — same pattern */
  var frameToggle = document.querySelector(".frame .nav-toggle");
  var frameNav = document.querySelector(".frame__nav");
  if (frameToggle && frameNav) {
    frameToggle.addEventListener("click", function () {
      var open = frameNav.classList.toggle("is-open");
      frameToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    frameNav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        frameNav.classList.remove("is-open");
        frameToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- CTA link configuration & placeholder guard ---------- */
  var BUY_LINK_SELECTOR = "a[data-buy], a.buy-link, a[href*='gumroad'], a[href*='ko-fi.com']";
  document.querySelectorAll(BUY_LINK_SELECTOR).forEach(function (a) {
    var href = a.getAttribute("href") || "";
    // If it is an external checkout button or specifically a buy link not targeting anchor
    if (!href.startsWith("#") && !href.includes("#pricing")) {
      a.href = checkoutUrl;
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
    }

    if (IS_PLACEHOLDER) {
      a.classList.add("is-placeholder");
      a.addEventListener("click", function (e) {
        if (!href.startsWith("#")) {
          e.preventDefault();
          var msg = document.getElementById("buy-placeholder-msg");
          if (msg) {
            msg.hidden = false;
            msg.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }
      });
    }
  });

  /* ---------- Free checklist email capture ---------- */
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
        status.setAttribute("aria-live", "polite");
        status.textContent = "Please enter a valid email address.";
        return;
      }
      if (!cfg.formEndpoint) {
        status.className = "form-status is-muted";
        status.setAttribute("aria-live", "polite");
        status.textContent = "The free checklist is already open for you — use the button above.";
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
          status.setAttribute("aria-live", "polite");
          status.textContent = "Done! Check your inbox for the free checklist.";
          if (input) input.value = "";
        } else {
          throw new Error("bad response");
        }
      }).catch(function () {
        status.className = "form-status is-error";
        status.setAttribute("aria-live", "polite");
        status.textContent = "Something went wrong — please try again or use the open-checklist button.";
      }).finally(function () {
        if (btn) { btn.disabled = false; btn.textContent = "Send me a copy"; }
      });
    });
  }

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("is-in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- Before / After slider ---------- */
  var ba = document.querySelector("[data-ba-slider]");
  if (ba) {
    var frame = ba.querySelector(".ba-frame");
    var after = ba.querySelector(".ba-after-layer") || ba.querySelector(".ba-after");
    var handle = ba.querySelector(".ba-handle");
    var knob = ba.querySelector(".ba-knob");
    var pos = 50;

    function setPos(pct) {
      pos = Math.max(2, Math.min(98, pct));
      if (after) after.style.clipPath = "inset(0 " + (100 - pos) + "% 0 0)";
      if (handle) handle.style.left = pos + "%";
    }

    function fromEvent(e) {
      if (!frame) return 50;
      var r = frame.getBoundingClientRect();
      var clientX = e.touches && e.touches.length ? e.touches[0].clientX : e.clientX;
      var x = clientX - r.left;
      return (x / r.width) * 100;
    }

    var dragging = false;
    function onDown(e) { dragging = true; setPos(fromEvent(e)); }
    function onMove(e) { if (dragging) setPos(fromEvent(e)); }
    function onUp() { dragging = false; }

    if (knob) knob.addEventListener("mousedown", onDown);
    if (handle) handle.addEventListener("mousedown", onDown);
    if (frame) {
      frame.addEventListener("mousedown", onDown);
      frame.addEventListener("touchstart", function (e) {
        dragging = true;
        setPos(fromEvent(e));
      }, { passive: true });
    }
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("touchmove", function (e) {
      if (dragging) setPos(fromEvent(e));
    }, { passive: true });
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
    setPos(50);
  }

  /* ---------- Start-here quiz ---------- */
  var quiz = document.querySelector("[data-quiz]");
  if (quiz) {
    var answers = {};
    var questions = quiz.querySelectorAll("[data-q]");

    quiz.addEventListener("click", function (e) {
      var opt = e.target.closest(".opt");
      if (!opt) return;
      var q = opt.closest("[data-q]");
      if (!q) return;
      q.querySelectorAll(".opt").forEach(function (b) {
        b.classList.remove("is-selected");
      });
      opt.classList.add("is-selected");
      answers[q.dataset.q] = opt.dataset.key;
      if (Object.keys(answers).length === questions.length) {
        showResult();
      }
    });

    function showResult() {
      var result = quiz.querySelector("[data-result]");
      var title = quiz.querySelector("[data-result-title]");
      var body = quiz.querySelector("[data-result-body]");
      if (!result || !title || !body) return;

      var a = answers;
      var concern = a["2"] || "audit";
      var stage = a["1"] || "audit";
      var map = {
        budget: { t: "Start with the numbers", b: "Your biggest risk is hidden cost. Chapter 1 of the Kit builds your budget with real ranges and the surprise-reserve column — before a single wall comes down." },
        contractor: { t: "Start with the contractor playbook", b: "Trust is your bottleneck. The bonus contractor chapter gives you the ten interview questions that separate old-house pros from generalists — plus the change-order process that protects you." },
        sequence: { t: "Start with the 90-day sequence", b: "Your fear is doing work in the wrong order. Chapter 2 lays out the exact sequence — water, systems, structure, walls, floors — so you never redo last month's work." },
        style: { t: "Start with the mid-century style guide", b: "You want the character to survive. Chapter 3 shows how to bring warm woods, period light and vintage details into every room without gutting what makes the house special." },
        audit: { t: "Start with the 30-minute audit", b: stage === "audit" ? "You're early — perfect. The free 30-minute audit tells you exactly what kind of house you're dealing with and what to fix first. Then Chapter 0 of the Kit takes it deeper." : "Start by understanding what you actually own. The 30-minute audit (free, printable) gives you your honest starting point before you spend anything." },
        diy: { t: "You're set up to save real money", b: "Hands-on owners save the most with the Kit — the sequence and pitfall list are exactly the mistakes DIYers make first. Chapter 2 is your best friend." }
      };
      var pick = map[concern] || map.audit;
      title.textContent = pick.t;
      body.textContent = pick.b;
      result.classList.add("is-show");
      result.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var q = item.querySelector(".faq-q");
    var a = item.querySelector(".faq-a");
    if (!q || !a) return;
    q.addEventListener("click", function () {
      var open = item.classList.toggle("is-open");
      q.setAttribute("aria-expanded", open ? "true" : "false");
      a.style.maxHeight = open ? a.scrollHeight + "px" : "0";
    });
  });

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();

/* ============================================================
   The Old House Playbook — unlock.js
   Password check (SHA-256) against the hash in config.js.
   Weak by design (MVP, KTD2) — see README before going live.
   ============================================================ */
(function () {
  "use strict";

  var UNLOCK_FLAG = "ohp_unlocked_v1";

  function sha256Hex(str) {
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(str)).then(function (buf) {
      return Array.from(new Uint8Array(buf)).map(function (b) {
        return b.toString(16).padStart(2, "0");
      }).join("");
    });
  }

  function isUnlocked() {
    try { return localStorage.getItem(UNLOCK_FLAG) === "1"; }
    catch (e) { return false; }
  }

  function setUnlocked() {
    try { localStorage.setItem(UNLOCK_FLAG, "1"); } catch (e) { /* private mode */ }
  }

  function clearUnlocked() {
    try { localStorage.removeItem(UNLOCK_FLAG); } catch (e) {}
  }

  function wire(formEl, msgEl) {
    var cfg = window.SITE_CONFIG || {};
    formEl.addEventListener("submit", function (e) {
      e.preventDefault();
      var val = (formEl.querySelector("input[type='password']").value || "").trim();
      if (!val) {
        msgEl.className = "unlock-msg is-error";
        msgEl.setAttribute("aria-live", "polite");
        msgEl.textContent = "Please enter the password from your purchase email.";
        return;
      }
      var btn = formEl.querySelector("button");
      if (btn) { btn.disabled = true; btn.textContent = "Checking…"; }
      sha256Hex(val).then(function (hex) {
        if (hex === cfg.unlockHash) {
          setUnlocked();
          msgEl.className = "unlock-msg is-success";
          msgEl.setAttribute("aria-live", "polite");
          msgEl.textContent = "Unlocked! Taking you to your kit…";
          setTimeout(function () { window.location.href = "member/kit.html"; }, 600);
        } else {
          msgEl.className = "unlock-msg is-error";
          msgEl.setAttribute("aria-live", "polite");
          msgEl.textContent = "That password doesn't match. Check your purchase email (and spam folder).";
          if (btn) { btn.disabled = false; btn.textContent = "Unlock my kit"; }
        }
      }).catch(function () {
        msgEl.className = "unlock-msg is-error";
        msgEl.setAttribute("aria-live", "polite");
        msgEl.textContent = "Something went wrong. Try again in a moment.";
        if (btn) { btn.disabled = false; btn.textContent = "Unlock my kit"; }
      });
    });
  }

  window.Unlock = { isUnlocked: isUnlocked, setUnlocked: setUnlocked, clearUnlocked: clearUnlocked, wire: wire };

  /* Unlock page wiring */
  var f = document.getElementById("unlock-form");
  var m = document.getElementById("unlock-msg");
  if (f && m) wire(f, m);
})();

/* ============================================================
   The Old House Playbook — lightbox.js
   Click-to-open large image viewer with prev/next, keyboard,
   captions and counter. Zero dependencies.
   Usage: any <img data-lightbox="group" data-caption="..."> is
   clickable; images sharing a group navigate together.
   ============================================================ */
(function () {
  "use strict";

  var targets = document.querySelectorAll("img[data-lightbox]");
  if (!targets.length) return;

  var root = document.createElement("div");
  root.className = "lb-root";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-label", "Image viewer");
  root.innerHTML =
    '<button class="lb-close" type="button" aria-label="Close">×</button>' +
    '<button class="lb-btn lb-prev" type="button" aria-label="Previous">←</button>' +
    '<div class="lb-stage">' +
    '<img alt="">' +
    '<p class="lb-count"></p>' +
    '<p class="lb-caption"></p>' +
    "</div>" +
    '<button class="lb-btn lb-next" type="button" aria-label="Next">→</button>';
  document.body.appendChild(root);

  var img = root.querySelector(".lb-stage img");
  var caption = root.querySelector(".lb-caption");
  var count = root.querySelector(".lb-count");
  var groupItems = [];
  var index = 0;

  function byGroup(group) {
    return Array.prototype.slice
      .call(document.querySelectorAll('img[data-lightbox="' + group + '"]'))
      .filter(function (elm) { return elm.getAttribute("src") || elm.src; });
  }

  function open(list, i) {
    groupItems = list;
    index = i;
    show();
    root.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function show() {
    var el = groupItems[index];
    var src = el.getAttribute("src") || el.src;
    var alt = el.getAttribute("alt") || "";
    var cap = el.getAttribute("data-caption") || alt || "";
    img.src = src;
    img.alt = alt;
    caption.textContent = cap;
    count.textContent = (index + 1) + " / " + groupItems.length;
  }

  function close() {
    root.classList.remove("is-open");
    document.body.style.overflow = "";
    img.removeAttribute("src");
  }

  function step(d) {
    index = (index + d + groupItems.length) % groupItems.length;
    show();
  }

  targets.forEach(function (elm) {
    elm.style.cursor = "zoom-in";
    elm.setAttribute("role", "button");
    elm.setAttribute("tabindex", "0");
    elm.addEventListener("click", function () {
      open(byGroup(elm.getAttribute("data-lightbox")), indexIn(elm));
    });
    elm.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open(byGroup(elm.getAttribute("data-lightbox")), indexIn(elm));
      }
    });
  });

  function indexIn(elm) {
    var g = byGroup(elm.getAttribute("data-lightbox"));
    var i = g.indexOf(elm);
    return i === -1 ? 0 : i;
  }

  root.querySelector(".lb-close").addEventListener("click", close);
  root.querySelector(".lb-prev").addEventListener("click", function () { step(-1); });
  root.querySelector(".lb-next").addEventListener("click", function () { step(1); });
  root.addEventListener("click", function (e) {
    if (e.target === root) close();
  });
  document.addEventListener("keydown", function (e) {
    if (!root.classList.contains("is-open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
    if (e.key === "Home") { index = 0; show(); }
    if (e.key === "End") { index = groupItems.length - 1; show(); }
  });
})();
/* ============================================================
   The Old House Playbook — corridor.js (hero-only edition)
   Creative Image Corridor hero, adapted from the user's
   reference prototype. Motion lives ONLY on the first screen:
   a perspective corridor of renovation photos streams out of a
   central aperture as the page loads; the rest of the page is
   static and clean.
   - rAF pauses when the hero scrolls out of view (IO-guarded).
   - prefers-reduced-motion: corridor renders its final frame.
   ============================================================ */
(function () {
  "use strict";

  var corridorImages = [
    "img-02.jpg", "img-03.jpg", "img-04.jpg", "img-06.jpg", "img-08.jpg",
    "img-09.jpg", "img-10.jpg", "img-11.jpg", "img-13.jpg"
  ].map(function (n) { return "" + n; });

  var SLOT_TRAVEL = [0, 0.06, 0.145, 0.255, 0.375, 0.485, 0.585];
  var SLOT_SCALE_RATIO = [0.1, 0.16, 0.27, 0.43, 0.68, 1, 1.35];
  var SLOT_ROTATION = [12, 16, 21, 27, 33, 39, 45];
  var TRACK_SPACING = 0.9;
  var BIRTH_GROWTH_SLOTS = 1;
  var PRE_PUSH_START_SLOT = 0.55;
  var PRE_PUSH_END_SLOT = 1.85;
  var BAR_START = 180;
  var BAR_END = 900;
  var IMAGE_REVEAL_PROGRESS = 0.8;
  var IMAGE_START = BAR_START + (BAR_END - BAR_START) * (1 - Math.cbrt(1 - IMAGE_REVEAL_PROGRESS));
  var FILL_DURATION = 1000;
  var FILLED_STREAM_POSITION = 6;
  var STEADY_SPEED = 1.25 * (2 / 3);
  var INITIAL_SPEED = (2 * FILLED_STREAM_POSITION) / (FILL_DURATION / 1000) - STEADY_SPEED;
  var DECELERATION = (STEADY_SPEED - INITIAL_SPEED) / (FILL_DURATION / 1000);
  var STREAM_PAIR_COUNT = 20;
  var MAX_VISIBLE_SLOT = 5.25;

  var corridor = document.querySelector(".corridor");
  var aperture = document.querySelector(".center-aperture");
  var heroShell = document.querySelector(".hero-shell");
  var cardElements = [];
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var clamp = function (value, min, max) {
    min = min || 0; max = max || 1;
    return Math.min(Math.max(value, min), max);
  };
  var easeInOut = function (value) {
    var t = clamp(value);
    return t * t * (3 - 2 * t);
  };
  var easeOut = function (value) {
    return 1 - Math.pow(1 - clamp(value), 3);
  };
  var easeIntoLinearMotion = function (value) {
    var t = clamp(value);
    return t * t * (2 - t);
  };

  function interpolateSlot(values, slot) {
    var last = values.length - 1;
    if (slot >= last) {
      var step = values[last] - values[last - 1];
      return values[last] + step * (slot - last);
    }
    var lower = Math.max(Math.floor(slot), 0);
    var upper = Math.min(lower + 1, last);
    var mix = slot - lower;
    var mixSquared = mix * mix;
    var mixCubed = mixSquared * mix;
    var getSlope = function (index) {
      if (index === 0) return values[1] - values[0];
      if (index === last) return values[last] - values[last - 1];
      var before = values[index] - values[index - 1];
      var after = values[index + 1] - values[index];
      if (before === 0 || after === 0 || before * after < 0) return 0;
      return (2 * before * after) / (before + after);
    };
    var lowerSlope = getSlope(lower);
    var upperSlope = getSlope(upper);
    return (
      (2 * mixCubed - 3 * mixSquared + 1) * values[lower] +
      (mixCubed - 2 * mixSquared + mix) * lowerSlope +
      (-2 * mixCubed + 3 * mixSquared) * values[upper] +
      (mixCubed - mixSquared) * upperSlope
    );
  }

  function getStreamPosition(elapsed) {
    var motionElapsed = Math.max(elapsed - IMAGE_START, 0) / 1000;
    var fillSeconds = FILL_DURATION / 1000;
    if (motionElapsed <= fillSeconds) {
      return INITIAL_SPEED * motionElapsed + 0.5 * DECELERATION * motionElapsed * motionElapsed;
    }
    return FILLED_STREAM_POSITION + (motionElapsed - fillSeconds) * STEADY_SPEED;
  }

  function createCorridorCards() {
    if (!corridor) return;
    var fragment = document.createDocumentFragment();
    for (var pairIndex = 0; pairIndex < STREAM_PAIR_COUNT; pairIndex += 1) {
      [0, 1].forEach(function (sideIndex) {
        var cardIndex = pairIndex * 2 + sideIndex;
        var imageIndex = (cardIndex * 2 + 7) % corridorImages.length;
        var card = document.createElement("div");
        card.className = "color-card";
        card.style.backgroundImage = 'url("' + corridorImages[imageIndex] + '")';
        card.style.setProperty("--base-shift", sideIndex === 0 ? "-100%" : "0%");
        card.style.setProperty("--origin-x", sideIndex === 0 ? "100%" : "0%");
        card.setAttribute("aria-hidden", "true");
        cardElements.push(card);
        fragment.appendChild(card);
      });
    }
    corridor.appendChild(fragment);
  }

  var corridorStartedAt = 0;
  var rafId = 0;
  var running = false;

  function renderCorridor(now) {
    if (!running) return;
    var elapsed = reduceMotion ? BAR_END + FILL_DURATION + 900 : now - corridorStartedAt;
    var width = corridor.clientWidth;
    var baseCardWidth = (cardElements[0] && cardElements[0].offsetWidth) || width * 0.125;
    var baseCardHeight = (baseCardWidth * 4) / 3;
    var outerScale = (window.innerHeight * 0.8) / baseCardHeight;
    var centerScaleRatio = aperture.offsetHeight / (baseCardHeight * outerScale);
    var scaleRatios = [centerScaleRatio].concat(SLOT_SCALE_RATIO.slice(1));
    var prePushDistance = baseCardWidth * centerScaleRatio * outerScale;
    var streamPosition = getStreamPosition(elapsed);
    var imagesStarted = elapsed >= IMAGE_START;
    var barProgress = easeOut((elapsed - BAR_START) / (BAR_END - BAR_START));

    aperture.style.setProperty("--open", barProgress.toFixed(4));
    aperture.style.opacity = "1";

    for (var pairIndex = 0; pairIndex < STREAM_PAIR_COUNT; pairIndex += 1) {
      var rawStreamAge = streamPosition - pairIndex;
      var streamAge = rawStreamAge >= 0 ? rawStreamAge % STREAM_PAIR_COUNT : rawStreamAge;
      var prePushProgress = easeIntoLinearMotion((streamAge - PRE_PUSH_START_SLOT) / (PRE_PUSH_END_SLOT - PRE_PUSH_START_SLOT));
      var birthProgress = easeInOut(streamAge / BIRTH_GROWTH_SLOTS);
      var slot = Math.max(streamAge - PRE_PUSH_END_SLOT, 0);
      var birthScale = 0.2 + birthProgress * 0.8;
      var scale = interpolateSlot(scaleRatios, slot) * outerScale;
      var rotationSlot = clamp(slot / MAX_VISIBLE_SLOT) * (SLOT_ROTATION.length - 1);
      var rotation = interpolateSlot(SLOT_ROTATION, rotationSlot);
      var x = prePushDistance * prePushProgress + interpolateSlot(SLOT_TRAVEL, slot) * width * TRACK_SPACING;
      var visible = imagesStarted && streamAge >= 0 && slot <= MAX_VISIBLE_SLOT ? 1 : 0;

      [cardElements[pairIndex * 2], cardElements[pairIndex * 2 + 1]].forEach(function (card, sideIndex) {
        var direction = sideIndex === 0 ? -1 : 1;
        card.style.setProperty("--x", direction * x + "px");
        card.style.setProperty("--scale", scale.toFixed(4));
        card.style.setProperty("--rotate", direction * -rotation + "deg");
        card.style.setProperty("--birth", birthScale.toFixed(4));
        card.style.opacity = visible.toFixed(4);
        card.style.zIndex = String(20 + Math.round(clamp(slot, 0, 8) * 10));
      });
    }

    if (!reduceMotion) rafId = requestAnimationFrame(renderCorridor);
  }

  function start() {
    corridorStartedAt = performance.now();
    running = true;
    rafId = requestAnimationFrame(renderCorridor);
  }

  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  }

  createCorridorCards();

  if (heroShell && "IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          if (!running) start();
        } else {
          stop();
        }
      });
    }, { threshold: 0.02 });
    io.observe(heroShell);
    start();
  } else {
    // No observer support or reduced motion: render one static frame.
    corridorStartedAt = performance.now();
    running = true;
    renderCorridor(BAR_END + FILL_DURATION + 900);
  }

  window.addEventListener("resize", function () { /* re-measure next frame */ }, { passive: true });
})();
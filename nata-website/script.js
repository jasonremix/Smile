/* =========================================================
   Nata – Interaktionen
   Scroll-Reveal, Parallax, Video-Steuerung
   ========================================================= */
(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* -------------------------------------------------------
     1. Scroll-Reveal
     Elemente mit .reveal faden ein, sobald sie ins Bild kommen.
     ------------------------------------------------------- */
  function initReveal() {
    var elements = document.querySelectorAll(".reveal");

    // Fallback: ohne IntersectionObserver alles sofort sichtbar machen
    if (reducedMotion || !("IntersectionObserver" in window)) {
      elements.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );

    elements.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* -------------------------------------------------------
     2. Parallax für das Phone-Mockup
     Verschiebt das Mockup beim Scrollen leicht gegen die
     Scrollrichtung. Gedrosselt via requestAnimationFrame.
     ------------------------------------------------------- */
  function initParallax() {
    var target = document.querySelector("[data-parallax]");
    if (!target || reducedMotion) return;

    var frame = 0;

    function update() {
      frame = 0;
      var rect = target.getBoundingClientRect();
      var progress =
        (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
      var offset = (progress - 0.5) * -48;
      target.style.transform = "translateY(" + offset.toFixed(2) + "px)";
    }

    function onScroll() {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
  }

  /* -------------------------------------------------------
     3. Video
     Autoplay nur solange das Video im Viewport ist – spart
     Akku und Bandbreite, wenn man weiterscrollt.
     ------------------------------------------------------- */
  function initVideo() {
    var video = document.querySelector(".video-el");
    if (!video) return;

    // Sicherstellen, dass Autoplay in allen Browsern erlaubt ist
    video.muted = true;

    if (!("IntersectionObserver" in window)) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var playPromise = video.play();
            // Manche Browser blockieren Autoplay – dann bleibt der Play-Button
            if (playPromise && typeof playPromise.catch === "function") {
              playPromise.catch(function () {});
            }
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.35 }
    );

    observer.observe(video);
  }

  /* -------------------------------------------------------
     4. Jahreszahl im Footer
     ------------------------------------------------------- */
  function initYear() {
    var el = document.getElementById("year");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  /* -------------------------------------------------------
     Start
     ------------------------------------------------------- */
  function init() {
    initReveal();
    initParallax();
    initVideo();
    initYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
